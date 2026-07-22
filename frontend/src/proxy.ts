import { NextRequest, NextResponse } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_PATHS = ['/dashboard', '/matriculas', '/practicas', '/ingles', '/titulacion'];

// Rutas exclusivas por rol
const ROLE_ROUTES: Record<string, string[]> = {
  docente: ['/practicas/panel', '/titulacion/tribunal', '/ingles/validar'],
  admin:   ['/admin'],
};

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Leer token de la cookie (el backend Go debe setearla en login)
  const token = request.cookies.get('instituto-token')?.value;

  // Si intenta acceder a ruta protegida sin token → login
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión e intenta ir al login → dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirigir raíz a dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
