
function Cart({
    cart,
    updateQuantity,
    removeFromCart,
    goHome,
    checkout
}) {
    const subtotal = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );

    const deliveryCharge =
        subtotal >= 500 || subtotal === 0
            ? 0
            : 30;

    const total =
        subtotal + deliveryCharge;

    const totalItems = cart.reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0),
        0
    );

    return (
        <main className="cart-page">

            {/* =========================
          HEADER
      ========================= */}

            <div className="cart-page-header">

                <button
                    type="button"
                    className="cart-back-btn"
                    onClick={goHome}
                    aria-label="Go back"
                >
                    ←
                </button>

                <div>
                    <h1>My Cart</h1>

                    <p>
                        {totalItems}{" "}
                        {totalItems === 1
                            ? "item"
                            : "items"}
                    </p>
                </div>

            </div>


            {/* =========================
          EMPTY CART
      ========================= */}

            {cart.length === 0 ? (

                <div className="empty-cart">

                    <div className="empty-cart-icon">
                        🛒
                    </div>

                    <h2>
                        Your cart is empty
                    </h2>

                    <p>
                        Add some stationery products
                        to your cart.
                    </p>

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={goHome}
                    >
                        Continue Shopping
                    </button>

                </div>

            ) : (

                <>

                    {/* =========================
              CART ITEMS
          ========================= */}

                    <div className="cart-items">

                        {cart.map((item) => {

                            const itemTotal =
                                Number(item.price || 0) *
                                Number(item.quantity || 0);

                            const stock =
                                Number(item.stock || 0);

                            return (
                                <div
                                    className="cart-item"
                                    key={item.id}
                                >

                                    {/* IMAGE */}

                                    <div className="cart-item-image">

                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                            />
                                        ) : (
                                            <span>📦</span>
                                        )}

                                    </div>


                                    {/* PRODUCT INFO */}

                                    <div className="cart-item-info">

                                        <h3>
                                            {item.name}
                                        </h3>

                                        {item.brand && (
                                            <p className="cart-brand">
                                                {item.brand}
                                            </p>
                                        )}

                                        <strong className="cart-price">
                                            ₹{item.price}
                                        </strong>


                                        {/* QUANTITY */}

                                        <div className="quantity-control">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        -1
                                                    )
                                                }
                                                aria-label="Decrease quantity"
                                            >
                                                −
                                            </button>

                                            <span>
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        1
                                                    )
                                                }
                                                disabled={
                                                    stock > 0 &&
                                                    item.quantity >= stock
                                                }
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>

                                        </div>

                                    </div>


                                    {/* RIGHT SIDE */}

                                    <div className="cart-item-right">

                                        <strong>
                                            ₹{itemTotal}
                                        </strong>

                                        <button
                                            type="button"
                                            className="remove-cart-item"
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            aria-label="Remove item"
                                        >
                                            ×
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>


                    {/* =========================
              FREE DELIVERY
          ========================= */}

                    <div className="delivery-message">

                        <span>
                            🚚
                        </span>

                        <p>
                            {subtotal >= 500
                                ? "You got FREE delivery!"
                                : `Add ₹${500 - subtotal
                                } more for FREE delivery`}
                        </p>

                    </div>


                    {/* =========================
              ORDER SUMMARY
          ========================= */}

                    <div className="cart-summary">

                        <h3>
                            Order Summary
                        </h3>

                        <div className="summary-row">

                            <span>
                                Subtotal
                            </span>

                            <span>
                                ₹{subtotal}
                            </span>

                        </div>


                        <div className="summary-row">

                            <span>
                                Delivery
                            </span>

                            <span>
                                {deliveryCharge === 0
                                    ? "FREE"
                                    : `₹${deliveryCharge}`}
                            </span>

                        </div>


                        <div className="summary-row total">

                            <strong>
                                Total Amount
                            </strong>

                            <strong>
                                ₹{total}
                            </strong>

                        </div>

                    </div>


                    {/* =========================
              CHECKOUT
          ========================= */}

                    <button
                        type="button"
                        className="checkout-btn"
                        onClick={checkout}
                    >

                        <span>
                            Proceed to Checkout
                        </span>

                        <strong>
                            ₹{total}
                        </strong>

                        <span>
                            →
                        </span>

                    </button>

                </>

            )}

        </main>
    );
}

export default Cart;

