import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_STREAM_PROXY_URL: z.string().url().optional(),
  ABYSS_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_STREAM_PROXY_URL: process.env.NEXT_PUBLIC_STREAM_PROXY_URL,
  ABYSS_API_KEY: process.env.ABYSS_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables. Check server logs.');
}

export const env = parsed.data;
