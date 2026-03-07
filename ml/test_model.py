import sys
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = "./my-injection-detector"

def format_output(text, pred, score):
    label_str = "INJECTION" if pred == 1 else "SAFE"
    threat_icon = "🚨 INJECTION DETECTED" if pred == 1 else "✅ SAFE"
    safe_prob = (1.0 - (score / 100.0)) * 100
    
    print("\n" + "═"*36)
    print(f'PROMPT:    "{text}"')
    print(f"VERDICT:   {threat_icon}")
    print(f"LABEL:     {label_str}")
    print(f"SCORE:     {score:.1f}%")
    print(f"SAFE PROB: {safe_prob:.1f}%")
    print("═"*36 + "\n")

def main():
    if not os.path.exists(MODEL_DIR):
        print(f"❌ Error: Model directory {MODEL_DIR} not found. Please train first.")
        return

    print("Loading model...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    def predict(text):
        inputs = tokenizer(str(text), return_tensors="pt", truncation=True, max_length=256)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        pred_label = torch.argmax(probs).item()
        confidence = probs[pred_label].item() * 100
        
        # If the model predicts safe, the "score" (threat score) should be low.
        score = confidence if pred_label == 1 else (100 - confidence)
        return pred_label, score

    if len(sys.argv) > 1:
        # Single prompt mode
        prompt = " ".join(sys.argv[1:])
        pred, score = predict(prompt)
        format_output(prompt, pred, score)
    else:
        # Interactive mode
        print("\n🤖 LLM Security Shield - Interactive Test Mode")
        print("Type 'exit' or 'quit' to close.\n")
        
        while True:
            try:
                text = input("> Enter prompt: ")
                if text.lower() in ['exit', 'quit']:
                    break
                if not text.strip():
                    continue
                
                pred, score = predict(text)
                format_output(text, pred, score)
            except KeyboardInterrupt:
                break

if __name__ == "__main__":
    main()
