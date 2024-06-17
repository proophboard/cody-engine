export const UserRoles = [
  'Anyone',
  'Admin'
] as const;

export type UserRole = typeof UserRoles[number];
