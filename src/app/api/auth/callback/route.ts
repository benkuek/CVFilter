import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/jwt';
import { parseDuration } from '@/lib/auth/utils';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      logger.error('Auth0 callback error', { error, description: searchParams.get('error_description') });
      return NextResponse.redirect(new URL('/?error=' + error, request.url));
    }
    
    if (!code || !state) {
      logger.error('Missing callback parameters', { hasCode: !!code, hasState: !!state });
      return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    // Verify state
    const storedState = request.cookies.get(process.env.OAUTH_STATE_COOKIE_NAME || 'oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      logger.error('State verification failed', { hasStoredState: !!storedState, stateMatch: storedState === state });
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    // Simple token exchange without OIDC client for now
    const tokenResponse = await fetch(`${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI
      })
    });
    
    const tokens = await tokenResponse.json();

    // Get user info
    const userinfoResponse = await fetch(`${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userinfo = await userinfoResponse.json();
    
    logger.info('Full userinfo from provider', { userinfo });
    
    // Store/update user in database
    const { createOrUpdateUser } = await import('@/lib/auth/roles');
    await createOrUpdateUser(userinfo.sub, userinfo);
    
    // Create session JWT - use sub as primary identifier
    const sessionToken = await createSession({
      sub: userinfo.sub,
      email: userinfo.email,
      name: userinfo.name
    });

    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Set session cookie
    response.cookies.set(process.env.SESSION_COOKIE_NAME || 'session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseDuration(process.env.SESSION_DURATION),
      path: '/',
    });

    // Clear temporary cookies
    response.cookies.delete(process.env.OAUTH_STATE_COOKIE_NAME || 'oauth_state');

    logger.info('Authentication successful', { email: userinfo.email, sub: userinfo.sub });
    return response;
  } catch (error) {
    logger.error('Callback processing failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}