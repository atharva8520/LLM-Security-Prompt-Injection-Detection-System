import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'llm_shield',
        port: parseInt(process.env.DB_PORT || '5432', 10),
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    console.log('[SYS] PostgreSQL Connection Pool Established');
});

pool.on('error', (err) => {
    console.error('[ERR] Idle client error', err.message, err.stack);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;
