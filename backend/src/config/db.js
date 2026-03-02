import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('[SYS] PostgreSQL Connection Pool Established');
});

pool.on('error', (err) => {
    console.error('[ERR] Idle client error', err.message, err.stack);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;
