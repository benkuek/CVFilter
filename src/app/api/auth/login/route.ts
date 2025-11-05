import { NextResponse, NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import logger from '@/lib/logger';

const STATE_LENGTH = 32;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceLogin = searchParams.get('force');
    
    const state = randomBytes(STATE_LENGTH).toString('hex');
    
    let authUrl = `${process.env.AUTH0_DOMAIN}/authorize?` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI!)}&` +
      `scope=${encodeURIComponent(process.env.OAUTH_SCOPE || 'openid email profile')}&` +
      `state=${state}`;
    
    if (forceLogin) {
      authUrl += '&prompt=login';
    }
    
    logger.info('Initiating OAuth login', { clientId: process.env.AUTH0_CLIENT_ID });
    
    const response = NextResponse.redirect(authUrl);
    
    // Store state in cookie
    response.cookies.set(process.env.OAUTH_STATE_COOKIE_NAME || 'oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.OAUTH_STATE_DURATION as string) || 600,
      path: '/',
    });
    
    return response;
  } catch (error) {
    logger.error('Login failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}