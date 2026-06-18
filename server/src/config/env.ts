import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env da raiz do projeto (kanba/.env)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  EVOLUTION_BASE_URL: z.string().url().default('https://evo.overflyia.com.br'),
  EVOLUTION_API_KEY: z.string(),
});

const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  EVOLUTION_BASE_URL: process.env.EVOLUTION_BASE_URL || process.env.VITE_EVOLUTION_BASE_URL,
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || process.env.VITE_EVOLUTION_API_KEY,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
