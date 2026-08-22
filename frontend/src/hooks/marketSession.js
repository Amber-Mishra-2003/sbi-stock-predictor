import { useEffect, useState } from "react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * market_session — fetches /api/market once per minute.
 * Lightweight shared cache so multiple components don't all re-fetch.
 */
let cache = { session: null, fetchedAt: 0 };
const subscribers = new Set();

async function refresh() {
    try {
        const res = await fetch(`${API_URL}/api/market`);
        if (!res.ok) return;
        const data = await res.json();
        cache = { session: data.session, fetchedAt: Date.now(), full: data };
        subscribers.forEach((cb) => cb(data));
    } catch (err) {
        console.error("market_session:", err);
    }
}

function ensureRunning() {
    if (cache._interval) return;
    refresh();
    cache._interval = setInterval(refresh, 30_000);
}

export function useMarketSession() {
    const [data, setData] = useState(cache.full || null);

    useEffect(() => {
        ensureRunning();
        const cb = (d) => setData({ ...d });
        subscribers.add(cb);
        // sync with current cache
        if (cache.full) setData({ ...cache.full });
        return () => {
            subscribers.delete(cb);
        };
    }, []);

    return data;
}

// Legacy helper for direct access (used by LiveChart if needed)
export function market_session() {
    return cache.session;
}

export default useMarketSession;
