import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const config: PoolConfig = {
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (connectionString && (connectionString.includes('neon.tech') || connectionString.includes('sslmode=require'))) {
  config.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new Pool(config);
export const db = drizzle(pool, { schema });

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
