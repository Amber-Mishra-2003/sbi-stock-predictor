import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceDot
} from "recharts";

/**
 * Custom tooltip — dark glass card with row breakdown.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    return (
        <motion.div
            className="chart-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
        >
            <div className="chart-tooltip-date">{label}</div>
            <div className="chart-tooltip-row">
                <span className="dot" />
                <span>Close</span>
                <strong>₹{Number(value).toFixed(2)}</strong>
            </div>
        </motion.div>
    );
}

function PriceChart({ history, prediction }) {
    const chartData = useMemo(
        () =>
            (history || []).map((item) => ({
                date: item.date,
                close: Number(item.close)
            })),
        [history]
    );

    if (!chartData.length) {
        return (
            <div className="chart-loading">
                <span className="chart-loader" />
                Loading price chart...
            </div>
        );
    }

    const first = chartData[0].close;
    const last = chartData[chartData.length - 1].close;
    const rangeHigh = Math.max(...chartData.map((d) => d.close));
    const rangeLow = Math.min(...chartData.map((d) => d.close));
    const periodReturn = ((last - first) / first) * 100;
    const isUp = periodReturn >= 0;

    // Build a tiny "last 7 days" sparkline dataset for the badge
    const sparkData = chartData.slice(-7);

    return (
        <motion.section
            className="chart-section card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="section-header">
                <div>
                    <div className="section-label">PRICE ANALYTICS</div>
                    <h2>SBI Close Price</h2>
                </div>

                <div className="chart-header-right">
                    <div className={`chart-period ${isUp ? "positive" : "negative"}`}>
                        {isUp ? "▲" : "▼"} {periodReturn.toFixed(2)}%
                        <span>last {chartData.length} sessions</span>
                    </div>
                </div>
            </div>

            <div className="chart-meta">
                <div className="meta-item">
                    <span>Latest</span>
                    <strong>₹{last.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>Period high</span>
                    <strong className="positive">₹{rangeHigh.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>Period low</span>
                    <strong className="negative">₹{rangeLow.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>Range</span>
                    <strong>₹{(rangeHigh - rangeLow).toFixed(2)}</strong>
                </div>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 15, right: 16, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="priceStroke" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--accent)" />
                                <stop offset="100%" stopColor="var(--positive)" />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--grid)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="date"
                            tick={{ fill: "var(--muted)", fontSize: 11 }}
                            tickFormatter={(v) => String(v).slice(5, 10)}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={28}
                        />

                        <YAxis
                            domain={["dataMin - 20", "dataMax + 20"]}
                            tick={{ fill: "var(--muted)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={62}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--accent)", strokeDasharray: "4 4" }} />

                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke="url(#priceStroke)"
                            strokeWidth={2.5}
                            fill="url(#priceGradient)"
                            dot={false}
                            activeDot={{
                                r: 6,
                                stroke: "var(--accent)",
                                strokeWidth: 2,
                                fill: "#00131a"
                            }}
                            animationDuration={1100}
                            animationEasing="ease-out"
                        />

                        {prediction && (
                            <>
                                <ReferenceLine
                                    y={prediction.ensemble_prediction}
                                    stroke="var(--prediction)"
                                    strokeDasharray="6 6"
                                    label={{
                                        value: `AI ₹${Number(prediction.ensemble_prediction).toFixed(2)}`,
                                        fill: "var(--prediction)",
                                        position: "insideTopRight",
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}
                                />
                                <ReferenceDot
                                    y={prediction.ensemble_prediction}
                                    x={chartData[chartData.length - 1].date}
                                    r={5}
                                    fill="var(--prediction)"
                                    stroke="#00131a"
                                    strokeWidth={2}
                                />
                            </>
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-legend">
                <div>
                    <span className="legend-line" />
                    Historical Close
                </div>
                <div>
                    <span className="legend-prediction" />
                    AI Ensemble Prediction
                </div>

                {/* tiny inline sparkline for visual rhythm */}
                <div className="sparkline">
                    {sparkData.map((d, i) => {
                        const min = Math.min(...sparkData.map((p) => p.close));
                        const max = Math.max(...sparkData.map((p) => p.close));
                        const h = ((d.close - min) / (max - min || 1)) * 100;
                        return (
                            <span
                                key={i}
                                className="spark-bar"
                                style={{ height: `${h}%` }}
                                title={`₹${d.close.toFixed(2)}`}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}

export default PriceChart;
