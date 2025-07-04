import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_CONFIG } from '@/lib/simple-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas que empiecen con /admin (excepto /admin que es el login)
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    const token = request.cookies.get(ADMIN_COOKIE_CONFIG.name)?.value;

    if (!token) {
      console.log('🚨 Acceso denegado: No hay token de sesión');
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    try {
      // Verificar token JWT
      const payload = await verifyAdminToken(token);
      
      if (!payload || payload.role !== 'admin') {
        console.log('🚨 Acceso denegado: Token inválido o no es admin');
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Token válido, permitir acceso
      console.log(`✅ Acceso admin autorizado: ${payload.username} a ${pathname}`);
      return NextResponse.next();

    } catch (error) {
      console.log('🚨 Acceso denegado: Error verificando token', error);
      // Eliminar cookie inválida y redirigir al login
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.cookies.set(ADMIN_COOKIE_CONFIG.name, '', { maxAge: 0 });
      return response;
    }
  }

  // Si está autenticado y accede a /admin, redirigir al dashboard
  if (pathname === '/admin') {
    const token = request.cookies.get(ADMIN_COOKIE_CONFIG.name)?.value;
    
    if (token) {
      try {
        const payload = await verifyAdminToken(token);
        if (payload && payload.role === 'admin') {
          console.log(`🔄 Redirigiendo usuario autenticado al dashboard: ${payload.username}`);
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      } catch (error) {
        // Token inválido, permitir que vea el login
        console.log('Token inválido, mostrando login');
      }
    }
  }

  // Para todas las otras rutas, continuar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Excluir archivos estáticos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 