import { motion } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    LoaderCircle,
    Database,
    Cpu,
    Brain,
    Zap
} from "lucide-react";

function StatusRow({ icon, name, available, accent }) {
    return (
        <motion.div
            className="model-row"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
            <div className="model-name">
                <div className={`model-icon ${accent}`}>{icon}</div>
                <span>{name}</span>
            </div>

            {available ? (
                <motion.div
                    className="model-ready"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                >
                    <CheckCircle size={15} />
                    Ready
                </motion.div>
            ) : (
                <div className="model-error">
                    <XCircle size={15} />
                    Missing
                </div>
            )}
        </motion.div>
    );
}

function ModelStatus({ status, training }) {
    if (!status) return null;

    const components = [
        { key: "xgboost", name: "XGBoost", icon: <Cpu size={16} />, available: status.xgboost_available },
        { key: "lstm", name: "LSTM", icon: <Brain size={16} />, available: status.lstm_available },
        { key: "scaler", name: "LSTM Scaler", icon: <Database size={16} />, available: status.scaler_available }
    ];

    const readyCount = components.filter((c) => c.available).length;
    const readyPct = Math.round((readyCount / components.length) * 100);

    return (
        <motion.section
            className="card model-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="model-header">
                <div>
                    <div className="card-label">MODEL STATUS</div>
                    <h2>Prediction Engine</h2>
                </div>

                <motion.div
                    className="model-badge"
                    animate={
                        training
                            ? { rotate: 360 }
                            : { rotate: 0 }
                    }
                    transition={
                        training
                            ? { duration: 1.2, ease: "linear", repeat: Infinity }
                            : { duration: 0.3 }
                    }
                >
                    {training ? <LoaderCircle size={22} /> : <Zap size={22} />}
                </motion.div>
            </div>

            {/* readiness progress */}
            <div className="readiness">
                <div className="readiness-top">
                    <span>System readiness</span>
                    <strong>{readyCount}/{components.length} models</strong>
                </div>
                <div className="readiness-track">
                    <motion.div
                        className="readiness-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${readyPct}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
            </div>

            <div className="model-list">
                {components.map((c) => (
                    <StatusRow
                        key={c.key}
                        icon={c.icon}
                        name={c.name}
                        available={c.available}
                        accent={c.key}
                    />
                ))}
            </div>

            <div className="training-state">
                <span>Training Status:</span>
                <motion.strong
                    key={String(training) + (status.training_status || "")}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    {training ? "TRAINING IN PROGRESS" : status.training_status}
                </motion.strong>
            </div>
        </motion.section>
    );
}

export default ModelStatus;
