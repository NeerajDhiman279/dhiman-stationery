import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/global.css";
import "./styles/components.css";
import "./styles/home.css";
import "./styles/cart.css";
import "./styles/product-details.css";
import "./styles/checkout.css";
import "./styles/success.css";
import "./styles/profile.css";
import "./styles/admin-login.css";
import "./styles/admin.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

