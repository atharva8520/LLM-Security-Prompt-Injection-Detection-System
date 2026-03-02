import { query } from '../config/db.js';

export const getDashboardSummary = async (req, res, next) => {
    try {
        // Levels counts
        const levelsRes = await query(`
            SELECT threat_level, COUNT(*) as count 
            FROM analyses WHERE user_id = $1 GROUP BY threat_level
        `, [req.user.id]);

        // Attack types counts
        const typesRes = await query(`
            SELECT attack_type, COUNT(*) as count 
            FROM analyses WHERE user_id = $1 GROUP BY attack_type
        `, [req.user.id]);

        const summary = {
            levels: levelsRes.rows.reduce((acc, row) => ({ ...acc, [row.threat_level]: parseInt(row.count) }), { safe: 0, warning: 0, danger: 0 }),
            types: typesRes.rows.reduce((acc, row) => ({ ...acc, [row.attack_type]: parseInt(row.count) }), {})
        };

        res.json({ success: true, summary });
    } catch (error) {
        next(error);
    }
};

export const getDashboardTimeline = async (req, res, next) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 7, 30);

        const { rows } = await query(`
            SELECT 
                DATE_TRUNC('day', analyzed_at) as date,
                SUM(CASE WHEN threat_level = 'safe' THEN 1 ELSE 0 END) as safe,
                SUM(CASE WHEN threat_level = 'warning' THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN threat_level = 'danger' THEN 1 ELSE 0 END) as danger
            FROM analyses 
            WHERE user_id = $1 AND analyzed_at >= NOW() - INTERVAL '${days} days'
            GROUP BY date
            ORDER BY date ASC
        `, [req.user.id]);

        const timeline = rows.map(r => ({
            date: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
            safe: parseInt(r.safe) || 0,
            warning: parseInt(r.warning) || 0,
            danger: parseInt(r.danger) || 0
        }));

        res.json({ success: true, timeline });
    } catch (error) {
        next(error);
    }
};

export const getDashboardRecent = async (req, res, next) => {
    try {
        const { rows } = await query(`
            SELECT id, LEFT(prompt_text, 100) as prompt, attack_type as type, threat_level as level, threat_score as score, 
                   CASE WHEN is_blocked THEN 'BLOCKED' WHEN threat_level = 'warning' THEN 'FLAGGED' ELSE 'ALLOWED' END as status,
                   analyzed_at
            FROM analyses 
            WHERE user_id = $1
            ORDER BY analyzed_at DESC 
            LIMIT 5
        `, [req.user.id]);

        res.json({ success: true, recent: rows });
    } catch (error) {
        next(error);
    }
};
