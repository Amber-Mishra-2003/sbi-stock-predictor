import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Bar
} from "recharts";
import { Activity, BarChart3, TrendingUp, TrendingDown, Radio } from "lucide-react";

import useIntraday from "../hooks/useIntraday";
import { market_session } from "../hooks/marketSession";

/**
 * Tooltip — compact, dark-glass card with row breakdown.
 */
function LiveTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const price = payload.find((p) => p.dataKey === "close")?.value;
    const vol = payload.find((p) => p.dataKey === "volume")?.value;

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
                <strong>₹{Number(price).toFixed(2)}</strong>
            </div>
            {vol != null && (
                <div className="chart-tooltip-row">
                    <span className="dot dot-amber" />
                    <span>Volume</span>
                    <strong>{Intl.NumberFormat("en-IN").format(vol)}</strong>
                </div>
            )}
        </motion.div>
    );
}

/**
 * LiveChart — intraday minute chart with a glowing live dot that follows
 * the current price tick. Shows volume bars below the price line, plus a
 * reference line at the previous day's close.
 *
 * During OPEN   → polls every 8s, neon glow on current tick
 * During CLOSED → polls every 60s, no glow, "MARKET CLOSED" overlay
 */
function LiveChart() {
    const { bars, previousClose, lastUpdate, dataSource, error, isInitialLoad } =
        useIntraday("1m", "1d");
    const session = market_session(); // lightweight cached check

    // Compute chart-friendly data (recharts needs flat numeric fields)
    const chartData = useMemo(
        () => bars.map((b) => ({
            time: b.time,
            close: b.close,
            volume: b.volume
        })),
        [bars]
    );

    // Summary stats
    const stats = useMemo(() => {
        if (!chartData.length) return null;
        const prices = chartData.map((d) => d.close);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const open = chartData[0].close;
        const last = chartData[chartData.length - 1].close;
        const change = last - open;
        const changePct = (change / open) * 100;
        const totalVol = chartData.reduce((sum, d) => sum + (d.volume || 0), 0);
        return { open, high, low, last, change, changePct, totalVol };
    }, [chartData]);

    if (!chartData.length) {
        // First response hasn't arrived yet → show the spinner.
        // After first response, if bars are still empty, show a clearer
        // "no ticks yet" message instead of an indefinite loader.
        const message = isInitialLoad
            ? "Loading intraday ticks..."
            : session === "PRE"
                ? "Pre-open session — live ticks start at 09:15 IST"
                : session === "OPEN"
                    ? "Awaiting first tick from exchange..."
                    : session === "POST"
                        ? "Closing auction — today's session ended"
                        : "Market closed — no recent intraday ticks available";

        return (
            <motion.section
                className="card live-chart"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
            >
                <div className="chart-loading">
                    {isInitialLoad && <span className="chart-loader" />}
                    <span>{message}</span>
                    {error && !isInitialLoad && (
                        <small style={{ opacity: 0.6, marginLeft: 8 }}>
                            ({error})
                        </small>
                    )}
                </div>
            </motion.section>
        );
    }

    const isUp = stats.change >= 0;
    const sessionClass = session?.toLowerCase() || "closed";
    const isStale = dataSource === "last_session" || dataSource === "fallback";

    return (
        <motion.section
            className={`card live-chart session-${sessionClass}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="live-chart-header">
                <div>
                    <div className="section-label">
                        <span className="live-pulse" />
                        LIVE INTRADAY · SBIN.NS
                    </div>
                    <h2>
                        {session === "OPEN" ? "Live Tick Stream" :
                         session === "PRE"  ? "Pre-Open Watch" :
                         session === "POST" ? "Closing Auction" :
                                              "Last Session"}
                    </h2>
                </div>

                <div className="chart-header-right">
                    <div className={`chart-period ${isUp ? "positive" : "negative"}`}>
                        {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {stats.change >= 0 ? "+" : ""}{stats.change.toFixed(2)}
                        <span>({stats.changePct >= 0 ? "+" : ""}{stats.changePct.toFixed(2)}%)</span>
                    </div>
                    <div className="chart-badge">
                        <Radio size={11} />
                        {session === "OPEN" ? "LIVE" : session || "—"}
                    </div>
                </div>
            </div>

            {isStale && (
                <div className="chart-stale-banner">
                    Showing the last available session — no ticks for today's window yet.
                </div>
            )}

            {/* mini stats row */}
            <div className="chart-meta live-meta">
                <div className="meta-item">
                    <span>Open</span>
                    <strong>₹{stats.open.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>High</span>
                    <strong className="positive">₹{stats.high.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>Low</span>
                    <strong className="negative">₹{stats.low.toFixed(2)}</strong>
                </div>
                <div className="meta-item">
                    <span>Prev Close</span>
                    <strong>{previousClose ? `₹${previousClose.toFixed(2)}` : "—"}</strong>
                </div>
                <div className="meta-item">
                    <span>Volume</span>
                    <strong>{Intl.NumberFormat("en-IN", { notation: "compact" }).format(stats.totalVol)}</strong>
                </div>
            </div>

            {/* main chart — composed area + volume bars */}
            <div className="chart-container live-chart-canvas">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 18, right: 18, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="liveArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isUp ? "var(--positive)" : "var(--negative)"} stopOpacity={0.45} />
                                <stop offset="100%" stopColor={isUp ? "var(--positive)" : "var(--negative)"} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="liveStroke" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--accent)" />
                                <stop offset="100%" stopColor={isUp ? "var(--positive)" : "var(--negative)"} />
                            </linearGradient>
                            <filter id="liveGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false} />

                        <XAxis
                            dataKey="time"
                            tick={{ fill: "var(--muted)", fontSize: 10.5 }}
                            axisLine={false}
                            tickLine={false}
                            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                            minTickGap={20}
                        />

                        <YAxis
                            yAxisId="price"
                            domain={[
                                (dataMin) => Math.floor(dataMin - 2),
                                (dataMax) => Math.ceil(dataMax + 2)
                            ]}
                            tick={{ fill: "var(--muted)", fontSize: 10.5 }}
                            axisLine={false}
                            tickLine={false}
                            width={62}
                            orientation="right"
                        />

                        <YAxis
                            yAxisId="volume"
                            domain={[0, "dataMax"]}
                            hide
                        />

                        <Tooltip
                            content={<LiveTooltip />}
                            cursor={{ stroke: "var(--accent)", strokeDasharray: "3 4", strokeOpacity: 0.6 }}
                        />

                        {/* volume bars */}
                        <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="var(--grid)"
                            opacity={0.55}
                            radius={[2, 2, 0, 0]}
                            maxBarSize={6}
                            animationDuration={400}
                        />

                        {/* price area */}
                        <Area
                            yAxisId="price"
                            type="monotone"
                            dataKey="close"
                            stroke="url(#liveStroke)"
                            strokeWidth={2.2}
                            fill="url(#liveArea)"
                            animationDuration={600}
                            filter="url(#liveGlow)"
                            dot={(props) => {
                                // render a glowing dot only at the last point
                                const { cx, cy, index, payload } = props;
                                if (index !== chartData.length - 1) return null;
                                const color = isUp ? "var(--positive)" : "var(--negative)";
                                return (
                                    <g key={`dot-${index}`}>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={10}
                                            fill={color}
                                            opacity={0.18}
                                        >
                                            <animate
                                                attributeName="r"
                                                values="10;16;10"
                                                dur="1.6s"
                                                repeatCount="indefinite"
                                            />
                                            <animate
                                                attributeName="opacity"
                                                values="0.4;0;0.4"
                                                dur="1.6s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                        <circle cx={cx} cy={cy} r={5} fill={color} stroke="#00131a" strokeWidth={1.5} />
                                    </g>
                                );
                            }}
                        />

                        {/* previous close reference line */}
                        {previousClose && (
                            <ReferenceLine
                                yAxisId="price"
                                y={previousClose}
                                stroke="var(--dim)"
                                strokeDasharray="5 5"
                                label={{
                                    value: `Prev ₹${previousClose.toFixed(2)}`,
                                    fill: "var(--muted)",
                                    position: "insideBottomRight",
                                    fontSize: 10,
                                    fontWeight: 500
                                }}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>

                {/* status overlay when market closed */}
                {session !== "OPEN" && (
                    <div className="live-chart-overlay">
                        <BarChart3 size={20} />
                        <span>
                            {session === "PRE"
                                ? "Pre-open session — live ticks start at 09:15"
                                : session === "POST"
                                    ? "Post-close — showing today's full session"
                                    : "Market closed — showing last session"}
                        </span>
                    </div>
                )}
            </div>

            <div className="chart-legend">
                <div>
                    <span className="legend-line" />
                    Price (₹)
                </div>
                <div>
                    <span className="legend-volume" />
                    Volume
                </div>
                <div>
                    <span className="legend-prev" />
                    Previous Close
                </div>
                <div className="sparkline-info">
                    <Activity size={11} />
                    {lastUpdate
                        ? `Last update ${lastUpdate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`
                        : "Awaiting first tick..."}
                </div>
            </div>
        </motion.section>
    );
}

export default LiveChart;
