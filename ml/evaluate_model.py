import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_curve, auc
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = "./my-injection-detector"
DATASET_PATH = "prompt_injection_dataset.csv"
RANDOM_SEED = 42
TEST_SIZE = 0.2
VAL_SIZE = 0.1

def load_test_data():
    df = pd.read_csv(DATASET_PATH).dropna().drop_duplicates(subset=['text'])
    
    # We re-split using the same seed as train_model.py to isolate the exact test set
    _, temp_df = train_test_split(df, test_size=(TEST_SIZE + VAL_SIZE), stratify=df['label'], random_state=RANDOM_SEED)
    test_ratio_of_temp = TEST_SIZE / (TEST_SIZE + VAL_SIZE)
    _, test_df = train_test_split(temp_df, test_size=test_ratio_of_temp, stratify=temp_df['label'], random_state=RANDOM_SEED)
    
    return test_df['text'].tolist(), test_df['label'].tolist()

def main():
    if not os.path.exists(MODEL_DIR):
        print(f"❌ Error: Model directory {MODEL_DIR} not found. Please run train_model.py first.")
        return
        
    print("Loading model for evaluation...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    print("Loading test dataset...")
    texts, true_labels = load_test_data()
    
    preds = []
    probs = []
    
    print("Running predictions on test set...")
    for text in texts:
        inputs = tokenizer(str(text), return_tensors="pt", truncation=True, max_length=256)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
            
        prob = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        pred_label = torch.argmax(prob).item()
        
        preds.append(pred_label)
        probs.append(prob[1].item()) # probability of class 1 (INJECTION)
        
    accuracy = accuracy_score(true_labels, preds) * 100
    precision = precision_score(true_labels, preds, average='binary', zero_division=0) * 100
    recall = recall_score(true_labels, preds, average='binary', zero_division=0) * 100
    f1 = f1_score(true_labels, preds, average='binary', zero_division=0) * 100
    
    print("\n" + "═"*36)
    print("MODEL EVALUATION RESULTS")
    print("═"*36)
    print(f"Accuracy:   {accuracy:.2f}%")
    print(f"Precision:  {precision:.2f}%")
    print(f"Recall:     {recall:.2f}%")
    print(f"F1 Score:   {f1:.2f}%")
    
    # Generate ROC Curve
    fpr, tpr, _ = roc_curve(true_labels, probs)
    roc_auc = auc(fpr, tpr)
    print(f"AUC-ROC:    {roc_auc*100:.2f}%")
    print("═"*36)
    
    # Save Classification Report
    report = classification_report(true_labels, preds, target_names=["SAFE", "INJECTION"])
    with open("report.txt", "w") as f:
        f.write("MODEL EVALUATION RESULTS\n")
        f.write(report)
        f.write(f"\nAUC-ROC: {roc_auc:.4f}")
    
    # Plot Confusion Matrix
    cm = confusion_matrix(true_labels, preds)
    plt.figure(figsize=(6,5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Reds', xticklabels=["SAFE", "INJECTION"], yticklabels=["SAFE", "INJECTION"])
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix')
    plt.savefig('confusion_matrix.png')
    plt.close()
    
    # Plot ROC Curve
    plt.figure(figsize=(6,5))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic')
    plt.legend(loc="lower right")
    plt.savefig('roc_curve.png')
    plt.close()
    
    # Plot Accuracy Chart
    labels = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
    values = [accuracy, precision, recall, f1]
    plt.figure(figsize=(8,5))
    sns.barplot(x=labels, y=values, palette="viridis")
    plt.ylim(0, 100)
    for i, v in enumerate(values):
        plt.text(i, v + 1, f"{v:.1f}%", ha='center')
    plt.title("Model Metrics Summary")
    plt.savefig('accuracy_chart.png')
    plt.close()

    print("\n✅ Evaluated successfully. Saved report.txt, confusion_matrix.png, roc_curve.png, and accuracy_chart.png")

if __name__ == "__main__":
    main()
