import {
    useState,
    useRef,
    useEffect
} from "react";

import {
    Bot,
    Send,
    User
} from "lucide-react";


function AIChat({
    prediction
}) {

    const [message, setMessage] =
        useState("");


    const [messages, setMessages] =
        useState([
            {
                id: 1,
                role: "assistant",
                text:
                    "Hi! I'm your SBI AI Assistant. Ask me about the current model prediction."
            }
        ]);


    const messagesEndRef =
        useRef(null);


    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);


    function generateResponse(
        question
    ) {

        if (!prediction) {

            return (
                "Prediction data is not available yet. "
                + "Please make sure the backend is running."
            );
        }


        const lower =
            question.toLowerCase();


        if (
            lower.includes("current") &&
            lower.includes("price")
        ) {

            return (
                `The latest SBI Close available to the model `
                + `is ₹${Number(
                    prediction.current_close
                ).toFixed(2)}.`
            );
        }


        if (
            lower.includes("xgboost")
        ) {

            return (
                `XGBoost predicts a future Close of `
                + `₹${Number(
                    prediction.xgboost_prediction
                ).toFixed(2)}, `
                + `which is `
                + `${Number(
                    prediction.xgboost_change_percent
                ).toFixed(2)}% `
                + `from the current Close.`
            );
        }


        if (
            lower.includes("lstm")
        ) {

            return (
                `LSTM predicts a future Close of `
                + `₹${Number(
                    prediction.lstm_prediction
                ).toFixed(2)}, `
                + `representing a `
                + `${Number(
                    prediction.lstm_change_percent
                ).toFixed(2)}% `
                + `change from the current Close.`
            );
        }


        if (
            lower.includes("direction") ||
            lower.includes("up") ||
            lower.includes("down")
        ) {

            return (
                `The current ensemble direction is `
                + `${prediction.direction}. `
                + `The ensemble prediction is `
                + `₹${Number(
                    prediction.ensemble_prediction
                ).toFixed(2)}.`
            );
        }


        if (
            lower.includes("prediction") ||
            lower.includes("future") ||
            lower.includes("close")
        ) {

            return (
                `Current SBI Close: `
                + `₹${Number(
                    prediction.current_close
                ).toFixed(2)}. `
                + `XGBoost: ₹${Number(
                    prediction.xgboost_prediction
                ).toFixed(2)}, `
                + `LSTM: ₹${Number(
                    prediction.lstm_prediction
                ).toFixed(2)}, `
                + `Ensemble: ₹${Number(
                    prediction.ensemble_prediction
                ).toFixed(2)}. `
                + `Model direction: `
                + `${prediction.direction}.`
            );
        }


        return (
            "I can currently answer questions about "
            + "SBI's current Close, XGBoost prediction, "
            + "LSTM prediction, ensemble prediction, "
            + "and model direction."
        );
    }


    function sendMessage() {

        const text =
            message.trim();


        if (!text) {
            return;
        }


        const userMessage = {

            id:
                Date.now(),

            role:
                "user",

            text:
                text
        };


        setMessages(
            previous => [
                ...previous,
                userMessage
            ]
        );


        setMessage("");


        setTimeout(() => {

            const aiMessage = {

                id:
                    Date.now() + 1,

                role:
                    "assistant",

                text:
                    generateResponse(
                        text
                    )
            };


            setMessages(
                previous => [
                    ...previous,
                    aiMessage
                ]
            );

        }, 350);
    }


    return (

        <section className="card ai-chat">

            <div className="chat-header">

                <div className="ai-title">

                    <div className="ai-icon">

                        <Bot
                            size={21}
                        />

                    </div>


                    <div>

                        <strong>

                            SBI AI Assistant

                        </strong>


                        <span>

                            GenAI Market Analyst

                        </span>

                    </div>

                </div>

            </div>


            <div className="messages">

                {messages.map(
                    item => (

                        <div
                            key={item.id}
                            className={
                                item.role ===
                                "user"
                                    ? "message user-message"
                                    : "message ai-message"
                            }
                        >

                            <div className="message-icon">

                                {item.role ===
                                "user"
                                    ? (
                                        <User
                                            size={14}
                                        />
                                    )
                                    : (
                                        <Bot
                                            size={14}
                                        />
                                    )
                                }

                            </div>


                            <div>

                                {item.text}

                            </div>

                        </div>

                    )
                )}


                <div
                    ref={
                        messagesEndRef
                    }
                />

            </div>


            <div className="chat-input">

                <input
                    value={message}
                    onChange={
                        event =>
                            setMessage(
                                event.target.value
                            )
                    }
                    onKeyDown={
                        event => {

                            if (
                                event.key ===
                                "Enter"
                            ) {

                                sendMessage();

                            }

                        }
                    }
                    placeholder={
                        "Ask about SBI prediction..."
                    }
                />


                <button
                    onClick={
                        sendMessage
                    }
                >

                    <Send
                        size={18}
                    />

                </button>

            </div>

        </section>
    );
}


export default AIChat;