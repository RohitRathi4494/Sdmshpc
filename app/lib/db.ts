import { Pool } from 'pg';

// Using environment variables for connection
// In a real scenario, ensure these are set in .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
    pool,
};
