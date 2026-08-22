import { motion } from "framer-motion";
import { Activity, BrainCircuit, Sparkles } from "lucide-react";

function Header({ training }) {
    return (
        <motion.header
            className="header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="brand">
                <motion.div
                    className="logo"
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <BrainCircuit size={24} />
                </motion.div>

                <div>
                    <div className="brand-name">
                        SBI AI
                        <Sparkles size={13} className="brand-spark" />
                    </div>
                    <div className="brand-subtitle">
                        MARKET INTELLIGENCE
                    </div>
                </div>
            </div>

            <motion.div
                className={
                    training ? "live-indicator training" : "live-indicator"
                }
                animate={training ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={
                    training
                        ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                }
            >
                <Activity size={16} />
                {training ? "MODEL TRAINING" : "AI ENGINE ONLINE"}
            </motion.div>
        </motion.header>
    );
}

export default Header;
