import { motion } from "framer-motion";
import { Brain, Layers, Target, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

import AnimatedNumber from "./AnimatedNumber";

const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
};

function PredictionRow({ icon, name, value, change, accent }) {
    const changeNum = Number(change);
    const isUp = changeNum >= 0;

    return (
        <motion.div
            className={`prediction-item ${accent === "ensemble" ? "ensemble" : ""}`}
            variants={itemVariants}
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
        >
            <div className={`prediction-icon ${accent}`}>
                {icon}
            </div>

            <div className="prediction-body">
                <span className="prediction-name">{name}</span>
                <strong className="prediction-value">
                    <span className="rupee-small">₹</span>
                    <AnimatedNumber
                        value={Number(value)}
                        duration={1100}
                        decimals={2}
                    />
                </strong>
            </div>

            <div className={`prediction-change ${isUp ? "positive" : "negative"}`}>
                {isUp
                    ? <ArrowUpRight size={14} />
                    : <ArrowDownRight size={14} />}
                <AnimatedNumber
                    value={changeNum}
                    duration={800}
                    decimals={2}
                    suffix="%"
                    prefix={isUp ? "+" : ""}
                />
            </div>
        </motion.div>
    );
}

function PredictionCard({ prediction }) {
    const direction = prediction.direction;
    const dirClass =
        direction === "UP"
            ? "positive"
            : direction === "DOWN"
                ? "negative"
                : "neutral";

    return (
        <motion.div
            className="card prediction-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.55,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ y: -4 }}
        >
            <div className="card-label">
                FUTURE CLOSE PREDICTION
            </div>

            <motion.div
                className="prediction-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: { staggerChildren: 0.1, delayChildren: 0.15 }
                    }
                }}
            >
                <PredictionRow
                    icon={<Target size={18} />}
                    name="XGBoost"
                    value={prediction.xgboost_prediction}
                    change={prediction.xgboost_change_percent}
                    accent="xgboost"
                />

                <PredictionRow
                    icon={<Brain size={18} />}
                    name="LSTM"
                    value={prediction.lstm_prediction}
                    change={prediction.lstm_change_percent}
                    accent="lstm"
                />

                <PredictionRow
                    icon={<Layers size={18} />}
                    name="Ensemble"
                    value={prediction.ensemble_prediction}
                    change={prediction.ensemble_change_percent}
                    accent="ensemble"
                />
            </motion.div>

            <motion.div
                className="direction"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
            >
                <span className="direction-label">
                    <Activity size={13} />
                    Model Direction
                </span>
                <motion.strong
                    key={direction}
                    className={dirClass}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 18
                    }}
                >
                    <span className="dir-arrow">
                        {direction === "UP" ? "▲" : direction === "DOWN" ? "▼" : "◆"}
                    </span>
                    {direction}
                </motion.strong>
            </motion.div>
        </motion.div>
    );
}

export default PredictionCard;
