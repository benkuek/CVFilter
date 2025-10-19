import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import logger from '@/lib/logger';

const STATE_LENGTH = 32;
const OAUTH_SCOPE = 'openid email profile';
const STATE_COOKIE_NAME = 'oauth_state';
const STATE_COOKIE_MAX_AGE = 600; // 10 minutes

export async function GET() {
  try {
    const state = randomBytes(STATE_LENGTH).toString('hex');
    
    const authUrl = `${process.env.AUTH0_DOMAIN}/authorize?` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI!)}&` +
      `scope=${encodeURIComponent(OAUTH_SCOPE)}&` +
      `state=${state}`;
    
    logger.info('Initiating OAuth login', { clientId: process.env.AUTH0_CLIENT_ID });
    
    const response = NextResponse.redirect(authUrl);
    
    // Store state in cookie
    response.cookies.set(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: STATE_COOKIE_MAX_AGE,
    });
    
    return response;
  } catch (error) {
    logger.error('Login failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}