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
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);

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

    /* =========================
       ADMIN TOKEN
    ========================= */

    function getAdminToken() {
        return localStorage.getItem(
            "dhiman_admin_token"
        );
    }

    /* =========================
       SECURE API REQUEST
    ========================= */

    async function adminFetch(url, options = {}) {
        const token = getAdminToken();

        if (!token) {
            alert(
                "Admin session expire ho gayi. Please login again."
            );

            logoutAdmin();
            return null;
        }

        const headers = {
            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),
            ...(options.headers || {}),
            Authorization:
                `Bearer ${token}`
        };

        const response = await fetch(
            url,
            {
                ...options,
                headers
            }
        );

        if (response.status === 401) {
            localStorage.removeItem(
                "dhiman_admin_token"
            );

            alert(
                "Admin session expire ho gayi. Please login again."
            );

            logoutAdmin();

            return null;
        }

        return response;
    }

    /* =========================
       LOAD PRODUCTS
    ========================= */

    async function loadProducts() {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/products`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load products"
                );
            }

            setProducts(data.products || []);

        } catch (error) {
            console.error(
                "Load products error:",
                error
            );

            alert(
                "Products database se load nahi ho pa rahe."
            );

        } finally {
            setLoading(false);
        }
    }

    /* =========================
       LOAD ORDERS
    ========================= */

    async function loadOrders() {
        try {
            setLoadingOrders(true);

            const response =
                await adminFetch(
                    `${API_URL}/api/orders`
                );

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to load orders"
                );
            }

            setOrders(
                data.orders || []
            );

        } catch (error) {
            console.error(
                "Load orders error:",
                error
            );

            alert(
                "Orders database se load nahi ho pa rahe."
            );

        } finally {
            setLoadingOrders(false);
        }
    }

    /* =========================
       INITIAL DATABASE LOAD
    ========================= */

    useEffect(() => {
        loadProducts();
        loadOrders();
    }, []);

    /* =========================
       STATS
    ========================= */

    const totalProducts =
        products.length;

    const totalStock =
        products.reduce(
            (sum, product) =>
                sum +
                Number(
                    product.stock || 0
                ),
            0
        );

    const outOfStock =
        products.filter(
            (product) =>
                Number(
                    product.stock || 0
                ) <= 0
        ).length;

    const totalOrders =
        orders.length;

    const totalSales =
        orders.reduce(
            (sum, order) =>
                sum +
                Number(
                    order.total || 0
                ),
            0
        );

    /* =========================
       PRODUCT SEARCH
    ========================= */

    const filteredProducts =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            if (!value) {
                return products;
            }

            return products.filter(
                (product) =>
                    [
                        product.name,
                        product.brand,
                        product.category
                    ]
                        .filter(Boolean)
                        .some((item) =>
                            item
                                .toString()
                                .toLowerCase()
                                .includes(
                                    value
                                )
                        )
            );
        }, [products, search]);

    /* =========================
       ADD PRODUCT MODAL
    ========================= */

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

    /* =========================
       EDIT PRODUCT MODAL
    ========================= */

    function openEditModal(product) {
        setEditingProduct(product);

        setForm({
            name: product.name || "",
            brand: product.brand || "",
            category:
                product.category ||
                "Pens",
            price:
                product.price ?? "",
            oldPrice:
                product.oldPrice ?? "",
            stock:
                product.stock ?? "",
            unit:
                product.unit ||
                "pieces",
            discount:
                product.discount || "",
            rating:
                product.rating ??
                "4.5",
            reviews:
                product.reviews ??
                "0",
            description:
                product.description ||
                "",
            image:
                product.image || ""
        });

        setShowModal(true);
    }

    /* =========================
       CLOSE MODAL
    ========================= */

    function closeModal() {
        setShowModal(false);
        setEditingProduct(null);
    }

    /* =========================
       FORM CHANGE
    ========================= */

    function handleFormChange(e) {
        const {
            name,
            value
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    /* =========================
       IMAGE UPLOAD
    ========================= */

    function handleImageUpload(e) {
        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            alert(
                "Please select an image file"
            );
            return;
        }

        if (
            file.size >
            2 * 1024 * 1024
        ) {
            alert(
                "Image must be less than 2 MB"
            );
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {
            setForm((prev) => ({
                ...prev,
                image:
                    reader.result
            }));
        };

        reader.readAsDataURL(file);
    }

    /* =========================
       GET NEXT PRODUCT ID
    ========================= */

    function getNextProductId() {
        if (!products.length) {
            return 1;
        }

        const ids =
            products
                .map((product) =>
                    Number(product.id)
                )
                .filter((id) =>
                    Number.isInteger(id)
                );

        if (!ids.length) {
            return 1;
        }

        return (
            Math.max(...ids) + 1
        );
    }

    /* =========================
       SAVE PRODUCT
    ========================= */

    async function saveProduct(e) {
        e.preventDefault();

        if (!form.name.trim()) {
            alert(
                "Please enter product name"
            );
            return;
        }

        if (!form.price) {
            alert(
                "Please enter product price"
            );
            return;
        }

        if (form.stock === "") {
            alert(
                "Please enter stock quantity"
            );
            return;
        }

        const productData = {
            id:
                editingProduct?.id ||
                getNextProductId(),

            name:
                form.name.trim(),

            brand:
                form.brand.trim(),

            category:
                form.category,

            price:
                Number(form.price),

            oldPrice:
                form.oldPrice === ""
                    ? Number(
                        form.price
                    )
                    : Number(
                        form.oldPrice
                    ),

            stock:
                Number(form.stock),

            unit:
                form.unit,

            discount:
                form.discount.trim() ||
                "Available",

            rating:
                Number(
                    form.rating
                ) || 0,

            reviews:
                Number(
                    form.reviews
                ) || 0,

            description:
                form.description.trim(),

            image:
                form.image || ""
        };

        try {
            setLoading(true);

            let response;

            /* EDIT */

            if (editingProduct) {
                response =
                    await adminFetch(
                        `${API_URL}/api/products/${editingProduct.id}`,
                        {
                            method: "PUT",
                            body:
                                JSON.stringify(
                                    productData
                                )
                        }
                    );
            }

            /* ADD */

            else {
                response =
                    await adminFetch(
                        `${API_URL}/api/products`,
                        {
                            method: "POST",
                            body:
                                JSON.stringify(
                                    productData
                                )
                        }
                    );
            }

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to save product"
                );
            }

            alert(
                editingProduct
                    ? "Product updated successfully"
                    : "Product added successfully"
            );

            closeModal();

            await loadProducts();

        } catch (error) {
            console.error(
                "Save product error:",
                error
            );

            alert(
                error.message ||
                "Product save nahi ho paaya."
            );

        } finally {
            setLoading(false);
        }
    }

    /* =========================
       DELETE PRODUCT
    ========================= */

    async function deleteProduct(id) {
        const product =
            products.find(
                (item) =>
                    Number(item.id) ===
                    Number(id)
            );

        const confirmed =
            window.confirm(
                `Delete "${product?.name || "this product"}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            const response =
                await adminFetch(
                    `${API_URL}/api/products/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to delete product"
                );
            }

            alert(
                "Product deleted successfully"
            );

            await loadProducts();

        } catch (error) {
            console.error(
                "Delete product error:",
                error
            );

            alert(
                error.message ||
                "Product delete nahi ho paaya."
            );

        } finally {
            setLoading(false);
        }
    }

    /* =========================
       CHANGE STOCK
    ========================= */

    async function changeStock(
        id,
        amount
    ) {
        const product =
            products.find(
                (item) =>
                    Number(item.id) ===
                    Number(id)
            );

        if (!product) {
            return;
        }

        const currentStock =
            Number(
                product.stock || 0
            );

        const newStock =
            Math.max(
                0,
                currentStock + amount
            );

        const productData = {
            name:
                product.name,

            brand:
                product.brand || "",

            category:
                product.category || "",

            price:
                Number(
                    product.price || 0
                ),

            oldPrice:
                product.oldPrice === ""
                    ? null
                    : Number(
                        product.oldPrice ||
                        0
                    ),

            stock:
                newStock,

            unit:
                product.unit ||
                "pieces",

            discount:
                product.discount ||
                "",

            rating:
                Number(
                    product.rating || 0
                ),

            reviews:
                Number(
                    product.reviews || 0
                ),

            description:
                product.description ||
                "",

            image:
                product.image || ""
        };

        try {
            const response =
                await adminFetch(
                    `${API_URL}/api/products/${id}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to update stock"
                );
            }

            await loadProducts();

        } catch (error) {
            console.error(
                "Stock update error:",
                error
            );

            alert(
                error.message ||
                "Stock update nahi ho paaya."
            );
        }
    }

    /* =========================
       UPDATE ORDER STATUS
    ========================= */

    async function updateOrderStatus(
        orderId,
        newStatus
    ) {
        try {
            const response =
                await adminFetch(
                    `${API_URL}/api/orders/${orderId}/status`,
                    {
                        method: "PATCH",
                        body:
                            JSON.stringify({
                                status:
                                    newStatus
                            })
                    }
                );

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to update order"
                );
            }

            setOrders(
                (prevOrders) =>
                    prevOrders.map(
                        (order) =>
                            String(
                                order.id
                            ) ===
                                String(
                                    orderId
                                )
                                ? {
                                    ...order,
                                    status:
                                        newStatus
                                }
                                : order
                    )
            );

        } catch (error) {
            console.error(
                "Update order status error:",
                error
            );

            alert(
                error.message ||
                "Order status update nahi ho paaya."
            );
        }
    }

    /* =========================
       PAYMENT LABEL
    ========================= */

    function getPaymentLabel(order) {
        if (
            order.customer?.payment ===
            "razorpay"
        ) {
            return "Online Payment";
        }

        if (
            order.customer?.payment ===
            "whatsapp"
        ) {
            return "WhatsApp";
        }

        return "Cash on Delivery";
    }

    /* =========================
       PAYMENT STATUS
    ========================= */

    function getPaymentStatus(order) {
        if (
            order.customer?.payment ===
            "razorpay"
        ) {
            return (
                order.customer
                    ?.paymentStatus ||
                "Paid"
            );
        }

        return "";
    }

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

                    <p>
                        DHIMAN STATIONERY
                    </p>

                    <h1>
                        Admin Panel
                    </h1>

                    <p>
                        Manage your shop
                    </p>

                </div>

                <button
                    type="button"
                    onClick={logoutAdmin}
                >
                    Logout
                </button>

            </header>


            {/* STATS */}

            <section className="admin-stats">

                <div className="admin-stat">
                    <strong>📦</strong>
                    <strong>
                        {totalProducts}
                    </strong>
                    <span>
                        Products
                    </span>
                </div>

                <div className="admin-stat">
                    <strong>📊</strong>
                    <strong>
                        {totalStock}
                    </strong>
                    <span>
                        Total Stock
                    </span>
                </div>

                <div className="admin-stat">
                    <strong>⚠️</strong>
                    <strong>
                        {outOfStock}
                    </strong>
                    <span>
                        Out of Stock
                    </span>
                </div>

                <div className="admin-stat">
                    <strong>🛍️</strong>
                    <strong>
                        {totalOrders}
                    </strong>
                    <span>
                        Orders
                    </span>
                </div>

                <div className="admin-stat">
                    <strong>
                        ₹{totalSales}
                    </strong>
                    <span>
                        Total Sales
                    </span>
                </div>

            </section>


            {/* TABS */}

            <div className="admin-tabs">

                <button
                    type="button"
                    className={
                        activeTab ===
                            "products"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "products"
                        )
                    }
                >
                    Products
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                            "orders"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "orders"
                        )
                    }
                >
                    Orders{" "}
                    {totalOrders >
                        0 &&
                        `(${totalOrders})`}
                </button>

            </div>


            {/* PRODUCTS */}

            {activeTab ===
                "products" && (

                    <section className="admin-products">

                        <input
                            className="admin-search"
                            type="text"
                            placeholder="🔍 Search products..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        <button
                            type="button"
                            className="admin-add-btn"
                            onClick={
                                openAddModal
                            }
                        >
                            + Add Product
                        </button>

                        {loading &&
                            products.length ===
                            0 ? (

                            <div className="admin-order-card">
                                <p>
                                    Loading products...
                                </p>
                            </div>

                        ) : filteredProducts.length ===
                            0 ? (

                            <div className="admin-order-card">
                                <p>
                                    No products found.
                                </p>
                            </div>

                        ) : (

                            filteredProducts.map(
                                (product) => {

                                    const stock =
                                        Number(
                                            product.stock ||
                                            0
                                        );

                                    return (
                                        <div
                                            className="admin-product-card"
                                            key={
                                                product.id
                                            }
                                        >

                                            <div className="admin-product-image">

                                                {product.image ? (

                                                    <img
                                                        src={
                                                            product.image
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                    />

                                                ) : (

                                                    <span>
                                                        📦
                                                    </span>

                                                )}

                                            </div>


                                            <div className="admin-product-info">

                                                <p>
                                                    {
                                                        product.category
                                                    }
                                                </p>

                                                <h3>
                                                    {
                                                        product.name
                                                    }
                                                </h3>

                                                <p>
                                                    {
                                                        product.brand ||
                                                        "No brand"
                                                    }
                                                </p>

                                                <p>
                                                    ₹
                                                    {
                                                        product.price
                                                    }

                                                    {Number(
                                                        product.oldPrice ||
                                                        0
                                                    ) >
                                                        Number(
                                                            product.price ||
                                                            0
                                                        ) && (

                                                            <span
                                                                style={{
                                                                    textDecoration:
                                                                        "line-through",
                                                                    marginLeft:
                                                                        "5px",
                                                                    color:
                                                                        "#aaa"
                                                                }}
                                                            >
                                                                ₹
                                                                {
                                                                    product.oldPrice
                                                                }
                                                            </span>

                                                        )}

                                                </p>

                                                <p>
                                                    Stock:{" "}

                                                    <strong>
                                                        {stock}
                                                    </strong>
                                                </p>


                                                <div className="admin-stock-controls">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeStock(
                                                                product.id,
                                                                -1
                                                            )
                                                        }
                                                        disabled={
                                                            stock <=
                                                            0
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {stock}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeStock(
                                                                product.id,
                                                                1
                                                            )
                                                        }
                                                    >
                                                        +
                                                    </button>

                                                </div>


                                                <div className="admin-product-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        ✏️ Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteProduct(
                                                                product.id
                                                            )
                                                        }
                                                    >
                                                        🗑️ Delete
                                                    </button>

                                                </div>

                                            </div>

                                        </div>
                                    );
                                }
                            )
                        )}

                    </section>
                )}


            {/* ORDERS */}

            {activeTab ===
                "orders" && (

                    <section className="admin-orders">

                        {loadingOrders ? (

                            <div className="admin-order-card">
                                <p
                                    style={{
                                        textAlign:
                                            "center"
                                    }}
                                >
                                    Loading orders...
                                </p>
                            </div>

                        ) : orders.length ===
                            0 ? (

                            <div className="admin-order-card">

                                <div
                                    style={{
                                        fontSize:
                                            "30px",
                                        textAlign:
                                            "center"
                                    }}
                                >
                                    📦
                                </div>

                                <h3
                                    style={{
                                        textAlign:
                                            "center",
                                        marginTop:
                                            "8px"
                                    }}
                                >
                                    No Orders Yet
                                </h3>

                                <p
                                    style={{
                                        textAlign:
                                            "center"
                                    }}
                                >
                                    Customer orders will
                                    appear here.
                                </p>

                            </div>

                        ) : (

                            orders.map(
                                (order) => {

                                    const currentStatus =
                                        order.status ||
                                        "Pending";

                                    const paymentLabel =
                                        getPaymentLabel(
                                            order
                                        );

                                    const paymentStatus =
                                        getPaymentStatus(
                                            order
                                        );

                                    return (

                                        <div
                                            className="admin-order-card"
                                            key={
                                                order.id
                                            }
                                        >

                                            <h3>
                                                Order #
                                                {
                                                    order.id
                                                }
                                            </h3>

                                            <p>
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleString()}
                                            </p>


                                            {/* STATUS */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        "10px",
                                                    padding:
                                                        "10px",
                                                    borderRadius:
                                                        "10px",
                                                    background:
                                                        "#f7f7f7"
                                                }}
                                            >

                                                <strong>
                                                    Order Status
                                                </strong>

                                                <p
                                                    style={{
                                                        margin:
                                                            "5px 0 8px",
                                                        fontWeight:
                                                            "700"
                                                    }}
                                                >
                                                    {
                                                        currentStatus
                                                    }
                                                </p>

                                                <div
                                                    style={{
                                                        display:
                                                            "grid",
                                                        gridTemplateColumns:
                                                            "1fr 1fr",
                                                        gap:
                                                            "6px"
                                                    }}
                                                >

                                                    {[
                                                        "Pending",
                                                        "Confirmed",
                                                        "Ready",
                                                        "Delivered"
                                                    ].map(
                                                        (
                                                            status
                                                        ) => (

                                                            <button
                                                                key={
                                                                    status
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    updateOrderStatus(
                                                                        order.id,
                                                                        status
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "7px 5px",
                                                                    border:
                                                                        "1px solid #ddd",
                                                                    borderRadius:
                                                                        "7px",
                                                                    background:
                                                                        currentStatus ===
                                                                            status
                                                                            ? "#111"
                                                                            : "#fff",
                                                                    color:
                                                                        currentStatus ===
                                                                            status
                                                                            ? "#fff"
                                                                            : "#111",
                                                                    fontSize:
                                                                        "10px",
                                                                    fontWeight:
                                                                        "600",
                                                                    cursor:
                                                                        "pointer"
                                                                }}
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </button>

                                                        )
                                                    )}

                                                </div>

                                            </div>


                                            {/* CUSTOMER */}

                                            <p>
                                                <strong>
                                                    Customer:
                                                </strong>{" "}
                                                {
                                                    order.customer
                                                        ?.name ||
                                                    "Customer"
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Mobile:
                                                </strong>{" "}
                                                {
                                                    order.customer
                                                        ?.phone ||
                                                    "N/A"
                                                }
                                            </p>

                                            <p>
                                                <strong>
                                                    Address:
                                                </strong>{" "}
                                                {
                                                    order.customer
                                                        ?.address ||
                                                    "N/A"
                                                }
                                            </p>


                                            {/* PAYMENT */}

                                            <p>
                                                <strong>
                                                    Payment:
                                                </strong>{" "}
                                                {
                                                    paymentLabel
                                                }

                                                {paymentStatus && (

                                                    <span
                                                        style={{
                                                            marginLeft:
                                                                "6px",
                                                            fontWeight:
                                                                "700"
                                                        }}
                                                    >
                                                        •{" "}
                                                        {
                                                            paymentStatus
                                                        }
                                                    </span>

                                                )}

                                            </p>


                                            {/* RAZORPAY */}

                                            {order.customer
                                                ?.payment ===
                                                "razorpay" && (

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "6px",
                                                            padding:
                                                                "8px 10px",
                                                            borderRadius:
                                                                "8px",
                                                            background:
                                                                "#f7f7f7",
                                                            fontSize:
                                                                "11px",
                                                            wordBreak:
                                                                "break-all"
                                                        }}
                                                    >

                                                        {order.customer
                                                            ?.razorpayPaymentId && (

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "3px 0"
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        Payment ID:
                                                                    </strong>{" "}
                                                                    {
                                                                        order.customer
                                                                            .razorpayPaymentId
                                                                    }
                                                                </p>

                                                            )}

                                                        {order.customer
                                                            ?.razorpayOrderId && (

                                                                <p
                                                                    style={{
                                                                        margin:
                                                                            "3px 0"
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        Razorpay Order:
                                                                    </strong>{" "}
                                                                    {
                                                                        order.customer
                                                                            .razorpayOrderId
                                                                    }
                                                                </p>

                                                            )}

                                                    </div>

                                                )}


                                            {/* ITEMS */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        "10px",
                                                    paddingTop:
                                                        "8px",
                                                    borderTop:
                                                        "1px solid #eee"
                                                }}
                                            >

                                                {order.items?.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <p
                                                            key={
                                                                item.id ??
                                                                index
                                                            }
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                justifyContent:
                                                                    "space-between"
                                                            }}
                                                        >

                                                            <span>
                                                                {
                                                                    item.name
                                                                }{" "}
                                                                ×{" "}
                                                                {
                                                                    item.quantity
                                                                }
                                                            </span>

                                                            <strong>
                                                                ₹
                                                                {Number(
                                                                    item.price ||
                                                                    0
                                                                ) *
                                                                    Number(
                                                                        item.quantity ||
                                                                        0
                                                                    )}
                                                            </strong>

                                                        </p>

                                                    )
                                                )}

                                            </div>


                                            {/* TOTAL */}

                                            <p
                                                style={{
                                                    marginTop:
                                                        "10px",
                                                    paddingTop:
                                                        "8px",
                                                    borderTop:
                                                        "1px solid #eee"
                                                }}
                                            >

                                                <strong>
                                                    Total: ₹
                                                    {
                                                        order.total
                                                    }
                                                </strong>

                                            </p>

                                        </div>

                                    );
                                }
                            )
                        )}

                    </section>
                )}


            {/* ADD / EDIT MODAL */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="modal-card"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <h2>
                            {editingProduct
                                ? "Edit Product"
                                : "Add Product"}
                        </h2>

                        <form
                            onSubmit={
                                saveProduct
                            }
                        >

                            <label
                                style={{
                                    display:
                                        "block",
                                    fontSize:
                                        "9px",
                                    marginBottom:
                                        "5px"
                                }}
                            >
                                Product Image
                            </label>

                            {form.image && (

                                <div
                                    style={{
                                        width:
                                            "90px",
                                        height:
                                            "90px",
                                        marginBottom:
                                            "8px",
                                        borderRadius:
                                            "10px",
                                        background:
                                            "#f5f5f5",
                                        overflow:
                                            "hidden"
                                    }}
                                >

                                    <img
                                        src={
                                            form.image
                                        }
                                        alt="Preview"
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "100%",
                                            objectFit:
                                                "contain"
                                        }}
                                    />

                                </div>

                            )}

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={
                                    handleImageUpload
                                }
                            />

                            <small
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        "-5px",
                                    marginBottom:
                                        "9px",
                                    color:
                                        "#888",
                                    fontSize:
                                        "8px"
                                }}
                            >
                                JPG, PNG, WEBP • Max 2 MB
                            </small>

                            <input
                                name="name"
                                type="text"
                                placeholder="Product Name"
                                value={
                                    form.name
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <input
                                name="brand"
                                type="text"
                                placeholder="Brand"
                                value={
                                    form.brand
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <select
                                name="category"
                                value={
                                    form.category
                                }
                                onChange={
                                    handleFormChange
                                }
                            >

                                <option value="Pens">
                                    Pens
                                </option>

                                <option value="Notebooks">
                                    Notebooks
                                </option>

                                <option value="Books">
                                    Books
                                </option>

                                <option value="Files">
                                    Files
                                </option>

                                <option value="Art & Craft">
                                    Art & Craft
                                </option>

                                <option value="Printing">
                                    Printing
                                </option>

                            </select>

                            <input
                                name="price"
                                type="number"
                                min="0"
                                placeholder="Price ₹"
                                value={
                                    form.price
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <input
                                name="oldPrice"
                                type="number"
                                min="0"
                                placeholder="Old Price ₹"
                                value={
                                    form.oldPrice
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <input
                                name="stock"
                                type="number"
                                min="0"
                                placeholder="Stock Quantity"
                                value={
                                    form.stock
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <select
                                name="unit"
                                value={
                                    form.unit
                                }
                                onChange={
                                    handleFormChange
                                }
                            >

                                <option value="pieces">
                                    Pieces
                                </option>

                                <option value="pack">
                                    Pack
                                </option>

                                <option value="box">
                                    Box
                                </option>

                                <option value="set">
                                    Set
                                </option>

                            </select>

                            <input
                                name="discount"
                                type="text"
                                placeholder="e.g. 20% OFF"
                                value={
                                    form.discount
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <input
                                name="rating"
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                placeholder="Rating"
                                value={
                                    form.rating
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <input
                                name="reviews"
                                type="number"
                                min="0"
                                placeholder="Reviews"
                                value={
                                    form.reviews
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <textarea
                                name="description"
                                placeholder="Write product description..."
                                value={
                                    form.description
                                }
                                onChange={
                                    handleFormChange
                                }
                            />

                            <div className="modal-buttons">

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
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