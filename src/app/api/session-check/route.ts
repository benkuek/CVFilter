import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/jwt';
import { enhanceJWTWithRoles } from '@/lib/auth/utils';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Handle mock auth (development only)
  if (process.env.MOCK_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    const mockRoles = process.env.MOCK_USER_ROLES?.split(',').filter(Boolean) || [];
    return NextResponse.json({
      authenticated: true,
      sub: process.env.MOCK_USER_ID || 'dev-user',
      email: 'dev@local.test',
      name: 'Dev User',
      roles: mockRoles
    });
  }

  const token = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;
  
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  
  logger.info('Token found', { tokenLength: token.length, tokenStart: token.substring(0, 20) });
  
  try {
    const session = await verifySession(token);
    logger.info('Session verification result', { hasSession: !!session, email: session?.email });
    if (session) {
      const enhancedSession = await enhanceJWTWithRoles(session);
      return NextResponse.json({ authenticated: true, ...enhancedSession });
    }
  } catch (error) {
    logger.error('Session verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
  
  return NextResponse.json({ authenticated: false });
}