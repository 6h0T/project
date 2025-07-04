import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_CONFIG } from '@/lib/simple-auth';
import { supabase } from '@/lib/supabase';

// Reutilizar la lógica de validación del archivo anterior
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
  language: string;
  category_id?: number;
  source: 'user_server' | 'hardcoded';
  [key: string]: any;
}

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
    }
  }

  // Calcular score y determinar si es válido
  result.score = Math.round((earnedPoints / totalPoints) * 100);
  result.isValid = result.score >= 80 && result.missingFields.length === 0;

  return result;
}

// POST - Auto-aprobar servidores que cumplan los requisitos
export async function POST(request: NextRequest) {
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

    console.log('🤖 Iniciando proceso de auto-aprobación...');

    let autoApprovedCount = 0;
    const approvedServers = [];
    const results = {
      success: true,
      message: '',
      autoApprovedCount: 0,
      approvedServers: [] as any[],
      skippedServers: [] as any[],
      errors: [] as string[]
    };

    // Obtener servidores de usuario pendientes
    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error obteniendo servidores de usuario:', userError);
        results.errors.push('Error obteniendo servidores de usuario');
      } else if (userServers && userServers.length > 0) {
        console.log(`🔍 Revisando ${userServers.length} servidores de usuario pendientes...`);

        for (const server of userServers) {
          const serverWithSource = { ...server, source: 'user_server' as const };
          const validation = validateServer(serverWithSource);

          console.log(`📋 Validando servidor: ${server.title} - Score: ${validation.score}%`);

          if (validation.isValid) {
            // Auto-aprobar servidor
            const { data: updatedServer, error: updateError } = await supabase
              .from('user_servers')
              .update({
                approved: true,
                status: 'online',
                updated_at: new Date().toISOString()
              })
              .eq('id', server.id)
              .select()
              .single();

            if (updateError) {
              console.error(`Error auto-aprobando servidor ${server.id}:`, updateError);
              results.errors.push(`Error auto-aprobando servidor ${server.title}`);
            } else {
              autoApprovedCount++;
              results.approvedServers.push({
                id: server.id,
                title: server.title,
                score: validation.score,
                autoApproved: true
              });
              console.log(`✅ Auto-aprobado: ${server.title} (Score: ${validation.score}%)`);
            }
          } else {
            results.skippedServers.push({
              id: server.id,
              title: server.title,
              score: validation.score,
              issues: validation.issues,
              missingFields: validation.missingFields
            });
            console.log(`⏭️ Omitido: ${server.title} (Score: ${validation.score}%) - Requisitos incompletos`);
          }
        }
      }
    } catch (error) {
      console.error('Error en auto-aprobación de servidores de usuario:', error);
      results.errors.push('Error procesando servidores de usuario');
    }

    results.autoApprovedCount = autoApprovedCount;
    
    if (autoApprovedCount > 0) {
      results.message = `✅ Se auto-aprobaron ${autoApprovedCount} servidores exitosamente`;
      console.log(`🎉 Proceso completado: ${autoApprovedCount} servidores auto-aprobados`);
    } else {
      results.message = '⏭️ No se encontraron servidores listos para auto-aprobación';
      console.log('📝 No hay servidores que cumplan los requisitos para auto-aprobación');
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error en auto-aprobación:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        autoApprovedCount: 0,
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET - Obtener estadísticas de servidores candidatos para auto-aprobación
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

    let candidatesCount = 0;
    let totalPending = 0;

    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending');

      if (!userError && userServers) {
        totalPending = userServers.length;
        
        for (const server of userServers) {
          const serverWithSource = { ...server, source: 'user_server' as const };
          const validation = validateServer(serverWithSource);
          
          if (validation.isValid) {
            candidatesCount++;
          }
        }
      }
    } catch (error) {
      console.log('Error obteniendo estadísticas:', error);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPending,
        candidatesForAutoApproval: candidatesCount,
        percentage: totalPending > 0 ? Math.round((candidatesCount / totalPending) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 