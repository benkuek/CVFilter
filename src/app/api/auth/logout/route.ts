import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

const SESSION_COOKIE_NAME = 'session';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    logger.info('User logged out via POST');
    return response;
  } catch (error) {
    logger.error('Logout failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Support GET for logout URL
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  logger.info('User logged out via GET');
  return response;
}