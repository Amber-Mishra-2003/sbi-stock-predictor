"""
Live market service — fetches latest SBIN.NS quote via yfinance and
computes NSE market session state.

NSE trading hours:
    Mon–Fri, 09:15 → 15:30 IST
    Pre-open      : 09:00 → 09:15 IST
    Post-close    : 15:40 → 16:00 IST
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

import pytz
import yfinance as yf


IST = pytz.timezone("Asia/Kolkata")
TICKER = "SBIN.NS"


# --------------------------------------------------------------------
# Market session helpers
# --------------------------------------------------------------------
def market_session(now: datetime | None = None) -> dict:
    """
    Returns a dict describing the current NSE session.

        {
            "is_weekday":   bool,
            "session":      "PRE" | "OPEN" | "POST" | "CLOSED",
            "is_open":      bool,
            "label":        str,            # human label
            "server_time":  ISO 8601 IST,
            "next_open":    ISO 8601 IST or None,
            "next_close":   ISO 8601 IST or None
        }
    """
    now = now or datetime.now(IST)
    weekday = now.weekday()  # 0 = Mon
    is_weekday = weekday < 5

    current = now.time()
    pre_open_start  = time(9, 0)
    open_start       = time(9, 15)
    close_end        = time(15, 30)
    post_close_end   = time(16, 0)

    if not is_weekday:
        session = "CLOSED"
        label = "WEEKEND — MARKET CLOSED"
    elif pre_open_start <= current < open_start:
        session = "PRE"
        label = "PRE-OPEN SESSION"
    elif open_start <= current <= close_end:
        session = "OPEN"
        label = "MARKET LIVE"
    elif close_end < current <= post_close_end:
        session = "POST"
        label = "POST-CLOSE SESSION"
    else:
        session = "CLOSED"
        label = "MARKET CLOSED"

    is_open = session == "OPEN"

    # next open: tomorrow 09:15 (or Monday if today is Fri / weekend)
    next_open_dt = None
    if session == "OPEN":
        next_open_dt = None
    elif session == "PRE":
        next_open_dt = now.replace(hour=9, minute=15, second=0, microsecond=0)
    elif session == "POST" or (session == "CLOSED" and is_weekday):
        # tomorrow morning
        days_ahead = 1 if is_weekday else (7 - weekday)
        next_open_dt = (now + timedelta(days=days_ahead)).replace(
            hour=9, minute=15, second=0, microsecond=0
        )
    else:
        # weekend → next Monday
        days_ahead = 7 - weekday
        next_open_dt = (now + timedelta(days=days_ahead)).replace(
            hour=9, minute=15, second=0, microsecond=0
        )

    next_close_dt = None
    if session == "OPEN":
        next_close_dt = now.replace(hour=15, minute=30, second=0, microsecond=0)

    return {
        "is_weekday": is_weekday,
        "session": session,
        "is_open": is_open,
        "label": label,
        "server_time": now.isoformat(),
        "next_open": next_open_dt.isoformat() if next_open_dt else None,
        "next_close": next_close_dt.isoformat() if next_close_dt else None,
    }


# --------------------------------------------------------------------
# Intraday minute-bar series (for live chart)
# --------------------------------------------------------------------
def get_intraday(interval: str = "1m", period: str = "1d") -> dict:
    """
    Returns today's 1-minute SBIN.NS bars for the live intraday chart.

    Response shape:
        {
            "ticker": "SBIN.NS",
            "interval": "1m",
            "bars": [
                {"time": "09:15", "close": 1041.5, "volume": 12345, "high": ..., "low": ...},
                ...
            ],
            "previous_close": 1048.0,
            "market": { ... }
        }
    """
    session = market_session()
    try:
        ticker = yf.Ticker(TICKER)

        # During market hours use 1m interval (last 1d = up to 7h of bars).
        # Outside hours, we fall back to the most recent session's bars.
        hist = ticker.history(period=period, interval=interval)

        if hist is None or hist.empty:
            raise RuntimeError("No intraday data available")

        # Daily previous close — used as the y-axis reference line
        daily = ticker.history(period="5d", interval="1d")
        prev_close = float(daily["Close"].iloc[-2]) if len(daily) >= 2 else float(hist["Close"].iloc[0])

        bars = []
        for idx, row in hist.iterrows():
            t = idx.strftime("%H:%M") if hasattr(idx, "strftime") else str(idx)
            bars.append({
                "time": t,
                "close": round(float(row["Close"]), 2),
                "high":  round(float(row["High"]),  2),
                "low":   round(float(row["Low"]),   2),
                "volume": int(row["Volume"]) if "Volume" in row and not pd_isna(row["Volume"]) else 0
            })

        return {
            "ticker": TICKER,
            "interval": interval,
            "previous_close": round(prev_close, 2),
            "bars": bars,
            "market": session,
        }
    except Exception as exc:
        return {
            "ticker": TICKER,
            "interval": interval,
            "bars": [],
            "previous_close": None,
            "error": str(exc),
            "market": session,
        }


def pd_isna(value):
    """Local helper so we don't have to import pandas at module level."""
    try:
        import pandas as pd  # noqa: WPS433
        return pd.isna(value)
    except Exception:
        return False


# --------------------------------------------------------------------
# Live quote (latest SBIN.NS price from yfinance)
# --------------------------------------------------------------------
def get_live_quote() -> dict:
    """
    Returns latest available SBIN.NS price from yfinance.

    During market hours this is the current live tick.
    Outside hours this is the most recent close (still useful to display).
    """
    session = market_session()

    try:
        ticker = yf.Ticker(TICKER)
        # period="1d", interval="1m" → most recent minute bars
        hist = ticker.history(period="1d", interval="1m")

        if hist is None or hist.empty:
            # fall back to daily if 1m is empty
            hist = ticker.history(period="5d", interval="1d")

        if hist is None or hist.empty:
            raise RuntimeError("No data returned by yfinance")

        last = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) > 1 else last
        # prev close from previous trading day for daily change calc
        daily = ticker.history(period="5d", interval="1d")
        prev_close = float(daily["Close"].iloc[-2]) if len(daily) >= 2 else float(prev["Close"])

        price = float(last["Close"])
        open_price = float(last["Open"]) if "Open" in last else price
        high = float(last["High"]) if "High" in last else price
        low = float(last["Low"]) if "Low" in last else price
        volume = int(last["Volume"]) if "Volume" in last else 0

        change = price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0.0

        return {
            "ticker": TICKER,
            "price": round(price, 2),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "volume": volume,
            "previous_close": round(prev_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "timestamp": last.name.isoformat() if hasattr(last.name, "isoformat") else None,
            "market": session,
        }
    except Exception as exc:
        # graceful fallback so the dashboard never breaks
        return {
            "ticker": TICKER,
            "price": None,
            "error": str(exc),
            "market": session,
        }
