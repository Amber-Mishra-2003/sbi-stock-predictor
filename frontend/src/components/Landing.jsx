import { useEffect, useMemo, useRef } from "react";
import {
    TrendingUp,
    Brain,
    MessageSquareText,
    ChevronDown
} from "lucide-react";

import "./Landing.css";

// deterministic pseudo-random bar heights (no new deps, stable across renders)
function useSeededBars(count, seed, min, max) {
    return useMemo(() => {
        let s = seed;
        const rand = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        return Array.from({ length: count }, () => min + rand() * (max - min));
    }, [count, seed, min, max]);
}

function Landing({ onEnter }) {
    const sectionRefs = useRef([]);

    const s1BackRef = useRef(null);
    const s1MidRef = useRef(null);
    const s1FrontRef = useRef(null);

    const s2CyanRef = useRef(null);
    const s2AmberRef = useRef(null);
    const s2CoreRef = useRef(null);

    const s3RingRef = useRef(null);

    const barsBack = useSeededBars(26, 11, 20, 70);
    const barsMid = useSeededBars(22, 42, 30, 110);
    const barsFront = useSeededBars(18, 7, 40, 150);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        if (reduceMotion) return;

        let rafId;

        function update() {
            const vh = window.innerHeight;

            // section 1 — layered parallax skyline
            const r1 = sectionRefs.current[0]?.getBoundingClientRect();
            if (r1) {
                const t = r1.top;
                if (s1BackRef.current) s1BackRef.current.style.transform = `translateY(${t * 0.06}px)`;
                if (s1MidRef.current) s1MidRef.current.style.transform = `translateY(${t * 0.14}px)`;
                if (s1FrontRef.current) s1FrontRef.current.style.transform = `translateY(${t * 0.24}px)`;
            }

            // section 2 — two models converging into the ensemble core
            const r2 = sectionRefs.current[1]?.getBoundingClientRect();
            if (r2) {
                const p = Math.max(0, Math.min(1, 1 - r2.top / vh));
                if (s2CyanRef.current) s2CyanRef.current.style.transform = `translateX(${(1 - p) * -90}px)`;
                if (s2AmberRef.current) s2AmberRef.current.style.transform = `translateX(${(1 - p) * 90}px)`;
                if (s2CoreRef.current) {
                    s2CoreRef.current.style.transform = `scale(${0.5 + p * 0.6})`;
                    s2CoreRef.current.style.opacity = String(0.2 + p * 0.8);
                }
            }

            // section 3 — pulsing analyst core
            const r3 = sectionRefs.current[2]?.getBoundingClientRect();
            if (r3 && s3RingRef.current) {
                const p = Math.max(0, Math.min(1, 1 - r3.top / vh));
                s3RingRef.current.style.transform = `scale(${0.8 + p * 0.5})`;
                s3RingRef.current.style.opacity = String(0.15 + p * 0.55);
            }
        }

        function onScroll() {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(update);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        update();

        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    function setSectionRef(i) {
        return (el) => { sectionRefs.current[i] = el; };
    }

    return (
        <div className="landing">

            <section className="landing-section" ref={setSectionRef(0)}>
                <div className="landing-bg">
                    <div className="skyline skyline-back" ref={s1BackRef}>
                        {barsBack.map((h, i) => <span key={i} style={{ height: `${h}px` }} />)}
                    </div>
                    <div className="skyline skyline-mid" ref={s1MidRef}>
                        {barsMid.map((h, i) => <span key={i} style={{ height: `${h}px` }} />)}
                    </div>
                    <div className="skyline skyline-front" ref={s1FrontRef}>
                        {barsFront.map((h, i) => <span key={i} style={{ height: `${h}px` }} />)}
                    </div>
                    <div className="glow glow-cyan" />
                </div>
                <div className="landing-content">
                    <div className="eyebrow"><TrendingUp size={14} /> SBI · NSE — AI MARKET INTELLIGENCE</div>
                    <h1>Every close<br />tells a story.</h1>
                    <p>Years of State Bank of India's price action, distilled into a signal you can actually act on.</p>
                </div>
            </section>

            <section className="landing-section" ref={setSectionRef(1)}>
                <div className="landing-bg landing-bg-converge">
                    <div className="beam beam-cyan" ref={s2CyanRef} />
                    <div className="beam beam-amber" ref={s2AmberRef} />
                    <div className="core" ref={s2CoreRef} />
                </div>
                <div className="landing-content">
                    <div className="eyebrow"><Brain size={14} /> XGBOOST + LSTM</div>
                    <h1>Two minds.<br />One forecast.</h1>
                    <p>A gradient-boosted model and a recurrent network independently study SBI's Close price — the ensemble is where they agree.</p>
                </div>
            </section>

            <section className="landing-section" ref={setSectionRef(2)}>
                <div className="landing-bg">
                    <div className="ring" ref={s3RingRef} />
                    <div className="ring ring-2" />
                </div>
                <div className="landing-content">
                    <div className="eyebrow"><MessageSquareText size={14} /> GENAI ASSISTANT</div>
                    <h1>Ask it anything<br />about SBI.</h1>
                    <p>Query the model directly — current close, per-model predictions, or which way it's leaning.</p>
                    <button className="enter-btn" onClick={onEnter}>
                        Enter the terminal <ChevronDown size={16} />
                    </button>
                </div>
            </section>

        </div>
    );
}

export default Landing;