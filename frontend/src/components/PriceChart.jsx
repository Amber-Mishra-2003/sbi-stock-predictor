import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from "recharts";


function PriceChart({
    history,
    prediction
}) {

    if (
        !history ||
        history.length === 0
    ) {

        return (
            <div className="chart-loading">

                Loading price chart...

            </div>
        );

    }


    const chartData = history.map(
        item => ({
            date: item.date,
            close: item.close
        })
    );


    return (

        <section className="chart-section">

            <div className="section-header">

                <div>

                    <div className="section-label">

                        PRICE ANALYTICS

                    </div>


                    <h2>

                        SBI Close Price

                    </h2>

                </div>


                <div className="chart-badge">

                    Last {history.length} sessions

                </div>

            </div>


            <div className="chart-container">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 15,
                            right: 10,
                            left: 0,
                            bottom: 5
                        }}
                    >

                        <defs>

                            <linearGradient
                                id="priceGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >

                                <stop
                                    offset="0%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0.35}
                                />

                                <stop
                                    offset="100%"
                                    stopColor="var(--accent)"
                                    stopOpacity={0}
                                />

                            </linearGradient>

                        </defs>


                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--grid)"
                            vertical={false}
                        />


                        <XAxis
                            dataKey="date"
                            tick={{
                                fill: "var(--muted)",
                                fontSize: 11
                            }}
                            tickFormatter={
                                value => {

                                    if (
                                        value ===
                                        "Prediction"
                                    ) {

                                        return "AI";

                                    }


                                    return String(
                                        value
                                    ).slice(
                                        5,
                                        10
                                    );

                                }
                            }
                            axisLine={false}
                            tickLine={false}
                        />


                        <YAxis
                            domain={[
                                "dataMin - 20",
                                "dataMax + 20"
                            ]}
                            tick={{
                                fill: "var(--muted)",
                                fontSize: 11
                            }}
                            axisLine={false}
                            tickLine={false}
                            width={65}
                        />


                        <Tooltip
                            contentStyle={{
                                background:
                                    "var(--tooltip)",

                                border:
                                    "1px solid var(--border)",

                                borderRadius:
                                    "12px",

                                color:
                                    "var(--text)"
                            }}

                            labelStyle={{
                                color:
                                    "var(--muted)"
                            }}

                            formatter={
                                value => [

                                    `₹${Number(
                                        value
                                    ).toFixed(2)}`,

                                    "Close"

                                ]
                            }
                        />


                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke="var(--accent)"
                            strokeWidth={2.5}
                            fill="url(#priceGradient)"
                            dot={false}
                            activeDot={{
                                r: 5
                            }}
                        />


                        {prediction && (

                            <ReferenceLine
                                y={
                                    prediction
                                        .ensemble_prediction
                                }
                                stroke="var(--prediction)"
                                strokeDasharray="6 6"
                                label={{
                                    value:
                                        `AI ₹${Number(
                                            prediction
                                                .ensemble_prediction
                                        ).toFixed(2)}`,

                                    fill:
                                        "var(--prediction)",

                                    position:
                                        "insideTopRight"
                                }}
                            />

                        )}

                    </AreaChart>

                </ResponsiveContainer>

            </div>


            <div className="chart-legend">

                <div>

                    <span
                        className="legend-line"
                    />

                    Historical Close

                </div>


                <div>

                    <span
                        className="legend-prediction"
                    />

                    AI Ensemble Prediction

                </div>

            </div>

        </section>

    );
}


export default PriceChart;