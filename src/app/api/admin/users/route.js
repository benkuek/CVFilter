import { NextResponse } from 'next/server';
import { getAllUsers, setUserRoles } from '../../../lib/auth/roles';
import logger from '../../../lib/logger';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    logger.error('Failed to get users', { error: error.message });
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { sub, roles } = await request.json();
    
    if (!sub || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await setUserRoles(sub, roles);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to update roles', { error: error.message });
    return NextResponse.json({ error: 'Failed to update roles' }, { status: 500 });
  }
}