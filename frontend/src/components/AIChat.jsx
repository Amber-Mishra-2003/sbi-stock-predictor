import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Sparkles } from "lucide-react";

function TypingDots() {
    return (
        <div className="typing-dots">
            <span /><span /><span />
        </div>
    );
}

function MessageBubble({ item, isUser }) {
    return (
        <motion.div
            className={isUser ? "message user-message" : "message ai-message"}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            layout
        >
            <div className={`message-icon ${isUser ? "user-icon" : "ai-icon"}`}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className="message-bubble">{item.text}</div>
        </motion.div>
    );
}

function AIChat({ prediction }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            text:
                "Hi! I'm your SBI AI Assistant. Ask me about the current model prediction."
        }
    ]);
    const [typing, setTyping] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    function generateResponse(question) {
        if (!prediction) {
            return "Prediction data is not available yet. Please make sure the backend is running.";
        }
        const lower = question.toLowerCase();

        if (lower.includes("current") && lower.includes("price")) {
            return `The latest SBI Close available to the model is ₹${Number(prediction.current_close).toFixed(2)}.`;
        }
        if (lower.includes("xgboost")) {
            return `XGBoost predicts a future Close of ₹${Number(prediction.xgboost_prediction).toFixed(2)}, which is ${Number(prediction.xgboost_change_percent).toFixed(2)}% from the current Close.`;
        }
        if (lower.includes("lstm")) {
            return `LSTM predicts a future Close of ₹${Number(prediction.lstm_prediction).toFixed(2)}, representing a ${Number(prediction.lstm_change_percent).toFixed(2)}% change from the current Close.`;
        }
        if (lower.includes("direction") || lower.includes("up") || lower.includes("down")) {
            return `The current ensemble direction is ${prediction.direction}. The ensemble prediction is ₹${Number(prediction.ensemble_prediction).toFixed(2)}.`;
        }
        if (lower.includes("prediction") || lower.includes("future") || lower.includes("close")) {
            return (
                `Current SBI Close: ₹${Number(prediction.current_close).toFixed(2)}. ` +
                `XGBoost: ₹${Number(prediction.xgboost_prediction).toFixed(2)}, ` +
                `LSTM: ₹${Number(prediction.lstm_prediction).toFixed(2)}, ` +
                `Ensemble: ₹${Number(prediction.ensemble_prediction).toFixed(2)}. ` +
                `Model direction: ${prediction.direction}.`
            );
        }
        return "I can currently answer questions about SBI's current Close, XGBoost prediction, LSTM prediction, ensemble prediction, and model direction.";
    }

    function sendMessage() {
        const text = message.trim();
        if (!text) return;

        const userMessage = { id: Date.now(), role: "user", text };
        setMessages((p) => [...p, userMessage]);
        setMessage("");
        setTyping(true);

        setTimeout(() => {
            const aiMessage = {
                id: Date.now() + 1,
                role: "assistant",
                text: generateResponse(text)
            };
            setMessages((p) => [...p, aiMessage]);
            setTyping(false);
        }, 650);
    }

    return (
        <motion.section
            className="card ai-chat"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="chat-header">
                <div className="ai-title">
                    <motion.div
                        className="ai-icon"
                        animate={{ rotate: [0, 8, -8, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Bot size={21} />
                    </motion.div>
                    <div>
                        <strong>SBI AI Assistant</strong>
                        <span>
                            <Sparkles size={10} /> GenAI Market Analyst
                        </span>
                    </div>
                </div>

                <div className="chat-status">
                    <span className="online-dot" />
                    Online
                </div>
            </div>

            <div className="messages">
                <AnimatePresence initial={false}>
                    {messages.map((item) => (
                        <MessageBubble
                            key={item.id}
                            item={item}
                            isUser={item.role === "user"}
                        />
                    ))}
                    {typing && (
                        <motion.div
                            key="typing"
                            className="message ai-message"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="message-icon ai-icon">
                                <Bot size={14} />
                            </div>
                            <div className="message-bubble typing">
                                <TypingDots />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                    }}
                    placeholder="Ask about SBI prediction..."
                />
                <motion.button
                    onClick={sendMessage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Send size={18} />
                </motion.button>
            </div>
        </motion.section>
    );
}

export default AIChat;
