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

const API_BASE_URL =
  "https://dhiman-stationery-server.onrender.com";

const DATA_VERSION = "dhiman-v5";

function App() {
  const [page, setPage] = useState("home");

  /* --------------------------------
     PRODUCTS
  -------------------------------- */

  const [products, setProducts] = useState([]);

  const [productsLoading, setProductsLoading] =
    useState(true);

  /* --------------------------------
     CART
  -------------------------------- */

  const [cart, setCart] = useState(() => {
    const savedCart =
      localStorage.getItem("dhiman_cart");

    return savedCart
      ? JSON.parse(savedCart)
      : [];
  });

  /* --------------------------------
     ORDERS
  -------------------------------- */

  const [orders, setOrders] = useState([]);

  /* --------------------------------
     CUSTOMER ORDER TOKENS
  -------------------------------- */

  const [customerTokens, setCustomerTokens] =
    useState(() => {
      const savedTokens =
        localStorage.getItem(
          "dhiman_customer_tokens"
        );

      if (!savedTokens) {
        return [];
      }

      try {
        const parsedTokens =
          JSON.parse(savedTokens);

        if (!Array.isArray(parsedTokens)) {
          return [];
        }

        return parsedTokens.filter(
          (token) =>
            typeof token === "string" &&
            token.trim() !== ""
        );

      } catch (error) {
        console.error(
          "Customer token parse error:",
          error
        );

        return [];
      }
    });

  /* --------------------------------
     SELECTED DATA
  -------------------------------- */

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [orderId, setOrderId] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* --------------------------------
     ADMIN LOGIN
  -------------------------------- */

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
     SAVE CUSTOMER TOKENS
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_customer_tokens",
      JSON.stringify(customerTokens)
    );
  }, [customerTokens]);

  /* --------------------------------
     LOAD PRODUCTS FROM DATABASE
  -------------------------------- */

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/products`
        );

        if (!response.ok) {
          throw new Error(
            `Products API error: ${response.status}`
          );
        }

        const data = await response.json();

        if (
          !data.success ||
          !Array.isArray(data.products)
        ) {
          throw new Error(
            "Invalid products response"
          );
        }

        const databaseProducts =
          data.products.map((product) => {
            const localProduct =
              productsData.find(
                (localItem) => {
                  if (!localItem.image) {
                    return false;
                  }

                  const localImageName =
                    localItem.image
                      .split("/")
                      .pop();

                  return (
                    localImageName ===
                    product.image
                  );
                }
              );

            return {
              ...product,

              price: Number(
                product.price || 0
              ),

              oldPrice:
                product.oldPrice !== null &&
                  product.oldPrice !== undefined
                  ? Number(product.oldPrice)
                  : null,

              rating: Number(
                product.rating || 0
              ),

              reviews: Number(
                product.reviews || 0
              ),

              stock: Number(
                product.stock || 0
              ),

              image:
                localProduct?.image ||
                product.image ||
                ""
            };
          });

        setProducts(databaseProducts);

        console.log(
          "Products loaded from PostgreSQL:",
          databaseProducts
        );

      } catch (error) {
        console.error(
          "Load products error:",
          error
        );

        setProducts(productsData);

        alert(
          "Unable to load products from server. Showing local products."
        );

      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  /* --------------------------------
     LOAD CUSTOMER ORDERS
     TOKEN BASED
  -------------------------------- */

  async function loadOrdersFromDatabase() {
    try {
      /*
       * No customer token means
       * there are no customer orders
       * to load.
       */

      if (
        !Array.isArray(customerTokens) ||
        customerTokens.length === 0
      ) {
        setOrders([]);

        setSelectedOrder(
          (currentSelectedOrder) => {
            if (!currentSelectedOrder) {
              return null;
            }

            return currentSelectedOrder;
          }
        );

        return [];
      }

      const allOrders = [];

      /*
       * Each order has its own secure token.
       * Fetch orders using each saved token.
       */

      for (const token of customerTokens) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/customer/orders`,
            {
              method: "GET",

              headers: {
                "x-customer-token": token
              }
            }
          );

          if (!response.ok) {
            console.error(
              "Customer orders API error:",
              response.status
            );

            continue;
          }

          const data =
            await response.json();

          if (
            !data.success ||
            !Array.isArray(data.orders)
          ) {
            continue;
          }

          allOrders.push(
            ...data.orders
          );

        } catch (error) {
          console.error(
            "Customer token order fetch error:",
            error
          );
        }
      }

      /*
       * Remove duplicate orders.
       */

      const uniqueOrders = [];

      const seenOrderIds =
        new Set();

      for (const order of allOrders) {
        const orderKey =
          String(order.id);

        if (
          seenOrderIds.has(orderKey)
        ) {
          continue;
        }

        seenOrderIds.add(
          orderKey
        );

        uniqueOrders.push(order);
      }

      /*
       * Newest orders first.
       */

      uniqueOrders.sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

      setOrders(uniqueOrders);

      /*
       * Update currently opened order
       * with latest database status.
       */

      setSelectedOrder(
        (currentSelectedOrder) => {
          if (!currentSelectedOrder) {
            return currentSelectedOrder;
          }

          const latestOrder =
            uniqueOrders.find(
              (order) =>
                String(order.id) ===
                String(
                  currentSelectedOrder.id
                )
            );

          return (
            latestOrder ||
            currentSelectedOrder
          );
        }
      );

      return uniqueOrders;

    } catch (error) {
      console.error(
        "Load customer orders error:",
        error
      );

      return null;
    }
  }

  /* --------------------------------
     INITIAL CUSTOMER ORDER LOAD
  -------------------------------- */

  useEffect(() => {
    loadOrdersFromDatabase();
  }, [customerTokens]);

  /* --------------------------------
     ORDER PAGE LIVE SYNC
  -------------------------------- */

  useEffect(() => {
    if (
      page !== "orders" &&
      page !== "order-details"
    ) {
      return;
    }

    loadOrdersFromDatabase();

    const syncInterval =
      setInterval(() => {
        loadOrdersFromDatabase();
      }, 10000);

    return () => {
      clearInterval(syncInterval);
    };

  }, [
    page,
    customerTokens
  ]);

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
     SAVE ORDERS LOCALLY
     
     LocalStorage is only a cache.
     PostgreSQL is the main database.
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "dhiman_orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  /* --------------------------------
     LIVE ORDER SYNC
  -------------------------------- */

  useEffect(() => {
    function handleStorageChange(event) {
      if (
        event.key !==
        "dhiman_customer_tokens"
      ) {
        return;
      }

      if (!event.newValue) {
        setCustomerTokens([]);
        setOrders([]);
        setSelectedOrder(null);
        return;
      }

      try {
        const updatedTokens =
          JSON.parse(
            event.newValue
          );

        if (
          !Array.isArray(
            updatedTokens
          )
        ) {
          return;
        }

        setCustomerTokens(
          updatedTokens
        );

      } catch (error) {
        console.error(
          "Customer token sync error:",
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
      alert(
        "This product is out of stock"
      );

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

  function updateQuantity(
    id,
    change
  ) {
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
              `Only ${stock} ${product?.unit || "items"
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
     SAVE CUSTOMER TOKEN
  -------------------------------- */

  function saveCustomerToken(
    customerToken
  ) {
    if (
      !customerToken ||
      typeof customerToken !==
      "string"
    ) {
      return;
    }

    setCustomerTokens(
      (prevTokens) => {
        if (
          prevTokens.includes(
            customerToken
          )
        ) {
          return prevTokens;
        }

        return [
          ...prevTokens,
          customerToken
        ];
      }
    );
  }

  /* --------------------------------
     PLACE ORDER
  -------------------------------- */

  async function placeOrder(
    orderId,
    customer
  ) {
    try {
      const total = cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.quantity || 0),
        0
      );

      const newOrder = {
        id: orderId,

        customer,

        items: cart,

        total,

        status: "Pending",

        createdAt:
          new Date().toISOString()
      };

      const response = await fetch(
        `${API_BASE_URL}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(
            newOrder
          )
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to save order"
        );
      }

      /*
       * Save secure customer token.
       */

      if (data.customerToken) {
        saveCustomerToken(
          data.customerToken
        );
      }

      /*
       * Add the new order locally.
       */

      setOrders((prevOrders) => [
        newOrder,
        ...prevOrders
      ]);

      /*
       * Update local product stock
       * after successful database order.
       */

      setProducts(
        (prevProducts) =>
          prevProducts.map(
            (product) => {
              const cartItem =
                cart.find(
                  (item) =>
                    item.id ===
                    product.id
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
                    cartItem.quantity ||
                    0
                  )
                )
              };
            }
          )
      );

      setOrderId(orderId);

      setCart([]);

      setPage("success");

      window.scrollTo(0, 0);

    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      alert(
        error.message ||
        "Order save nahi ho paya. Please try again."
      );
    }
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
          updateQuantity={
            updateQuantity
          }
          removeFromCart={
            removeFromCart
          }
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

      const latestOrder =
        orders.find(
          (order) =>
            String(order.id) ===
            String(
              selectedOrder.id
            )
        ) || selectedOrder;

      let paymentLabel =
        "Cash on Delivery";

      if (
        latestOrder.customer?.payment ===
        "whatsapp"
      ) {
        paymentLabel =
          "WhatsApp";
      }

      if (
        latestOrder.customer?.payment ===
        "razorpay"
      ) {
        paymentLabel =
          "Online Payment";
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
              (item, index) => (
                <div
                  className="cart-item"
                  key={
                    item.id ||
                    `${item.name}-${index}`
                  }
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
                        marginLeft:
                          "6px",
                        fontWeight:
                          "700"
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

  if (
    productsLoading &&
    products.length === 0
  ) {
    return (
      <div className="app-shell">

        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "20px",
            textAlign: "center"
          }}
        >
          <div>

            <div
              style={{
                fontSize: "40px",
                marginBottom:
                  "12px"
              }}
            >
              🛍️
            </div>

            <h2>
              Loading products...
            </h2>

            <p>
              Please wait
            </p>

          </div>
        </main>

      </div>
    );
  }

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