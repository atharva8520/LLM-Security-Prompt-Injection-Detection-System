import { query } from '../config/db.js';
import axios from 'axios';
import { classifyPrompt } from './mlService.js';

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
    let rules = [];
    if (process.env.MOCK_DB === 'true') {
        rules = [
            { name: 'Direct Override', pattern: 'ignore.*(previous|all|prior).*instruction', severity: 'critical', attack_type: 'direct' },
            { name: 'System Prompt Leak', pattern: 'reveal.*system.*prompt|show.*system.*prompt|output.*instructions', severity: 'critical', attack_type: 'direct' },
            { name: 'Developer Mode', pattern: 'developer mode|jailbreak mode|god mode', severity: 'high', attack_type: 'direct' },
            { name: 'DAN Jailbreak', pattern: 'act as dan|do anything now|without restrictions', severity: 'high', attack_type: 'jailbreak' },
            { name: 'Persona Override', pattern: 'you are now|pretend you are|roleplay as|you are a bot', severity: 'medium', attack_type: 'jailbreak' },
            { name: 'Malware Generation', pattern: 'write.*malware|how to hack|exploit.*vulnerability|bypass.*security|ddos.*attack|reverse.*shell', severity: 'critical', attack_type: 'malware' },
            { name: 'Credential Theft', pattern: 'steal.*password|keylogger|phishing.*email|wifi.*password', severity: 'critical', attack_type: 'credential_theft' },
            { name: 'SQL Injection Payload', pattern: 'drop table|select.*from information_schema|union select|1=1--', severity: 'high', attack_type: 'sqli' },
            { name: 'OS Command Exec', pattern: '\\/bin\\/bash|\\/bin\\/sh|rm -rf|wget.*http|curl.*http|chmod \\+x', severity: 'critical', attack_type: 'os_cmd_injection' },
            { name: 'Toxicity/Abuse', pattern: 'kill yourself|i hate you|stupid ai|dumb bot|nazi', severity: 'low', attack_type: 'toxicity' },
            { name: 'Social Engineering', pattern: 'pretend to be my bank|urgent.*account.*suspended|reset.*password.*link', severity: 'high', attack_type: 'phishing' },
            { name: 'PII Extraction', pattern: 'give me.*credit card|social security number|ssn|leak.*database', severity: 'critical', attack_type: 'pii_leak' },
            { name: 'Content Filter Evasion', pattern: 'hypothetical scenario|for educational purposes only|in a fictional world', severity: 'medium', attack_type: 'evasion' }
        ];
    } else {
        const rulesRes = await query('SELECT * FROM detection_rules WHERE is_active = true');
        rules = rulesRes.rows;
    }

    const matchedRules = [];
    rules.forEach(rule => {
        try {
            // Some patterns are regex, some are literal. Safe test.
            const regex = new RegExp(rule.pattern, 'i');
            if (regex.test(cleanText) || hiddenSegments.some(h => regex.test(h))) {
                matchedRules.push({ name: rule.name, severity: rule.severity, type: rule.attack_type });
            }
        } catch (e) {
            // Regex parsing fallback
            if (cleanText.toLowerCase().includes(rule.pattern.toLowerCase())) {
                matchedRules.push({ name: rule.name, severity: rule.severity, type: rule.attack_type });
            }
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

    // Trigger Smart ML Router
    try {
        const mlResult = await classifyPrompt(rawText);

        if (mlResult) {
            if (mlResult.label === 'INJECTION') {
                mlFlagged = true;
                mlConfidence = Math.round(mlResult.score * 100);
                score += mlConfidence; // Boost score due to high confidence AI prediction
                attackTypes.add('semantic_injection');
            } else if (mlResult.label === 'SAFE') {
                // If the model is confident it's safe (low injection score)
                mlConfidence = Math.round((1 - mlResult.score) * 100);
                if (score < 40) {
                    score = Math.max(0, score + (mlResult.threatScore || -20));
                } else {
                    mlConfidence = 80; // ML disagrees with heuristics
                }
            }
        }
    } catch (error) {
        console.warn('[WARN] Smart ML Router Error (fallback to heuristics):', error.message);
    }

    score = Math.min(100, score);

    let confidence = mlConfidence > 0 ? mlConfidence : 96;
    if (!mlFlagged && mlConfidence === 0) {
        if (score >= 70) confidence = 95;
        else if (score >= 40) confidence = 88;
        else if (score >= 20) confidence = 82;
        else confidence = 99; // Baseline high confidence for normal safe prompts if heuristic finds nothing
    }

    // LAYER 4: RISK SCORING
    let threatLevel = 'safe';
    let isBlocked = false;

    if (score >= 70) {
        threatLevel = 'danger';
        isBlocked = true;
    } else if (score >= 35) {
        threatLevel = 'warning';
    } else if (score < 15 && attackTypes.size === 0) {
        // Enforce safe rating for very low scores with no heuristic hits
        threatLevel = 'safe';
    }

    // LAYER 5: DECISION
    const pipelineSteps = [
        { name: 'INPUT', status: 'passed' },
        { name: 'PREPROCESS', status: (hiddenSegments.length || decodedSegments.length) ? 'active' : 'passed' },
        { name: 'HEURISTIC', status: matchedRules.length > 0 ? (isBlocked ? 'blocked' : 'active') : 'passed' },
        { name: 'ML', status: 'active' }, // ML API is always active now
        { name: 'RISK', status: 'passed' },
        { name: 'DECISION', status: isBlocked ? 'blocked' : 'passed' }
    ];

    const layerResults = {
        preprocessing: { hiddenCount: hiddenSegments.length, decodedCount: decodedSegments.length },
        heuristics: matchedRules.map(r => r.name)
    };

    const primaryAttackType = Array.from(attackTypes)[0] || 'safe';

    let verdict = 'PROMPT VERIFIED SAFE';
    let explanation = 'No significant threat signatures or obfuscation patterns detected in the prompt matrix. Routine execution permitted. The analysis indicates this is a standard user interaction.';

    if (threatLevel === 'danger') {
        verdict = 'MALICIOUS INTENT BLOCKED';
        explanation = `Critical security violation intercepted. The prompt actively triggered heuristics or ML classifiers targeting structural integrity. Execution halted.`;
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
