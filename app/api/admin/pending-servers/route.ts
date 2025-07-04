import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_CONFIG } from '@/lib/simple-auth';
import { supabase } from '@/lib/supabase';

// Requisitos obligatorios para la aprobación automática
const REQUIRED_FIELDS = {
  user_servers: ['title', 'description', 'language', 'category_id'],
  hardcoded_servers: ['title', 'description', 'ip', 'category_id']
};

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_TITLE_LENGTH = 100;

interface ValidationResult {
  isValid: boolean;
  score: number;
  missingFields: string[];
  issues: string[];
  recommendations: string[];
}

interface PendingServer {
  id: string | number;
  title: string;
  description: string | null;
  website: string | null;
  ip?: string;
  country: string | null;
  language: string;
  version: string | null;
  experience: number | null;
  max_level?: number | null;
  maxLevel?: number | null;
  status: string;
  premium: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
  category_id?: number;
  categoryId?: number;
  user_id?: string;
  userId?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  source: 'user_server' | 'hardcoded';
}

// Función para validar un servidor
function validateServer(server: PendingServer): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    score: 0,
    missingFields: [],
    issues: [],
    recommendations: []
  };

  const requiredFields = server.source === 'user_server' 
    ? REQUIRED_FIELDS.user_servers 
    : REQUIRED_FIELDS.hardcoded_servers;

  let totalPoints = 0;
  let earnedPoints = 0;

  // Validar campos obligatorios (40 puntos)
  requiredFields.forEach(field => {
    totalPoints += 10;
    const value = server[field as keyof PendingServer];
    
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      result.missingFields.push(field);
      result.issues.push(`Campo obligatorio faltante: ${field}`);
    } else {
      earnedPoints += 10;
    }
  });

  // Validar título (20 puntos)
  totalPoints += 20;
  if (server.title) {
    if (server.title.length >= 5 && server.title.length <= MAX_TITLE_LENGTH) {
      earnedPoints += 20;
    } else if (server.title.length < 5) {
      result.issues.push('El título es demasiado corto (mínimo 5 caracteres)');
    } else {
      result.issues.push(`El título es demasiado largo (máximo ${MAX_TITLE_LENGTH} caracteres)`);
    }
  }

  // Validar descripción (30 puntos)
  totalPoints += 30;
  if (server.description) {
    if (server.description.length >= MIN_DESCRIPTION_LENGTH) {
      earnedPoints += 30;
    } else {
      result.issues.push(`La descripción es demasiado corta (mínimo ${MIN_DESCRIPTION_LENGTH} caracteres)`);
      result.recommendations.push('Agrega más detalles sobre el servidor, eventos especiales, características únicas');
    }
  }

  // Validar website (10 puntos bonus)
  totalPoints += 10;
  if (server.website && server.website.trim() !== '') {
    try {
      new URL(server.website);
      earnedPoints += 10;
    } catch {
      result.issues.push('La URL del sitio web no es válida');
      result.recommendations.push('Verifica que la URL sea correcta y incluya http:// o https://');
    }
  } else {
    result.recommendations.push('Considera agregar un sitio web para mayor credibilidad');
  }

  // Calcular score y determinar si es válido
  result.score = Math.round((earnedPoints / totalPoints) * 100);
  result.isValid = result.score >= 80 && result.missingFields.length === 0;

  if (!result.isValid && result.score >= 60) {
    result.recommendations.push('Tu servidor está cerca de ser aprobado automáticamente');
  }

  return result;
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

    // Validar cada servidor pendiente
    const serversWithValidation = pendingServers.map(server => {
      const validation = validateServer(server);
      
      return {
        ...server,
        validation: {
          isValid: validation.isValid,
          score: validation.score,
          missingFields: validation.missingFields,
          issues: validation.issues,
          recommendations: validation.recommendations,
          canAutoApprove: validation.isValid
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
      const { data, error } = await supabase
        .from('user_servers')
        .update({
          approved: action === 'approve',
          status: action === 'approve' ? 'online' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', serverId)
        .select()
        .single();

      result = { data, error };
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