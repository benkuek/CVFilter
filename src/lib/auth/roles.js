import { createStorage } from './storage';

let storage = null;

async function getStorage() {
  if (!storage) {
    storage = await createStorage();
  }
  return storage;
}

export async function createOrUpdateUser(sub, userinfo) {
  const storageInstance = await getStorage();
  const existingUser = await storageInstance.getUser(sub);
  
  const userData = {
    ...existingUser,
    email: userinfo.email,
    name: userinfo.name,
    lastLogin: new Date().toISOString(),
    roles: existingUser.roles || []
  };
  
  await storageInstance.setUser(sub, userData);
  return userData;
}

export async function getUserRoles(sub) {
  const storageInstance = await getStorage();
  const user = await storageInstance.getUser(sub);
  return user.roles || [];
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