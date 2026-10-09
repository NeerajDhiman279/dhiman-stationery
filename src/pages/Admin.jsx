import { useEffect, useMemo, useState } from "react";

const API_URL =
    "https://dhiman-stationery-server.onrender.com";

function Admin({
    products,
    setProducts,
    orders,
    setOrders,
    goHome,
    logoutAdmin
}) {
    const [activeTab, setActiveTab] = useState("products");
    const [search, setSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("All");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        brand: "",
        category: "Pens",
        price: "",
        oldPrice: "",
        stock: "",
        unit: "pieces",
        discount: "",
        rating: "4.5",
        reviews: "0",
        description: "",
        image: ""
    });

    /* ADMIN TOKEN */

    function getAdminToken() {
        return localStorage.getItem("dhiman_admin_token");
    }

    /* SECURE API REQUEST */

    async function adminFetch(url, options = {}) {
        const token = getAdminToken();

        if (!token) {
            alert("Admin session expire ho gayi. Please login again.");
            logoutAdmin();
            return null;
        }

        const headers = {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem("dhiman_admin_token");
            localStorage.removeItem("dhiman_admin_login");

            alert("Admin session expire ho gayi. Please login again.");
            logoutAdmin();
            return null;
        }

        return response;
    }

    /* LOAD PRODUCTS */

    async function loadProducts() {
        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/api/products`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load products");
            }

            setProducts(data.products || []);
        } catch (error) {
            console.error("Load products error:", error);
            alert("Products database se load nahi ho pa rahe.");
        } finally {
            setLoading(false);
        }
    }

    /* LOAD ORDERS */

    async function loadOrders() {
        try {
            setLoadingOrders(true);

            const response = await adminFetch(`${API_URL}/api/orders`);

            if (!response) return;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load orders");
            }

            setOrders(data.orders || []);
        } catch (error) {
            console.error("Load orders error:", error);
            alert(error.message || "Orders load nahi ho pa rahe.");
        } finally {
            setLoadingOrders(false);
        }
    }

    useEffect(() => {
        loadProducts();
        loadOrders();
    }, []);

    /* DASHBOARD STATISTICS */

    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + Number(product.stock || 0),
        0
    );

    const outOfStock = products.filter(
        (product) => Number(product.stock || 0) <= 0
    ).length;

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
        (order) => {
            const status = String(order.status || "Pending").toLowerCase();
            return status === "pending";
        }
    ).length;

    const deliveredOrders = orders.filter(
        (order) =>
            String(order.status || "").toLowerCase() === "delivered"
    ).length;

    const deliveredSales = orders.reduce(
        (sum, order) => {
            if (
                String(order.status || "").toLowerCase() === "delivered"
            ) {
                return sum + Number(order.total || 0);
            }

            return sum;
        },
        0
    );

    /* PRODUCT SEARCH */

    const filteredProducts = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return products;

        return products.filter((product) =>
            [
                product.name,
                product.brand,
                product.category
            ]
                .filter(Boolean)
                .some((item) =>
                    String(item).toLowerCase().includes(value)
                )
        );
    }, [products, search]);

    /* ORDER SEARCH AND FILTER */

    const filteredOrders = useMemo(() => {
        const value = search.trim().toLowerCase();

        return orders.filter((order) => {
            const customer = order.customer || {};

            const matchesSearch =
                !value ||
                [
                    order.id,
                    customer.name,
                    customer.phone,
                    customer.address,
                    ...(order.items || []).map((item) => item.name)
                ]
                    .filter(Boolean)
                    .some((item) =>
                        String(item).toLowerCase().includes(value)
                    );

            const status = String(order.status || "Pending").toLowerCase();

            const matchesStatus =
                orderStatusFilter === "All" ||
                status === orderStatusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [orders, search, orderStatusFilter]);

    /* ADD PRODUCT MODAL */

    function openAddModal() {
        setEditingProduct(null);

        setForm({
            name: "",
            brand: "",
            category: "Pens",
            price: "",
            oldPrice: "",
            stock: "",
            unit: "pieces",
            discount: "",
            rating: "4.5",
            reviews: "0",
            description: "",
            image: ""
        });

        setShowModal(true);
    }

    /* EDIT PRODUCT MODAL */

    function openEditModal(product) {
        setEditingProduct(product);

        setForm({
            name: product.name || "",
            brand: product.brand || "",
            category: product.category || "Pens",
            price: product.price ?? "",
            oldPrice: product.oldPrice ?? "",
            stock: product.stock ?? "",
            unit: product.unit || "pieces",
            discount: product.discount || "",
            rating: product.rating ?? "4.5",
            reviews: product.reviews ?? "0",
            description: product.description || "",
            image: product.image || ""
        });

        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingProduct(null);
    }

    /* FORM CHANGE */

    function handleFormChange(e) {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    /* IMAGE UPLOAD */

    function handleImageUpload(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            e.target.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be less than 2 MB.");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            setForm((previous) => ({
                ...previous,
                image: reader.result
            }));
        };

        reader.readAsDataURL(file);
    }

    /* NEXT PRODUCT ID */

    function getNextProductId() {
        const ids = products
            .map((product) => Number(product.id))
            .filter(Number.isInteger);

        return ids.length ? Math.max(...ids) + 1 : 1;
    }

    /* SAVE PRODUCT */

    async function saveProduct(e) {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Please enter product name.");
            return;
        }

        if (form.price === "" || Number(form.price) < 0) {
            alert("Please enter a valid product price.");
            return;
        }

        if (form.stock === "" || Number(form.stock) < 0) {
            alert("Please enter a valid stock quantity.");
            return;
        }

        const productData = {
            id: editingProduct?.id || getNextProductId(),
            name: form.name.trim(),
            brand: form.brand.trim(),
            category: form.category,
            price: Number(form.price),
            oldPrice:
                form.oldPrice === ""
                    ? Number(form.price)
                    : Number(form.oldPrice),
            stock: Number(form.stock),
            unit: form.unit,
            discount: form.discount.trim() || "Available",
            rating: Number(form.rating) || 0,
            reviews: Number(form.reviews) || 0,
            description: form.description.trim(),
            image: form.image || ""
        };

        try {
            setLoading(true);

            const response = await adminFetch(
                editingProduct
                    ? `${API_URL}/api/products/${editingProduct.id}`
                    : `${API_URL}/api/products`,
                {
                    method: editingProduct ? "PUT" : "POST",
                    body: JSON.stringify(productData)
                }
            );

            if (!response) return;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to save product");
            }

            alert(
                editingProduct
                    ? "Product updated successfully."
                    : "Product added successfully."
            );

            closeModal();
            await loadProducts();
        } catch (error) {
            console.error("Save product error:", error);
            alert(error.message || "Product save nahi ho paaya.");
        } finally {
            setLoading(false);
        }
    }

    /* DELETE PRODUCT */

    async function deleteProduct(id) {
        const product = products.find(
            (item) => Number(item.id) === Number(id)
        );

        if (
            !window.confirm(
                `Delete "${product?.name || "this product"}"?`
            )
        ) {
            return;
        }

        try {
            setLoading(true);

            const response = await adminFetch(
                `${API_URL}/api/products/${id}`,
                { method: "DELETE" }
            );

            if (!response) return;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to delete product");
            }

            alert("Product deleted successfully.");
            await loadProducts();
        } catch (error) {
            console.error("Delete product error:", error);
            alert(error.message || "Product delete nahi ho paaya.");
        } finally {
            setLoading(false);
        }
    }

    /* CHANGE STOCK */

    async function changeStock(id, amount) {
        const product = products.find(
            (item) => Number(item.id) === Number(id)
        );

        if (!product) return;

        const currentStock = Number(product.stock || 0);
        const newStock = Math.max(0, currentStock + amount);

        if (newStock === currentStock) return;

        const productData = {
            name: product.name || "",
            brand: product.brand || "",
            category: product.category || "",
            price: Number(product.price || 0),
            oldPrice:
                product.oldPrice === null ||
                    product.oldPrice === undefined ||
                    product.oldPrice === ""
                    ? null
                    : Number(product.oldPrice),
            stock: newStock,
            unit: product.unit || "pieces",
            discount: product.discount || "",
            rating: Number(product.rating || 0),
            reviews: Number(product.reviews || 0),
            description: product.description || "",
            image: product.image || ""
        };

        try {
            const response = await adminFetch(
                `${API_URL}/api/products/${id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(productData)
                }
            );

            if (!response) return;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to update stock");
            }

            setProducts((previousProducts) =>
                previousProducts.map((item) =>
                    Number(item.id) === Number(id)
                        ? {
                            ...item,
                            ...(data.product || {}),
                            stock: Number(
                                data.product?.stock ?? newStock
                            )
                        }
                        : item
                )
            );
        } catch (error) {
            console.error("Stock update error:", error);
            alert(error.message || "Stock update nahi ho paaya.");
        }
    }

    /* UPDATE ORDER STATUS */

    async function updateOrderStatus(orderId, newStatus) {
        if (updatingOrderId !== null) return;

        const currentOrder = orders.find(
            (order) => String(order.id) === String(orderId)
        );

        if (!currentOrder || currentOrder.status === newStatus) return;

        try {
            setUpdatingOrderId(orderId);

            const response = await adminFetch(
                `${API_URL}/api/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (!response) return;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to update order");
            }

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    String(order.id) === String(orderId)
                        ? { ...order, status: newStatus }
                        : order
                )
            );
        } catch (error) {
            console.error("Update order status error:", error);
            alert(error.message || "Order status update nahi ho paaya.");
        } finally {
            setUpdatingOrderId(null);
        }
    }

    /* PAYMENT LABEL */

    function getPaymentLabel(order) {
        const payment = String(
            order.customer?.payment || order.payment || ""
        ).toLowerCase();

        if (payment === "razorpay") return "Online Payment";
        if (payment === "whatsapp") return "WhatsApp";
        if (payment === "cod" || payment === "cash") {
            return "Cash on Delivery";
        }

        return payment || "Not specified";
    }

    /* PAYMENT STATUS */

    function getPaymentStatus(order) {
        const payment = String(
            order.customer?.payment || order.payment || ""
        ).toLowerCase();

        if (payment !== "razorpay") {
            return "";
        }

        const status =
            order.customer?.paymentStatus ||
            order.payment_status ||
            order.paymentStatus;

        return status || "Not verified";
    }

    /* ORDER DATE */

    function getOrderDate(order) {
        const date = new Date(
            order.createdAt || order.created_at || ""
        );

        return Number.isNaN(date.getTime())
            ? "Date unavailable"
            : date.toLocaleString();
    }

    /* STATUS BUTTONS */

    const orderStatuses = [
        "Pending",
        "Confirmed",
        "Ready",
        "Delivered"
    ];

    return (
        <main className="admin-page">
            {/* HEADER */}

            <header className="admin-header">
                <button
                    onClick={goHome}
                    type="button"
                    className="cart-back-btn"
                    aria-label="Go back"
                >
                    ←
                </button>

                <div>
                    <p>DHIMAN STATIONERY</p>
                    <h1>Admin Panel</h1>
                    <p>Manage your shop</p>
                </div>

                <button type="button" onClick={logoutAdmin}>
                    Logout
                </button>
            </header>

            {/* DASHBOARD STATS */}

            <section className="admin-stats">
                <div className="admin-stat">
                    <strong>📦</strong>
                    <strong>{totalProducts}</strong>
                    <span>Products</span>
                </div>

                <div className="admin-stat">
                    <strong>📊</strong>
                    <strong>{totalStock}</strong>
                    <span>Total Stock</span>
                </div>

                <div className="admin-stat">
                    <strong>⚠️</strong>
                    <strong>{outOfStock}</strong>
                    <span>Out of Stock</span>
                </div>

                <div className="admin-stat">
                    <strong>🛍️</strong>
                    <strong>{totalOrders}</strong>
                    <span>Total Orders</span>
                </div>

                <div className="admin-stat">
                    <strong>⏳</strong>
                    <strong>{pendingOrders}</strong>
                    <span>Pending Orders</span>
                </div>

                <div className="admin-stat">
                    <strong>✅</strong>
                    <strong>{deliveredOrders}</strong>
                    <span>Delivered Orders</span>
                </div>

                <div className="admin-stat">
                    <strong>₹{deliveredSales.toLocaleString("en-IN")}</strong>
                    <span>Delivered Sales</span>
                </div>
            </section>

            {/* TABS */}

            <div className="admin-tabs">
                <button
                    type="button"
                    className={activeTab === "products" ? "active" : ""}
                    onClick={() => {
                        setActiveTab("products");
                        setSearch("");
                    }}
                >
                    Products
                </button>

                <button
                    type="button"
                    className={activeTab === "orders" ? "active" : ""}
                    onClick={() => {
                        setActiveTab("orders");
                        setSearch("");
                        setOrderStatusFilter("All");
                    }}
                >
                    Orders {totalOrders > 0 && `(${totalOrders})`}
                </button>
            </div>

            {/* PRODUCTS */}

            {activeTab === "products" && (
                <section className="admin-products">
                    <input
                        className="admin-search"
                        type="text"
                        placeholder="🔍 Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <button
                        type="button"
                        className="admin-add-btn"
                        onClick={openAddModal}
                    >
                        + Add Product
                    </button>

                    {loading && products.length === 0 ? (
                        <div className="admin-order-card">
                            <p>Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="admin-order-card">
                            <p>No products found.</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => {
                            const stock = Number(product.stock || 0);

                            return (
                                <div
                                    className="admin-product-card"
                                    key={product.id}
                                >
                                    <div className="admin-product-image">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                            />
                                        ) : (
                                            <span>📦</span>
                                        )}
                                    </div>

                                    <div className="admin-product-info">
                                        <p>{product.category}</p>
                                        <h3>{product.name}</h3>
                                        <p>{product.brand || "No brand"}</p>

                                        <p>
                                            ₹{product.price}

                                            {Number(product.oldPrice || 0) >
                                                Number(product.price || 0) && (
                                                    <span
                                                        style={{
                                                            textDecoration: "line-through",
                                                            marginLeft: "5px",
                                                            color: "#aaa"
                                                        }}
                                                    >
                                                        ₹{product.oldPrice}
                                                    </span>
                                                )}
                                        </p>

                                        <p>
                                            Stock: <strong>{stock}</strong>
                                        </p>

                                        <div className="admin-stock-controls">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStock(product.id, -1)
                                                }
                                                disabled={stock <= 0}
                                            >
                                                −
                                            </button>

                                            <span>{stock}</span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStock(product.id, 1)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="admin-product-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(product)
                                                }
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteProduct(product.id)
                                                }
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            )}

            {/* ORDERS */}

            {activeTab === "orders" && (
                <section className="admin-orders">
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "12px"
                        }}
                    >
                        <input
                            className="admin-search"
                            style={{ flex: "1 1 180px", minWidth: 0 }}
                            type="text"
                            placeholder="Search order, customer, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={loadOrders}
                            disabled={loadingOrders}
                            style={{
                                padding: "10px 14px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                cursor: loadingOrders ? "wait" : "pointer"
                            }}
                        >
                            {loadingOrders ? "Refreshing..." : "↻ Refresh"}
                        </button>
                    </div>

                    <select
                        value={orderStatusFilter}
                        onChange={(e) =>
                            setOrderStatusFilter(e.target.value)
                        }
                        aria-label="Filter orders by status"
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginBottom: "12px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            background: "#fff"
                        }}
                    >
                        <option value="All">All Orders ({totalOrders})</option>
                        <option value="Pending">Pending ({pendingOrders})</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">
                            Delivered ({deliveredOrders})
                        </option>
                    </select>

                    {loadingOrders ? (
                        <div className="admin-order-card">
                            <p style={{ textAlign: "center" }}>
                                Loading orders...
                            </p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="admin-order-card">
                            <div
                                style={{
                                    fontSize: "30px",
                                    textAlign: "center"
                                }}
                            >
                                📦
                            </div>

                            <h3 style={{ textAlign: "center" }}>
                                No Orders Found
                            </h3>

                            <p style={{ textAlign: "center" }}>
                                Search ya status filter change karke dekho.
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const currentStatus = order.status || "Pending";
                            const paymentLabel = getPaymentLabel(order);
                            const paymentStatus = getPaymentStatus(order);
                            const isUpdating =
                                String(updatingOrderId) === String(order.id);

                            return (
                                <div
                                    className="admin-order-card"
                                    key={order.id}
                                >
                                    <h3>Order #{order.id}</h3>

                                    <p>{getOrderDate(order)}</p>

                                    {/* STATUS */}

                                    <div
                                        style={{
                                            marginTop: "10px",
                                            padding: "10px",
                                            borderRadius: "10px",
                                            background: "#f7f7f7"
                                        }}
                                    >
                                        <strong>Order Status</strong>

                                        <p
                                            style={{
                                                margin: "5px 0 8px",
                                                fontWeight: "700"
                                            }}
                                        >
                                            {isUpdating
                                                ? "Updating status..."
                                                : currentStatus}
                                        </p>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "6px"
                                            }}
                                        >
                                            {orderStatuses.map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    disabled={
                                                        isUpdating ||
                                                        currentStatus === status
                                                    }
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order.id,
                                                            status
                                                        )
                                                    }
                                                    style={{
                                                        padding: "8px 5px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "7px",
                                                        background:
                                                            currentStatus === status
                                                                ? "#111"
                                                                : "#fff",
                                                        color:
                                                            currentStatus === status
                                                                ? "#fff"
                                                                : "#111",
                                                        fontSize: "11px",
                                                        fontWeight: "600",
                                                        cursor:
                                                            isUpdating ||
                                                                currentStatus === status
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        opacity:
                                                            isUpdating ? 0.6 : 1
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CUSTOMER */}

                                    <p>
                                        <strong>Customer:</strong>{" "}
                                        {order.customer?.name ||
                                            order.customer_name ||
                                            "Customer"}
                                    </p>

                                    <p>
                                        <strong>Mobile:</strong>{" "}
                                        {order.customer?.phone ||
                                            order.phone ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>Address:</strong>{" "}
                                        {order.customer?.address ||
                                            order.address ||
                                            "N/A"}
                                    </p>

                                    {/* PAYMENT */}

                                    <p>
                                        <strong>Payment:</strong>{" "}
                                        {paymentLabel}

                                        {paymentStatus && (
                                            <span
                                                style={{
                                                    marginLeft: "6px",
                                                    fontWeight: "700"
                                                }}
                                            >
                                                • {paymentStatus}
                                            </span>
                                        )}
                                    </p>

                                    {/* RAZORPAY */}

                                    {(order.customer?.razorpayPaymentId ||
                                        order.customer?.razorpayOrderId) && (
                                            <div
                                                style={{
                                                    marginTop: "6px",
                                                    padding: "8px 10px",
                                                    borderRadius: "8px",
                                                    background: "#f7f7f7",
                                                    fontSize: "11px",
                                                    wordBreak: "break-all"
                                                }}
                                            >
                                                {order.customer?.razorpayPaymentId && (
                                                    <p style={{ margin: "3px 0" }}>
                                                        <strong>Payment ID:</strong>{" "}
                                                        {order.customer.razorpayPaymentId}
                                                    </p>
                                                )}

                                                {order.customer?.razorpayOrderId && (
                                                    <p style={{ margin: "3px 0" }}>
                                                        <strong>Razorpay Order:</strong>{" "}
                                                        {order.customer.razorpayOrderId}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    {/* ITEMS */}

                                    <div
                                        style={{
                                            marginTop: "10px",
                                            paddingTop: "8px",
                                            borderTop: "1px solid #eee"
                                        }}
                                    >
                                        <strong>Order Items</strong>

                                        {!order.items?.length ? (
                                            <p>Item details unavailable.</p>
                                        ) : (
                                            order.items.map((item, index) => (
                                                <p
                                                    key={item.id ?? index}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: "10px"
                                                    }}
                                                >
                                                    <span>
                                                        {item.name || "Product"} ×{" "}
                                                        {item.quantity || 0}
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {Number(item.price || 0) *
                                                            Number(item.quantity || 0)}
                                                    </strong>
                                                </p>
                                            ))
                                        )}
                                    </div>

                                    {/* TOTAL */}

                                    <p
                                        style={{
                                            marginTop: "10px",
                                            paddingTop: "8px",
                                            borderTop: "1px solid #eee"
                                        }}
                                    >
                                        <strong>
                                            Total: ₹
                                            {Number(order.total || 0).toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>
                                    </p>
                                </div>
                            );
                        })
                    )}
                </section>
            )}

            {/* ADD / EDIT PRODUCT MODAL */}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </h2>

                        <form onSubmit={saveProduct}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "9px",
                                    marginBottom: "5px"
                                }}
                            >
                                Product Image
                            </label>

                            {form.image && (
                                <div
                                    style={{
                                        width: "90px",
                                        height: "90px",
                                        marginBottom: "8px",
                                        borderRadius: "10px",
                                        background: "#f5f5f5",
                                        overflow: "hidden"
                                    }}
                                >
                                    <img
                                        src={form.image}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain"
                                        }}
                                    />
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageUpload}
                            />

                            <small
                                style={{
                                    display: "block",
                                    marginTop: "-5px",
                                    marginBottom: "9px",
                                    color: "#888",
                                    fontSize: "8px"
                                }}
                            >
                                JPG, PNG, WEBP • Max 2 MB
                            </small>

                            <input
                                name="name"
                                type="text"
                                placeholder="Product Name"
                                value={form.name}
                                onChange={handleFormChange}
                                required
                            />

                            <input
                                name="brand"
                                type="text"
                                placeholder="Brand"
                                value={form.brand}
                                onChange={handleFormChange}
                            />

                            <select
                                name="category"
                                value={form.category}
                                onChange={handleFormChange}
                            >
                                <option value="Pens">Pens</option>
                                <option value="Notebooks">Notebooks</option>
                                <option value="Books">Books</option>
                                <option value="Files">Files</option>
                                <option value="Art & Craft">Art & Craft</option>
                                <option value="Printing">Printing</option>
                            </select>

                            <input
                                name="price"
                                type="number"
                                min="0"
                                placeholder="Price ₹"
                                value={form.price}
                                onChange={handleFormChange}
                                required
                            />

                            <input
                                name="oldPrice"
                                type="number"
                                min="0"
                                placeholder="Old Price ₹"
                                value={form.oldPrice}
                                onChange={handleFormChange}
                            />

                            <input
                                name="stock"
                                type="number"
                                min="0"
                                placeholder="Stock Quantity"
                                value={form.stock}
                                onChange={handleFormChange}
                                required
                            />

                            <select
                                name="unit"
                                value={form.unit}
                                onChange={handleFormChange}
                            >
                                <option value="pieces">Pieces</option>
                                <option value="pack">Pack</option>
                                <option value="box">Box</option>
                                <option value="set">Set</option>
                            </select>

                            <input
                                name="discount"
                                type="text"
                                placeholder="e.g. 20% OFF"
                                value={form.discount}
                                onChange={handleFormChange}
                            />

                            <input
                                name="rating"
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                placeholder="Rating"
                                value={form.rating}
                                onChange={handleFormChange}
                            />

                            <input
                                name="reviews"
                                type="number"
                                min="0"
                                placeholder="Reviews"
                                value={form.reviews}
                                onChange={handleFormChange}
                            />

                            <textarea
                                name="description"
                                placeholder="Write product description..."
                                value={form.description}
                                onChange={handleFormChange}
                            />

                            <div className="modal-buttons">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Saving..."
                                        : editingProduct
                                            ? "Save Changes"
                                            : "Add Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Admin;