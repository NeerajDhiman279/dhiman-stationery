import { useState } from "react";

function AdminLogin({ loginSuccess, goBack }) {
    const [password, setPassword] = useState("");

    function handleLogin(e) {
        e.preventDefault();

        if (password === "123456") {
            loginSuccess();
        } else {
            alert("Wrong password");
            setPassword("");
        }
    }

    return (
        <main className="admin-login">

            <button
                className="login-back"
                onClick={goBack}
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

                <label>Admin Password</label>

                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    type="submit"
                    className="login-btn"
                >
                    Login
                </button>

            </form>

        </main>
    );
}

export default AdminLogin;