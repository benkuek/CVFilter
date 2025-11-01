import { createStorage } from './storage';

let storage = null;

async function getStorage() {
  if (!storage) {
    storage = await createStorage();
  }
  return storage;
}

export async function getUserRoles(email) {
  const storageInstance = await getStorage();
  const user = await storageInstance.getUser(email);
  return user.roles;
}

export async function setUserRoles(email, roles) {
  const storageInstance = await getStorage();
  await storageInstance.setUserRoles(email, roles);
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
  const storageInstance = await getStorage();
  return await storageInstance.getAllUsers();
}