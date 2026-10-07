const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =========================
// TEST SERVER
// =========================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message:
            "Dhiman Stationery Payment Server Running"
    });
});


// =========================
// CREATE RAZORPAY ORDER
// =========================

app.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const options = {
            amount:
                Math.round(
                    Number(amount) * 100
                ),

            currency: "INR",

            receipt:
                "DS_" +
                Date.now()
        };

        const order =
            await razorpay.orders.create(
                options
            );

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error(
            "Create Order Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to create Razorpay order"
        });
    }
});


// =========================
// VERIFY PAYMENT
// =========================

app.post(
    "/verify-payment",
    (req, res) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment details are missing"
                });
            }

            const body =
                razorpay_order_id +
                "|" +
                razorpay_payment_id;

            const expectedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(body)
                    .digest("hex");

            const isValid =
                expectedSignature ===
                razorpay_signature;

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment verification failed"
                });
            }

            res.json({
                success: true,
                message:
                    "Payment verified successfully"
            });

        } catch (error) {
            console.error(
                "Verification Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to verify payment"
            });
        }
    }
);


// =========================
// START SERVER
// =========================

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Payment server running on port ${PORT}`
    );
});