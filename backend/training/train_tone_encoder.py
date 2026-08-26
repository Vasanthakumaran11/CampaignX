"""
train_tone_encoder.py
Fine-tunes sentence-transformers/all-MiniLM-L6-v2 on brand voice anchor-positive pairs.
Run on a GPU environment (Google Colab, RunPod, Kaggle, etc.).
"""

import argparse
import json
import os
import torch
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader


def load_pairs(filepath: str):
    examples = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            examples.append(InputExample(texts=[data["anchor"], data["positive"]]))
    return examples


def main():
    parser = argparse.ArgumentParser(description="Fine-tune MiniLM Tone Encoder")
    parser.add_argument("--data", type=str, required=True, help="Path to train_pairs.jsonl")
    parser.add_argument("--output", type=str, default="./trained_model", help="Output directory")
    parser.add_argument("--base-model", type=str, default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--warmup-steps", type=int, default=100)
    parser.add_argument("--sanity-check", action="store_true", help="Print sanity check test after training")
    args = parser.parse_args()

    print(f"Loading base model: {args.base_model}...")
    model = SentenceTransformer(args.base_model)

    print(f"Loading training data from {args.data}...")
    train_examples = load_pairs(args.data)
    print(f"Loaded {len(train_examples)} training pairs.")

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=args.batch_size)
    train_loss = losses.MultipleNegativesRankingLoss(model)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training on device: {device} for {args.epochs} epochs...")

    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=args.epochs,
        warmup_steps=args.warmup_steps,
        output_path=args.output,
        show_progress_bar=True,
    )

    print(f"Model saved to {args.output}")

    if args.sanity_check:
        print("\n--- Sanity Check ---")
        t_model = SentenceTransformer(args.output)
        emb1 = t_model.encode("We craft bold, vibrant, modern experiences.")
        emb2 = t_model.encode("Our brand voice is vibrant and daring.")
        emb3 = t_model.encode("Corporate quarterly earnings were filed pursuant to section 13.")
        
        sim1_2 = t_model.similarity(emb1, emb2).item()
        sim1_3 = t_model.similarity(emb1, emb3).item()
        print(f"Similarity (Voice sample vs paraphrased voice): {sim1_2:.4f}")
        print(f"Similarity (Voice sample vs legal jargon): {sim1_3:.4f}")
        print("Done!")


if __name__ == "__main__":
    main()
