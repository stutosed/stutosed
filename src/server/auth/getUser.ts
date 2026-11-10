import 'server-only';

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export async function getUser(): Promise<AuthUser | null> {
  // Auth provider placeholder. Ready for pluggable auth.
  return null;
}
