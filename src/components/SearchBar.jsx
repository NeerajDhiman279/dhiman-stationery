function SearchBar({ search, setSearch }) {
    return (
        <div className="search-bar">

            <span className="search-icon">
                🔍
            </span>

            <input
                type="text"
                placeholder="Search stationery, books, pens..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
            />

            {search && (
                <button
                    className="search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                >
                    ×
                </button>
            )}

        </div>
    );
}

export default SearchBar;

