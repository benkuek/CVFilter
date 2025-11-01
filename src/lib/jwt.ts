import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import logger from './logger';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const JWT_ALGORITHM = 'HS256';
const SESSION_DURATION = process.env.SESSION_DURATION || '24h';

export interface SessionData {
  sub: string;
  email?: string;
  name?: string;
  exp: number;
}

export async function createSession(payload: Omit<SessionData, 'exp'>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(SESSION_DURATION)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionData;
  } catch (error) {
    logger.error('JWT verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

export async function getSession(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;
  
  if (!token) return null;
  
  return await verifySession(token);
}