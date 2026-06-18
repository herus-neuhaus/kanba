import { db } from '../db';
import { sql } from 'drizzle-orm';

export class DbHealthService {
  static async checkConnection() {
    try {
      // Execute a simple query
      const result = await db.execute(sql`SELECT 1 as connected`);
      
      return {
        connected: true,
        database: 'PostgreSQL (Supabase)',
        message: 'Connection successful',
        queryResult: result,
      };
    } catch (error) {
      console.error('Database connection failed', error);
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
