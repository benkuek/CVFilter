import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserRoles } from './src/lib/auth/roles.js';
import logger from './src/lib/logger.ts';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (pathname === '/' || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRoles = await getUserRoles(payload.email);

    // Add roles to request headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-roles', JSON.stringify(userRoles));

    return response;
  } catch (error) {
    logger.error('Middleware authentication failed', { 
      error: error.message, 
      pathname: request.nextUrl.pathname 
    });
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};