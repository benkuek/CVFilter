import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/jwt';
import { enhanceJWTWithRoles } from '@/lib/auth/utils';
import logger from '@/lib/logger';

const SESSION_COOKIE_NAME = 'session';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  
  try {
    const session = await verifySession(token);
    if (session) {
      const enhancedSession = await enhanceJWTWithRoles(session);
      return NextResponse.json({ authenticated: true, ...enhancedSession });
    }
  } catch (error) {
    logger.error('Session verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
  
  return NextResponse.json({ authenticated: false });
}