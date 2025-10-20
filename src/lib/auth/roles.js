import { createStorage } from './storage.js';

const storage = createStorage();

export async function getUserRoles(email) {
  const user = await storage.getUser(email);
  return user.roles;
}

export async function setUserRoles(email, roles) {
  await storage.setUserRoles(email, roles);
}

export async function hasRole(email, role) {
  const roles = await getUserRoles(email);
  return roles.includes(role);
}

export async function hasAnyRole(email, requiredRoles) {
  const userRoles = await getUserRoles(email);
  return requiredRoles.some(role => userRoles.includes(role));
}

export async function getAllUsers() {
  return await storage.getAllUsers();
}