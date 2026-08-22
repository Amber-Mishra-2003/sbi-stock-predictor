import { motion } from "framer-motion";

/**
 * Tiny bag of reusable motion presets.
 * Keeps animation feel consistent across the dashboard without
 * scattering magic numbers everywhere.
 */

export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 }
};

export const staggerParent = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05
        }
    }
};

export const slideRight = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

export const popIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 360, damping: 22 }
    }
};

export function AnimatedSection({
    children,
    variants,
    delay = 0,
    className = "",
    as = "div"
}) {
    const MotionTag = motion[as] || motion.div;
    return (
        <MotionTag
            className={className}
            variants={variants || fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </MotionTag>
    );
}

export function AnimatedItem({ children, variants, className = "", ...rest }) {
    return (
        <motion.div
            className={className}
            variants={variants || fadeUp}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}
