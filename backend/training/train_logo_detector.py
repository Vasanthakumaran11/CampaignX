"""
CampaignX AI - Phase 4 Logo Detector Trainer (Track A - Colab Script)
Generic single-class YOLO logo detector training script.

Run in Google Colab (GPU execution environment).
"""

import os
import sys
import glob
import yaml
import argparse
from pathlib import Path

def flatten_to_single_class(dataset_dir: str):
    """
    Flattens all multi-class annotations (e.g. 'nike', 'adidas') in YOLO format label files
    into a single class ID: 0 ("logo").
    """
    labels_path = Path(dataset_dir)
    if not labels_path.exists():
        print(f"[-] Labels directory {dataset_dir} does not exist. Skipping label flattening.")
        return

    txt_files = list(labels_path.glob("**/*.txt"))
    print(f"[+] Flattening {len(txt_files)} label files in {dataset_dir} to single class 'logo' (class_id=0)...")
    
    modified_count = 0
    for txt_file in txt_files:
        if txt_file.name == 'classes.txt':
            continue
        
        new_lines = []
        with open(txt_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 5:
                # Force class index to 0
                parts[0] = '0'
                new_lines.append(" ".join(parts))
        
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(new_lines) + "\n")
        modified_count += 1
        
    print(f"[+] Successfully flattened {modified_count} label files to class 0 ('logo').")

def update_data_yaml_for_single_class(yaml_path: str):
    """
    Updates data.yaml to define a single class 'logo'.
    """
    yaml_file = Path(yaml_path)
    if not yaml_file.exists():
        print(f"[-] data.yaml not found at {yaml_path}.")
        return

    with open(yaml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    data['nc'] = 1
    data['names'] = ['logo']

    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False)

    print(f"[+] Updated {yaml_path} to 1 class: ['logo'].")

def train_yolo_logo_detector(
    data_yaml: str,
    output_dir: str = "./logo_detector_weights",
    base_model: str = "yolo11n.pt",
    epochs: int = 60,
    imgsz: int = 640,
    sanity_check_image: str = None
):
    """
    Trains YOLO11n on single-class logo dataset.
    """
    from ultralytics import YOLO

    print(f"[+] Initializing YOLO model with base weights: {base_model}...")
    model = YOLO(base_model)

    print(f"[+] Starting logo detector training for {epochs} epochs on {data_yaml}...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        project=output_dir,
        name="train_run",
        exist_ok=True,
        plots=True,
        save=True
    )

    best_weights = Path(output_dir) / "train_run" / "weights" / "best.pt"
    print(f"[+] Training complete! Best weights saved at: {best_weights.resolve()}")

    if sanity_check_image and Path(sanity_check_image).exists():
        print(f"[+] Running sanity check detection on test image: {sanity_check_image}...")
        trained_model = YOLO(str(best_weights))
        check_results = trained_model.predict(sanity_check_image, conf=0.35)
        for r in check_results:
            boxes = r.boxes
            print(f"[+] Sanity Check Result: Detected {len(boxes)} logo region(s) with confidence scores:")
            for box in boxes:
                conf = float(box.conf[0])
                xywh = box.xywh[0].tolist()
                print(f"    - Confidence: {conf:.2f} | BBox (cx, cy, w, h): {[round(x,1) for x in xywh]}")

    return str(best_weights)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CampaignX AI Logo Detector Trainer")
    parser.add_argument("--data", type=str, required=True, help="Path to data.yaml file")
    parser.add_argument("--flatten-labels-dir", type=str, help="Directory of dataset labels to flatten to class 0")
    parser.add_argument("--output", type=str, default="./logo_detector_weights", help="Output directory for weights")
    parser.add_argument("--base-model", type=str, default="yolo11n.pt", help="Base YOLO model checkpoint")
    parser.add_argument("--epochs", type=int, default=60, help="Number of training epochs")
    parser.add_argument("--sanity-check-image", type=str, help="Optional image path to test detection after training")

    args = parser.parse_args()

    if args.flatten_labels_dir:
        flatten_to_single_class(args.flatten_labels_dir)
        update_data_yaml_for_single_class(args.data)

    train_yolo_logo_detector(
        data_yaml=args.data,
        output_dir=args.output,
        base_model=args.base_model,
        epochs=args.epochs,
        sanity_check_image=args.sanity_check_image
    )
