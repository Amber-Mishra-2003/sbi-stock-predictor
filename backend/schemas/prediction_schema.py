from pydantic import BaseModel
from typing import Optional


class PredictionResponse(BaseModel):
    ticker: str

    current_close: float

    xgboost_prediction: float
    lstm_prediction: float
    ensemble_prediction: float

    xgboost_change_percent: float
    lstm_change_percent: float
    ensemble_change_percent: float

    direction: str

    last_data_date: Optional[str] = None

    model_version: Optional[str] = None


class StatusResponse(BaseModel):
    status: str

    xgboost_available: bool
    lstm_available: bool
    scaler_available: bool

    last_data_date: Optional[str] = None

    last_prediction: Optional[dict] = None