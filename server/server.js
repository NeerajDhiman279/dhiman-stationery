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
   ADMIN AUTHENTICATION
========================= */

function createAdminToken() {
    const payload = {
        role: "admin",
        expiresAt: Date.now() + (12 * 60 * 60 * 1000)
    };

    const payloadString = Buffer
        .from(JSON.stringify(payload))
        .toString("base64url");

    const signature = crypto
        .createHmac(
            "sha256",
            process.env.ADMIN_SECRET
        )
        .update(payloadString)
        .digest("base64url");

    return `${payloadString}.${signature}`;
}

function verifyAdminToken(token) {
    try {
        if (!token || !process.env.ADMIN_SECRET) {
            return false;
        }

        const parts = token.split(".");

        if (parts.length !== 2) {
            return false;
        }

        const [payloadString, receivedSignature] = parts;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.ADMIN_SECRET
            )
            .update(payloadString)
            .digest("base64url");

        const receivedBuffer =
            Buffer.from(receivedSignature);

        const expectedBuffer =
            Buffer.from(expectedSignature);

        if (
            receivedBuffer.length !==
            expectedBuffer.length
        ) {
            return false;
        }

        if (
            !crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            )
        ) {
            return false;
        }

        const payload = JSON.parse(
            Buffer
                .from(payloadString, "base64url")
                .toString("utf8")
        );

        if (payload.role !== "admin") {
            return false;
        }

        if (
            !payload.expiresAt ||
            Date.now() > payload.expiresAt
        ) {
            return false;
        }

        return true;

    } catch (error) {
        return false;
    }
}

/* =========================
   ADMIN LOGIN
========================= */

app.post("/admin/login", (req, res) => {
    try {
        const { password } = req.body;

        if (!process.env.ADMIN_PASSWORD) {
            return res.status(500).json({
                success: false,
                message: "Admin password is not configured on server"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        const passwordBuffer =
            Buffer.from(String(password));

        const adminPasswordBuffer =
            Buffer.from(process.env.ADMIN_PASSWORD);

        if (
            passwordBuffer.length !==
            adminPasswordBuffer.length
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin password"
            });
        }

        const passwordMatch =
            crypto.timingSafeEqual(
                passwordBuffer,
                adminPasswordBuffer
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin password"
            });
        }

        const token = createAdminToken();

        res.json({
            success: true,
            message: "Admin login successful",
            token
        });

    } catch (error) {
        console.error(
            "Admin login error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to login"
        });
    }
});

/* =========================
   ADMIN AUTH MIDDLEWARE
========================= */

