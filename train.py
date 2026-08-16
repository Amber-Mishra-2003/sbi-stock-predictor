import pandas as pd

from src.data_loader import load_sbi_data
from src.train_xgboost import train_xgboost
from src.train_lstm import train_lstm


def main():

    print("=" * 60)
    print("       SBI CLOSE PRICE PREDICTION")
    print("       XGBoost + LSTM")
    print("=" * 60)

    df = load_sbi_data()

    close_prices = (
        df["Close"]
        .values
        .astype("float32")
    )

    print("\nTarget:")
    print("Close Price")

    print("\nStarting XGBoost training...")

    train_xgboost(
        close_prices
    )

    print("\nStarting LSTM training...")

    train_lstm(
        close_prices
    )

    print("\n" + "=" * 60)
    print("TRAINING COMPLETED")
    print("=" * 60)

    print("\nModels:")
    print("models/xgboost_model.pkl")
    print("models/lstm_model.keras")
    print("models/lstm_scaler.pkl")


if __name__ == "__main__":
    main()