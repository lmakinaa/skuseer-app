#!/usr/bin/env python3
"""
Generate synthetic daily sales CSV for Stock Seer pipeline testing.
Output: date, sales (and optional product_id). Compatible with pipeline
column mapping (date → date, sales → sales). Run from repo root:
  python test_data/generate_sample_sales.py
  python test_data/generate_sample_sales.py --days 180 --out test_data/long_run.csv
"""
import argparse
import csv
from datetime import date, timedelta
import random

def main():
    ap = argparse.ArgumentParser(description="Generate synthetic daily sales CSV")
    ap.add_argument("--days", type=int, default=90, help="Number of days of history (default 90)")
    ap.add_argument("--out", default="test_data/daily_sales_sample.csv", help="Output CSV path")
    ap.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    ap.add_argument("--with-product", action="store_true", help="Add product_id column (multiple rows per day)")
    args = ap.parse_args()

    random.seed(args.seed)
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=args.days - 1)

    rows = []
    base = 1000
    trend = 2
    for i in range(args.days):
        d = start + timedelta(days=i)
        # Weekly seasonality: higher mid-week, lower weekend
        wd = d.weekday()
        season = 1.0 + 0.15 * (2 - abs(wd - 2)) - 0.2 * (1 if wd >= 5 else 0)
        # Slight trend + noise
        noise = random.gauss(0, 80)
        sales = max(50, int(base + trend * i + season * 100 + noise))
        if args.with_product:
            for pid in ["SKU-A", "SKU-B", "SKU-C"]:
                rows.append((d.isoformat(), max(10, sales // 3 + random.randint(-20, 20)), pid))
        else:
            rows.append((d.isoformat(), sales))

    with open(args.out, "w", newline="") as f:
        w = csv.writer(f)
        if args.with_product:
            w.writerow(["date", "sales", "product_id"])
        else:
            w.writerow(["date", "sales"])
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {args.out} ({args.days} days)")

if __name__ == "__main__":
    main()
