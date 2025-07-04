import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyAdminCredentials, 
  generateAdminToken, 
  ADMIN_COOKIE_CONFIG 
} from '@/lib/simple-auth';

// POST - Login simple admin
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validar datos de entrada
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar credenciales
    const isValid = verifyAdminCredentials(username.trim(), password.trim());

    if (!isValid) {
      console.log(`🚨 Intento de login inválido: ${username}`);
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = await generateAdminToken(username);

    console.log(`✅ Login exitoso para admin: ${username}`);

    // Crear respuesta con redirección
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      redirectTo: '/admin/dashboard'
    });

    // Configurar cookie de sesión
    response.cookies.set(
      ADMIN_COOKIE_CONFIG.name, 
      token, 
      {
        ...ADMIN_COOKIE_CONFIG.options,
        maxAge: ADMIN_COOKIE_CONFIG.maxAge
      }
    );

    return response;

  } catch (error) {
    console.error('Error en login admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Logout admin
export async function DELETE() {
  console.log('🚪 Logout admin');

  const response = NextResponse.json({
    success: true,
    message: 'Logout exitoso',
    redirectTo: '/admin'
  });

  // Eliminar cookie de sesión
  response.cookies.set(
    ADMIN_COOKIE_CONFIG.name, 
    '', 
    {
      ...ADMIN_COOKIE_CONFIG.options,
      maxAge: 0
    }
  );

  return response;
} 