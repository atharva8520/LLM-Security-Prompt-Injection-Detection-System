from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = Flask(__name__)
CORS(app) # Enable CORS for localhost:5000

MODEL_DIR = "./my-injection-detector"
model = None
tokenizer = None
device = None

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def log_request(response):
    if hasattr(request, 'start_time'):
        latency = (time.time() - request.start_time) * 1000
        print(f"[{request.method}] {request.path} - {response.status_code} - {latency:.1f}ms")
    return response

def load_model():
    global model, tokenizer, device
    if os.path.exists(MODEL_DIR):
        print(f"Loading local model from {MODEL_DIR}...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
            model.eval()
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model.to(device)
            print(f"✅ Model loaded successfully on {device}")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
    else:
        print("⚠️ Warning: local model directory not found. Please train the model first.")

with app.app_context():
    load_model()

@app.route('/classify', methods=['POST'])
def classify():
    if not model or not tokenizer:
        return jsonify({"error": "Model not loaded. Service unavailable."}), 503
        
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' in request body"}), 400
        
    text = str(data['text'])
    if len(text) > 5000:
        return jsonify({"error": "Text too long (max 5000 chars)"}), 400
        
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model(**inputs)
            
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        pred_label = torch.argmax(probs).item()
        
        # 0 = SAFE, 1 = INJECTION
        label_str = "INJECTION" if pred_label == 1 else "SAFE"
        injection_score = probs[1].item()
        safe_score = probs[0].item()
        
        threat_score = int(round(injection_score * 100))
        
        return jsonify({
            "label": label_str,
            "score": injection_score,
            "safe_score": safe_score,
            "threat_score": threat_score,
            "source": "local-model",
            "model": "my-injection-detector"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/classify/batch', methods=['POST'])
def classify_batch():
    if not model or not tokenizer:
        return jsonify({"error": "Model not loaded. Service unavailable."}), 503
        
    data = request.json
    if not data or 'texts' not in data or not isinstance(data['texts'], list):
        return jsonify({"error": "Missing 'texts' array in request body"}), 400
        
    texts = [str(t) for t in data['texts']]
    if len(texts) > 10:
        return jsonify({"error": "Max 10 texts per batch"}), 400
        
    results = []
    try:
        # Simplistic sequential processing for batch
        for text in texts:
            inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = model(**inputs)
                
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
            pred_label = torch.argmax(probs).item()
            
            label_str = "INJECTION" if pred_label == 1 else "SAFE"
            injection_score = probs[1].item()
            
            results.append({
                "label": label_str,
                "score": injection_score,
                "threat_score": int(round(injection_score * 100)),
                "text": text[:50] + "..." if len(text) > 50 else text
            })
            
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model": "my-injection-detector",
        "device": str(device) if device else "unknown",
        "loaded": model is not None
    })

@app.route('/model/info', methods=['GET'])
def model_info():
    info_path = os.path.join(MODEL_DIR, "model_info.json")
    if os.path.exists(info_path):
        with open(info_path, "r") as f:
            return jsonify(json.load(f))
    return jsonify({"error": "Model info not found"}), 404

if __name__ == '__main__':
    print("🚀 Starting local ML Flask server on port 5001...")
    # NOTE: Run strictly on port 5001 for Node.js backend
    app.run(host='0.0.0.0', port=5001, debug=False)
