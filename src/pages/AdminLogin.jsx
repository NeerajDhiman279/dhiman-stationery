import { useState } from "react";

const API_URL =
    "https://dhiman-stationery-server.onrender.com";

function AdminLogin({ loginSuccess, goBack }) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();

        if (!password.trim()) {
            alert("Please enter admin password");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/admin/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Wrong password"
                );
            }

            if (!data.token) {
                throw new Error(
                    "Admin token nahi mila."
                );
            }

            localStorage.setItem(
                "dhiman_admin_token",
                data.token
            );

            loginSuccess();

        } catch (error) {
            console.error(
                "Admin login error:",
                error
            );

            alert(
                error.message ||
                "Admin login failed"
            );

            setPassword("");

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="admin-login">

            <button
                className="login-back"
                onClick={goBack}
                type="button"
            >
                ←
            </button>

            <div className="login-icon">
                🔐
            </div>

            <h1>Admin Login</h1>

            <p>
                Dhiman Stationery
            </p>

            <form onSubmit={handleLogin}>

                <label>
                    Admin Password
                </label>

                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    disabled={loading}
                />

                <button
                    type="submit"
                    className="login-btn"
                    disabled={loading}
                >
                    {loading
                        ? "Logging in..."
                        : "Login"}
                </button>

            </form>

        </main>
    );
}

export default AdminLogin;