import joblib
import numpy as np


WINDOW_SIZE = 60


def predict_future_close(close_prices):

    xgb_model = joblib.load(
        "models/xgboost_model.pkl"
    )

    lstm_model = __import__(
        "tensorflow"
    ).keras.models.load_model(
        "models/lstm_model.keras"
    )

    scaler = joblib.load(
        "models/lstm_scaler.pkl"
    )

    recent = close_prices[
        -WINDOW_SIZE:
    ]

    xgb_input = recent.reshape(
        1,
        WINDOW_SIZE
    )

    xgb_prediction = xgb_model.predict(
        xgb_input
    )[0]

    scaled_recent = scaler.transform(
        recent.reshape(-1, 1)
    )

    lstm_input = scaled_recent.reshape(
        1,
        WINDOW_SIZE,
        1
    )

    lstm_scaled_prediction = (
        lstm_model.predict(
            lstm_input,
            verbose=0
        )
    )

    lstm_prediction = (
        scaler.inverse_transform(
            lstm_scaled_prediction
        )[0][0]
    )

    ensemble_prediction = (
        xgb_prediction +
        lstm_prediction
    ) / 2

    current_close = recent[-1]

    print("\n" + "=" * 55)
    print("          SBI FUTURE CLOSE PREDICTION")
    print("=" * 55)

    print(
        f"Current Close       : ₹{current_close:.2f}"
    )

    print(
        f"XGBoost Future Close: ₹{xgb_prediction:.2f}"
    )

    print(
        f"LSTM Future Close   : ₹{lstm_prediction:.2f}"
    )

    print(
        f"Ensemble Prediction : ₹{ensemble_prediction:.2f}"
    )

    print("=" * 55)

    return ensemble_prediction