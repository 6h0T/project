import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateServer, logValidationResult, type ServerForValidation } from '@/lib/serverValidation';

/**
 * ENDPOINT DE VALIDACIÓN AUTOMÁTICA INDEPENDIENTE
 * 
 * Este endpoint se puede ejecutar automáticamente mediante:
 * - Cron jobs (cada X minutos)
 * - Webhooks de Supabase
 * - Triggers de base de datos
 * - Llamadas programáticas
 * 
 * NO requiere autenticación de admin y opera de forma completamente automática
 */

interface AutoValidationResult {
  success: boolean;
  totalProcessed: number;
  autoApproved: number;
  skipped: number;
  approvedServers: Array<{
    id: string;
    title: string;
    score: number;
    source: string;
  }>;
  skippedServers: Array<{
    id: string;
    title: string;
    score: number;
    issues: string[];
  }>;
  errors: string[];
  executionTime: number;
}

// POST - Ejecutar validación automática
export async function POST(request: NextRequest): Promise<NextResponse<AutoValidationResult>> {
  const startTime = Date.now();
  
  console.log('🤖 [AUTO-VALIDATION] Iniciando proceso de validación automática...');
  
  const result: AutoValidationResult = {
    success: true,
    totalProcessed: 0,
    autoApproved: 0,
    skipped: 0,
    approvedServers: [],
    skippedServers: [],
    errors: [],
    executionTime: 0
  };

  try {
    // ===================================
    // 1. OBTENER SERVIDORES PENDIENTES DE user_servers
    // ===================================
    console.log('🔍 [AUTO-VALIDATION] Buscando servidores de usuario pendientes...');
    
    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('❌ [AUTO-VALIDATION] Error obteniendo user_servers:', userError);
        result.errors.push('Error obteniendo servidores de usuario');
      } else if (userServers && userServers.length > 0) {
        console.log(`📊 [AUTO-VALIDATION] Encontrados ${userServers.length} servidores de usuario pendientes`);
        
        for (const server of userServers) {
          result.totalProcessed++;
          
          // Validar servidor
          const serverForValidation: ServerForValidation = {
            title: server.title,
            description: server.description,
            website: server.website,
            language: server.language || 'es',
            category_id: server.category_id,
            source: 'user_server'
          };

          const validation = validateServer(serverForValidation);
          
          console.log(`🔍 [AUTO-VALIDATION] Validando: ${server.title}`);
          logValidationResult(serverForValidation, validation);

          if (validation.canAutoApprove) {
            // AUTO-APROBAR
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
              console.error(`❌ [AUTO-VALIDATION] Error aprobando servidor ${server.id}:`, updateError);
              result.errors.push(`Error aprobando servidor: ${server.title}`);
            } else {
              result.autoApproved++;
              result.approvedServers.push({
                id: server.id,
                title: server.title,
                score: validation.score,
                source: 'user_server'
              });
              console.log(`✅ [AUTO-VALIDATION] AUTO-APROBADO: ${server.title} (Score: ${validation.score}%)`);
            }
          } else {
            // OMITIR - No cumple requisitos
            result.skipped++;
            result.skippedServers.push({
              id: server.id,
              title: server.title,
              score: validation.score,
              issues: validation.issues
            });
            console.log(`⏭️ [AUTO-VALIDATION] OMITIDO: ${server.title} (Score: ${validation.score}%)`);
          }
        }
      } else {
        console.log('ℹ️ [AUTO-VALIDATION] No hay servidores de usuario pendientes');
      }
    } catch (error) {
      console.error('❌ [AUTO-VALIDATION] Error procesando user_servers:', error);
      result.errors.push('Error procesando servidores de usuario');
    }

    // ===================================
    // 2. OBTENER SERVIDORES PENDIENTES DE servers
    // ===================================
    console.log('🔍 [AUTO-VALIDATION] Buscando servidores regulares pendientes...');
    
    try {
      const { data: regularServers, error: regularError } = await supabase
        .from('servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (regularError) {
        console.log('ℹ️ [AUTO-VALIDATION] Tabla servers no existe o error:', regularError);
      } else if (regularServers && regularServers.length > 0) {
        console.log(`📊 [AUTO-VALIDATION] Encontrados ${regularServers.length} servidores regulares pendientes`);
        
        for (const server of regularServers) {
          result.totalProcessed++;
          
          // Validar servidor
          const serverForValidation: ServerForValidation = {
            title: server.title,
            description: server.description,
            website: server.website,
            ip: server.ip,
            category_id: server.category_id,
            source: 'regular_servers'
          };

          const validation = validateServer(serverForValidation);
          
          console.log(`🔍 [AUTO-VALIDATION] Validando: ${server.title}`);
          logValidationResult(serverForValidation, validation);

          if (validation.canAutoApprove) {
            // AUTO-APROBAR
            const { data: updatedServer, error: updateError } = await supabase
              .from('servers')
              .update({
                approved: true,
                status: 'online',
                updated_at: new Date().toISOString()
              })
              .eq('id', server.id)
              .select()
              .single();

            if (updateError) {
              console.error(`❌ [AUTO-VALIDATION] Error aprobando servidor ${server.id}:`, updateError);
              result.errors.push(`Error aprobando servidor: ${server.title}`);
            } else {
              result.autoApproved++;
              result.approvedServers.push({
                id: server.id.toString(),
                title: server.title,
                score: validation.score,
                source: 'regular_servers'
              });
              console.log(`✅ [AUTO-VALIDATION] AUTO-APROBADO: ${server.title} (Score: ${validation.score}%)`);
            }
          } else {
            // OMITIR - No cumple requisitos
            result.skipped++;
            result.skippedServers.push({
              id: server.id.toString(),
              title: server.title,
              score: validation.score,
              issues: validation.issues
            });
            console.log(`⏭️ [AUTO-VALIDATION] OMITIDO: ${server.title} (Score: ${validation.score}%)`);
          }
        }
      } else {
        console.log('ℹ️ [AUTO-VALIDATION] No hay servidores regulares pendientes');
      }
    } catch (error) {
      console.log('ℹ️ [AUTO-VALIDATION] Error accediendo tabla servers (normal si no existe):', error);
    }

    // ===================================
    // 3. RESULTADOS FINALES
    // ===================================
    result.executionTime = Date.now() - startTime;
    
    console.log('🎉 [AUTO-VALIDATION] Proceso completado:');
    console.log(`  📊 Total procesados: ${result.totalProcessed}`);
    console.log(`  ✅ Auto-aprobados: ${result.autoApproved}`);
    console.log(`  ⏭️ Omitidos: ${result.skipped}`);
    console.log(`  ⏱️ Tiempo ejecución: ${result.executionTime}ms`);
    console.log(`  ❌ Errores: ${result.errors.length}`);

    if (result.errors.length === 0) {
      result.success = true;
    } else {
      result.success = false;
      console.error('❌ [AUTO-VALIDATION] Errores durante el proceso:', result.errors);
    }

    return NextResponse.json(result);

  } catch (error) {
    result.success = false;
    result.executionTime = Date.now() - startTime;
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    console.error('❌ [AUTO-VALIDATION] Error general del proceso:', error);
    
    return NextResponse.json(result, { status: 500 });
  }
}

