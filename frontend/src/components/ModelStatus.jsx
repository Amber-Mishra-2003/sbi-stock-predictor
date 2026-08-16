import {
    CheckCircle,
    XCircle,
    LoaderCircle,
    Database,
    Cpu,
    Brain
} from "lucide-react";


function ModelStatus({
    status,
    training
}) {

    if (!status) {
        return null;
    }


    function StatusRow({
        icon,
        name,
        available
    }) {

        return (

            <div className="model-row">

                <div className="model-name">

                    {icon}

                    <span>
                        {name}
                    </span>

                </div>


                {available ? (

                    <div className="model-ready">

                        <CheckCircle
                            size={16}
                        />

                        Ready

                    </div>

                ) : (

                    <div className="model-error">

                        <XCircle
                            size={16}
                        />

                        Missing

                    </div>

                )}

            </div>
        );
    }


    return (

        <section className="card model-card">

            <div className="model-header">

                <div>

                    <div className="card-label">

                        MODEL STATUS

                    </div>


                    <h2>

                        Prediction Engine

                    </h2>

                </div>


                {training ? (

                    <LoaderCircle
                        className="spin"
                        size={22}
                    />

                ) : (

                    <Cpu
                        size={22}
                    />

                )}

            </div>


            <div className="model-list">


                <StatusRow
                    icon={
                        <Cpu
                            size={17}
                        />
                    }
                    name="XGBoost"
                    available={
                        status
                            .xgboost_available
                    }
                />


                <StatusRow
                    icon={
                        <Brain
                            size={17}
                        />
                    }
                    name="LSTM"
                    available={
                        status
                            .lstm_available
                    }
                />


                <StatusRow
                    icon={
                        <Database
                            size={17}
                        />
                    }
                    name="LSTM Scaler"
                    available={
                        status
                            .scaler_available
                    }
                />

            </div>


            <div className="training-state">

                Training Status:

                <strong>

                    {" "}
                    {training
                        ? "TRAINING"
                        : status.training_status
                    }

                </strong>

            </div>

        </section>
    );
}


export default ModelStatus;