function requireAdmin(req, res, next) {
    const authHeader =
        req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required"
        });
    }

    const token =
        authHeader.substring(7);

    if (!verifyAdminToken(token)) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });
    }

    next();
}

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
                customer_token TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS customer_token TEXT;
        `);

        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS
            orders_customer_token_unique
            ON orders(customer_token)
            WHERE customer_token IS NOT NULL;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id TEXT NOT NULL
                    REFERENCES orders(id)
                    ON DELETE CASCADE,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                quantity INTEGER NOT NULL
            );
        `);

        console.log("Database tables ready");

    } catch (error) {
        console.error(
            "Database initialization error:",
            error
        );

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
        console.error(
            "Database test error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

/* =========================
   GET PRODUCTS
   PUBLIC
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
        console.error(
            "Get products error:",
            error
        );

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
   ADMIN ONLY
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
                message:
                    "Product id, name and price are required"
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
                $1,$2,$3,$4,$5,$6,$7,
                $8,$9,$10,$11,$12,$13
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
        console.error(
            "Add product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to add product"
        });
    }
}

app.post(
    "/products",
    requireAdmin,
    addProduct
);

app.post(
    "/api/products",
    requireAdmin,
    addProduct
);

/* =========================
   UPDATE PRODUCT
   ADMIN ONLY
========================= */

async function updateProduct(req, res) {
    try {
        const productId =
            Number(req.params.id);

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
        console.error(
            "Update product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to update product"
        });
    }
}

app.put(
    "/products/:id",
    requireAdmin,
    updateProduct
);

app.put(
    "/api/products/:id",
    requireAdmin,
    updateProduct
);

/* =========================
   DELETE PRODUCT
   ADMIN ONLY
========================= */

async function deleteProduct(req, res) {
    try {
        const productId =
            Number(req.params.id);

        if (!Number.isInteger(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING id
            `,
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
            message:
                "Product deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to delete product"
        });
    }
}

app.delete(
    "/products/:id",
    requireAdmin,
    deleteProduct
);

app.delete(
    "/api/products/:id",
    requireAdmin,
    deleteProduct
);

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
            amount:
                Math.round(
                    Number(amount) * 100
                ),
            currency: "INR",
            receipt:
                "DS_" + Date.now()
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
            "Razorpay Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to create Razorpay order"
        });
    }
});

/* =========================
   VERIFY RAZORPAY PAYMENT
========================= */

app.post(
    "/verify-payment",
    (req, res) => {
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
                    "Missing payment details"
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
            expectedSignature ===
            razorpay_signature;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment signature"
            });
        }

        res.json({
            success: true,
            message:
                "Payment verified successfully"
        });
    }
);

/* =========================
   CREATE ORDER
   PUBLIC CUSTOMER API
========================= */

async function createOrder(req, res) {
    const client =
        await pool.connect();

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
                message:
                    "Invalid order data"
            });
        }

        const customerToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        await client.query("BEGIN");

        /* =========================
           CHECK + REDUCE STOCK
        ========================= */

        for (const item of items) {
            const productId =
                Number(item.id);

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                throw new Error(
                    `Invalid product or quantity for ${item.name || "product"
                    }`
                );
            }

            const productResult =
                await client.query(
                    `
                    SELECT
                        id,
                        name,
                        price,
                        stock
                    FROM products
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [productId]
                );

            if (
                productResult.rows.length === 0
            ) {
                throw new Error(
                    `Product not found: ${item.name || productId
                    }`
                );
            }

            const product =
                productResult.rows[0];

            if (
                product.stock < quantity
            ) {
                throw new Error(
                    `Not enough stock for ${product.name
                    }. Available stock: ${product.stock
                    }`
                );
            }

            await client.query(
                `
                UPDATE products
                SET
                    stock = stock - $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    quantity,
                    productId
                ]
            );
        }

        /* =========================
           CREATE ORDER
        ========================= */

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
                razorpay_signature,
                customer_token
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,
                $8,$9,$10,$11,$12
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
                customer.razorpayPaymentId ||
                null,
                customer.razorpayOrderId ||
                null,
                customer.razorpaySignature ||
                null,
                customerToken
            ]
        );

        /* =========================
           SAVE ORDER ITEMS
        ========================= */

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
            message:
                "Order created successfully",
            orderId: id,
            customerToken
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Create order error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create order"
        });

    } finally {
        client.release();
    }
}

app.post(
    "/orders",
    createOrder
);

app.post(
    "/api/orders",
    createOrder
);

/* =========================
   FORMAT ORDER
========================= */

async function formatOrder(order) {
    const itemsResult =
        await pool.query(
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

    return {
        id: order.id,

        customer: {
            name: order.customer_name,
            phone: order.phone,
            address: order.address,
            payment: order.payment,
            paymentStatus:
                order.payment_status,
            razorpayPaymentId:
                order.razorpay_payment_id,
            razorpayOrderId:
                order.razorpay_order_id,
            razorpaySignature:
                order.razorpay_signature
        },

        items: itemsResult.rows,

        total:
            Number(order.total),

        status:
            order.status,

        createdAt:
            order.created_at
    };
}

/* =========================
   GET ALL ORDERS
   ADMIN ONLY
========================= */

async function getOrders(req, res) {
    try {
        const ordersResult =
            await pool.query(`
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

        for (
            const order
            of ordersResult.rows
        ) {
            const formattedOrder =
                await formatOrder(order);

            orders.push(
                formattedOrder
            );
        }

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(
            "Get orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to fetch orders"
        });
    }
}

app.get(
    "/orders",
    requireAdmin,
    getOrders
);

app.get(
    "/api/orders",
    requireAdmin,
    getOrders
);

/* =========================
   GET CUSTOMER ORDERS
   TOKEN BASED
   PUBLIC WITH CUSTOMER TOKEN
========================= */

async function getCustomerOrders(
    req,
    res
) {
    try {
        const customerToken =
            req.headers[
            "x-customer-token"
            ] ||
            req.query.token;

        if (!customerToken) {
            return res.status(401).json({
                success: false,
                message:
                    "Customer token is required"
            });
        }

        const ordersResult =
            await pool.query(
                `
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
                WHERE customer_token = $1
                ORDER BY created_at DESC
                `,
                [customerToken]
            );

        const orders = [];

        for (
            const order
            of ordersResult.rows
        ) {
            const formattedOrder =
                await formatOrder(order);

            orders.push(
                formattedOrder
            );
        }

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(
            "Get customer orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to fetch customer orders"
        });
    }
}

app.get(
    "/customer/orders",
    getCustomerOrders
);

app.get(
    "/api/customer/orders",
    getCustomerOrders
);

/* =========================
   UPDATE ORDER STATUS
   ADMIN ONLY
========================= */

async function updateOrderStatus(
    req,
    res
) {
    try {
        const orderId =
            req.params.id;

        const { status } =
            req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Ready",
            "Delivered"
        ];

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status"
            });
        }

        const result =
            await pool.query(
                `
                UPDATE orders
                SET status = $1
                WHERE id = $2
                RETURNING id, status
                `,
                [
                    status,
                    orderId
                ]
            );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        res.json({
            success: true,
            message:
                "Order status updated",
            order:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "Update order status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to update order status"
        });
    }
}

app.patch(
    "/orders/:id/status",
    requireAdmin,
    updateOrderStatus
);

app.patch(
    "/api/orders/:id/status",
    requireAdmin,
    updateOrderStatus
);

/* =========================
   START SERVER
========================= */

const PORT =
    process.env.PORT || 5000;

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(
            PORT,
            () => {
                console.log(
                    `Payment server running on port ${PORT}`
                );
            }
        );

    } catch (error) {
        console.error(
            "Server could not start:",
            error
        );

        process.exit(1);
    }
}

startServer();