// GET - Obtener estadísticas de validación automática
export async function GET(): Promise<NextResponse> {
  try {
    console.log('📊 [AUTO-VALIDATION] Obteniendo estadísticas...');
    
    let userServersPending = 0;
    let userServersCandidate = 0;
    let regularServersPending = 0;
    let regularServersCandidate = 0;

    // Estadísticas de user_servers
    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending');

      if (!userError && userServers) {
        userServersPending = userServers.length;
        
        for (const server of userServers) {
          const validation = validateServer({
            title: server.title,
            description: server.description,
            website: server.website,
            language: server.language || 'es',
            category_id: server.category_id,
            source: 'user_server'
          });
          
          if (validation.canAutoApprove) {
            userServersCandidate++;
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Error obteniendo estadísticas user_servers:', error);
    }

    // Estadísticas de servers
    try {
      const { data: regularServers, error: regularError } = await supabase
        .from('servers')
        .select('*')
        .eq('approved', false)
        .eq('status', 'pending');

      if (!regularError && regularServers) {
        regularServersPending = regularServers.length;
        
        for (const server of regularServers) {
          const validation = validateServer({
            title: server.title,
            description: server.description,
            website: server.website,
            ip: server.ip,
            category_id: server.category_id,
            source: 'regular_servers'
          });
          
          if (validation.canAutoApprove) {
            regularServersCandidate++;
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Error obteniendo estadísticas servers:', error);
    }

    const stats = {
      success: true,
      userServers: {
        pending: userServersPending,
        candidatesForAutoApproval: userServersCandidate
      },
      regularServers: {
        pending: regularServersPending,
        candidatesForAutoApproval: regularServersCandidate
      },
      total: {
        pending: userServersPending + regularServersPending,
        candidatesForAutoApproval: userServersCandidate + regularServersCandidate
      },
      canRunAutomation: (userServersCandidate + regularServersCandidate) > 0
    };

    console.log('📊 [AUTO-VALIDATION] Estadísticas:', stats);
    
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ [AUTO-VALIDATION] Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 