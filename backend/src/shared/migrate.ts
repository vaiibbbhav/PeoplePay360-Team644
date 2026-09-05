import fs from 'fs';
import path from 'path';
import { pool, closeDb } from './db';

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    console.info(`Found ${files.length} database migration(s):`, files.join(', '));

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.info(`Executing database migration: ${file}...`);
      await client.query(sql);
    }
    console.info('All migrations completed successfully.');
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
