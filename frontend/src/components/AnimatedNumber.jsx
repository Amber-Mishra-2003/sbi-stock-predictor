import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` over `duration` ms.
 * Uses requestAnimationFrame — pauses cleanly when `value` is undefined.
 *
 * Used for prices so the dashboard feels live rather than
 * "value snap, value snap, value snap".
 */
function AnimatedNumber({
    value,
    duration = 900,
    decimals = 2,
    prefix = "",
    suffix = "",
    className = ""
}) {
    const [display, setDisplay] = useState(value ?? 0);
    const startRef = useRef(null);
    const fromRef = useRef(value ?? 0);
    const targetRef = useRef(value ?? 0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (value == null || isNaN(value)) return;

        targetRef.current = value;
        fromRef.current = display;
        startRef.current = null;

        const step = (timestamp) => {
            if (startRef.current == null) startRef.current = timestamp;
            const elapsed = timestamp - startRef.current;
            const t = Math.min(1, elapsed / duration);

            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);

            const next = fromRef.current + (targetRef.current - fromRef.current) * eased;
            setDisplay(next);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration]);

    const formatted = Number(display).toFixed(decimals);

    return (
        <span className={className}>
            {prefix}
            {formatted}
            {suffix}
        </span>
    );
}

export default AnimatedNumber;
