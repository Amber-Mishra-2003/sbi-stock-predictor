import {
    useEffect,
    useState
} from "react";


import Header from "./components/Header";

import PriceCard from "./components/PriceCard";

import PredictionCard from "./components/PredictionCard";

import ModelStatus from "./components/ModelStatus";

import PriceChart from "./components/PriceChart";

import AIChat from "./components/AIChat";


import "./App.css";


const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";


function App() {

    const [
        prediction,
        setPrediction
    ] = useState(null);


    const [
        status,
        setStatus
    ] = useState(null);


    const [
        history,
        setHistory
    ] = useState([]);


    const [
        training,
        setTraining
    ] = useState(false);


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        error,
        setError
    ] = useState("");


    async function fetchPrediction() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/latest`
                );


            if (!response.ok) {

                throw new Error(
                    "Prediction request failed"
                );

            }


            const data =
                await response.json();


            setPrediction(data);

            setError("");


        } catch (error) {

            console.error(
                "Prediction error:",
                error
            );


            setError(
                "Unable to connect to prediction backend."
            );

        }

    }


    async function fetchStatus() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/status`
                );


            if (!response.ok) {

                throw new Error(
                    "Status request failed"
                );

            }


            const data =
                await response.json();


            setStatus(data);


            setTraining(
                data.training_status ===
                "TRAINING"
            );


        } catch (error) {

            console.error(
                "Status error:",
                error
            );

        }

    }


    async function fetchHistory() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/history`
                );


            if (!response.ok) {

                throw new Error(
                    "History request failed"
                );

            }


            const data =
                await response.json();


            setHistory(
                data.data || []
            );


        } catch (error) {

            console.error(
                "History error:",
                error
            );

        }

    }


    async function refreshDashboard() {

        await Promise.all([
            fetchStatus(),
            fetchPrediction(),
            fetchHistory()
        ]);

    }


    async function startTraining() {

        if (training) {

            return;

        }


        setLoading(true);

        setError("");


        try {

            const response =
                await fetch(
                    `${API_URL}/api/train`,
                    {
                        method: "POST"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Training request failed"
                );

            }


            const data =
                await response.json();


            console.log(
                "Training:",
                data
            );


            setTraining(true);


        } catch (error) {

            console.error(
                error
            );


            setError(
                "Unable to start model training."
            );


        } finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        refreshDashboard();


        const interval =
            setInterval(
                () => {

                    fetchStatus();

                },
                5000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, []);


    useEffect(() => {

        if (!training) {

            return;

        }


        const interval =
            setInterval(
                async () => {

                    try {

                        const response =
                            await fetch(
                                `${API_URL}/api/train/status`
                            );


                        const data =
                            await response.json();


                        if (
                            data.status ===
                            "IDLE"
                        ) {

                            setTraining(
                                false
                            );


                            await fetchStatus();

                            await fetchPrediction();

                            await fetchHistory();

                        }

                    } catch (error) {

                        console.error(
                            error
                        );

                    }

                },
                3000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, [training]);


    return (

        <div className="app">


            <Header
                training={
                    training
                }
            />


            <main className="dashboard">


                {error && (

                    <div className="error">

                        {error}

                    </div>

                )}


                <section className="hero">


                    <div>

                        <div className="eyebrow">

                            AI POWERED
                            MARKET INTELLIGENCE

                        </div>


                        <h1>

                            SBI Stock
                            <br />

                            Predictor

                        </h1>


                        <p>

                            Close price forecasting
                            using XGBoost + LSTM

                        </p>

                    </div>


                    <div className="market-status">

                        <span
                            className={
                                status?.status ===
                                "READY"

                                    ? "status-dot"

                                    : "status-dot offline"
                            }
                        />


                        {status?.status ===
                        "READY"

                            ? "MODEL ONLINE"

                            : "CONNECTING..."
                        }

                    </div>

                </section>


                {prediction && (

                    <>


                        <section
                            className="top-grid"
                        >


                            <PriceCard
                                prediction={
                                    prediction
                                }
                            />


                            <PredictionCard
                                prediction={
                                    prediction
                                }
                            />


                        </section>


                        <PriceChart
                            history={
                                history
                            }
                            prediction={
                                prediction
                            }
                        />


                        <ModelStatus
                            status={
                                status
                            }
                            training={
                                training
                            }
                        />


                    </>

                )}


                {!prediction &&
                    !error && (

                        <div
                            className="loading-card"
                        >

                            Loading SBI
                            prediction...

                        </div>

                    )
                }


                <section className="controls">


                    <button
                        className="train-button"

                        onClick={
                            startTraining
                        }

                        disabled={
                            training ||
                            loading
                        }
                    >

                        {training

                            ? "Training Models..."

                            : "Retrain Models"

                        }

                    </button>


                    <button
                        className="refresh-button"

                        onClick={
                            refreshDashboard
                        }
                    >

                        Refresh Prediction

                    </button>


                </section>


                <AIChat
                    prediction={
                        prediction
                    }
                />


            </main>


        </div>

    );

}


export default App;