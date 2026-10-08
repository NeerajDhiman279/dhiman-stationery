const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Pool } = require("pg");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =========================
   DATABASE
========================= */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

/* =========================
   RAZORPAY
========================= */

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* =========================
   DATABASE INITIALIZATION
========================= */

async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                brand TEXT,
                category TEXT,
                price NUMERIC(10, 2) NOT NULL,
                old_price NUMERIC(10, 2),
                discount TEXT,
                rating NUMERIC(3, 2),
                reviews INTEGER DEFAULT 0,
                stock INTEGER DEFAULT 0,
                unit TEXT,
                description TEXT,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                customer_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                total NUMERIC(10, 2) NOT NULL,
                payment TEXT NOT NULL,
                payment_status TEXT,
                status TEXT DEFAULT 'Pending',
                razorpay_payment_id TEXT,
                razorpay_order_id TEXT,
                razorpay_signature TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                quantity INTEGER NOT NULL
            );
        `);

        console.log("Database tables ready");

    } catch (error) {
        console.error("Database initialization error:", error);
        throw error;
    }
}

/* =========================
   BASIC ROUTE
========================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Dhiman Stationery Server Running"
    });
});

/* =========================
   DATABASE TEST
========================= */

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json({
            success: true,
            message: "Database connected successfully",
            time: result.rows[0].current_time
        });

    } catch (error) {
        console.error("Database test error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

/* =========================
   GET PRODUCTS
   OLD + API ROUTE
========================= */

async function getProducts(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                brand,
                category,
                price,
                old_price AS "oldPrice",
                discount,
                rating,
                reviews,
                stock,
                unit,
                description,
                image
            FROM products
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            products: result.rows
        });

    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch products"
        });
    }
}

app.get("/products", getProducts);
app.get("/api/products", getProducts);

/* =========================
   ADD PRODUCT
   OLD + API ROUTE
========================= */

async function addProduct(req, res) {
    try {
        const {
            id,
            name,
            brand,
            category,
            price,
            oldPrice,
            discount,
            rating,
            reviews,
            stock,
            unit,
            description,
            image
        } = req.body;

        if (!id || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product id, name and price are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO products (
                id,
                name,
                brand,
                category,
                price,
                old_price,
                discount,
                rating,
                reviews,
                stock,
                unit,
                description,
                image
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
            )
            RETURNING
                id,
                name,
                brand,
                category,
                price,
                old_price AS "oldPrice",
                discount,
                rating,
                reviews,
                stock,
                unit,
                description,
                image
            `,
            [
                id,
                name,
                brand || "",
                category || "",
                price,
                oldPrice || null,
                discount || "",
                rating || 0,
                reviews || 0,
                stock || 0,
                unit || "pieces",
                description || "",
                image || ""
            ]
        );

        res.status(201).json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Add product error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add product"
        });
    }
}

app.post("/products", addProduct);
app.post("/api/products", addProduct);

/* =========================
   UPDATE PRODUCT
   OLD + API ROUTE
========================= */

async function updateProduct(req, res) {
    try {
        const productId = Number(req.params.id);

        const {
            name,
            brand,
            category,
            price,
            oldPrice,
            discount,
            rating,
            reviews,
            stock,
            unit,
            description,
            image
        } = req.body;

        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const result = await pool.query(
            `
            UPDATE products
            SET
                name = $1,
                brand = $2,
                category = $3,
                price = $4,
                old_price = $5,
                discount = $6,
                rating = $7,
                reviews = $8,
                stock = $9,
                unit = $10,
                description = $11,
                image = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING
                id,
                name,
                brand,
                category,
                price,
                old_price AS "oldPrice",
                discount,
                rating,
                reviews,
                stock,
                unit,
                description,
                image
            `,
            [
                name,
                brand || "",
                category || "",
                price,
                oldPrice || null,
                discount || "",
                rating || 0,
                reviews || 0,
                stock || 0,
                unit || "pieces",
                description || "",
                image || "",
                productId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Update product error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update product"
        });
    }
}

app.put("/products/:id", updateProduct);
app.put("/api/products/:id", updateProduct);

/* =========================
   DELETE PRODUCT
   OLD + API ROUTE
========================= */

