import { useEffect, useRef, useState } from "react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * useIntraday — polls /api/intraday while the dashboard is open.
 *
 * Returns:
 *   {
 *     bars:           [{ time, close, high, low, volume }],
 *     previousClose:  number | null,
 *     lastUpdate:     Date | null,
 *     dataSource:     "today" | "last_session" | "fallback" | "none",
 *     error:          string | null
 *   }
 *
 * Cadence adapts to market state (faster during OPEN, slower when closed).
 */
function useIntraday(interval = "1m", period = "1d") {
    const [bars, setBars] = useState([]);
    const [previousClose, setPreviousClose] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [dataSource, setDataSource] = useState(null);
    const [error, setError] = useState(null);
    const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
    const timerRef = useRef(null);
    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;

        async function fetchOnce() {
            try {
                const res = await fetch(
                    `${API_URL}/api/intraday?interval=${interval}&period=${period}`
                );
                if (!res.ok) throw new Error(`intraday fetch failed (${res.status})`);
                const data = await res.json();
                if (cancelledRef.current) return;
                setBars(data.bars || []);
                setPreviousClose(data.previous_close ?? null);
                setDataSource(data.data_source || null);
                setError(data.error || null);
                setLastUpdate(new Date());
                setHasReceivedFirstResponse(true);
            } catch (err) {
                console.error("useIntraday:", err);
                setError(err.message || String(err));
                setHasReceivedFirstResponse(true);
            }
        }

        async function decideDelayAndSchedule() {
            let nextDelay = 8000;
            try {
                const mRes = await fetch(`${API_URL}/api/market`);
                if (mRes.ok) {
                    const m = await mRes.json();
                    nextDelay =
                        m.session === "OPEN" ? 8000 :
                        m.session === "PRE" || m.session === "POST" ? 30000 :
                        60000;
                }
            } catch (_) { /* keep default */ }

            await fetchOnce();
            if (cancelledRef.current) return;

            timerRef.current = setTimeout(decideDelayAndSchedule, nextDelay);
        }

        decideDelayAndSchedule();

        return () => {
            cancelledRef.current = true;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [interval, period]);

    return {
        bars,
        previousClose,
        lastUpdate,
        dataSource,
        error,
        isInitialLoad: !hasReceivedFirstResponse
    };
}

export default useIntraday;
