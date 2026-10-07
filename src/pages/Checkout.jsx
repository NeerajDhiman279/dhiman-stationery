import { useState } from "react";

function Checkout({
    cart,
    goBack,
    orderPlaced
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [payment, setPayment] = useState("cod");
    const [isPaying, setIsPaying] = useState(false);

    const subtotal = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.price) *
            Number(item.quantity || 1),
        0
    );

    const delivery =
        subtotal >= 500 ? 0 : 30;

    const total =
        subtotal + delivery;

    const totalItems = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.quantity || 1),
        0
    );


    // =========================
    // LOAD RAZORPAY SCRIPT
    // =========================

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            const existingScript =
                document.getElementById(
                    "razorpay-script"
                );

            if (existingScript) {
                resolve(true);
                return;
            }

            const script =
                document.createElement("script");

            script.id =
                "razorpay-script";

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () =>
                resolve(true);

            script.onerror = () =>
                resolve(false);

            document.body.appendChild(
                script
            );
        });
    }


    // =========================
    // VALIDATE CUSTOMER
    // =========================

    function validateCustomer() {
        if (!name.trim()) {
            alert("Please enter your name.");
            return false;
        }

        if (
            !/^[6-9]\d{9}$/.test(
                phone.trim()
            )
        ) {
            alert(
                "Please enter a valid 10-digit mobile number."
            );
            return false;
        }

        if (!address.trim()) {
            alert(
                "Please enter your delivery address."
            );
            return false;
        }

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return false;
        }

        return true;
    }


    // =========================
    // RAZORPAY PAYMENT
    // =========================

    async function startRazorpayPayment() {
        if (!validateCustomer()) {
            return;
        }

        setIsPaying(true);

        try {

            // Load Razorpay
            const scriptLoaded =
                await loadRazorpayScript();

            if (!scriptLoaded) {
                alert(
                    "Razorpay failed to load. Please check your internet connection."
                );

                setIsPaying(false);
                return;
            }


            // Create Razorpay Order
            const response =
                await fetch(
                    "http://localhost:5000/create-order",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            amount: total
                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to create payment order"
                );
            }


            // =========================
            // RAZORPAY OPTIONS
            // =========================

            const options = {
                key:
                    "rzp_test_Tl4mN5ghvMG3ui",

                amount:
                    data.order.amount,

                currency:
                    data.order.currency,

                name:
                    "Dhiman Stationery",

                description:
                    "Stationery Order",

                order_id:
                    data.order.id,

                prefill: {
                    name: name,
                    contact: phone
                },

                notes: {
                    address: address
                },

                theme: {
                    color: "#111111"
                },


                // =========================
                // PAYMENT SUCCESS
                // =========================

                handler:
                    async function (
                        paymentResponse
                    ) {

                        try {

                            // Send payment details
                            // to backend for verification

                            const verifyResponse =
                                await fetch(
                                    "http://localhost:5000/verify-payment",
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify(
                                                {
                                                    razorpay_order_id:
                                                        paymentResponse
                                                            .razorpay_order_id,

                                                    razorpay_payment_id:
                                                        paymentResponse
                                                            .razorpay_payment_id,

                                                    razorpay_signature:
                                                        paymentResponse
                                                            .razorpay_signature
                                                }
                                            )
                                    }
                                );


                            const verifyData =
                                await verifyResponse.json();


                            // Payment verification failed

                            if (
                                !verifyResponse.ok ||
                                !verifyData.success
                            ) {
                                alert(
                                    "Payment verification failed. Order was not placed."
                                );

                                setIsPaying(
                                    false
                                );

                                return;
                            }


                            // =========================
                            // VERIFIED PAYMENT
                            // =========================

                            const newOrderId =
                                "DS" +
                                Date.now()
                                    .toString()
                                    .slice(-8);


                            orderPlaced(
                                newOrderId,
                                {
                                    name:
                                        name.trim(),

                                    phone:
                                        phone.trim(),

                                    address:
                                        address.trim(),

                                    payment:
                                        "razorpay",

                                    paymentStatus:
                                        "Paid",

                                    razorpayPaymentId:
                                        paymentResponse
                                            .razorpay_payment_id,

                                    razorpayOrderId:
                                        paymentResponse
                                            .razorpay_order_id,

                                    razorpaySignature:
                                        paymentResponse
                                            .razorpay_signature
                                }
                            );

                        } catch (error) {

                            console.error(
                                "Payment verification error:",
                                error
                            );

                            alert(
                                "Payment verification failed. Please contact the shop."
                            );

                        } finally {

                            setIsPaying(false);

                        }
                    },


                // =========================
                // PAYMENT WINDOW CLOSED
                // =========================

                modal: {
                    ondismiss:
                        function () {
                            setIsPaying(false);
                        }
                }
            };


            const razorpay =
                new window.Razorpay(
                    options
                );


            // =========================
            // PAYMENT FAILED
            // =========================

            razorpay.on(
                "payment.failed",
                function (response) {

                    console.error(
                        "Payment Failed:",
                        response
                    );

                    alert(
                        "Payment failed. Please try again."
                    );

                    setIsPaying(false);
                }
            );


            razorpay.open();

        } catch (error) {

            console.error(
                "Razorpay Error:",
                error
            );

            alert(
                error.message ||
                "Unable to start payment."
            );

            setIsPaying(false);
        }
    }


    // =========================
    // PLACE ORDER
    // =========================

    function submitOrder(event) {
        event.preventDefault();

        if (!validateCustomer()) {
            return;
        }


        // Online payment
        if (payment === "razorpay") {
            startRazorpayPayment();
            return;
        }


        // COD / WhatsApp
        const newOrderId =
            "DS" +
            Date.now()
                .toString()
                .slice(-8);


        orderPlaced(
            newOrderId,
            {
                name:
                    name.trim(),

                phone:
                    phone.trim(),

                address:
                    address.trim(),

                payment:
                    payment
            }
        );
    }


    return (
        <main className="checkout-page">

            <div className="checkout-header">

                <button
                    type="button"
                    className="profile-back-btn"
                    onClick={goBack}
                >
                    ←
                </button>

                <h1>
                    Checkout
                </h1>

            </div>


            <form
                className="checkout-form"
                onSubmit={submitOrder}
            >

                {/* CUSTOMER DETAILS */}

                <section className="checkout-section">

                    <h2>
                        Delivery Details
                    </h2>


                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                        placeholder="Enter your name"
                    />


                    <label>
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                            setPhone(
                                e.target.value
                                    .replace(
                                        /\D/g,
                                        ""
                                    )
                                    .slice(
                                        0,
                                        10
                                    )
                            )
                        }
                        placeholder="10-digit mobile number"
                    />


                    <label>
                        Delivery Address
                    </label>

                    <textarea
                        value={address}
                        onChange={(e) =>
                            setAddress(
                                e.target.value
                            )
                        }
                        placeholder="Enter complete delivery address"
                        rows="4"
                    />

                </section>


                {/* PAYMENT */}

                <section className="checkout-section">

                    <h2>
                        Payment Method
                    </h2>


                    <label className="payment-option">

                        <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={
                                payment ===
                                "cod"
                            }
                            onChange={(e) =>
                                setPayment(
                                    e.target.value
                                )
                            }
                        />

                        <span>
                            Cash on Delivery
                        </span>

                    </label>


                    <label className="payment-option">

                        <input
                            type="radio"
                            name="payment"
                            value="razorpay"
                            checked={
                                payment ===
                                "razorpay"
                            }
                            onChange={(e) =>
                                setPayment(
                                    e.target.value
                                )
                            }
                        />

                        <span>
                            Online Payment
                        </span>

                    </label>


                    <label className="payment-option">

                        <input
                            type="radio"
                            name="payment"
                            value="whatsapp"
                            checked={
                                payment ===
                                "whatsapp"
                            }
                            onChange={(e) =>
                                setPayment(
                                    e.target.value
                                )
                            }
                        />

                        <span>
                            WhatsApp Order
                        </span>

                    </label>

                </section>


                {/* ORDER SUMMARY */}

                <section className="checkout-section">

                    <h2>
                        Order Summary
                    </h2>


                    <div className="checkout-row">

                        <span>
                            Items
                        </span>

                        <span>
                            {totalItems}
                        </span>

                    </div>


                    <div className="checkout-row">

                        <span>
                            Subtotal
                        </span>

                        <span>
                            ₹{subtotal}
                        </span>

                    </div>


                    <div className="checkout-row">

                        <span>
                            Delivery
                        </span>

                        <span>
                            {delivery === 0
                                ? "FREE"
                                : `₹${delivery}`}
                        </span>

                    </div>


                    <div className="checkout-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹{total}
                        </strong>

                    </div>

                </section>


                {/* PLACE ORDER BUTTON */}

                <button
                    type="submit"
                    className="checkout-submit-btn"
                    disabled={isPaying}
                >

                    {isPaying
                        ? "Processing..."
                        : payment ===
                            "razorpay"
                            ? `Pay ₹${total}`
                            : "Place Order"}

                </button>

            </form>

        </main>
    );
}

export default Checkout;