async function deleteProduct(req, res) {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 RETURNING id",
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete product"
        });
    }
}

app.delete("/products/:id", deleteProduct);
app.delete("/api/products/:id", deleteProduct);

/* =========================
   CREATE RAZORPAY ORDER
========================= */

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
            amount: Math.round(Number(amount) * 100),
            currency: "INR",
            receipt: "DS_" + Date.now()
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Razorpay Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create Razorpay order"
        });
    }
});

/* =========================
   VERIFY RAZORPAY PAYMENT
========================= */

app.post("/verify-payment", (req, res) => {
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
            message: "Missing payment details"
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
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

    const isValid =
        expectedSignature === razorpay_signature;

    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment signature"
        });
    }

    res.json({
        success: true,
        message: "Payment verified successfully"
    });
});

/* =========================
   CREATE ORDER
   OLD + API ROUTE
========================= */

async function createOrder(req, res) {
    const client = await pool.connect();

    try {
        const {
            id,
            customer,
            items,
            total
        } = req.body;

        if (
            !id ||
            !customer ||
            !customer.name ||
            !customer.phone ||
            !customer.address ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            total === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order data"
            });
        }

        await client.query("BEGIN");

        await client.query(
            `
            INSERT INTO orders (
                id,
                customer_name,
                phone,
                address,
                total,
                payment,
                payment_status,
                status,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )
            `,
            [
                id,
                customer.name,
                customer.phone,
                customer.address,
                total,
                customer.payment || "cod",
                customer.paymentStatus || null,
                "Pending",
                customer.razorpayPaymentId || null,
                customer.razorpayOrderId || null,
                customer.razorpaySignature || null
            ]
        );

        for (const item of items) {
            await client.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    price,
                    quantity
                )
                VALUES ($1,$2,$3,$4,$5)
                `,
                [
                    id,
                    item.id || null,
                    item.name || "Product",
                    item.price || 0,
                    item.quantity || 1
                ]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            orderId: id
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create order error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create order"
        });

    } finally {
        client.release();
    }
}

app.post("/orders", createOrder);
app.post("/api/orders", createOrder);

/* =========================
   GET ALL ORDERS
   OLD + API ROUTE
========================= */

async function getOrders(req, res) {
    try {
        const ordersResult = await pool.query(`
            SELECT
                id,
                customer_name,
                phone,
                address,
                total,
                payment,
                payment_status,
                status,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                created_at
            FROM orders
            ORDER BY created_at DESC
        `);

        const orders = [];

        for (const order of ordersResult.rows) {
            const itemsResult = await pool.query(
                `
                SELECT
                    product_id AS id,
                    product_name AS name,
                    price,
                    quantity
                FROM order_items
                WHERE order_id = $1
                ORDER BY id ASC
                `,
                [order.id]
            );

            orders.push({
                id: order.id,

                customer: {
                    name: order.customer_name,
                    phone: order.phone,
                    address: order.address,
                    payment: order.payment,
                    paymentStatus: order.payment_status,
                    razorpayPaymentId:
                        order.razorpay_payment_id,
                    razorpayOrderId:
                        order.razorpay_order_id,
                    razorpaySignature:
                        order.razorpay_signature
                },

                items: itemsResult.rows,

                total: Number(order.total),

                status: order.status,

                createdAt: order.created_at
            });
        }

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("Get orders error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch orders"
        });
    }
}

app.get("/orders", getOrders);
app.get("/api/orders", getOrders);

/* =========================
   UPDATE ORDER STATUS
   OLD + API ROUTE
========================= */

async function updateOrderStatus(req, res) {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Ready",
            "Delivered"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const result = await pool.query(
            `
            UPDATE orders
            SET status = $1
            WHERE id = $2
            RETURNING id, status
            `,
            [status, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Order status updated",
            order: result.rows[0]
        });

    } catch (error) {
        console.error("Update order status error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update order status"
        });
    }
}

app.patch("/orders/:id/status", updateOrderStatus);
app.patch("/api/orders/:id/status", updateOrderStatus);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(
                `Payment server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Server could not start:",
            error
        );

        process.exit(1);
    }
}

startServer();