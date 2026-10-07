function CategoryCard({
    category,
    selected,
    onClick
}) {
    return (
        <button
            className={`category-card ${selected ? "selected-category" : ""
                }`}
            onClick={onClick}
        >
            <div className="category-icon">
                {category.icon}
            </div>

            <p>{category.name}</p>
        </button>
    );
}

export default CategoryCard;