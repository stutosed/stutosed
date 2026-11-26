import { betterAuth } from 'better-auth';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { nextCookies } from 'better-auth/next-js';
import { dash } from '@better-auth/infra';
import { expo } from '@better-auth/expo';
import { getCloudflareContext } from '@opennextjs/cloudflare';

type RuntimeEnv = Record<string, string | undefined>;

function createAuthInstance(runtimeEnv: RuntimeEnv) {
  const tursoUrl =
    runtimeEnv.TURSO_DATABASE_URL ||
    process.env.TURSO_DATABASE_URL ||
    'libsql://stutosed-7atva.aws-ap-south-1.turso.io';
  const tursoToken =
    runtimeEnv.TURSO_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    '';
  const secret =
    runtimeEnv.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    '62500f41857d444465f3b88a57a2a14eb6af8f22760a6108b9890fc98b12ff04';
  const baseURL =
    runtimeEnv.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    runtimeEnv.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://stutosed.7atva.workers.dev';
  const betterAuthApiKey =
    runtimeEnv.BETTER_AUTH_API_KEY || process.env.BETTER_AUTH_API_KEY;
  const googleClientId =
    runtimeEnv.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret =
    runtimeEnv.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    database: {
      dialect: new LibsqlDialect({
        url: tursoUrl,
        authToken: tursoToken,
      }),
      type: 'sqlite',
    },
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      ...(googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
              accessType: 'offline',
              prompt: 'select_account',
            },
          }
        : {}),
    },
    advanced: {
      database: {
        joins: true,
      },
    },
    trustedOrigins: [
      'stutosed://',
      'exp://**',
      'https://stutosed.7atva.workers.dev',
      'http://localhost:3000',
    ],
    plugins: [
      expo(),
      dash({
        apiKey: betterAuthApiKey,
      }),
      nextCookies(),
    ],
  });
}

let cachedAuth: ReturnType<typeof createAuthInstance> | null = null;
let cachedKey = '';

async function readCloudflareEnv(): Promise<RuntimeEnv> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return ((ctx?.env as unknown) as RuntimeEnv) || {};
  } catch {
    return {};
  }
}

export async function getAuth() {
  const cfEnv = await readCloudflareEnv();
  const hasGoogle = Boolean(
    (cfEnv.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
      (cfEnv.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  );
  const urlKey =
    cfEnv.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    'default';
  const nextKey = `${hasGoogle ? '1' : '0'}:${urlKey}`;

  if (!cachedAuth || cachedKey !== nextKey) {
    cachedAuth = createAuthInstance(cfEnv);
    cachedKey = nextKey;
  }
  return cachedAuth;
}

export const auth = createAuthInstance({});
