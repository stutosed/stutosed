import 'server-only';

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export async function getUser(): Promise<AuthUser | null> {
  // Supabase auth removed. Ready for new auth provider.
  return null;
}
