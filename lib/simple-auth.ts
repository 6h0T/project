import { SignJWT, jwtVerify } from 'jose';

// =====================================
// SISTEMA SIMPLE DE AUTENTICACIÓN
// =====================================

// Credenciales simples para desarrollo
export const SIMPLE_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin'
} as const;

// Secret para JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'simple-admin-secret-key-dev'
);

// Interfaz para el payload del JWT
export interface AdminTokenPayload {
  username: string;
  role: 'admin';
  loginTime: string;
}

// Verificar credenciales simples
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === SIMPLE_ADMIN_CREDENTIALS.username && 
         password === SIMPLE_ADMIN_CREDENTIALS.password;
}

// Generar token JWT para sesión admin
export async function generateAdminToken(username: string): Promise<string> {
  const token = await new SignJWT({
    username,
    role: 'admin',
    loginTime: new Date().toISOString()
  } as AdminTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Token válido por 8 horas
    .sign(JWT_SECRET);

  return token;
}

// Verificar token JWT
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AdminTokenPayload;
  } catch (error) {
    console.log('Token inválido o expirado:', error);
    return null;
  }
}

// Configuración de cookies de sesión
export const ADMIN_COOKIE_CONFIG = {
  name: 'admin-session',
  maxAge: 8 * 60 * 60, // 8 horas
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  }
} as const; 