import { useEffect, useRef, useState } from "react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * useLivePrice — polls /api/quote and /api/market while the dashboard is open.
 *
 * Returns:
 *   {
 *     quote:         { price, open, high, low, volume, change, change_percent, ... } | null,
 *     market:        { session, is_open, label, next_open, server_time } | null,
 *     lastTickAt:    Date | null,       // timestamp of last successful fetch
 *     tickDirection: "UP" | "DOWN" | "NEUTRAL"  // direction of most recent price change
 *     isLive:        boolean           // true while polling is active
 *   }
 *
 * Polling cadence adapts to market session:
 *   • OPEN   → every 8s   (live ticks)
 *   • PRE/POST → every 30s
 *   • CLOSED → every 60s  (price won't change, but keeps clock fresh)
 *
 * Cleans up on unmount and on backend errors — never throws.
 */
function useLivePrice(intervalMs = 8000) {
    const [quote, setQuote] = useState(null);
    const [market, setMarket] = useState(null);
    const [lastTickAt, setLastTickAt] = useState(null);
    const [tickDirection, setTickDirection] = useState("NEUTRAL");
    const [isLive, setIsLive] = useState(true);

    const prevPriceRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchOnce() {
            try {
                const [qRes, mRes] = await Promise.all([
                    fetch(`${API_URL}/api/quote`),
                    fetch(`${API_URL}/api/market`)
                ]);

                if (cancelled) return;

                if (qRes.ok) {
                    const data = await qRes.json();
                    if (data.price != null) {
                        if (
                            prevPriceRef.current != null &&
                            data.price !== prevPriceRef.current
                        ) {
                            setTickDirection(
                                data.price > prevPriceRef.current
                                    ? "UP"
                                    : "DOWN"
                            );
                        } else if (prevPriceRef.current == null) {
                            setTickDirection("NEUTRAL");
                        }
                        prevPriceRef.current = data.price;
                    }
                    setQuote(data);
                    setLastTickAt(new Date());
                }

                if (mRes.ok) {
                    const m = await mRes.json();
                    if (!cancelled) setMarket(m);
                }
            } catch (err) {
                console.error("Live price poll failed:", err);
                setIsLive(false);
            }
        }

        function schedule(delay) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(async () => {
                await fetchOnce();
                // adaptive delay based on market state
                // (re-read latest market from state via a ref is overkill;
                //  we simply re-fetch market before deciding next delay)
                let nextDelay = intervalMs;
                try {
                    const mRes = await fetch(`${API_URL}/api/market`);
                    if (mRes.ok) {
                        const m = await mRes.json();
                        nextDelay =
                            m.session === "OPEN" ? 8000 :
                            m.session === "PRE" || m.session === "POST" ? 30000 :
                            60000;
                    }
                } catch (_) { /* ignore — keep previous delay */ }
                if (!cancelled) schedule(nextDelay);
            }, delay);
        }

        fetchOnce();
        schedule(intervalMs);

        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { quote, market, lastTickAt, tickDirection, isLive };
}

export default useLivePrice;
