export const UserRoles = ['Anyone', 'Admin', 'FleetManager'] as const;

export type UserRole = (typeof UserRoles)[number];
