
function ProductDetails({
    product,
    addToCart,
    // goCart,
    goHome
}) {
    const stock = Number(product?.stock || 0);
    const outOfStock = stock <= 0;

    if (!product) {
        return null;
    }
    function goCart() {
        setPage("cart");

        window.scrollTo(0, 0);
    }
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#f7f7f7",
                paddingBottom: "25px"
            }}
        >
            {/* TOP BAR */}
            <div
                style={{
                    height: "64px",
                    padding: "0 16px",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderBottom: "1px solid #eee"
                }}
            >
                <button
                    type="button"
                    onClick={goHome}
                    style={{
                        width: "38px",
                        height: "38px",
                        border: "1px solid #e5e5e5",
                        borderRadius: "50%",
                        background: "#fff",
                        fontSize: "20px"
                    }}
                >
                    ←
                </button>

                <strong
                    style={{
                        fontSize: "18px"
                    }}
                >
                    Product Details
                </strong>
            </div>

            {/* PRODUCT IMAGE */}
            <section
                style={{
                    margin: "12px",
                    height: "285px",
                    borderRadius: "18px",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                }}
            >
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            padding: "25px"
                        }}
                    />
                ) : (
                    <span
                        style={{
                            fontSize: "60px"
                        }}
                    >
                        📦
                    </span>
                )}
            </section>

            {/* PRODUCT INFORMATION */}
            <section
                style={{
                    margin: "12px",
                    padding: "17px",
                    background: "#fff",
                    borderRadius: "17px"
                }}
            >
                {product.category && (
                    <p
                        style={{
                            color: "#888",
                            fontSize: "10px",
                            marginBottom: "5px"
                        }}
                    >
                        {product.category}
                    </p>
                )}

                <h1
                    style={{
                        fontSize: "22px",
                        lineHeight: "1.2"
                    }}
                >
                    {product.name}
                </h1>

                {product.brand && (
                    <p
                        style={{
                            marginTop: "5px",
                            color: "#777",
                            fontSize: "11px"
                        }}
                    >
                        Brand: {product.brand}
                    </p>
                )}

                {/* RATING */}
                <div
                    style={{
                        marginTop: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px"
                        }}
                    >
                        ⭐
                    </span>

                    <strong
                        style={{
                            fontSize: "12px"
                        }}
                    >
                        {product.rating || 0}
                    </strong>

                    <span
                        style={{
                            color: "#888",
                            fontSize: "10px"
                        }}
                    >
                        ({product.reviews || 0} reviews)
                    </span>
                </div>

                {/* PRICE */}
                <div
                    style={{
                        marginTop: "15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "9px"
                    }}
                >
                    <strong
                        style={{
                            fontSize: "24px"
                        }}
                    >
                        ₹{product.price}
                    </strong>

                    {product.oldPrice >
                        product.price && (
                            <span
                                style={{
                                    color: "#999",
                                    textDecoration:
                                        "line-through",
                                    fontSize: "12px"
                                }}
                            >
                                ₹{product.oldPrice}
                            </span>
                        )}

                    {product.discount && (
                        <span
                            style={{
                                padding: "4px 7px",
                                borderRadius: "6px",
                                background: "#eee",
                                fontSize: "9px",
                                fontWeight: "700"
                            }}
                        >
                            {product.discount}
                        </span>
                    )}
                </div>

                {/* STOCK */}
                <div
                    style={{
                        marginTop: "12px",
                        padding: "9px 11px",
                        borderRadius: "9px",
                        background: outOfStock
                            ? "#f3f3f3"
                            : "#f5f5f5",
                        color: outOfStock
                            ? "#777"
                            : "#333",
                        fontSize: "10px"
                    }}
                >
                    {outOfStock
                        ? "Currently out of stock"
                        : `${stock} ${product.unit || "items"} available`}
                </div>
            </section>

            {/* DESCRIPTION */}
            <section
                style={{
                    margin: "12px",
                    padding: "17px",
                    background: "#fff",
                    borderRadius: "17px"
                }}
            >
                <h2
                    style={{
                        fontSize: "15px",
                        marginBottom: "8px"
                    }}
                >
                    Product Description
                </h2>

                <p
                    style={{
                        color: "#666",
                        fontSize: "11px",
                        lineHeight: "1.7"
                    }}
                >
                    {product.description ||
                        "Good quality stationery product suitable for school, college and office use."}
                </p>
            </section>

            {/* ADD TO CART */}
            <div
                style={{
                    position: "sticky",
                    bottom: "0",
                    margin: "12px",
                    padding: "10px",
                    borderRadius: "15px",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                }}
            >
                <div
                    style={{
                        color: "#fff"
                    }}
                >
                    <small
                        style={{
                            display: "block",
                            color: "#aaa",
                            fontSize: "8px"
                        }}
                    >
                        Price
                    </small>

                    <strong
                        style={{
                            fontSize: "17px"
                        }}
                    >
                        ₹{product.price}
                    </strong>
                </div>
                <button onClick={() => {
                    goHome()
                }}
                    style={{

                        height: "43px",
                        padding: "0 18px",
                        border: "0",
                        borderRadius: "11px",
                        fontWeight: "700",
                        fontSize: "11px"
                    }}
                >Buy</button>
                <button
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                        if (!outOfStock) {
                            addToCart(product);
                        }
                    }}
                    style={{
                        height: "43px",
                        padding: "0 18px",
                        border: "0",
                        borderRadius: "11px",
                        background: outOfStock
                            ? "#555"
                            : "#fff",
                        color: outOfStock
                            ? "#bbb"
                            : "#111",
                        fontWeight: "700",
                        fontSize: "11px"
                    }}
                >
                    {outOfStock
                        ? "Out of Stock"
                        : "Add to Cart →"}
                </button>

            </div>
        </main >
    );
}

export default ProductDetails;

