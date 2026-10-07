
function CartBar({ cart, goCart }) {
    const cartCount = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const cartTotal = cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    if (cartCount === 0) {
        return null;
    }

    return (
        <div className="cart-bar">

            <div className="cart-bar-left">

                <div className="cart-bar-icon">
                    🛒
                    <span>{cartCount}</span>
                </div>

                <div>
                    <strong>
                        {cartCount} item
                        {cartCount > 1 ? "s" : ""}
                    </strong>

                    <p>
                        ₹{cartTotal}
                    </p>
                </div>

            </div>

            <button
                className="view-cart-btn"
                onClick={goCart}
            >
                View Cart
                <span>→</span>
            </button>

        </div>
    );
}

export default CartBar;

