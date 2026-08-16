import joblib
import numpy as np

from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


WINDOW_SIZE = 60


def train_xgboost(close_prices):

    x = []
    y = []

    for i in range(WINDOW_SIZE, len(close_prices)):

        x.append(
            close_prices[
                i - WINDOW_SIZE:i
            ]
        )

        y.append(
            close_prices[i]
        )

    x = np.array(x)
    y = np.array(y)

    split_index = int(len(x) * 0.8)

    x_train = x[:split_index]
    x_test = x[split_index:]

    y_train = y[:split_index]
    y_test = y[split_index:]

    print("\nXGBoost")
    print("Training samples:", len(x_train))
    print("Testing samples :", len(x_test))

    model = XGBRegressor(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    )

    model.fit(
        x_train,
        y_train
    )

    predictions = model.predict(x_test)

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    print(f"XGBoost MAE  : {mae:.4f}")
    print(f"XGBoost RMSE : {rmse:.4f}")

    joblib.dump(
        model,
        "models/xgboost_model.pkl"
    )

    return model