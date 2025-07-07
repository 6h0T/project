import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_CONFIG } from '@/lib/simple-auth';
import { supabase } from '@/lib/supabase';
import { validateServer, type ValidationResult, type ServerForValidation } from '@/lib/serverValidation';

// Requisitos obligatorios para la aprobación automática
const REQUIRED_FIELDS = {
  user_servers: ['title', 'description', 'language', 'category_id'],
  hardcoded_servers: ['title', 'description', 'ip', 'category_id']
};

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_TITLE_LENGTH = 100;

interface PendingServer {
  id: string;
  title: string;
  description?: string;
  website?: string;
  language?: string;
  category_id?: number;
  ip?: string;
  status: string;
  approved: boolean;
  created_at: string;
  source: 'user_server' | 'regular_servers';
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  validation: {
    isValid: boolean;
    score: number;
    missingFields: string[];
    issues: string[];
    recommendations: string[];
    canAutoApprove: boolean;
  };
}

interface PendingServersStats {
  total: number;
  pending: number;
  rejected: number;
  canAutoApprove: number;
  averageScore: number;
}

interface PendingServersResponse {
  success: boolean;
  servers: PendingServer[];
  stats: PendingServersStats;
}

// GET - Obtener servidores pendientes
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const token = request.cookies.get(ADMIN_COOKIE_CONFIG.name)?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminPayload = await verifyAdminToken(token);
    if (!adminPayload || adminPayload.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pendingServers: PendingServer[] = [];

    // Obtener servidores de usuario pendientes
    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select(`
          *,
          category:server_categories(*)
        `)
        .eq('approved', false)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (!userError && userServers) {
        userServers.forEach(server => {
          pendingServers.push({
            ...server,
            id: server.id,
            source: 'user_server',
            category: server.category ? {
              id: server.category.id,
              name: server.category.name,
              slug: server.category.slug
            } : undefined
          });
        });
      }
    } catch (error) {
      console.log('Error fetching user servers (tabla podría no existir):', error);
    }

    // También obtener servidores pendientes de la tabla 'servers' (si existen)
    try {
      const { data: regularServers, error: regularError } = await supabase
        .from('servers')
        .select(`
          *,
          server_categories(id, name, slug)
        `)
        .eq('approved', false)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (!regularError && regularServers) {
        regularServers.forEach(server => {
          pendingServers.push({
            ...server,
            id: server.id.toString(), // Convertir a string para consistencia
            source: 'regular_servers',
            category: server.server_categories && Array.isArray(server.server_categories) && server.server_categories[0] ? {
              id: server.server_categories[0].id,
              name: server.server_categories[0].name,
              slug: server.server_categories[0].slug
            } : undefined
          });
        });
      }
    } catch (error) {
      console.log('Error fetching regular servers (tabla podría no existir):', error);
    }

    // Validar cada servidor pendiente usando el módulo centralizado
    const serversWithValidation = pendingServers.map(server => {
      const serverForValidation: ServerForValidation = {
        title: server.title,
        description: server.description,
        website: server.website,
        language: server.language,
        category_id: server.category_id,
        ip: server.ip,
        source: server.source === 'user_server' ? 'user_server' : 'regular_servers'
      };
      
      const validation = validateServer(serverForValidation);
      
      return {
        ...server,
        validation: {
          isValid: validation.isValid,
          score: validation.score,
          missingFields: validation.missingFields,
          issues: validation.issues,
          recommendations: validation.recommendations,
          canAutoApprove: validation.canAutoApprove
        }
      };
    });

    // Estadísticas
    const stats = {
      total: serversWithValidation.length,
      pending: serversWithValidation.filter(s => s.status === 'pending').length,
      rejected: serversWithValidation.filter(s => s.status === 'rejected').length,
      canAutoApprove: serversWithValidation.filter(s => s.validation.canAutoApprove).length,
      averageScore: serversWithValidation.length > 0 
        ? Math.round(serversWithValidation.reduce((sum, s) => sum + s.validation.score, 0) / serversWithValidation.length)
        : 0
    };

    console.log(`📊 Servidores pendientes: ${stats.total}, Auto-aprobables: ${stats.canAutoApprove}`);

    return NextResponse.json({
      success: true,
      servers: serversWithValidation,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo servidores pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Aprobar o rechazar servidor
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const token = request.cookies.get(ADMIN_COOKIE_CONFIG.name)?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminPayload = await verifyAdminToken(token);
    if (!adminPayload || adminPayload.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { serverId, action, source } = await request.json();

    if (!serverId || !action || !source) {
      return NextResponse.json(
        { error: 'Faltan parámetros: serverId, action, source' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida. Use approve o reject' },
        { status: 400 }
      );
    }

    let result;

    if (source === 'user_server') {
      const { data: serverData, error: selectError } = await supabase
        .from('user_servers')
        .select(`
          *,
          category:server_categories(*)
        `)
        .eq('id', serverId)
        .single();

      if (selectError) {
        console.error('Error al seleccionar el servidor:', selectError);
        return NextResponse.json(
          { error: 'Error al seleccionar el servidor' },
          { status: 500 }
        );
      }

      // Usar módulo centralizado de validación
      const serverForValidation: ServerForValidation = {
        title: serverData.title,
        description: serverData.description,
        website: serverData.website,
        language: serverData.language,
        category_id: serverData.category_id,
        source: 'user_server'
      };
      
      const validation = validateServer(serverForValidation);

      if (action === 'approve') {
        const { data, error } = await supabase
          .from('user_servers')
          .update({
            approved: true,
            status: 'online',
            updated_at: new Date().toISOString()
          })
          .eq('id', serverId)
          .select()
          .single();

        result = { data, error };
      } else {
        const { data: rejectData, error: rejectError } = await supabase
          .from('user_servers')
          .update({
            approved: false,
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', serverId)
          .select()
          .single();

        result = { data: rejectData, error: rejectError };
      }
    } else {
      // Para servidores hardcodeados (si los hay en el futuro)
      return NextResponse.json(
        { error: 'Tipo de servidor no soportado' },
        { status: 400 }
      );
    }

    if (result.error) {
      console.error('Error actualizando servidor:', result.error);
      return NextResponse.json(
        { error: 'Error actualizando servidor' },
        { status: 500 }
      );
    }

    console.log(`✅ Servidor ${serverId} ${action === 'approve' ? 'aprobado' : 'rechazado'} por admin`);

    return NextResponse.json({
      success: true,
      message: `Servidor ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`,
      server: result.data
    });

  } catch (error) {
    console.error('Error procesando servidor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 