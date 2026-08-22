import pandas as pd

from src.predictor import predict_future_close


def main():

    print("Loading SBI data...")

    df = pd.read_csv(
        "data/sbi_data.csv",
        index_col=0
    )

    # Sort by date ascending so the most recent rows are at the end —
    # this matches how the LSTM model expects the sequence.
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()

    print("Columns:", df.columns.tolist())
    print(f"Date range: {df.index.min().date()} -> {df.index.max().date()}")
    print(f"Total rows: {len(df)}")

    if "Close" not in df.columns:
        raise ValueError(
            "Close column not found in sbi_data.csv"
        )

    close_prices = (
        pd.to_numeric(
            df["Close"],
            errors="coerce"
        )
        .dropna()
        .values
        .astype("float32")
    )

    print(
        f"Available Close prices: {len(close_prices)}"
    )

    if len(close_prices) < 60:
        raise ValueError(
            "At least 60 Close prices are required."
        )

    predict_future_close(
        close_prices
    )


if __name__ == "__main__":
    main()