"""
Daily updater for SBI (SBIN.NS) close prices.

Appends the latest trading day's row(s) to data/sbi_data.csv. Safe to run
multiple times — duplicates are dropped by date. Also handles the case
where the local CSV is stale (e.g. last entry is weeks old): in that
case it backfills all missing trading days.

Usage:
    python update_data.py                # incremental update (today's row)
    python update_data.py --backfill     # force full backfill from 2y ago
    python update_data.py --days 30      # fetch last 30 calendar days
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf


TICKER = "SBIN.NS"
CSV_PATH = Path("data/sbi_data.csv")
COLUMNS = ["Open", "High", "Low", "Close", "Volume"]


def fetch_latest(days: int = 10) -> pd.DataFrame:
    """Fetch the last `days` calendar days of SBIN.NS data via yfinance."""
    print(f"Fetching {days} days of {TICKER} from yfinance...")
    df = yf.download(
        TICKER,
        period=f"{days}d",
        interval="1d",
        auto_adjust=False,
        progress=False,
    )

    if df.empty:
        raise RuntimeError(f"No data returned for {TICKER}.")

    # yfinance sometimes returns a MultiIndex column header — flatten it.
    if hasattr(df.columns, "levels"):
        df.columns = df.columns.get_level_values(0)

    df = df[COLUMNS].dropna(how="any")
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df.index.name = "Date"
    return df


def load_existing() -> pd.DataFrame:
    """Load the local CSV if it exists, else return an empty frame."""
    if not CSV_PATH.exists():
        print(f"{CSV_PATH} not found — will create a fresh one.")
        return pd.DataFrame(columns=COLUMNS)

    df = pd.read_csv(CSV_PATH, index_col=0)
    df.index = pd.to_datetime(df.index)
    return df.sort_index()


def merge(existing: pd.DataFrame, latest: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Combine existing + latest, dropping duplicate dates.
    Returns (merged_df, num_new_rows).
    """
    combined = pd.concat([existing, latest])
    combined = combined[~combined.index.duplicated(keep="last")]
    combined = combined.sort_index()

    new_rows = len(combined) - len(existing)
    return combined, new_rows


def save(df: pd.DataFrame) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Keep the same float formatting yfinance used originally.
    df.to_csv(CSV_PATH)
    print(f"Saved {len(df)} rows to {CSV_PATH}.")


def run(days: int = 10, force_backfill: bool = False) -> int:
    existing = load_existing()
    fetch_days = 730 if force_backfill else days  # 2y if backfill

    latest = fetch_latest(days=fetch_days)

    # If local CSV is way behind, widen the fetch window automatically.
    if not existing.empty:
        last_local_date = existing.index.max()
        gap_days = (pd.Timestamp.today().normalize() - last_local_date).days
        if gap_days > fetch_days:
            print(f"Local CSV is {gap_days} days behind — expanding fetch window.")
            latest = fetch_latest(days=gap_days + 5)

    merged, new_rows = merge(existing, latest)
    save(merged)
    print(f"Appended {new_rows} new row(s).")
    print(f"Latest date in CSV: {merged.index.max().date()}")
    return new_rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Update SBI stock data CSV.")
    parser.add_argument(
        "--backfill",
        action="store_true",
        help="Force a full 2-year backfill from yfinance.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=10,
        help="How many recent calendar days to fetch (default: 10).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        new_rows = run(days=args.days, force_backfill=args.backfill)
        return 0 if new_rows >= 0 else 1
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
