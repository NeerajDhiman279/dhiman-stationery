import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Cart from "./pages/Cart";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";

import CartBar from "./components/CartBar";
import BottomNav from "./components/BottomNav";

import productsData from "./data/products";

const DATA_VERSION = "dhiman-v2";

function App() {
  const isFreshVersion =
    localStorage.getItem("dhiman_data_version") ===
    DATA_VERSION;

  const [page, setPage] = useState("home");

  const [products, setProducts] = useState(() => {
    if (!isFreshVersion) return productsData;

    const savedProducts =
      localStorage.getItem("dhiman_products");

    return savedProducts
      ? JSON.parse(savedProducts)
      : productsData;
  });

  const [cart, setCart] = useState(() => {
    if (!isFreshVersion) return [];

    const savedCart =
      localStorage.getItem("dhiman_cart");

    return savedCart
      ? JSON.parse(savedCart)
      : [];
  });

  const [orders, setOrders] = useState(() => {
    if (!isFreshVersion) return [];

    const savedOrders =
      localStorage.getItem("dhiman_orders");

    return savedOrders
      ? JSON.parse(savedOrders)
      : [];
  });

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [orderId, setOrderId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [isAdminLoggedIn, setIsAdminLoggedIn] =
    useState(() => {
      return (
        localStorage.getItem(
          "dhiman_admin_login"
        ) === "true"
      );
    });

  /* --------------------------------
     DATA VERSION
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_data_version",
      DATA_VERSION
    );
  }, []);

  /* --------------------------------
     SAVE PRODUCTS
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_products",
      JSON.stringify(products)
    );
  }, [products]);

  /* --------------------------------
     SAVE CART
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  /* --------------------------------
     SAVE ORDERS
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  /* --------------------------------
     LIVE ORDER SYNC
     
     If Admin changes order status
     in another browser tab/window,
     customer side automatically gets
     the updated orders.
  -------------------------------- */

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key !== "dhiman_orders") {
        return;
      }

      if (!event.newValue) {
        setOrders([]);
        setSelectedOrder(null);
        return;
      }

      try {
        const updatedOrders =
          JSON.parse(event.newValue);

        if (!Array.isArray(updatedOrders)) {
          return;
        }

        setOrders(updatedOrders);

        /*
          If customer is currently viewing
          an order, keep selected order updated.
        */

        setSelectedOrder((currentSelectedOrder) => {
          if (!currentSelectedOrder) {
            return currentSelectedOrder;
          }

          const latestOrder =
            updatedOrders.find(
              (order) =>
                String(order.id) ===
                String(currentSelectedOrder.id)
            );

          return latestOrder || currentSelectedOrder;
        });
      } catch (error) {
        console.error(
          "Order sync error:",
          error
        );
      }
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  /* --------------------------------
     ADD TO CART
  -------------------------------- */

  function addToCart(product) {
    const currentStock =
      Number(product.stock || 0);

    if (currentStock <= 0) {
      alert("This product is out of stock");
      return;
    }

    setCart((prevCart) => {
      const existingItem =
        prevCart.find(
          (item) =>
            item.id === product.id
        );

      if (existingItem) {
        if (
          existingItem.quantity >=
          currentStock
        ) {
          alert(
            `Only ${currentStock} ${product.unit || "items"
            } available`
          );

          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity:
                item.quantity + 1
            }
            : item
        );
      }

      return [
        ...prevCart,
        {
          ...product,
          quantity: 1
        }
      ];
    });
  }

  /* --------------------------------
     UPDATE CART QUANTITY
  -------------------------------- */

  function updateQuantity(id, change) {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const product =
            products.find(
              (p) => p.id === id
            );

          const stock = Number(
            product?.stock ||
            item.stock ||
            0
          );

          const newQuantity =
            item.quantity + change;

          if (newQuantity <= 0) {
            return null;
          }

          if (newQuantity > stock) {
            alert(
              `Only ${stock} ${product?.unit ||
              "items"
              } available`
            );

            return item;
          }

          return {
            ...item,
            quantity: newQuantity
          };
        })
        .filter(Boolean)
    );
  }

  /* --------------------------------
     REMOVE FROM CART
  -------------------------------- */

  function removeFromCart(id) {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => item.id !== id
      )
    );
  }

  /* --------------------------------
     PRODUCT
  -------------------------------- */

  function openProduct(product) {
    setSelectedProduct(product);
    setPage("details");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     HOME
  -------------------------------- */

  function goHome() {
    setPage("home");
    setSelectedProduct(null);
    setSelectedOrder(null);
    setSearch("");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     CART
  -------------------------------- */

  function goCart() {
    setPage("cart");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     PROFILE
  -------------------------------- */

  function goProfile() {
    setPage("profile");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     ORDERS
  -------------------------------- */

  function goOrders() {
    setPage("orders");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     OPEN ORDER
  -------------------------------- */

  function openOrder(order) {
    setSelectedOrder(order);
    setPage("order-details");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     BACK FROM ORDER
  -------------------------------- */

  function goBackFromOrder() {
    setSelectedOrder(null);
    setPage("orders");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     CHECKOUT
  -------------------------------- */

  function goCheckout() {
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setPage("checkout");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     BACK TO CART
  -------------------------------- */

  function goBackToCart() {
    setPage("cart");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     ADMIN
  -------------------------------- */

  function openAdmin() {
    if (isAdminLoggedIn) {
      setPage("admin");
    } else {
      setPage("admin-login");
    }

    window.scrollTo(0, 0);
  }

  function adminLoginSuccess() {
    setIsAdminLoggedIn(true);

    localStorage.setItem(
      "dhiman_admin_login",
      "true"
    );

    setPage("admin");

    window.scrollTo(0, 0);
  }

  function logoutAdmin() {
    setIsAdminLoggedIn(false);

    localStorage.removeItem(
      "dhiman_admin_login"
    );

    setPage("profile");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     PLACE ORDER
  -------------------------------- */

  function placeOrder(orderId, customer) {
    const newOrder = {
      id: orderId,
      customer,
      items: cart,

      total: cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.quantity || 0),
        0
      ),

      status: "Pending",

      createdAt:
        new Date().toISOString()
    };

    setOrders((prevOrders) => [
      newOrder,
      ...prevOrders
    ]);

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const cartItem =
          cart.find(
            (item) =>
              item.id === product.id
          );

        if (!cartItem) {
          return product;
        }

        return {
          ...product,

          stock: Math.max(
            0,
            Number(
              product.stock || 0
            ) -
            Number(
              cartItem.quantity || 0
            )
          )
        };
      })
    );

    setOrderId(orderId);
    setCart([]);
    setPage("success");

    window.scrollTo(0, 0);
  }

  /* --------------------------------
     RENDER PAGES
  -------------------------------- */

  function renderPage() {

    /* HOME */

    if (page === "home") {
      return (
        <Home
          products={products}
          addToCart={addToCart}
          search={search}
          setSearch={setSearch}
          openProduct={openProduct}
        />
      );
    }

    /* CART */

    if (page === "cart") {
      return (
        <Cart
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          goHome={goHome}
          checkout={goCheckout}
        />
      );
    }

    /* PRODUCT DETAILS */

    if (page === "details") {
      if (!selectedProduct) {
        return null;
      }

      const latestProduct =
        products.find(
          (product) =>
            product.id ===
            selectedProduct.id
        ) || selectedProduct;

      return (
        <ProductDetails
          product={latestProduct}
          addToCart={addToCart}
          goHome={goHome}
        />
      );
    }

    /* CHECKOUT */

    if (page === "checkout") {
      return (
        <Checkout
          cart={cart}
          goBack={goBackToCart}
          orderPlaced={placeOrder}
        />
      );
    }

    /* SUCCESS */

    if (page === "success") {
      return (
        <OrderSuccess
          orderId={orderId}
          goHome={goHome}
        />
      );
    }

    /* PROFILE */

    if (page === "profile") {
      return (
        <Profile
          goHome={goHome}
          openAdmin={openAdmin}
          customerOrders={orders}
          openOrders={goOrders}
        />
      );
    }

    /* ORDERS */

    if (page === "orders") {
      return (
        <Orders
          orders={orders}
          goBack={goProfile}
          openOrder={openOrder}
        />
      );
    }

    /* ORDER DETAILS */

    if (page === "order-details") {

      if (!selectedOrder) {
        return null;
      }

      /*
        Always get latest order from
        current orders state.
      */

      const latestOrder =
        orders.find(
          (order) =>
            String(order.id) ===
            String(selectedOrder.id)
        ) || selectedOrder;

      let paymentLabel =
        "Cash on Delivery";

      if (
        latestOrder.customer?.payment ===
        "whatsapp"
      ) {
        paymentLabel = "WhatsApp";
      }

      if (
        latestOrder.customer?.payment ===
        "razorpay"
      ) {
        paymentLabel = "Online Payment";
      }

      return (
        <main className="cart-page">

          <div className="cart-page-header">

            <button
              type="button"
              className="cart-back-btn"
              onClick={
                goBackFromOrder
              }
              aria-label="Go back"
            >
              ←
            </button>

            <div>

              <h1>
                Order #
                {latestOrder.id}
              </h1>

              <p>
                {latestOrder.status ||
                  "Pending"}
              </p>

            </div>

          </div>

          <div className="cart-items">

            {latestOrder.items.map(
              (item) => (
                <div
                  className="cart-item"
                  key={item.id}
                >

                  <div className="cart-item-image">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span>
                        📦
                      </span>
                    )}

                  </div>

                  <div className="cart-item-info">

                    <h3>
                      {item.name}
                    </h3>

                    {item.brand && (
                      <p className="cart-brand">
                        {item.brand}
                      </p>
                    )}

                    <p className="cart-brand">
                      ₹{item.price} ×{" "}
                      {item.quantity}
                    </p>

                  </div>

                  <div className="cart-item-right">

                    <strong>
                      ₹
                      {Number(
                        item.price
                      ) *
                        Number(
                          item.quantity
                        )}
                    </strong>

                  </div>

                </div>
              )
            )}

          </div>

          <div className="cart-summary">

            <h3>
              Order Details
            </h3>

            <div className="summary-row">

              <span>
                Status
              </span>

              <strong>
                {latestOrder.status ||
                  "Pending"}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Payment
              </span>

              <span>
                {paymentLabel}

                {latestOrder.customer
                  ?.payment ===
                  "razorpay" &&
                  latestOrder.customer
                    ?.paymentStatus && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontWeight: "700"
                      }}
                    >
                      •{" "}
                      {
                        latestOrder
                          .customer
                          .paymentStatus
                      }
                    </span>
                  )}
              </span>

            </div>

            <div className="summary-row">

              <span>
                Customer
              </span>

              <span>
                {
                  latestOrder
                    .customer?.name
                }
              </span>

            </div>

            <div className="summary-row">

              <span>
                Mobile
              </span>

              <span>
                {
                  latestOrder
                    .customer?.phone
                }
              </span>

            </div>

            <div className="summary-row">

              <span>
                Address
              </span>

              <span>
                {
                  latestOrder
                    .customer?.address
                }
              </span>

            </div>

            <div className="summary-row total">

              <strong>
                Total Amount
              </strong>

              <strong>
                ₹
                {latestOrder.total}
              </strong>

            </div>

          </div>

        </main>
      );
    }

    /* ADMIN LOGIN */

    if (page === "admin-login") {
      return (
        <AdminLogin
          loginSuccess={
            adminLoginSuccess
          }
          goBack={goProfile}
        />
      );
    }

    /* ADMIN */

    if (page === "admin") {

      if (!isAdminLoggedIn) {
        setPage("admin-login");
        return null;
      }

      return (
        <Admin
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          logoutAdmin={logoutAdmin}
        />
      );
    }

    return null;
  }

  /* --------------------------------
     BOTTOM NAV
  -------------------------------- */

  const showBottomNav =
    page === "home" ||
    page === "cart" ||
    page === "profile";

  /* --------------------------------
     APP
  -------------------------------- */

  return (
    <div className="app-shell">

      {renderPage()}

      {page === "home" && (
        <CartBar
          cart={cart}
          goCart={goCart}
        />
      )}

      {showBottomNav && (
        <BottomNav
          page={page}
          goHome={goHome}
          goCart={goCart}
          goProfile={goProfile}
          cart={cart}
        />
      )}

    </div>
  );
}

export default App;