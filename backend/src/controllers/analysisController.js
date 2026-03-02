import { analyzePrompt } from '../services/detectionService.js';
import { query } from '../config/db.js';

export const analyze = async (req, res, next) => {
    try {
        const { prompt_text } = req.body;

        if (!prompt_text || prompt_text.length > 5000) {
            return res.status(400).json({ success: false, error: 'Prompt must be provided and under 5000 characters' });
        }

        const result = await analyzePrompt(prompt_text, req.user.id);

        const dbRes = await query(
            `INSERT INTO analyses 
            (user_id, prompt_text, attack_type, threat_level, threat_score, confidence, verdict, explanation, layer_results, pipeline_steps, is_blocked)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [
                req.user.id, prompt_text, result.attackType, result.threatLevel, result.threatScore, result.confidence,
                result.verdict, result.explanation, result.layerResults, JSON.stringify(result.pipelineSteps), result.isBlocked
            ]
        );

        await query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            req.user.id, 'ANALYZE', JSON.stringify({ threatLevel: result.threatLevel, attackType: result.attackType }), req.ip
        ]);

        res.status(201).json({ success: true, analysis: { ...result, id: dbRes.rows[0].id } });
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, threatLevel, attackType, search } = req.query;
        const offset = (page - 1) * limit;

        let whereQuery = 'user_id = $1';
        let queryParams = [req.user.id];
        let paramCount = 1;

        if (threatLevel && threatLevel !== 'ALL THREATS') {
            paramCount++;
            whereQuery += ` AND threat_level = $${paramCount}`;
            queryParams.push(threatLevel.toLowerCase());
        }

        if (attackType && attackType !== 'ALL ATTACKS') {
            paramCount++;
            whereQuery += ` AND attack_type = $${paramCount}`;
            queryParams.push(attackType.toLowerCase());
        }

        if (search) {
            paramCount++;
            whereQuery += ` AND prompt_text ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
        }

        const countRes = await query(`SELECT COUNT(*) FROM analyses WHERE ${whereQuery}`, queryParams);
        const total = parseInt(countRes.rows[0].count, 10);

        const dataRes = await query(`
            SELECT id, LEFT(prompt_text, 80) as prompt_text, attack_type, threat_level, threat_score, verdict, is_blocked, analyzed_at
            FROM analyses 
            WHERE ${whereQuery}
            ORDER BY analyzed_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...queryParams, limit, offset]);

        res.json({ success: true, data: dataRes.rows, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

export const getAnalysisById = async (req, res, next) => {
    try {
        const { rows } = await query('SELECT * FROM analyses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Analysis not found' });
        res.json({ success: true, analysis: rows[0] });
    } catch (error) {
        next(error);
    }
};

export const deleteHistory = async (req, res, next) => {
    try {
        const result = await query('DELETE FROM analyses WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Analysis not found' });

        await query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [req.user.id, 'DELETE', JSON.stringify({ analysisId: req.params.id }), req.ip]);
        res.json({ success: true, message: 'Analysis deleted' });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req, res, next) => {
    try {
        const { rows } = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_blocked = true THEN 1 ELSE 0 END) as blocked,
                SUM(CASE WHEN threat_level = 'safe' THEN 1 ELSE 0 END) as safe,
                SUM(CASE WHEN threat_level = 'warning' THEN 1 ELSE 0 END) as warning
            FROM analyses WHERE user_id = $1
        `, [req.user.id]);

        const total = parseInt(rows[0].total) || 0;
        const blocked = parseInt(rows[0].blocked) || 0;

        res.json({
            success: true,
            totalAnalyses: total,
            totalBlocked: blocked,
            totalSafe: parseInt(rows[0].safe) || 0,
            totalWarning: parseInt(rows[0].warning) || 0,
            blockedRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : 0
        });
    } catch (error) {
        next(error);
    }
};
