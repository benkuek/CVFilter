import { getUserRoles } from './roles';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function verifyAuth0JWT(token) {
  // Verify Auth0 JWT using Auth0's public key or shared secret
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

export async function enhanceJWTWithRoles(userPayload) {
  const roles = await getUserRoles(userPayload.email);
  return {
    ...userPayload,
    roles
  };
}

export function parseDuration(duration) {
  if (!duration) return 60 * 60 * 24;
  const match = duration.match(/^(\d+)([hmd])$/);
  if (!match) return 60 * 60 * 24;
  const [, num, unit] = match;
  const multipliers = { m: 60, h: 60 * 60, d: 60 * 60 * 24 };
  return parseInt(num) * multipliers[unit];
}