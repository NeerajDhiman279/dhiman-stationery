
function BottomNav({
    page,
    goHome,
    goCart,
    goProfile,
    cart
}) {
    const cartCount = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    return (
        <nav className="bottom-nav">

            {/* HOME */}

            <button
                type="button"
                className={`bottom-nav-item ${page === "home" ? "active" : ""
                    }`}
                onClick={goHome}
                aria-label="Home"
            >
                <span className="bottom-nav-icon">
                    🏠
                </span>

                <span>
                    Home
                </span>
            </button>


            {/* CART */}

            <button
                type="button"
                className={`bottom-nav-item ${page === "cart" ? "active" : ""
                    }`}
                onClick={goCart}
                aria-label="Cart"
            >
                <span className="bottom-nav-icon cart-icon">

                    🛒

                    {cartCount > 0 && (
                        <span className="bottom-cart-badge">
                            {cartCount > 99
                                ? "99+"
                                : cartCount}
                        </span>
                    )}

                </span>

                <span>
                    Cart
                </span>
            </button>


            {/* PROFILE */}

            <button
                type="button"
                className={`bottom-nav-item ${page === "profile" ? "active" : ""
                    }`}
                onClick={goProfile}
                aria-label="Profile"
            >
                <span className="bottom-nav-icon">
                    👤
                </span>

                <span>
                    Profile
                </span>
            </button>

        </nav>
    );
}

export default BottomNav;

