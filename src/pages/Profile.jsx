
function Profile({
    goHome,
    openAdmin,
    customerOrders = [],
    openOrders
}) {
    const shopPhone = "916280522760";

    function callShop() {
        window.location.href = `tel:+${shopPhone}`;
    }

    function openWhatsApp() {
        window.open(
            `https://wa.me/${shopPhone}?text=Hello%20Dhiman%20Stationery,%20I%20want%20to%20know%20about%20your%20products.`,
            "_blank"
        );
    }

    function openMaps() {
        window.open(
            "https://www.google.com/maps/search/?api=1&query=Dhiman+Stationery+Nurpur+Bedi+Rupnagar+Punjab",
            "_blank"
        );
    }

    const orderCount = customerOrders.length;

    return (
        <main className="profile-page">

            {/* =========================
          HEADER
      ========================= */}

            <div className="profile-page-header">

                <button
                    type="button"
                    className="profile-back-btn"
                    onClick={goHome}
                    aria-label="Go back"
                >
                    ←
                </button>

                <h1>
                    My Shop
                </h1>

            </div>


            {/* =========================
          SHOP PROFILE
      ========================= */}

            <section className="shop-profile">

                <div className="shop-logo">
                    DS
                </div>

                <h2>
                    Dhiman Stationery
                </h2>

                <p>
                    Stationery • Printing • School Supplies
                </p>

            </section>


            {/* =========================
          MY ORDERS
      ========================= */}

            <section className="my-orders-entry">

                <button
                    type="button"
                    onClick={() => {
                        if (openOrders) {
                            openOrders();
                        }
                    }}
                >

                    <div className="my-orders-icon">
                        📦
                    </div>

                    <div className="my-orders-text">

                        <strong>
                            My Orders
                        </strong>

                        <p>
                            {orderCount}{" "}
                            {orderCount === 1
                                ? "order"
                                : "orders"}
                        </p>

                    </div>

                    <span className="my-orders-arrow">
                        →
                    </span>

                </button>

            </section>


            {/* =========================
          SHOP INFORMATION
      ========================= */}

            <section className="profile-section">

                <div className="profile-card">

                    <div className="profile-card-icon">
                        📍
                    </div>

                    <div>

                        <strong>
                            Shop Location
                        </strong>

                        <p>
                            Nurpur Bedi,
                            Rupnagar, Punjab
                        </p>

                    </div>

                </div>


                <div className="profile-card">

                    <div className="profile-card-icon">
                        🕒
                    </div>

                    <div>

                        <strong>
                            Opening Hours
                        </strong>

                        <p>
                            Monday – Sunday
                        </p>

                        <small>
                            Contact shop for today's timing
                        </small>

                    </div>

                </div>

            </section>


            {/* =========================
          SERVICES
      ========================= */}

            <section className="services-section">

                <h2>
                    Our Services
                </h2>

                <div className="services-list">

                    <div>
                        <span>
                            📚
                        </span>

                        <p>
                            Stationery
                        </p>
                    </div>


                    <div>
                        <span>
                            🖨️
                        </span>

                        <p>
                            Printing
                        </p>
                    </div>


                    <div>
                        <span>
                            📄
                        </span>

                        <p>
                            Photocopy
                        </p>
                    </div>


                    <div>
                        <span>
                            🎨
                        </span>

                        <p>
                            Art & Craft
                        </p>
                    </div>

                </div>

            </section>


            {/* =========================
          CONTACT
      ========================= */}

            <section className="contact-section">

                <button
                    type="button"
                    className="contact-btn"
                    onClick={callShop}
                >

                    <span>
                        📞
                    </span>

                    <div>
                        <strong>
                            Call Shop
                        </strong>

                        <small>
                            Talk directly with the shop
                        </small>
                    </div>

                    <b>
                        →
                    </b>

                </button>


                <button
                    type="button"
                    className="contact-btn"
                    onClick={openWhatsApp}
                >

                    <span>
                        💬
                    </span>

                    <div>
                        <strong>
                            WhatsApp
                        </strong>

                        <small>
                            Chat with Dhiman Stationery
                        </small>
                    </div>

                    <b>
                        →
                    </b>

                </button>


                <button
                    type="button"
                    className="contact-btn"
                    onClick={openMaps}
                >

                    <span>
                        📍
                    </span>

                    <div>
                        <strong>
                            Open in Google Maps
                        </strong>

                        <small>
                            Find our shop location
                        </small>
                    </div>

                    <b>
                        →
                    </b>

                </button>

            </section>


            {/* =========================
          ADMIN
      ========================= */}

            <section className="admin-entry">

                <button
                    type="button"
                    onClick={openAdmin}
                >

                    <span>
                        ⚙️
                    </span>

                    <div>
                        <strong>
                            Admin Panel
                        </strong>

                        <small>
                            Manage products and orders
                        </small>
                    </div>

                    <b>
                        →
                    </b>

                </button>

            </section>

        </main>
    );
}

export default Profile;

