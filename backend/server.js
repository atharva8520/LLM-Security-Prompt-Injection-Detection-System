import app from './src/app.js';
import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const { rows } = await pool.query('SELECT NOW()');
        console.log(`[SYS] DB Initialization Successful: ${rows[0].now}`);

        app.listen(PORT, () => {
            console.log(`[SYS] Server sequence started on port ${PORT}`);
        });
    } catch (error) {
        console.warn('[WARN] DB Initialization Failed. Running in offline/mock mode for testing.', error.message);
        app.listen(PORT, () => {
            console.log(`[SYS] Server sequence started on port ${PORT} (OFFLINE MOCK MODE)`);
        });
    }
};

startServer();
