import numpy as np


WINDOW_SIZE = 60


def create_sequences(values, window_size=WINDOW_SIZE):

    x = []
    y = []

    for i in range(window_size, len(values)):

        x.append(
            values[i - window_size:i]
        )

        y.append(
            values[i]
        )

    return np.array(x), np.array(y)