export type Role = 'STUDENT' | 'TEACHER';

export function parseRole(value: unknown): Role {
  return value === 'TEACHER' ? 'TEACHER' : 'STUDENT';
}

export const homeForRole = (role: Role) => (role === 'TEACHER' ? '/teacher' : '/dashboard');
