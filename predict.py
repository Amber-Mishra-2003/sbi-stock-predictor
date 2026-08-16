import pandas as pd

from src.predictor import predict_future_close


def main():

    print("Loading SBI data...")

    df = pd.read_csv(
        "data/sbi_data.csv",
        skiprows=[1],
        index_col=0
    )

    print("Columns:", df.columns.tolist())

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