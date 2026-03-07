import axios from 'axios';

const LOCAL_ML_URL = process.env.LOCAL_ML_URL || 'http://localhost:5001';
const HF_API_KEY = process.env.HF_API_KEY;
// If the user uploads to hub, this variable will be used. Otherwise falls back to ProtectAI.
const HF_MODEL_URL = process.env.HF_MODEL_URL || 'https://router.huggingface.co/hf-inference/models/ProtectAI/deberta-v3-base-prompt-injection-v2';

// Check if local ML server is running
async function isLocalServerUp() {
    try {
        await axios.get(`${LOCAL_ML_URL}/health`, { timeout: 2000 });
        return true;
    } catch {
        return false;
    }
}

// Call local Flask ML server
async function callLocalModel(text) {
    const response = await axios.post(
        `${LOCAL_ML_URL}/classify`,
        { text },
        { timeout: 8000 }
    );
    return {
        label: response.data.label,
        score: response.data.score,
        threatScore: response.data.threat_score,
        source: 'local-model',
    };
}

// Call HuggingFace API (Fallback)
async function callHuggingFace(text) {
    const response = await axios.post(
        HF_MODEL_URL,
        { inputs: text },
        {
            headers: { Authorization: `Bearer ${HF_API_KEY}` },
            timeout: 15000,
        }
    );

    // Parse HuggingFace response
    const results = Array.isArray(response.data) && Array.isArray(response.data[0])
        ? response.data[0]
        : response.data;

    let injScore = 0;
    let fallbackThreatScore = 0;

    if (Array.isArray(results)) {
        const injection = results.find(r => r.label.toUpperCase().includes('INJECTION') || r.label === 'LABEL_1');
        const safe = results.find(r => r.label.toUpperCase().includes('SAFE') || r.label === 'LABEL_0');

        injScore = injection ? injection.score : 0;

        if (injScore > 0.6) {
            fallbackThreatScore = Math.round(injScore * 100);
        } else if (safe && safe.score > 0.8) {
            // Highly confident safe prompt gets negative threat impact in outer scope
            fallbackThreatScore = -20;
        }
    }

    return {
        label: injScore > 0.5 ? 'INJECTION' : 'SAFE',
        score: injScore,
        threatScore: fallbackThreatScore,
        source: 'huggingface',
    };
}

// MAIN FUNCTION — smart router with fallbacks
export const classifyPrompt = async (text) => {
    // Try 1: Local model
    try {
        const isUp = await isLocalServerUp();
        if (isUp) {
            console.log('[ML] Attempting local model classification...');
            const result = await callLocalModel(text);
            console.log(`[ML] Used local model — label: ${result.label}, score: ${result.score}`);
            return result;
        }
    } catch (err) {
        console.warn('[ML] Local model request failed:', err.message);
    }

    // Try 2: HuggingFace API
    if (HF_API_KEY) {
        try {
            console.log('[ML] Local model unavailable. Attempting HuggingFace API classification...');
            const result = await callHuggingFace(text);
            console.log(`[ML] Used HuggingFace — label: ${result.label}, score: ${result.score}`);
            return result;
        } catch (err) {
            console.warn('[ML] HuggingFace API failed:', err.message);
        }
    }

    // Try 3: Return null (heuristic fallback in detectionService)
    console.warn('[ML] All ML sources failed — using heuristic fallback');
    return null;
};
