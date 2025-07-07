import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateServer, logValidationResult, type ServerForValidation } from '@/lib/serverValidation';

/**
 * ENDPOINT DE DEBUGGING PARA VALIDACIÓN AUTOMÁTICA
 * 
 * Este endpoint ayuda a diagnosticar por qué los servidores
 * no se están auto-aprobando automáticamente.
 * 
 * Uso: GET /api/debug-validation?serverType=user_servers
 */

interface DebugServer {
  id: string;
  title: string;
  description: string | null;
  website: string | null;
  language: string | null;
  category_id: number | null;
  status: string;
  approved: boolean;
  created_at: string;
}

interface DebugResult {
  server: DebugServer;
  validationInput: ServerForValidation;
  validationResult: {
    isValid: boolean;
    score: number;
    missingFields: string[];
    issues: string[];
    recommendations: string[];
    canAutoApprove: boolean;
  };
  shouldBeApproved: boolean;
  problems: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serverType = searchParams.get('serverType') || 'user_servers';
  const serverId = searchParams.get('serverId');

  console.log('🔍 [DEBUG-VALIDATION] Iniciando diagnóstico...');
  console.log(`🔍 [DEBUG-VALIDATION] Tipo: ${serverType}`);
  
  try {
    let servers: DebugServer[] = [];
    const debugResults: DebugResult[] = [];

    // ===================================
    // 1. OBTENER SERVIDORES PARA DIAGNOSTICAR
    // ===================================
    if (serverType === 'user_servers') {
      let query = supabase
        .from('user_servers')
        .select('id, title, description, website, language, category_id, status, approved, created_at')
        .eq('approved', false);

      if (serverId) {
        query = query.eq('id', serverId);
      } else {
        query = query.eq('status', 'pending').limit(5);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [DEBUG-VALIDATION] Error obteniendo user_servers:', error);
        return NextResponse.json({ 
          error: 'Error obteniendo servidores de usuario',
          details: error 
        }, { status: 500 });
      }

      servers = data || [];
    }

    if (servers.length === 0) {
      return NextResponse.json({
        message: 'No se encontraron servidores para diagnosticar',
        suggestion: 'Crea un servidor de prueba o especifica un serverId específico'
      });
    }

    console.log(`🔍 [DEBUG-VALIDATION] Analizando ${servers.length} servidores...`);

    // ===================================
    // 2. DIAGNOSTICAR CADA SERVIDOR
    // ===================================
    for (const server of servers) {
      console.log(`\n🔍 [DEBUG-VALIDATION] === ANALIZANDO: ${server.title} ===`);
      
      const problems: string[] = [];

      // Preparar datos para validación
      const validationInput: ServerForValidation = {
        title: server.title,
        description: server.description || undefined,
        website: server.website || undefined,
        language: server.language || undefined,
        category_id: server.category_id || undefined,
        source: 'user_server'
      };

      console.log('🔍 [DEBUG-VALIDATION] Datos de entrada para validación:', validationInput);

      // Verificar campos obligatorios manualmente
      console.log('🔍 [DEBUG-VALIDATION] Verificando campos obligatorios...');
      if (!server.title || server.title.trim() === '') {
        problems.push('Título faltante o vacío');
      } else {
        console.log(`✅ Título: "${server.title}" (${server.title.length} caracteres)`);
      }

      if (!server.description || server.description.trim() === '') {
        problems.push('Descripción faltante o vacía');
      } else {
        console.log(`✅ Descripción: "${server.description.substring(0, 50)}..." (${server.description.length} caracteres)`);
      }

      if (!server.language || server.language.trim() === '') {
        problems.push('Idioma faltante o vacío');
      } else {
        console.log(`✅ Idioma: "${server.language}"`);
      }

      if (!server.category_id) {
        problems.push('Categoría faltante');
      } else {
        console.log(`✅ Categoría ID: ${server.category_id}`);
      }

      // Ejecutar validación oficial
      console.log('🔍 [DEBUG-VALIDATION] Ejecutando validación oficial...');
      const validation = validateServer(validationInput);
      
      console.log('🔍 [DEBUG-VALIDATION] Resultado de validación:');
      console.log(`  - Score: ${validation.score}%`);
      console.log(`  - Es válido: ${validation.isValid ? '✅' : '❌'}`);
      console.log(`  - Puede auto-aprobar: ${validation.canAutoApprove ? '✅' : '❌'}`);
      console.log(`  - Campos faltantes: [${validation.missingFields.join(', ')}]`);
      console.log(`  - Issues: [${validation.issues.join(', ')}]`);

      // Determinar si debería ser aprobado
      const shouldBeApproved = validation.canAutoApprove && problems.length === 0;

      debugResults.push({
        server,
        validationInput,
        validationResult: {
          isValid: validation.isValid,
          score: validation.score,
          missingFields: validation.missingFields,
          issues: validation.issues,
          recommendations: validation.recommendations,
          canAutoApprove: validation.canAutoApprove
        },
        shouldBeApproved,
        problems
      });

      console.log(`🔍 [DEBUG-VALIDATION] Conclusión: ${shouldBeApproved ? '✅ DEBERÍA APROBARSE' : '❌ NO DEBE APROBARSE'}`);
    }

    // ===================================
    // 3. RESUMEN Y RECOMENDACIONES
    // ===================================
    const summary = {
      totalAnalyzados: debugResults.length,
      deberianAprobarse: debugResults.filter(r => r.shouldBeApproved).length,
      problemasComunes: Array.from(
        new Set(debugResults.flatMap(r => r.problems))
      ),
      promedioScore: Math.round(
        debugResults.reduce((sum, r) => sum + r.validationResult.score, 0) / debugResults.length
      )
    };

    console.log('\n📊 [DEBUG-VALIDATION] RESUMEN:');
    console.log(`  • Total analizados: ${summary.totalAnalyzados}`);
    console.log(`  • Deberían aprobarse: ${summary.deberianAprobarse}`);
    console.log(`  • Promedio score: ${summary.promedioScore}%`);
    console.log(`  • Problemas comunes: [${summary.problemasComunes.join(', ')}]`);

    return NextResponse.json({
      success: true,
      summary,
      serversAnalyzed: debugResults,
      recommendations: [
        summary.deberianAprobarse === 0 ? 
          'Ningún servidor cumple los requisitos. Revisa que tengan descripción de 50+ caracteres.' :
          `${summary.deberianAprobarse} servidores deberían aprobarse automáticamente.`,
        summary.promedioScore < 80 ? 
          'El promedio de score está por debajo del 80% requerido.' : 
          'El promedio de score está en rango aceptable.',
        summary.problemasComunes.length > 0 ? 
          `Problemas más comunes: ${summary.problemasComunes.join(', ')}` : 
          'No se detectaron problemas obvios en los datos.'
      ]
    });

  } catch (error) {
    console.error('❌ [DEBUG-VALIDATION] Error general:', error);
    return NextResponse.json({
      error: 'Error ejecutando diagnóstico',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST - Probar validación con datos específicos
export async function POST(request: NextRequest) {
  try {
    const testData = await request.json();
    
    console.log('🧪 [DEBUG-VALIDATION] Probando validación con datos específicos...');
    console.log('🧪 [DEBUG-VALIDATION] Datos de entrada:', testData);

    const serverForValidation: ServerForValidation = {
      title: testData.title,
      description: testData.description,
      website: testData.website,
      language: testData.language || 'es',
      category_id: testData.category_id,
      source: 'user_server'
    };

    const validation = validateServer(serverForValidation);
    logValidationResult(serverForValidation, validation);

    return NextResponse.json({
      success: true,
      input: serverForValidation,
      result: validation,
      conclusion: {
        willBeAutoApproved: validation.canAutoApprove,
        message: validation.canAutoApprove ? 
          '✅ Este servidor SERÍA aprobado automáticamente' : 
          `❌ Este servidor NO se aprobaría (Score: ${validation.score}%)`
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG-VALIDATION] Error en prueba:', error);
    return NextResponse.json({
      error: 'Error ejecutando prueba',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 