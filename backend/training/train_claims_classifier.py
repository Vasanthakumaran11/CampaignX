"""
GPU Training & Export Script for Zero-Shot Claims Classifier (Colab / GPU compatible).
Run this script on Google Colab or a GPU instance to fine-tune or pre-export
the DistilBART / BART MNLI claims classifier model into `backend/models/claims-classifier/`.
"""

import os
import sys
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

MODEL_NAME = "valhalla/distilbart-mnli-12-3"  # or "facebook/bart-large-mnli"
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "claims-classifier")


def train_and_export_claims_classifier():
    print("==================================================")
    print(f"CampaignX Claims Classifier Export Utility")
    print("==================================================")
    print(f"Target Model: {MODEL_NAME}")
    print(f"Export Directory: {EXPORT_DIR}")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU Device: {torch.cuda.get_device_name(0)}")

    os.makedirs(EXPORT_DIR, exist_ok=True)

    print("\n1. Loading Base Tokenizer & Model Weights...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

    if torch.cuda.is_available():
        model = model.to("cuda")
        print("Model transferred to GPU (cuda:0).")

    print("\n2. Testing Sample Zero-Shot Classification...")
    classifier = pipeline("zero-shot-classification", model=model, tokenizer=tokenizer, device=0 if torch.cuda.is_available() else -1)

    candidate_labels = [
        "unsubstantiated guarantee",
        "missing required disclaimer",
        "direct competitor comparison",
        "medical or health claim",
        "financial or earnings claim",
        "neutral marketing statement"
    ]

    sample_sentence = "We guarantee 100% risk-free 10x ROI overnight without any effort."
    result = classifier(sample_sentence, candidate_labels)

    print(f"\nSample Text: \"{sample_sentence}\"")
    print("Top Predicted Label:", result["labels"][0], f"(Confidence: {result['scores'][0]:.4f})")

    print(f"\n3. Exporting Tokenizer and Model Weights to '{EXPORT_DIR}'...")
    tokenizer.save_pretrained(EXPORT_DIR)
    model.save_pretrained(EXPORT_DIR)

    print("\n==================================================")
    print("✅ Model successfully exported to backend/models/claims-classifier/")
    print("==================================================")


if __name__ == "__main__":
    train_and_export_claims_classifier()
