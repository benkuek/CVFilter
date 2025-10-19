import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/jwt';

const SESSION_COOKIE_NAME = 'session';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  
  try {
    const session = await verifySession(token);
    if (session) {
      return NextResponse.json({ authenticated: true, ...session });
    }
  } catch {
    // Token invalid
  }
  
  return NextResponse.json({ authenticated: false });
}