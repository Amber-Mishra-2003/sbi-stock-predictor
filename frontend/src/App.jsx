import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import PriceCard from "./components/PriceCard";
import PredictionCard from "./components/PredictionCard";
import ModelStatus from "./components/ModelStatus";
import PriceChart from "./components/PriceChart";
import AIChat from "./components/AIChat";
import LiveTicker from "./components/LiveTicker";
import LiveChart from "./components/LiveChart";
import Background3D from "./components/Background3D";
import AIStockVideo3D from "./components/AIStockVideo3D";
import Landing from "./components/Landing";
import { fadeUp } from "./components/Motion";

import "./App.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

function App() {
    const [entered, setEntered] = useState(false);

    const [prediction, setPrediction] = useState(null);
    const [status, setStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [training, setTraining] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    async function fetchPrediction() {
        try {
            const response = await fetch(`${API_URL}/api/latest`);
            if (!response.ok) throw new Error("Prediction request failed");
            const data = await response.json();
            setPrediction(data);
            setError("");
        } catch (err) {
            console.error("Prediction error:", err);
            setError("Unable to connect to prediction backend.");
        }
    }

    async function fetchStatus() {
        try {
            const response = await fetch(`${API_URL}/api/status`);
            if (!response.ok) throw new Error("Status request failed");
            const data = await response.json();
            setStatus(data);
            setTraining(data.training_status === "TRAINING");
        } catch (err) {
            console.error("Status error:", err);
        }
    }

    async function fetchHistory() {
        try {
            const response = await fetch(`${API_URL}/api/history`);
            if (!response.ok) throw new Error("History request failed");
            const data = await response.json();
            setHistory(data.data || []);
        } catch (err) {
            console.error("History error:", err);
        }
    }

    async function refreshDashboard() {
        setRefreshing(true);
        await Promise.all([fetchStatus(), fetchPrediction(), fetchHistory()]);
        setLastUpdated(new Date());
        setRefreshing(false);
    }

    // Wake Render free-tier service before the real dashboard calls hit it.
    // The free tier spins down after ~15 min of inactivity; the first request
    // then takes 30–50s to cold-start and surfaces as ERR_INTERNET_DISCONNECTED.
    // A cheap GET to /api/health right after the user clicks "Enter" warms the
    // service so subsequent calls succeed immediately.
    async function wakeBackend() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            await fetch(`${API_URL}/api/health`, { signal: controller.signal });
            clearTimeout(timeout);
        } catch (err) {
            // Cold-start timeout is fine — the next refresh will retry naturally.
            console.warn("Backend wake-up ping failed (will retry on next refresh):", err);
        }
    }

    async function startTraining() {
        if (training) return;
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/train`, { method: "POST" });
            if (!response.ok) throw new Error("Training request failed");
            console.log("Training:", await response.json());
            setTraining(true);
        } catch (err) {
            console.error(err);
            setError("Unable to start model training.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refreshDashboard();
        const interval = setInterval(() => fetchStatus(), 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!training) return;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/train/status`);
                const data = await response.json();
                if (data.status === "IDLE") {
                    setTraining(false);
                    await fetchStatus();
                    await fetchPrediction();
                    await fetchHistory();
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error(err);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [training]);

    // Landing overlay — shown once on first load, dismissed by clicking Enter
    if (!entered) {
        return (
            <div className="app">
                <AIStockVideo3D direction={prediction?.direction} scene="hero" />
                <Landing
                    onEnter={() => {
                        setEntered(true);
                        // Warm Render before the dashboard queries land.
                        wakeBackend();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="app">
            <AIStockVideo3D direction={prediction?.direction} scene="dashboard" />

            <LiveTicker />

            <Header training={training} />

            <main className="dashboard">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="error"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.section
                    className="hero"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <motion.div
                            className="eyebrow"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            AI POWERED · MARKET INTELLIGENCE
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6 }}
                        >
                            SBI Stock
                            <br />
                            <span className="hero-gradient">Predictor</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Close price forecasting using XGBoost + LSTM
                        </motion.p>
                    </div>

                    <motion.div
                        className="market-status"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <span
                            className={
                                status?.status === "READY"
                                    ? "status-dot"
                                    : "status-dot offline"
                            }
                        />
                        {status?.status === "READY" ? "MODEL ONLINE" : "CONNECTING..."}
                    </motion.div>
                </motion.section>

                <AnimatePresence mode="wait">
                    {prediction && (
                        <motion.section
                            key="top-grid"
                            className="top-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <PriceCard prediction={prediction} />
                            <PredictionCard prediction={prediction} />
                        </motion.section>
                    )}

                    {prediction && (
                        <LiveChart key="live-chart" />
                    )}

                    {prediction && (
                        <PriceChart
                            key="chart"
                            history={history}
                            prediction={prediction}
                        />
                    )}

                    {prediction && (
                        <ModelStatus
                            key="status"
                            status={status}
                            training={training}
                        />
                    )}
                </AnimatePresence>

                {!prediction && !error && (
                    <motion.div
                        className="loading-card"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span className="loading-spinner" />
                        Loading SBI prediction...
                    </motion.div>
                )}

                <motion.section
                    className="controls"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        className="train-button"
                        onClick={startTraining}
                        disabled={training || loading}
                        whileHover={!(training || loading) ? { scale: 1.03, y: -2 } : {}}
                        whileTap={!(training || loading) ? { scale: 0.97 } : {}}
                    >
                        {training ? (
                            <>
                                <span className="btn-spinner" />
                                Training Models...
                            </>
                        ) : (
                            "Retrain Models"
                        )}
                    </motion.button>

                    <motion.button
                        className="refresh-button"
                        onClick={refreshDashboard}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <motion.span
                            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                            transition={
                                refreshing
                                    ? { duration: 0.8, ease: "linear", repeat: Infinity }
                                    : { duration: 0.3 }
                            }
                            style={{ display: "inline-block", marginRight: 8 }}
                        >
                            ↻
                        </motion.span>
                        Refresh Prediction
                    </motion.button>

                    {lastUpdated && (
                        <motion.div
                            className="last-updated"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </motion.div>
                    )}
                </motion.section>

                {prediction && <AIChat prediction={prediction} />}
            </main>
        </div>
    );
}

export default App;
