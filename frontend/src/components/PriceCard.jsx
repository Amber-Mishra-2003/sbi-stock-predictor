import {
    TrendingUp,
    TrendingDown,
    Minus
} from "lucide-react";


function PriceCard({
    prediction
}) {

    const change =
        Number(
            prediction
                .ensemble_change_percent
        );


    const isUp =
        change > 0;

    const isDown =
        change < 0;


    return (

        <div className="card price-card">

            <div className="card-label">

                CURRENT SBI CLOSE

            </div>


            <div className="current-price">

                ₹
                {Number(
                    prediction.current_close
                ).toFixed(2)}

            </div>


            <div
                className={
                    isUp
                        ? "change positive"
                        : isDown
                            ? "change negative"
                            : "change neutral"
                }
            >

                {isUp && (
                    <TrendingUp
                        size={18}
                    />
                )}


                {isDown && (
                    <TrendingDown
                        size={18}
                    />
                )}


                {!isUp && !isDown && (
                    <Minus
                        size={18}
                    />
                )}


                {change >= 0
                    ? "+"
                    : ""
                }

                {change.toFixed(2)}%

            </div>


            <div className="data-date">

                Latest data:

                <strong>

                    {" "}
                    {prediction.last_data_date ||
                        "N/A"}

                </strong>

            </div>

        </div>
    );
}


export default PriceCard;