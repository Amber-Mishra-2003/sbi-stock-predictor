import joblib
import numpy as np

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping


WINDOW_SIZE = 60


def train_lstm(close_prices):

    close_prices = close_prices.reshape(-1, 1)

    split_index = int(
        len(close_prices) * 0.8
    )

    scaler = MinMaxScaler()

    scaler.fit(
        close_prices[:split_index]
    )

    scaled = scaler.transform(
        close_prices
    )

    x_train = []
    y_train = []

    x_test = []
    y_test = []

    for i in range(
        WINDOW_SIZE,
        len(scaled)
    ):

        sequence = scaled[
            i - WINDOW_SIZE:i
        ]

        target = scaled[i]

        if i < split_index:

            x_train.append(sequence)
            y_train.append(target)

        else:

            x_test.append(sequence)
            y_test.append(target)

    x_train = np.array(x_train)
    y_train = np.array(y_train)

    x_test = np.array(x_test)
    y_test = np.array(y_test)

    print("\nLSTM")
    print("Training shape:", x_train.shape)
    print("Testing shape :", x_test.shape)

    model = Sequential()

    model.add(
        LSTM(
            64,
            return_sequences=True,
            input_shape=(
                WINDOW_SIZE,
                1
            )
        )
    )

    model.add(
        Dropout(0.2)
    )

    model.add(
        LSTM(32)
    )

    model.add(
        Dropout(0.2)
    )

    model.add(
        Dense(16, activation="relu")
    )

    model.add(
        Dense(1)
    )

    model.compile(
        optimizer="adam",
        loss="mse"
    )

    early_stopping = EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True
    )

    model.fit(
        x_train,
        y_train,
        epochs=100,
        batch_size=32,
        validation_split=0.1,
        callbacks=[early_stopping],
        verbose=1
    )

    scaled_predictions = model.predict(
        x_test,
        verbose=0
    )

    predictions = scaler.inverse_transform(
        scaled_predictions
    )

    actual = scaler.inverse_transform(
        y_test
    )

    mae = mean_absolute_error(
        actual,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predictions
        )
    )

    print(f"LSTM MAE  : {mae:.4f}")
    print(f"LSTM RMSE : {rmse:.4f}")

    model.save(
        "models/lstm_model.keras"
    )

    joblib.dump(
        scaler,
        "models/lstm_scaler.pkl"
    )

    return model, scaler