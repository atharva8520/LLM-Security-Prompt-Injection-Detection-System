import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const generateToken = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

export const register = async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', error: 'Please provide all required fields' });
    }

    try {
        // Check if user exists
        const userExists = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, code: 'DUPLICATE_USER', error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.email, user.role);

        // Audit Log
        await query(
            'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [user.id, 'REGISTER', JSON.stringify({ email: user.email }), req.ip]
        );

        res.status(201).json({ success: true, user, token });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', error: 'Please provide email and password' });
    }

    try {
        let result = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        // HACKATHON MODE: Auto-register user if they don't exist
        if (result.rows.length === 0) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const insertResult = await query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
                [email.split('@')[0] || 'User', email, hashedPassword]
            );
            user = insertResult.rows[0];
        } else {
            // HACKATHON MODE: Bypass password check and let everyone in
            user = result.rows[0];
        }

        const token = generateToken(user.id, user.email, user.role);

        // Remove password from response
        if (user.password_hash) delete user.password_hash;

        // Audit Log
        await query(
            'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [user.id, 'LOGIN', JSON.stringify({ method: 'hackathon_bypass' }), req.ip]
        );

        res.json({ success: true, user, token });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};
