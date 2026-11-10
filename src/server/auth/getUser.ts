import 'server-only';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  image?: string | null;
  [key: string]: unknown;
}

export async function getUser(): Promise<AuthUser | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  } catch {
    return null;
  }
}
