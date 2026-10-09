
import { useRef, useState } from "react";
import {
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Auth({ onContinueGuest, onAuthenticated }) {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const verifier = useRef(null);

    async function loginWithGoogle() {
        setError("");
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            onAuthenticated?.(result.user);
        } catch (err) {
            setError(err.message || "Google login failed.");
        } finally {
            setLoading(false);
        }
    }

    async function sendOTP() {
        setError("");

        const digits = phone.replace(/\D/g, "");

        if (digits.length !== 10) {
            setError("Please enter a valid 10-digit Indian mobile number.");
            return;
        }

        setLoading(true);

        try {
            if (verifier.current) {
                verifier.current.clear();
            }

            verifier.current = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                { size: "normal" }
            );

            const result = await signInWithPhoneNumber(
                auth,
                `+91${digits}`,
                verifier.current
            );

            setConfirmation(result);
            setError("");
        } catch (err) {
            verifier.current?.clear();
            verifier.current = null;
            setError(err.message || "Could not send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function verifyOTP() {
        setError("");

        if (!confirmation || otp.trim().length !== 6) {
            setError("Please enter the 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            const result = await confirmation.confirm(otp.trim());
            onAuthenticated?.(result.user);
        } catch (err) {
            setError("OTP is incorrect or expired. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={styles.page}>
            <section style={styles.card}>
                <h1 style={styles.title}>Dhiman Stationery</h1>
                <p style={styles.subtitle}>Sign in to your account</p>

                {error && <p style={styles.error}>{error}</p>}

                <button
                    style={styles.googleButton}
                    onClick={loginWithGoogle}
                    disabled={loading}
                >
                    Continue with Google
                </button>

                <div style={styles.divider}>OR</div>

                <label style={styles.label} htmlFor="phone">
                    Mobile number
                </label>

                <div style={styles.phoneRow}>
                    <span style={styles.countryCode}>+91</span>
                    <input
                        id="phone"
                        style={styles.input}
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        maxLength={10}
                        onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                        }
                        disabled={!!confirmation || loading}
                    />
                </div>

                {!confirmation ? (
                    <button
                        style={styles.primaryButton}
                        onClick={sendOTP}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : "Send OTP"}
                    </button>
                ) : (
                    <>
                        <label style={styles.label} htmlFor="otp">
                            Enter 6-digit OTP
                        </label>
                        <input
                            id="otp"
                            style={styles.input}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter OTP"
                            maxLength={6}
                            value={otp}
                            onChange={(e) =>
                                setOtp(e.target.value.replace(/\D/g, ""))
                            }
                        />

                        <button
                            style={styles.primaryButton}
                            onClick={verifyOTP}
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                            style={styles.textButton}
                            onClick={() => {
                                setConfirmation(null);
                                setOtp("");
                                setError("");
                            }}
                        >
                            Change mobile number
                        </button>
                    </>
                )}

                <div id="recaptcha-container" style={styles.recaptcha} />

                <button
                    style={styles.guestButton}
                    onClick={onContinueGuest}
                    disabled={loading}
                >
                    Continue as Guest
                </button>

                <p style={styles.note}>
                    Your mobile number will be verified before sign-in.
                </p>
            </section>
        </main>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f6f8",
        padding: "20px",
        boxSizing: "border-box",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        background: "#fff",
        padding: "28px",
        borderRadius: "16px",
        boxShadow: "0 5px 24px rgba(0,0,0,0.08)",
        boxSizing: "border-box",
    },
    title: {
        textAlign: "center",
        margin: "0 0 8px",
        color: "#1d4ed8",
    },
    subtitle: {
        textAlign: "center",
        color: "#666",
        marginBottom: "24px",
    },
    label: {
        display: "block",
        fontWeight: "600",
        margin: "16px 0 8px",
    },
    input: {
        width: "100%",
        minWidth: 0,
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "16px",
        boxSizing: "border-box",
    },
    phoneRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    countryCode: {
        padding: "12px",
        background: "#f1f5f9",
        borderRadius: "8px",
    },
    primaryButton: {
        width: "100%",
        marginTop: "16px",
        padding: "13px",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
    },
    googleButton: {
        width: "100%",
        padding: "13px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "#fff",
        fontSize: "16px",
        cursor: "pointer",
    },
    divider: {
        textAlign: "center",
        color: "#888",
        margin: "20px 0",
    },
    guestButton: {
        width: "100%",
        marginTop: "18px",
        padding: "12px",
        border: "none",
        borderRadius: "8px",
        background: "#e5e7eb",
        color: "#111827",
        fontSize: "16px",
        cursor: "pointer",
    },
    textButton: {
        display: "block",
        margin: "12px auto",
        border: "none",
        background: "transparent",
        color: "#2563eb",
        cursor: "pointer",
    },
    error: {
        color: "#b91c1c",
        background: "#fef2f2",
        padding: "10px",
        borderRadius: "8px",
        overflowWrap: "anywhere",
    },
    recaptcha: {
        display: "flex",
        justifyContent: "center",
        marginTop: "16px",
        overflow: "hidden",
    },
    note: {
        textAlign: "center",
        color: "#777",
        fontSize: "12px",
        marginBottom: 0,
    },
};