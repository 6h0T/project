// ===================================
// MÓDULO DE VALIDACIÓN DE BANNERS
// ===================================

// Requisitos para la aprobación automática de banners
export const BANNER_VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 5,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 120, // Mínimo 120 caracteres para aprobación automática
  // Sin máximo de descripción - removido según solicitud
  AUTO_APPROVAL_THRESHOLD: 80 // Score mínimo para aprobación automática
} as const;

export interface BannerValidationResult {
  isValid: boolean;
  score: number;
  missingFields: string[];
  issues: string[];
  recommendations: string[];
  canAutoApprove: boolean;
}

export interface BannerForValidation {
  title?: string;
  description?: string | null;
  image_url?: string;
  target_url?: string;
  position?: string;
  [key: string]: any;
}

/**
 * Función principal de validación de banners
 * @param banner - Datos del banner a validar
 * @returns Resultado completo de la validación
 */
export function validateBanner(banner: BannerForValidation): BannerValidationResult {
  const result: BannerValidationResult = {
    isValid: false,
    score: 0,
    missingFields: [],
    issues: [],
    recommendations: [],
    canAutoApprove: false
  };

  let totalPoints = 0;
  let earnedPoints = 0;

  // ===================================
  // 1. VALIDAR CAMPOS OBLIGATORIOS (40 puntos)
  // ===================================
  const requiredFields = ['title', 'image_url', 'target_url', 'position'];
  
  requiredFields.forEach(field => {
    totalPoints += 10;
    const value = banner[field];
    
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      result.missingFields.push(field);
      result.issues.push(`Campo obligatorio faltante: ${field}`);
    } else {
      earnedPoints += 10;
    }
  });

  // ===================================
  // 2. VALIDAR TÍTULO (20 puntos)
  // ===================================
  totalPoints += 20;
  if (banner.title) {
    const titleLength = banner.title.trim().length;
    if (titleLength >= BANNER_VALIDATION_RULES.MIN_TITLE_LENGTH && 
        titleLength <= BANNER_VALIDATION_RULES.MAX_TITLE_LENGTH) {
      earnedPoints += 20;
    } else if (titleLength < BANNER_VALIDATION_RULES.MIN_TITLE_LENGTH) {
      result.issues.push(`El título es demasiado corto (mínimo ${BANNER_VALIDATION_RULES.MIN_TITLE_LENGTH} caracteres)`);
    } else {
      result.issues.push(`El título es demasiado largo (máximo ${BANNER_VALIDATION_RULES.MAX_TITLE_LENGTH} caracteres)`);
    }
  }

  // ===================================
  // 3. VALIDAR DESCRIPCIÓN (30 puntos)
  // ===================================
  totalPoints += 30;
  if (banner.description && banner.description.trim() !== '') {
    const descriptionLength = banner.description.trim().length;
    if (descriptionLength >= BANNER_VALIDATION_RULES.MIN_DESCRIPTION_LENGTH) {
      earnedPoints += 30;
    } else {
      result.issues.push(`La descripción es demasiado corta (mínimo ${BANNER_VALIDATION_RULES.MIN_DESCRIPTION_LENGTH} caracteres para aprobación automática)`);
      result.recommendations.push('Agrega más detalles sobre tu servidor, eventos especiales, características únicas, etc.');
    }
  } else {
    result.issues.push('La descripción es obligatoria para aprobación automática');
    result.recommendations.push('Agrega una descripción detallada de tu servidor para aprobación automática');
  }

  // ===================================
  // 4. VALIDAR URL DE DESTINO (10 puntos)
  // ===================================
  totalPoints += 10;
  if (banner.target_url && banner.target_url.trim() !== '') {
    try {
      new URL(banner.target_url.trim());
      earnedPoints += 10;
    } catch {
      result.issues.push('La URL de destino no es válida');
      result.recommendations.push('Verifica que la URL sea correcta y incluya http:// o https://');
    }
  }

  // ===================================
  // 5. CALCULAR SCORE Y DETERMINAR VALIDEZ
  // ===================================
  result.score = Math.round((earnedPoints / totalPoints) * 100);
  result.isValid = result.score >= BANNER_VALIDATION_RULES.AUTO_APPROVAL_THRESHOLD && result.missingFields.length === 0;
  result.canAutoApprove = result.isValid;

  // ===================================
  // 6. AGREGAR RECOMENDACIONES CONTEXTUALES
  // ===================================
  if (!result.isValid) {
    if (result.score >= 60) {
      result.recommendations.push(`Tu banner está cerca de ser aprobado automáticamente (${result.score}%)`);
      result.recommendations.push(`Necesitas ${BANNER_VALIDATION_RULES.AUTO_APPROVAL_THRESHOLD - result.score}% más para aprobación automática`);
    } else {
      result.recommendations.push('El banner necesita mejoras significativas para aprobación automática');
    }
    
    result.recommendations.push('Los banners que no califican para aprobación automática serán revisados manualmente');
  }

  return result;
}

/**
 * Función para validar rápidamente si un banner puede ser auto-aprobado
 * @param banner - Datos del banner
 * @returns true si puede ser auto-aprobado
 */
export function canAutoApproveBanner(banner: BannerForValidation): boolean {
  const validation = validateBanner(banner);
  return validation.canAutoApprove;
}

/**
 * Función para obtener solo los issues críticos que impiden la aprobación
 * @param banner - Datos del banner
 * @returns Array de issues críticos
 */
export function getCriticalBannerIssues(banner: BannerForValidation): string[] {
  const validation = validateBanner(banner);
  return validation.issues.filter(issue => 
    issue.includes('obligatorio') || 
    issue.includes('demasiado corto') || 
    issue.includes('demasiado largo') ||
    issue.includes('no es válida')
  );
}

/**
 * Función para logging de validación de banners
 * @param banner - Datos del banner
 * @param validation - Resultado de validación
 */
export function logBannerValidationResult(banner: BannerForValidation, validation: BannerValidationResult): void {
  console.log(`[BANNER-VALIDATION] Banner: ${banner.title || 'Sin título'}`);
  console.log(`[BANNER-VALIDATION] Score: ${validation.score}%`);
  console.log(`[BANNER-VALIDATION] Auto-aprobable: ${validation.canAutoApprove ? '✅ SÍ' : '❌ NO'}`);
  
  if (validation.issues.length > 0) {
    console.log(`[BANNER-VALIDATION] Issues (${validation.issues.length}):`, validation.issues);
  }
  
  if (validation.missingFields.length > 0) {
    console.log(`[BANNER-VALIDATION] Campos faltantes:`, validation.missingFields);
  }
}