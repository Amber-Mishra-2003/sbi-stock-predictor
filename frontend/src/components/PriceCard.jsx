import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

import AnimatedNumber from "./AnimatedNumber";

function PriceCard({ prediction }) {
    const change = Number(prediction.ensemble_change_percent);
    const isUp = change > 0;
    const isDown = change < 0;
    const directionClass = isUp
        ? "positive"
        : isDown
            ? "negative"
            : "neutral";

    // Format last_data_date nicely if it looks like an ISO date
    const rawDate = prediction.last_data_date;
    let formattedDate = rawDate || "N/A";
    if (rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }
    }

    return (
        <motion.div
            className="card price-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
        >
            <div className="price-glow" data-direction={directionClass} />

            <div className="card-label">
                <span className="live-pulse" />
                CURRENT SBI CLOSE
            </div>

            <div className="current-price">
                <span className="rupee">₹</span>
                <AnimatedNumber
                    value={Number(prediction.current_close)}
                    duration={1100}
                    decimals={2}
                />
            </div>

            <motion.div
                className={`change ${directionClass}`}
                key={change} // re-trigger when value changes
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
            >
                {isUp && <TrendingUp size={18} />}
                {isDown && <TrendingDown size={18} />}
                {!isUp && !isDown && <Minus size={18} />}

                <AnimatedNumber
                    value={change}
                    duration={700}
                    decimals={2}
                    suffix="%"
                    prefix={change >= 0 ? "+" : ""}
                />

                <span className="change-tag">vs forecast</span>
            </motion.div>

            <div className="data-date">
                <Calendar size={13} />
                <span>Latest data:</span>
                <strong>{formattedDate}</strong>
            </div>

            <div className="price-stats">
                <div className="price-stat">
                    <span>52W range impact</span>
                    <strong>{prediction.last_data_date ? "Active" : "—"}</strong>
                </div>
                <div className="price-stat">
                    <span>Model confidence</span>
                    <strong>
                        {prediction.confidence != null
                            ? `${(prediction.confidence * 100).toFixed(1)}%`
                            : "High"}
                    </strong>
                </div>
            </div>
        </motion.div>
    );
}

export default PriceCard;
