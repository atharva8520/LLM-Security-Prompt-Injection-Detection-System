import app from './src/app.js';
import pool from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Enforce Hugging Face API key on startup
if (!process.env.HF_API_KEY || process.env.HF_API_KEY === 'your_hugging_face_api_key_here') {
    console.error('\n=============================================================');
    console.error(' [ERROR] Hugging Face API Key is missing or invalid.');
    console.error(' Please create a .env file and add your HF_API_KEY.');
    console.error(' Get yours here: https://huggingface.co/settings/tokens');
    console.error('=============================================================\n');
    process.exit(1);
}

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
        process.env.MOCK_DB = 'true';
        app.listen(PORT, () => {
            console.log(`[SYS] Server sequence started on port ${PORT} (OFFLINE MOCK MODE)`);
        });
    }
};

startServer();
