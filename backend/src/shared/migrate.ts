import fs from 'fs';
import path from 'path';
import { pool, closeDb } from './db';

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    const migrationFile = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.info('Executing database migration: 001_initial_schema.sql...');
    await client.query(sql);
    console.info('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await closeDb();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
