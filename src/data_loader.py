import os
import yfinance as yf


TICKER = "SBIN.NS"


def load_sbi_data():
    print("Downloading SBI historical data...")

    df = yf.download(
        TICKER,
        period="2y",
        interval="1d",
        auto_adjust=False
    )

    if df.empty:
        raise RuntimeError("SBI data download failed.")

    if hasattr(df.columns, "levels"):
        df.columns = df.columns.get_level_values(0)

    df = df[["Open", "High", "Low", "Close", "Volume"]]

    df.dropna(inplace=True)

    os.makedirs("data", exist_ok=True)

    df.to_csv("data/sbi_data.csv")

    print(f"Downloaded {len(df)} rows.")

    return df