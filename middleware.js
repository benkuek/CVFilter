import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserRoles } from './src/lib/auth/roles.js';
import logger from './src/lib/logger';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'your-secret-key');

export async function middleware(request) {
  try {
    const token = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (!payload.sub) {
      logger.error('JWT payload missing sub field', { payload });
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
    
    const userRoles = await getUserRoles(payload.sub);

    // Add roles to request headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-sub', payload.sub);
    response.headers.set('x-user-email', payload.email || '');
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
    '/((?!$|api/auth|api/session-check|api/cv-graph|_next/static|_next/image|favicon.ico).*)',
  ],
};