"""
generate_synthetic_pairs.py
Augments brand approved copy samples using Google Gemini LLM to create anchor-positive training pairs.
Outputs train_pairs.jsonl for fine-tuning train_tone_encoder.py.
"""

import argparse
import json
import os
import google.generativeai as genai
from tqdm import tqdm


PROMPT_TEMPLATE = """You are a brand voice specialist. Given the following approved brand copy snippet, generate 3 high-quality paraphrased variations that preserve the EXACT tone, personality, cadence, vocabulary, and emotional resonance of the original brand voice.

Original Sample:
\"\"\"{sample}\"\"\"

Output strictly valid JSON with the format:
{{"variations": ["variation 1", "variation 2", "variation 3"]}}
"""


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic brand voice pairs using Gemini")
    parser.add_argument("--input", type=str, required=True, help="Path to text file with approved brand copy (one sample per paragraph)")
    parser.add_argument("--output", type=str, default="train_pairs.jsonl", help="Output JSONL file")
    parser.add_argument("--api-key", type=str, default=os.getenv("GEMINI_API_KEY"), help="Gemini API Key")
    args = parser.parse_args()

    if not args.api_key:
        raise ValueError("Please provide --api-key or set GEMINI_API_KEY environment variable.")

    genai.configure(api_key=args.api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    with open(args.input, "r", encoding="utf-8") as f:
        samples = [line.strip() for line in f if len(line.strip()) > 20]

    print(f"Loaded {len(samples)} base samples. Generating synthetic pairs...")
    pairs_created = 0

    with open(args.output, "w", encoding="utf-8") as out_f:
        for sample in tqdm(samples):
            try:
                response = model.generate_content(
                    PROMPT_TEMPLATE.format(sample=sample),
                    generation_config={"response_mime_type": "application/json"}
                )
                res_data = json.loads(response.text)
                variations = res_data.get("variations", [])
                for var in variations:
                    record = {"anchor": sample, "positive": var}
                    out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    pairs_created += 1
            except Exception as e:
                print(f"Error augmenting sample: {e}")

    print(f"Successfully generated {pairs_created} pairs to {args.output}")


if __name__ == "__main__":
    main()
