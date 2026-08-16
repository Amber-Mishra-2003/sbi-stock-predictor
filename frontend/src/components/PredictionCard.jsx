import {
    Brain,
    Layers,
    Target
} from "lucide-react";


function PredictionCard({
    prediction
}) {

    const direction =
        prediction.direction;


    return (

        <div className="card prediction-card">

            <div className="card-label">

                FUTURE CLOSE PREDICTION

            </div>


            <div className="prediction-grid">


                <div className="prediction-item">

                    <div className="prediction-icon">

                        <Target
                            size={18}
                        />

                    </div>


                    <span>

                        XGBOOST

                    </span>


                    <strong>

                        ₹
                        {Number(
                            prediction
                                .xgboost_prediction
                        ).toFixed(2)}

                    </strong>


                    <small
                        className={
                            Number(
                                prediction
                                    .xgboost_change_percent
                            ) >= 0
                                ? "positive"
                                : "negative"
                        }
                    >

                        {Number(
                            prediction
                                .xgboost_change_percent
                        ) >= 0
                            ? "+"
                            : ""
                        }

                        {Number(
                            prediction
                                .xgboost_change_percent
                        ).toFixed(2)}

                        %

                    </small>

                </div>


                <div className="prediction-item">

                    <div className="prediction-icon">

                        <Brain
                            size={18}
                        />

                    </div>


                    <span>

                        LSTM

                    </span>


                    <strong>

                        ₹
                        {Number(
                            prediction
                                .lstm_prediction
                        ).toFixed(2)}

                    </strong>


                    <small
                        className={
                            Number(
                                prediction
                                    .lstm_change_percent
                            ) >= 0
                                ? "positive"
                                : "negative"
                        }
                    >

                        {Number(
                            prediction
                                .lstm_change_percent
                        ) >= 0
                            ? "+"
                            : ""
                        }

                        {Number(
                            prediction
                                .lstm_change_percent
                        ).toFixed(2)}

                        %

                    </small>

                </div>


                <div
                    className={
                        "prediction-item ensemble"
                    }
                >

                    <div className="prediction-icon">

                        <Layers
                            size={18}
                        />

                    </div>


                    <span>

                        ENSEMBLE

                    </span>


                    <strong>

                        ₹
                        {Number(
                            prediction
                                .ensemble_prediction
                        ).toFixed(2)}

                    </strong>


                    <small
                        className={
                            Number(
                                prediction
                                    .ensemble_change_percent
                            ) >= 0
                                ? "positive"
                                : "negative"
                        }
                    >

                        {Number(
                            prediction
                                .ensemble_change_percent
                        ) >= 0
                            ? "+"
                            : ""
                        }

                        {Number(
                            prediction
                                .ensemble_change_percent
                        ).toFixed(2)}

                        %

                    </small>

                </div>

            </div>


            <div className="direction">

                Model Direction:

                <strong
                    className={
                        direction === "UP"
                            ? "positive"
                            : direction === "DOWN"
                                ? "negative"
                                : "neutral"
                    }
                >

                    {direction}

                </strong>

            </div>

        </div>
    );
}


export default PredictionCard;