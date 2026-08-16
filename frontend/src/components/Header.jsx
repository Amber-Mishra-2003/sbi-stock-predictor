import {
    Activity,
    BrainCircuit
} from "lucide-react";


function Header({
    training
}) {

    return (

        <header className="header">

            <div className="brand">

                <div className="logo">

                    <BrainCircuit
                        size={24}
                    />

                </div>


                <div>

                    <div className="brand-name">

                        SBI AI

                    </div>


                    <div className="brand-subtitle">

                        MARKET
                        INTELLIGENCE

                    </div>

                </div>

            </div>


            <div
                className={
                    training
                        ? "live-indicator training"
                        : "live-indicator"
                }
            >

                <Activity
                    size={16}
                />


                {training
                    ? "MODEL TRAINING"
                    : "AI ENGINE ONLINE"
                }

            </div>

        </header>

    );
}


export default Header;