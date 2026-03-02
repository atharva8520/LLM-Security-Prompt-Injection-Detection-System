import { query } from '../config/db.js';
import axios from 'axios';

export const analyzePrompt = async (text, userId = null) => {
    const rawText = text || '';

    // LAYER 1: PREPROCESSING
    let cleanText = rawText.trim();
    const hiddenSegments = [];
    const decodedSegments = [];

    // Strip HTML Comments
    cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, (match) => {
        hiddenSegments.push(match);
        return '';
    });

    // Detect Base64
    const b64Regex = /[a-zA-Z0-9+/]{30,}={0,2}/g;
    const b64Matches = cleanText.match(b64Regex) || [];
    b64Matches.forEach(match => {
        try {
            const decoded = Buffer.from(match, 'base64').toString('utf8');
            decodedSegments.push(decoded);
            cleanText += ' ' + decoded; // Append decoded text for analysis
        } catch (e) { /* Ignore invalid base64 */ }
    });

    // Detect ROT13
    const rot13Decode = (str) => str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
    if (/rot13|cerivbhf|vafgehpgvbaf/i.test(cleanText)) {
        const decodedRot = rot13Decode(cleanText);
        decodedSegments.push(decodedRot);
        cleanText += ' ' + decodedRot;
    }

    // LAYER 2: HEURISTIC DETECTION
    const rulesRes = await query('SELECT * FROM detection_rules WHERE is_active = true');
    const rules = rulesRes.rows;

    const matchedRules = [];
    rules.forEach(rule => {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(cleanText) || hiddenSegments.some(h => regex.test(h))) {
            matchedRules.push({ name: rule.name, severity: rule.severity, type: rule.attack_type });
        }
    });

    // LAYER 3: ML CLASSIFIER (HUGGING FACE INFERENCE API)
    let score = 0;
    const attackTypes = new Set();
    let mlFlagged = false;
    let mlConfidence = 0;

    matchedRules.forEach(match => {
        attackTypes.add(match.type);
        if (match.severity === 'critical') score += 40;
        else if (match.severity === 'high') score += 25;
        else if (match.severity === 'medium') score += 15;
        else if (match.severity === 'low') score += 8;
    });

    if (attackTypes.size > 1) score += 10;
    if (decodedSegments.length > 0) score += 12;
    if (hiddenSegments.length > 0) score += 12;

    // Trigger Hugging Face API Request
    try {
        if (process.env.HUGGINGFACE_API_KEY) {
            const hfResponse = await axios.post(
                'https://router.huggingface.co/hf-inference/models/ProtectAI/deberta-v3-base-prompt-injection-v2',
                { inputs: rawText },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 4000 // 4 seconds timeout
                }
            );

            // API typically returns [[{label: "INJECTION", score: 0.99}, {label: "SAFE", score: 0.01}]]
            const results = Array.isArray(hfResponse.data) && Array.isArray(hfResponse.data[0])
                ? hfResponse.data[0]
                : [];

            const injectionResult = results.find(item => item.label === 'INJECTION');

            if (injectionResult && injectionResult.score > 0.6) {
                mlFlagged = true;
                mlConfidence = Math.round(injectionResult.score * 100);
                score += mlConfidence; // Boost score due to high confidence AI prediction
                attackTypes.add('semantic_injection');
            }
        }
    } catch (error) {
        console.warn('[WARN] ML Classification API Error (fallback to heuristics):', error.message);
    }

    score = Math.min(100, score);

    let confidence = mlFlagged ? mlConfidence : 96;
    if (!mlFlagged) {
        if (score >= 70) confidence = 95;
        else if (score >= 40) confidence = 88;
        else if (score >= 20) confidence = 82;
    }

    // LAYER 4: RISK SCORING
    let threatLevel = 'safe';
    let isBlocked = false;

    if (score >= 70) {
        threatLevel = 'danger';
        isBlocked = true;
    } else if (score >= 35) {
        threatLevel = 'warning';
    }

    // LAYER 5: DECISION
    const pipelineSteps = [
        { name: 'INPUT', status: 'passed' },
        { name: 'PREPROCESS', status: (hiddenSegments.length || decodedSegments.length) ? 'active' : 'passed' },
        { name: 'HEURISTIC', status: matchedRules.length > 0 ? (isBlocked ? 'blocked' : 'active') : 'passed' },
        { name: 'ML', status: score > 35 ? 'active' : 'passed' },
        { name: 'RISK', status: 'passed' },
        { name: 'DECISION', status: isBlocked ? 'blocked' : 'passed' }
    ];

    const layerResults = {
        preprocessing: { hiddenCount: hiddenSegments.length, decodedCount: decodedSegments.length },
        heuristics: matchedRules.map(r => r.name)
    };

    const primaryAttackType = Array.from(attackTypes)[0] || 'safe';

    let verdict = 'PROMPT VERIFIED SAFE';
    let explanation = 'No significant threat signatures or obfuscation patterns detected in the prompt matrix. Routine execution permitted.';

    if (threatLevel === 'danger') {
        verdict = 'MALICIOUS INTENT BLOCKED';
        explanation = `Critical security violation intercepted. The prompt actively triggered ${matchedRules.length} security heuristics targeting structural integrity (${matchedRules.map(r => r.name).join(', ')}). Execution halted.`;
    } else if (threatLevel === 'warning') {
        verdict = 'SUSPICIOUS PATTERN FLAGGED';
        explanation = 'Anomalous behavior or edge-case bypass attempts detected. The prompt contains unusual lexical structures requiring potential manual review, though below threshold for automatic termination.';
    }

    const analysisRecord = {
        promptText: rawText,
        attackType: primaryAttackType,
        threatLevel,
        threatScore: score,
        confidence,
        verdict,
        explanation,
        layerResults,
        pipelineSteps,
        isBlocked
    };

    return analysisRecord;
};
