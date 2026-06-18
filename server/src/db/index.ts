import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});
export const db = drizzle(client, { schema });
