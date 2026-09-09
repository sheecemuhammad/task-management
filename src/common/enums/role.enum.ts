export const SystemRole = {
  OWNER: 'OWNER',
  USER: 'USER',
} as const;

export type SystemRole =
  (typeof SystemRole)[keyof typeof SystemRole];

export const TeamRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type TeamRole =
  (typeof TeamRole)[keyof typeof TeamRole];