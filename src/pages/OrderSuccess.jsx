
function OrderSuccess({ orderId, goHome }) {
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#f7f7f7",
                padding: "12px",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    minHeight: "calc(100vh - 24px)",
                    background: "#fff",
                    borderRadius: "18px",
                    padding: "28px 18px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                }}
            >
                {/* SUCCESS ICON */}
                <div
                    style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        background: "#111",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "35px",
                        fontWeight: "700",
                        marginTop: "20px"
                    }}
                >
                    ✓
                </div>

                {/* TITLE */}
                <h1
                    style={{
                        margin: "20px 0 5px",
                        fontSize: "28px",
                        lineHeight: "1.1"
                    }}
                >
                    Order Placed!
                </h1>

                <p
                    style={{
                        margin: 0,
                        color: "#777",
                        fontSize: "12px",
                        lineHeight: "1.5"
                    }}
                >
                    Your order has been successfully
                    received by Dhiman Stationery.
                </p>

                {/* ORDER ID */}
                <div
                    style={{
                        width: "100%",
                        marginTop: "22px",
                        padding: "14px",
                        background: "#f7f7f7",
                        borderRadius: "13px",
                        boxSizing: "border-box"
                    }}
                >
                    <span
                        style={{
                            display: "block",
                            color: "#888",
                            fontSize: "9px",
                            marginBottom: "5px"
                        }}
                    >
                        ORDER ID
                    </span>

                    <strong
                        style={{
                            fontSize: "15px",
                            letterSpacing: "0.5px"
                        }}
                    >
                        {orderId}
                    </strong>
                </div>

                {/* WHATSAPP INFO */}
                <div
                    style={{
                        width: "100%",
                        marginTop: "12px",
                        padding: "14px",
                        border: "1px solid #eee",
                        borderRadius: "13px",
                        boxSizing: "border-box",
                        textAlign: "left"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                        }}
                    >
                        <span
                            style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "10px",
                                background: "#f1f1f1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px"
                            }}
                        >
                            💬
                        </span>

                        <div>
                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "11px"
                                }}
                            >
                                Order sent to shop
                            </strong>

                            <span
                                style={{
                                    color: "#777",
                                    fontSize: "9px"
                                }}
                            >
                                Order details have been sent
                                on WhatsApp.
                            </span>
                        </div>
                    </div>
                </div>

                {/* CONTACT INFO */}
                <div
                    style={{
                        width: "100%",
                        marginTop: "10px",
                        padding: "14px",
                        background: "#f7f7f7",
                        borderRadius: "13px",
                        boxSizing: "border-box",
                        textAlign: "left"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "19px"
                            }}
                        >
                            📞
                        </span>

                        <div>
                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "11px"
                                }}
                            >
                                Shop may contact you
                            </strong>

                            <span
                                style={{
                                    color: "#777",
                                    fontSize: "9px"
                                }}
                            >
                                The shop may contact you to
                                confirm your order.
                            </span>
                        </div>
                    </div>
                </div>

                {/* PREPARATION */}
                <div
                    style={{
                        width: "100%",
                        marginTop: "10px",
                        padding: "14px",
                        border: "1px solid #eee",
                        borderRadius: "13px",
                        boxSizing: "border-box",
                        textAlign: "left"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "19px"
                            }}
                        >
                            📦
                        </span>

                        <div>
                            <strong
                                style={{
                                    display: "block",
                                    fontSize: "11px"
                                }}
                            >
                                Order preparation
                            </strong>

                            <span
                                style={{
                                    color: "#777",
                                    fontSize: "9px"
                                }}
                            >
                                Your order will be prepared
                                after confirmation.
                            </span>
                        </div>
                    </div>
                </div>

                {/* BUTTONS */}
                <div
                    style={{
                        width: "100%",
                        marginTop: "auto",
                        paddingTop: "25px"
                    }}
                >
                    <button
                        type="button"
                        onClick={goHome}
                        style={{
                            width: "100%",
                            height: "48px",
                            border: "0",
                            borderRadius: "13px",
                            background: "#111",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                        }}
                    >
                        Continue Shopping →
                    </button>
                </div>
            </div>
        </main>
    );
}

export default OrderSuccess;

