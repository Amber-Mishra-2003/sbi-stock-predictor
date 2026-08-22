import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUp, ArrowDown, Minus, Clock, Radio } from "lucide-react";

import useLivePrice from "../hooks/useLivePrice";

/**
 * LiveTicker — a sticky banner that shows the live SBIN.NS price tick.
 *
 * Behavior:
 *   • When market is OPEN  → bright pulse, "MARKET LIVE", live price flashes
 *                            green/red on each tick
 *   • When PRE/POST/CLOSED → quieter, "MARKET CLOSED", shows the most recent
 *                            price with a clock countdown to the next session
 */
function LiveTicker() {
    const { quote, market, lastTickAt, tickDirection, isLive } = useLivePrice(8000);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    if (!market) return null;

    const session = market.session;
    const isOpen = session === "OPEN";

    // Clock helpers
    function timeUntil(target) {
        if (!target) return null;
        const diff = new Date(target).getTime() - now.getTime();
        if (diff <= 0) return null;
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        return `${h}h ${m}m ${s}s`;
    }

    const nextLabel = isOpen
        ? `Closes in ${timeUntil(market.next_close)}`
        : session === "PRE"
            ? `Opens in ${timeUntil(market.next_open)}`
            : session === "POST"
                ? `Reopens ${timeUntil(market.next_open)?.replace(/^0h\s?/, "")}`
                : market.next_open
                    ? `Opens in ${timeUntil(market.next_open)}`
                    : "";

    // Format current IST clock HH:MM:SS
    const clock = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    const price = quote?.price ?? null;
    const change = quote?.change ?? null;
    const changePct = quote?.change_percent ?? null;
    const dir = change == null ? "NEUTRAL" : change >= 0 ? "UP" : "DOWN";
    const dirClass = dir === "UP" ? "positive" : dir === "DOWN" ? "negative" : "neutral";

    // pulse class for the price box
    const tickClass = isOpen && tickDirection === "UP"
        ? "tick-up"
        : isOpen && tickDirection === "DOWN"
            ? "tick-down"
            : "";

    return (
        <motion.div
            className={`live-ticker ${session.toLowerCase()}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* LEFT — market status + live dot */}
            <div className="ticker-left">
                <motion.div
                    className={`live-dot ${isOpen ? "on" : "off"}`}
                    animate={
                        isOpen
                            ? { scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }
                            : { scale: 1, opacity: 0.5 }
                    }
                    transition={
                        isOpen
                            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                            : { duration: 0.3 }
                    }
                />
                <div className="ticker-status">
                    <div className="ticker-session">
                        {isOpen && <Radio size={12} />}
                        {market.label}
                    </div>
                    <div className="ticker-sub">
                        {isOpen ? nextLabel : nextLabel}
                    </div>
                </div>
            </div>

            {/* CENTER — price + change */}
            <div className={`ticker-price ${tickClass} ${dirClass}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={price ?? "no-price"}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                        className="price-value"
                    >
                        <span className="rupee">₹</span>
                        {price != null ? price.toFixed(2) : "—"}
                    </motion.div>
                </AnimatePresence>

                <div className={`price-change ${dirClass}`}>
                    {dir === "UP" && <ArrowUp size={13} />}
                    {dir === "DOWN" && <ArrowDown size={13} />}
                    {dir === "NEUTRAL" && <Minus size={13} />}
                    <span>
                        {change != null
                            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}`
                            : "—"}
                    </span>
                    <span className="price-pct">
                        ({changePct != null
                            ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
                            : "—"})
                    </span>
                </div>
            </div>

            {/* RIGHT — clock + last tick + ticker symbol */}
            <div className="ticker-right">
                <div className="ticker-symbol">SBIN · NSE</div>
                <div className="ticker-clock">
                    <Clock size={12} />
                    <span>{clock}</span>
                </div>
                <div className="ticker-last">
                    <Activity size={11} className={isLive ? "active" : ""} />
                    {lastTickAt
                        ? `Last tick ${lastTickAt.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false
                          })}`
                        : "Connecting..."}
                </div>
            </div>
        </motion.div>
    );
}

export default LiveTicker;
