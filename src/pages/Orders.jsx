function Orders({ orders, goBack, openOrder }) {
    return (
        <main className="profile-page">
            <div className="profile-page-header">
                <button
                    type="button"
                    className="profile-back-btn"
                    onClick={goBack}
                    aria-label="Go back"
                >
                    ←
                </button>

                <h1>My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="empty-cart">
                    <div className="empty-cart-icon">
                        📦
                    </div>

                    <h2>No orders yet</h2>

                    <p>
                        Your placed orders will appear here.
                    </p>

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={goBack}
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <section className="cart-items">
                    {orders.map((order) => {
                        const totalItems =
                            order.items?.reduce(
                                (sum, item) =>
                                    sum +
                                    Number(item.quantity || 0),
                                0
                            ) || 0;

                        const orderDate = order.createdAt
                            ? new Date(
                                order.createdAt
                            ).toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            )
                            : "";

                        const orderStatus =
                            order.status || "Pending";

                        return (
                            <button
                                type="button"
                                className="cart-item"
                                key={order.id}
                                onClick={() =>
                                    openOrder(order)
                                }
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    cursor: "pointer"
                                }}
                            >
                                <div className="cart-item-image">
                                    <span>📦</span>
                                </div>

                                <div className="cart-item-info">
                                    <h3>
                                        Order #{order.id}
                                    </h3>

                                    <p className="cart-brand">
                                        {orderDate}
                                    </p>

                                    <p className="cart-brand">
                                        {totalItems}{" "}
                                        {totalItems === 1
                                            ? "item"
                                            : "items"}
                                    </p>

                                    <strong className="cart-price">
                                        ₹{Number(order.total || 0).toFixed(2)}
                                    </strong>
                                </div>

                                <div className="cart-item-right">
                                    <strong>
                                        {orderStatus}
                                    </strong>

                                    <span
                                        style={{
                                            fontSize: "18px",
                                            marginTop: "8px"
                                        }}
                                    >
                                        →
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default Orders;