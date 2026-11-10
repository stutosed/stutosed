import { betterAuth } from 'better-auth';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  database: {
    dialect: new LibsqlDialect({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    }),
    type: 'sqlite',
  },
  secret: process.env.BETTER_AUTH_SECRET || '62500f41857d444465f3b88a57a2a14eb6af8f22760a6108b9890fc98b12ff04',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
  plugins: [
    nextCookies(),
  ],
});
