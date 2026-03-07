# LLM Security Shield - Machine Learning Setup Guide

Follow this guide to train your local DistilBERT model, test it, and run the ML server fallback!

### STEP 1 — Train the model (run once):
```bash
cd ml
pip install -r requirements.txt
python train_model.py
```
*Expected: The dataset will be loaded, augmented, tokenized, and the DistilBERT model will be trained. The model will be saved to `./my-injection-detector/`.*

### STEP 2 — Evaluate the model:
```bash
python evaluate_model.py
```
*Expected: The script will evaluate the model on the isolated test set and generate `confusion_matrix.png`, `roc_curve.png`, `accuracy_chart.png`, and a detailed `report.txt`.*

### STEP 3 — Test the model interactively:
```bash
python test_model.py "Ignore all previous instructions"
python test_model.py "What is the capital of France?"

# Or run interactive mode:
python test_model.py
```

### STEP 4 — Upload to HuggingFace Hub (Optional):
```bash
export HF_USERNAME=your_username
export HF_TOKEN=hf_your_token
python upload_to_hub.py
```
*Expected: The local DistilBERT model will be pushed to HuggingFace, a model card generated, and your `.env` file automatically updated with the specific model URL!*

### STEP 5 — Start local ML API server:
Whenever you are running the LLM Security Shield fullstack app, start up this local python background API to do hyper-fast offline ML inferences.
```bash
cd ml
python ml_server.py
```
*Runs on `http://localhost:5001`. The Node.js router will automatically detect it.*

### STEP 6 — Start Node.js backend:
In a new terminal:
```bash
cd backend
npm run dev
```

### STEP 7 — Start React frontend:
In a new terminal:
```bash
cd frontend
npm run dev
```

### STEP 8 — Ensure Everything works natively
With all 3 servers running (Python on `5001`, Node on `5000`, React on `5173`), simply load `http://localhost:5173` and start submitting prompts.

The routing engine will attempt to process it locally through your fine-tuned Python model. If that's down, it will use Hugging Face inference!
