
import { useMemo, useState } from "react";

import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import OfferBanner from "../components/OfferBanner";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";

import categories from "../data/categories";

function Home({
    products,
    addToCart,
    search,
    setSearch,
    openProduct
}) {
    const [selectedCategory, setSelectedCategory] =
        useState("All");

    const [sortBy, setSortBy] = useState("default");

    const filteredProducts = useMemo(() => {
        let result = [...products];

        /* Category filter */
        if (selectedCategory !== "All") {
            result = result.filter(
                (product) =>
                    product.category === selectedCategory
            );
        }

        /* Search filter */
        if (search.trim()) {
            const query = search.toLowerCase();

            result = result.filter((product) => {
                return (
                    product.name?.toLowerCase().includes(query) ||
                    product.brand?.toLowerCase().includes(query) ||
                    product.category?.toLowerCase().includes(query)
                );
            });
        }

        /* Sorting */
        if (sortBy === "low") {
            result.sort(
                (a, b) =>
                    Number(a.price || 0) -
                    Number(b.price || 0)
            );
        }

        if (sortBy === "high") {
            result.sort(
                (a, b) =>
                    Number(b.price || 0) -
                    Number(a.price || 0)
            );
        }

        if (sortBy === "rating") {
            result.sort(
                (a, b) =>
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
            );
        }

        return result;
    }, [
        products,
        selectedCategory,
        search,
        sortBy
    ]);

    function selectCategory(category) {
        setSelectedCategory(category);
    }

    return (
        <main className="home-page">

            {/* HEADER */}
            <Header />

            {/* SEARCH */}
            <SearchBar
                search={search}
                setSearch={setSearch}
            />

            {/* OFFER */}
            <OfferBanner />

            {/* CATEGORIES */}
            <section className="categories-section">

                <div className="section-heading">
                    <div>
                        <h2>Categories</h2>
                        <p className="categories-subtitle">
                            Shop by category
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSelectedCategory("All")
                        }
                    >
                        View All
                    </button>
                </div>

                <div className="categories-list">

                    <CategoryCard
                        category={{
                            id: 0,
                            name: "All",
                            icon: "🛍️"
                        }}
                        selected={
                            selectedCategory === "All"
                        }
                        onClick={() =>
                            selectCategory("All")
                        }
                    />

                    {categories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            selected={
                                selectedCategory === category.name
                            }
                            onClick={() =>
                                selectCategory(category.name)
                            }
                        />
                    ))}

                </div>
            </section>


            {/* PRODUCTS */}
            <section className="products-section">

                <div className="products-heading">
                    <h2>Popular Products</h2>

                    <p>
                        {filteredProducts.length}{" "}
                        {filteredProducts.length === 1
                            ? "product"
                            : "products"}
                    </p>
                </div>


                {/* SORT */}
                <div className="product-sort">

                    <select
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(e.target.value)
                        }
                        aria-label="Sort products"
                    >
                        <option value="default">
                            Sort
                        </option>

                        <option value="low">
                            Price: Low to High
                        </option>

                        <option value="high">
                            Price: High to Low
                        </option>

                        <option value="rating">
                            Top Rated
                        </option>
                    </select>

                </div>


                {/* PRODUCT LIST */}
                {filteredProducts.length > 0 ? (

                    <div className="product-grid">

                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                addToCart={addToCart}
                                openProduct={openProduct}
                            />
                        ))}

                    </div>

                ) : (

                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            🔍
                        </div>

                        <h2>
                            No products found
                        </h2>

                        <p>
                            Try another product or category.
                        </p>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={() => {
                                setSearch("");
                                setSelectedCategory("All");
                            }}
                        >
                            View All Products
                        </button>
                    </div>

                )}

            </section>

        </main>
    );
}

export default Home;

