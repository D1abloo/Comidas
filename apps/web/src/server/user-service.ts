import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgDeleteUser, pgListUsers, pgUpdateUserRole } from './orders-db.js';
import { persistOperationalState } from './store-persistence.js';
import type { Role, User } from './types.js';

export async function listUsers(): Promise<User[]> {
  if (isDatabaseEnabled()) return pgListUsers();
  return getStore().users;
}

export async function updateUserRole(id: string, role: Role): Promise<User | null> {
  if (isDatabaseEnabled()) return pgUpdateUserRole(id, role);
  const store = getStore();
  const user = store.users.find((candidate) => candidate.id === id);
  if (!user) return null;
  user.role = role;
  await persistOperationalState(store);
  return user;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isDatabaseEnabled()) return pgDeleteUser(id);
  const store = getStore();
  const index = store.users.findIndex((candidate) => candidate.id === id);
  if (index < 0) return false;
  store.users.splice(index, 1);
  await persistOperationalState(store);
  return true;
}
