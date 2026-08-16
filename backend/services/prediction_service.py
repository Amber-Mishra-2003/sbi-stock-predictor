import os
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf


TICKER = "SBIN.NS"

WINDOW_SIZE = 60

DATA_FILE = "data/sbi_data.csv"

XGB_MODEL_FILE = "models/xgboost_model.pkl"

LSTM_MODEL_FILE = "models/lstm_model.keras"

SCALER_FILE = "models/lstm_scaler.pkl"


class PredictionService:

    def __init__(self):

        self.xgb_model = None
        self.lstm_model = None
        self.scaler = None

        self.last_prediction = None

        self.load_models()

    def load_models(self):

        if os.path.exists(XGB_MODEL_FILE):

            self.xgb_model = joblib.load(
                XGB_MODEL_FILE
            )

        if os.path.exists(LSTM_MODEL_FILE):

            self.lstm_model = (
                tf.keras.models.load_model(
                    LSTM_MODEL_FILE
                )
            )

        if os.path.exists(SCALER_FILE):

            self.scaler = joblib.load(
                SCALER_FILE
            )

    def reload_models(self):

        print("Reloading ML models...")

        self.xgb_model = None
        self.lstm_model = None
        self.scaler = None

        self.load_models()

        print("Models reloaded.")

    def load_close_prices(self):

        if not os.path.exists(DATA_FILE):

            raise FileNotFoundError(
                "SBI data file not found."
            )

        df = pd.read_csv(
            DATA_FILE
        )

        # Handle yfinance multi-level CSV
        if "Close" not in df.columns:

            df = pd.read_csv(
                DATA_FILE,
                header=[0, 1],
                index_col=0
            )

            close_prices = (
                df["Close"]
                .iloc[:, 0]
                .dropna()
                .values
            )

            last_date = str(
                df.index[-1]
            )

        else:

            close_prices = (
                pd.to_numeric(
                    df["Close"],
                    errors="coerce"
                )
                .dropna()
                .values
            )

            if "Date" in df.columns:

                last_date = str(
                    df["Date"].iloc[-1]
                )

            else:

                last_date = None

        close_prices = np.asarray(
            close_prices,
            dtype="float32"
        )

        if len(close_prices) < WINDOW_SIZE:

            raise ValueError(
                f"At least {WINDOW_SIZE} "
                "Close prices are required."
            )

        return close_prices, last_date

    def predict(self):

        if self.xgb_model is None:

            raise RuntimeError(
                "XGBoost model is not available."
            )

        if self.lstm_model is None:

            raise RuntimeError(
                "LSTM model is not available."
            )

        if self.scaler is None:

            raise RuntimeError(
                "LSTM scaler is not available."
            )

        close_prices, last_date = (
            self.load_close_prices()
        )

        recent_prices = close_prices[
            -WINDOW_SIZE:
        ]

        current_close = float(
            recent_prices[-1]
        )

        # -------------------------
        # XGBoost
        # -------------------------

        xgb_input = recent_prices.reshape(
            1,
            WINDOW_SIZE
        )

        xgb_prediction = float(
            self.xgb_model.predict(
                xgb_input
            )[0]
        )

        # -------------------------
        # LSTM
        # -------------------------

        scaled_prices = (
            self.scaler.transform(
                recent_prices.reshape(
                    -1,
                    1
                )
            )
        )

        lstm_input = scaled_prices.reshape(
            1,
            WINDOW_SIZE,
            1
        )

        lstm_scaled_prediction = (
            self.lstm_model.predict(
                lstm_input,
                verbose=0
            )
        )

        lstm_prediction = float(
            self.scaler.inverse_transform(
                lstm_scaled_prediction
            )[0][0]
        )

        # -------------------------
        # Ensemble
        # -------------------------

        ensemble_prediction = (
            0.5 * xgb_prediction
            + 0.5 * lstm_prediction
        )

        xgb_change = (
            (
                xgb_prediction
                - current_close
            )
            / current_close
        ) * 100

        lstm_change = (
            (
                lstm_prediction
                - current_close
            )
            / current_close
        ) * 100

        ensemble_change = (
            (
                ensemble_prediction
                - current_close
            )
            / current_close
        ) * 100

        if ensemble_change > 0.05:

            direction = "UP"

        elif ensemble_change < -0.05:

            direction = "DOWN"

        else:

            direction = "NEUTRAL"

        result = {

            "ticker": TICKER,

            "current_close": current_close,

            "xgboost_prediction":
                xgb_prediction,

            "lstm_prediction":
                lstm_prediction,

            "ensemble_prediction":
                ensemble_prediction,

            "xgboost_change_percent":
                xgb_change,

            "lstm_change_percent":
                lstm_change,

            "ensemble_change_percent":
                ensemble_change,

            "direction":
                direction,

            "last_data_date":
                last_date,

            "model_version":
                "XGBoost + LSTM v1"
        }

        self.last_prediction = result

        return result

    def get_status(self):

        _, last_date = (
            self.load_close_prices()
        )

        return {

            "status": "READY",

            "xgboost_available":
                self.xgb_model is not None,

            "lstm_available":
                self.lstm_model is not None,

            "scaler_available":
                self.scaler is not None,

            "last_data_date":
                last_date,

            "last_prediction":
                self.last_prediction
        }