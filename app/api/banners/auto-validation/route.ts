import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateBanner, logBannerValidationResult, type BannerForValidation } from '@/lib/bannerValidation';

/**
 * ENDPOINT DE VALIDACIÓN AUTOMÁTICA DE BANNERS
 * 
 * Este endpoint valida y auto-aprueba banners que cumplan con los criterios:
 * - Título entre 5-100 caracteres
 * - Descripción mínimo 120 caracteres (sin máximo)
 * - URL válida
 * - Imagen válida
 * - Posición válida
 */

interface BannerAutoValidationResult {
  success: boolean;
  totalProcessed: number;
  autoApproved: number;
  skipped: number;
  approvedBanners: Array<{
    id: string;
    title: string;
    score: number;
  }>;
  skippedBanners: Array<{
    id: string;
    title: string;
    score: number;
    issues: string[];
  }>;
  errors: string[];
  executionTime: number;
}

// POST - Ejecutar validación automática de banners
export async function POST(request: NextRequest): Promise<NextResponse<BannerAutoValidationResult>> {
  const startTime = Date.now();
  
  console.log('🎨 [BANNER-AUTO-VALIDATION] Iniciando proceso de validación automática de banners...');
  
  const result: BannerAutoValidationResult = {
    success: true,
    totalProcessed: 0,
    autoApproved: 0,
    skipped: 0,
    approvedBanners: [],
    skippedBanners: [],
    errors: [],
    executionTime: 0
  };

  try {
    // Obtener banners pendientes
    console.log('🔍 [BANNER-AUTO-VALIDATION] Buscando banners pendientes...');
    
    const { data: pendingBanners, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ [BANNER-AUTO-VALIDATION] Error obteniendo banners:', fetchError);
      result.errors.push('Error obteniendo banners pendientes');
      result.success = false;
      return NextResponse.json(result, { status: 500 });
    }

    if (!pendingBanners || pendingBanners.length === 0) {
      console.log('ℹ️ [BANNER-AUTO-VALIDATION] No hay banners pendientes');
      result.executionTime = Date.now() - startTime;
      return NextResponse.json(result);
    }

    console.log(`📊 [BANNER-AUTO-VALIDATION] Encontrados ${pendingBanners.length} banners pendientes`);

    // Procesar cada banner
    for (const banner of pendingBanners) {
      result.totalProcessed++;
      
      // Preparar datos para validación
      const bannerForValidation: BannerForValidation = {
        title: banner.title,
        description: banner.description,
        image_url: banner.image_url,
        target_url: banner.target_url,
        position: banner.position
      };

      // Validar banner
      const validation = validateBanner(bannerForValidation);
      
      console.log(`🔍 [BANNER-AUTO-VALIDATION] Validando: ${banner.title}`);
      logBannerValidationResult(bannerForValidation, validation);

      if (validation.canAutoApprove) {
        // AUTO-APROBAR BANNER
        const { data: updatedBanner, error: updateError } = await supabase
          .from('banners')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', banner.id)
          .select()
          .single();

        if (updateError) {
          console.error(`❌ [BANNER-AUTO-VALIDATION] Error aprobando banner ${banner.id}:`, updateError);
          result.errors.push(`Error aprobando banner: ${banner.title}`);
        } else {
          result.autoApproved++;
          result.approvedBanners.push({
            id: banner.id,
            title: banner.title,
            score: validation.score
          });
          console.log(`✅ [BANNER-AUTO-VALIDATION] AUTO-APROBADO: ${banner.title} (Score: ${validation.score}%)`);
        }
      } else {
        // OMITIR - No cumple requisitos para auto-aprobación
        result.skipped++;
        result.skippedBanners.push({
          id: banner.id,
          title: banner.title,
          score: validation.score,
          issues: validation.issues
        });
        console.log(`⏭️ [BANNER-AUTO-VALIDATION] OMITIDO: ${banner.title} (Score: ${validation.score}%)`);
      }
    }

    // Resultados finales
    result.executionTime = Date.now() - startTime;
    
    console.log('🎉 [BANNER-AUTO-VALIDATION] Proceso completado:');
    console.log(`  📊 Total procesados: ${result.totalProcessed}`);
    console.log(`  ✅ Auto-aprobados: ${result.autoApproved}`);
    console.log(`  ⏭️ Omitidos: ${result.skipped}`);
    console.log(`  ⏱️ Tiempo ejecución: ${result.executionTime}ms`);
    console.log(`  ❌ Errores: ${result.errors.length}`);

    if (result.errors.length === 0) {
      result.success = true;
    } else {
      result.success = false;
      console.error('❌ [BANNER-AUTO-VALIDATION] Errores durante el proceso:', result.errors);
    }

    return NextResponse.json(result);

  } catch (error) {
    result.success = false;
    result.executionTime = Date.now() - startTime;
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    console.error('❌ [BANNER-AUTO-VALIDATION] Error general del proceso:', error);
    
    return NextResponse.json(result, { status: 500 });
  }
}

// GET - Obtener estadísticas de validación automática de banners
export async function GET(): Promise<NextResponse> {
  try {
    console.log('📊 [BANNER-AUTO-VALIDATION] Obteniendo estadísticas...');
    
    // Obtener banners pendientes
    const { data: pendingBanners, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) {
      console.error('❌ [BANNER-AUTO-VALIDATION] Error obteniendo estadísticas:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo estadísticas de banners',
          details: fetchError.message
        },
        { status: 500 }
      );
    }

    let candidatesForAutoApproval = 0;

    if (pendingBanners && pendingBanners.length > 0) {
      // Validar cada banner para ver cuántos califican para auto-aprobación
      for (const banner of pendingBanners) {
        const validation = validateBanner({
          title: banner.title,
          description: banner.description,
          image_url: banner.image_url,
          target_url: banner.target_url,
          position: banner.position
        });
        
        if (validation.canAutoApprove) {
          candidatesForAutoApproval++;
        }
      }
    }

    const stats = {
      success: true,
      banners: {
        pending: pendingBanners?.length || 0,
        candidatesForAutoApproval: candidatesForAutoApproval
      },
      canRunAutomation: candidatesForAutoApproval > 0,
      validationRules: {
        minDescriptionLength: 120,
        maxDescriptionLength: 'Sin límite',
        minTitleLength: 5,
        maxTitleLength: 100,
        autoApprovalThreshold: 80
      }
    };

    console.log('📊 [BANNER-AUTO-VALIDATION] Estadísticas:', stats);
    
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ [BANNER-AUTO-VALIDATION] Error obteniendo estadísticas:', error);
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