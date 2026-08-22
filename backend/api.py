import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.services.prediction_service import (
    PredictionService
)

from backend.services.training_service import (
    TrainingService
)

from backend.services.market_service import (
    get_live_quote,
    market_session,
    get_intraday,
)

from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title="SBI AI Stock Predictor",
    description=(
        "SBI Close Price Prediction "
        "using XGBoost and LSTM"
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sbi-stock-predictor.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





prediction_service = (
    PredictionService()
)

training_service = (
    TrainingService()
)


@app.get("/api/health")
def health():

    return {
        "status": "UP",
        "service": "SBI AI Predictor"
    }


@app.get("/api/quote")
def quote():
    """Latest live SBIN.NS quote (intraday tick during market hours)."""
    try:
        return get_live_quote()
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/market")
def market():
    """NSE market session info (is_open, next_open, etc.)."""
    try:
        return market_session()
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/intraday")
def intraday(interval: str = "1m", period: str = "1d"):
    """
    Today's 1-minute (or 5-minute) bars for SBIN.NS.
    Used by the frontend LiveChart for a real-time intraday plot.
    """
    try:
        return get_intraday(interval=interval, period=period)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/status")
def status():

    try:

        result = (
            prediction_service
            .get_status()
        )

        result["training_status"] = (
            training_service
            .get_status()
        )

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.get("/api/latest")
def latest():

    try:

        result = (
            prediction_service
            .predict()
        )

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post("/api/predict")
def predict():

    try:

        result = (
            prediction_service
            .predict()
        )

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post("/api/train")
def train():

    result = (
        training_service
        .train()
    )

    return result


@app.get("/api/train/status")
def training_status():

    return {

        "status":
            training_service
            .get_status(),

        "output":
            training_service
            .get_output()
    }


@app.post("/api/models/reload")
def reload_models():

    try:

        prediction_service.reload_models()

        return {

            "status": "SUCCESS",

            "message":
                "Models reloaded successfully."
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.get("/api/history")
def history():

    try:

        df = pd.read_csv(
            "data/sbi_data.csv"
        )

        # Handle normal CSV
        if "Close" in df.columns:

            close = pd.to_numeric(
                df["Close"],
                errors="coerce"
            )

            if "Date" in df.columns:

                dates = df["Date"]

            else:

                dates = df.index

        # Handle yfinance MultiIndex CSV
        else:

            df = pd.read_csv(
                "data/sbi_data.csv",
                header=[0, 1],
                index_col=0
            )

            close = pd.to_numeric(
                df["Close"].iloc[:, 0],
                errors="coerce"
            )

            dates = df.index


        result = []


        for date, value in zip(
            dates,
            close
        ):

            if pd.notna(value):

                result.append(
                    {
                        "date": str(date),
                        "close": float(value)
                    }
                )


        return {

            "ticker": "SBIN.NS",

            "count": len(result),

            "data": result[-120:]

        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
