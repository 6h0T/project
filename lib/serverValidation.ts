// ===================================
// MÓDULO DE VALIDACIÓN DE SERVIDORES
// ===================================

// Requisitos obligatorios para la aprobación automática
export const REQUIRED_FIELDS = {
  user_servers: ['title', 'description', 'language', 'category_id'],
  hardcoded_servers: ['title', 'description', 'ip', 'category_id'],
  regular_servers: ['title', 'description', 'ip', 'category_id']
} as const;

export const MIN_DESCRIPTION_LENGTH = 120;
export const MAX_TITLE_LENGTH = 100;
export const MIN_TITLE_LENGTH = 5;
export const AUTO_APPROVAL_THRESHOLD = 80; // Score mínimo para aprobación automática

export interface ValidationResult {
  isValid: boolean;
  score: number;
  missingFields: string[];
  issues: string[];
  recommendations: string[];
  canAutoApprove: boolean;
}

export interface ServerForValidation {
  title?: string;
  description?: string;
  website?: string;
  language?: string;
  category_id?: number;
  ip?: string;
  source?: 'user_server' | 'hardcoded_servers' | 'regular_servers';
  [key: string]: any;
}

/**
 * Función principal de validación de servidores
 * @param server - Datos del servidor a validar
 * @returns Resultado completo de la validación
 */
export function validateServer(server: ServerForValidation): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    score: 0,
    missingFields: [],
    issues: [],
    recommendations: [],
    canAutoApprove: false
  };

  // Determinar qué campos son obligatorios según el tipo de servidor
  const serverType = server.source || 'user_server';
  const requiredFields = REQUIRED_FIELDS[serverType as keyof typeof REQUIRED_FIELDS] || REQUIRED_FIELDS.user_servers;

  let totalPoints = 0;
  let earnedPoints = 0;

  // ===================================
  // 1. VALIDAR CAMPOS OBLIGATORIOS (40 puntos)
  // ===================================
  requiredFields.forEach(field => {
    totalPoints += 10;
    const value = server[field];
    
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
  if (server.title) {
    const titleLength = server.title.trim().length;
    if (titleLength >= MIN_TITLE_LENGTH && titleLength <= MAX_TITLE_LENGTH) {
      earnedPoints += 20;
    } else if (titleLength < MIN_TITLE_LENGTH) {
      result.issues.push(`El título es demasiado corto (mínimo ${MIN_TITLE_LENGTH} caracteres)`);
    } else {
      result.issues.push(`El título es demasiado largo (máximo ${MAX_TITLE_LENGTH} caracteres)`);
    }
  }

  // ===================================
  // 3. VALIDAR DESCRIPCIÓN (30 puntos)
  // ===================================
  totalPoints += 30;
  if (server.description) {
    const descriptionLength = server.description.trim().length;
    if (descriptionLength >= MIN_DESCRIPTION_LENGTH) {
      earnedPoints += 30;
    } else {
      result.issues.push(`La descripción es demasiado corta (mínimo ${MIN_DESCRIPTION_LENGTH} caracteres)`);
      result.recommendations.push('Agrega más detalles sobre el servidor, eventos especiales, características únicas, rates, etc.');
    }
  }

  // ===================================
  // 4. VALIDAR WEBSITE (10 puntos bonus)
  // ===================================
  totalPoints += 10;
  if (server.website && server.website.trim() !== '') {
    try {
      new URL(server.website.trim());
      earnedPoints += 10;
    } catch {
      result.issues.push('La URL del sitio web no es válida');
      result.recommendations.push('Verifica que la URL sea correcta y incluya http:// o https://');
    }
  } else {
    result.recommendations.push('Considera agregar un sitio web para mayor credibilidad y más información');
  }

  // ===================================
  // 5. CALCULAR SCORE Y DETERMINAR VALIDEZ
  // ===================================
  result.score = Math.round((earnedPoints / totalPoints) * 100);
  result.isValid = result.score >= AUTO_APPROVAL_THRESHOLD && result.missingFields.length === 0;
  result.canAutoApprove = result.isValid;

  // ===================================
  // 6. AGREGAR RECOMENDACIONES CONTEXTUALES
  // ===================================
  if (!result.isValid) {
    if (result.score >= 60) {
      result.recommendations.push(`Tu servidor está cerca de ser aprobado automáticamente (${result.score}%)`);
      result.recommendations.push(`Necesitas ${AUTO_APPROVAL_THRESHOLD - result.score}% más para aprobación automática`);
    } else {
      result.recommendations.push('El servidor necesita mejoras significativas para aprobación automática');
    }
  }

  return result;
}

/**
 * Función para validar rápidamente si un servidor puede ser auto-aprobado
 * @param server - Datos del servidor
 * @returns true si puede ser auto-aprobado
 */
export function canAutoApprove(server: ServerForValidation): boolean {
  const validation = validateServer(server);
  return validation.canAutoApprove;
}

/**
 * Función para obtener solo los issues críticos que impiden la aprobación
 * @param server - Datos del servidor
 * @returns Array de issues críticos
 */
export function getCriticalIssues(server: ServerForValidation): string[] {
  const validation = validateServer(server);
  return validation.issues.filter(issue => 
    issue.includes('obligatorio') || 
    issue.includes('demasiado corto') || 
    issue.includes('demasiado largo')
  );
}

/**
 * Función para logging de validación
 * @param server - Datos del servidor
 * @param validation - Resultado de validación
 */
export function logValidationResult(server: ServerForValidation, validation: ValidationResult): void {
  console.log(`[VALIDATION] Servidor: ${server.title || 'Sin título'}`);
  console.log(`[VALIDATION] Score: ${validation.score}%`);
  console.log(`[VALIDATION] Auto-aprobable: ${validation.canAutoApprove ? '✅ SÍ' : '❌ NO'}`);
  
  if (validation.issues.length > 0) {
    console.log(`[VALIDATION] Issues (${validation.issues.length}):`, validation.issues);
  }
  
  if (validation.missingFields.length > 0) {
    console.log(`[VALIDATION] Campos faltantes:`, validation.missingFields);
  }
} 