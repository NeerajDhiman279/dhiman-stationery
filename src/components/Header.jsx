function Header() {
    return (
        <header className="header">

            <div className="header-left">

                <p>Welcome to</p>

                <h1>
                    Dhiman Stationery
                </h1>

                <span>
                    Your everyday stationery store
                </span>

            </div>


            <button
                className="notification-btn"
                aria-label="Notifications"
            >
                <span>🔔</span>

                <b></b>
            </button>

        </header>
    );
}

export default Header;

