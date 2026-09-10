import pg from 'pg';
import 'dotenv/config';

export const db = new pg.Client({
    connectionString:process.env.DATABASE_URL,
    ssl: {
    rejectUnauthorized: true, // Ensures a secure, validated connection to Neon
  }
});
