import { getUserRoles } from './roles.js';

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