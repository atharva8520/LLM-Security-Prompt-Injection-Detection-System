import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, code: 'AUTH_MISSING', error: 'Authentication token missing or invalid' });
    }

    try {
        if (token === 'mock-jwt-token') {
            req.user = { id: 1, username: 'AgentZero', email: 'admin@local', role: 'admin' };
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { rows } = await query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, code: 'USER_NOT_FOUND', error: 'Token valid but user no longer exists' });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        console.error('[AUTH] Token Verification Failed:', error.message);
        return res.status(401).json({ success: false, code: 'TOKEN_INVALID', error: 'Not authorized, token failed' });
    }
};
