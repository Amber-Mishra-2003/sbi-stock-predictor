# SBI Stock Predictor — Daily Data Updater

## Problem
`data/sbi_data.csv` was stale (last entry Sep 2024) and there was no script
to keep it current. `predict.py` also had a `skiprows=[1]` bug that broke
date parsing.

## What was fixed
1. **`predict.py`** — removed the bogus `skiprows=[1]` and added date parsing
   + sorting so the LSTM sees the most-recent sequence in the right order.
2. **`update_data.py`** — new script that pulls SBIN.NS from yfinance and
   appends to the CSV. De-duplicates by date, auto-detects large gaps and
   backfills them.
3. **`setup_scheduler.bat`** — registers a Windows Task Scheduler job that
   runs the updater every weekday at **4:00 PM IST** (15 min after NSE close).
4. **`remove_scheduler.bat`** — cleanly removes the scheduled task.

## Manual usage
```bash
# Fetch today's row only (default: last 10 calendar days)
venv\Scripts\python.exe update_data.py

# Backfill everything from the past 2 years
venv\Scripts\python.exe update_data.py --backfill

# Fetch last 30 calendar days
venv\Scripts\python.exe update_data.py --days 30
```

After updating the data, **retrain the models** so predictions reflect the
newest regime:
```bash
venv\Scripts\python.exe train.py
```

## One-time auto-update setup
1. Open **Command Prompt as Administrator** (right-click → "Run as administrator").
2. `cd` into this project folder.
3. Run:
   ```
   setup_scheduler.bat
   ```
4. Verify:
   ```
   schtasks /Query /TN "SBI_Stock_Daily_Update" /V /FO LIST
   ```

To uninstall:
```
remove_scheduler.bat
```

## Log
Output is appended to `logs/update_data.log`. Tail it with:
```
type logs\update_data.log
```

## Notes
- The updater is **idempotent** — running it twice on the same day is safe.
- Weekends & NSE holidays are handled automatically (yfinance simply returns
  no row for those days).
- After every weekly batch of updates you may want to rerun `train.py` so
  the XGBoost / LSTM models stay current.
