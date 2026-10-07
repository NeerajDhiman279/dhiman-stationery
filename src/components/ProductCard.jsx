
function ProductCard({
    product,
    addToCart,
    openProduct
}) {
    const stock = Number(product.stock || 0);
    const isOutOfStock = stock <= 0;

    return (
        <div
            className="product-card"
            onClick={() => openProduct(product)}
        >
            <div className="product-image">
                <img
                    src={product.image}
                    alt={product.name}
                />

                {isOutOfStock && (
                    <div className="out-of-stock">
                        Out of Stock
                    </div>
                )}
            </div>

            <div className="product-info">
                <h3>{product.name}</h3>

                <p className="product-rating">
                    ⭐ {product.rating || 0}
                    <span>
                        ({product.reviews || 0})
                    </span>
                </p>

                <div className="price-row">
                    <strong>₹{product.price}</strong>

                    {product.oldPrice > product.price && (
                        <span>₹{product.oldPrice}</span>
                    )}
                </div>

                <div className="product-action">
                    <p>
                        {isOutOfStock
                            ? "Currently unavailable"
                            : product.discount || "Available"}
                    </p>

                    <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                            e.stopPropagation();

                            if (!isOutOfStock) {
                                addToCart(product);
                            }
                        }}
                    >
                        {isOutOfStock ? "×" : "+"}
                    </button>
                </div>

                {!isOutOfStock && (
                    <button
                        type="button"
                        className="buy-now-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            openProduct(product);
                        }}
                    >
                        Buy Now
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProductCard;

