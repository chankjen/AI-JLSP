import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export default pool;
