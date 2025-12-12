"use client";

import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!email || !password || (mode === "signup" && !fullName)) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);

            // Itt lesz majd a Supabase integráció.
            await new Promise((resolve) => setTimeout(resolve, 800));

            if (mode === "login") {
                console.log("LOGIN with:", { email, password });
                setMessage("Login successful (mock). Later this will use Supabase.");
            } else {
                console.log("SIGNUP with:", { fullName, email, password });
                setMessage(
                    "Account created (mock). Later this will create a real account with Supabase."
                );
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const switchTo = (newMode: AuthMode) => {
        setMode(newMode);
        setMessage(null);
        setError(null);
    };

    return (
        <div
            style={{
                minHeight: "calc(100vh - 120px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2.5rem 1rem 3rem",
                background: "#f7f3e9", // világos háttér az auth oldalra
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    borderRadius: "16px",
                    padding: "2rem",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    boxShadow:
                        "0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)",
                    boxSizing: "border-box",
                }}
            >
                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        marginBottom: "1.4rem",
                        padding: "0.2rem",
                        borderRadius: "999px",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => switchTo("login")}
                        style={{
                            flex: 1,
                            padding: "0.35rem 0.75rem",
                            borderRadius: "999px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background:
                                mode === "login"
                                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                    : "transparent",
                            color: mode === "login" ? "#f9fafb" : "#6b7280",
                            transition: "all 160ms ease-out",
                        }}
                    >
                        Log in
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTo("signup")}
                        style={{
                            flex: 1,
                            padding: "0.35rem 0.75rem",
                            borderRadius: "999px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background:
                                mode === "signup"
                                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                    : "transparent",
                            color: mode === "signup" ? "#f9fafb" : "#6b7280",
                            transition: "all 160ms ease-out",
                        }}
                    >
                        Sign up
                    </button>
                </div>

                {/* Intro */}
                <div style={{ marginBottom: "1.2rem" }}>
                    <h1
                        style={{
                            fontSize: "1.4rem",
                            marginBottom: "0.35rem",
                            color: "#111827",
                        }}
                    >
                        {mode === "login"
                            ? "Welcome back!"
                            : "Start learning with full access"}
                    </h1>
                    <p
                        style={{
                            fontSize: "0.9rem",
                            color: "#4b5563",
                            margin: 0,
                        }}
                    >
                        {mode === "login"
                            ? "Log in to watch all your lessons and access your favourite videos."
                            : "Create an account to unlock the full video library and save your favourites."}
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div
                        style={{
                            marginBottom: "0.8rem",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "10px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "0.85rem",
                        }}
                    >
                        {error}
                    </div>
                )}
                {message && (
                    <div
                        style={{
                            marginBottom: "0.8rem",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "10px",
                            background: "#ecfdf3",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            fontSize: "0.85rem",
                        }}
                    >
                        {message}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    {mode === "signup" && (
                        <div style={{ marginBottom: "0.75rem" }}>
                            <label
                                htmlFor="fullName"
                                style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    marginBottom: "0.25rem",
                                    color: "#374151",
                                }}
                            >
                                Full name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.55rem 0.6rem",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    background: "#f9fafb",
                                    color: "#111827",
                                    fontSize: "0.95rem",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: "0.75rem" }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: "block",
                                fontSize: "0.8rem",
                                marginBottom: "0.25rem",
                                color: "#374151",
                            }}
                        >
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.55rem 0.6rem",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                background: "#f9fafb",
                                color: "#111827",
                                fontSize: "0.95rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: "block",
                                fontSize: "0.8rem",
                                marginBottom: "0.25rem",
                                color: "#374151",
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete={
                                mode === "login" ? "current-password" : "new-password"
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.55rem 0.6rem",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                background: "#f9fafb",
                                color: "#111827",
                                fontSize: "0.95rem",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {/* Submit + helper */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "0.7rem 0.8rem",
                            borderRadius: "999px",
                            border: "none",
                            cursor: loading ? "default" : "pointer",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "white",
                            fontSize: "1rem",
                            fontWeight: 600,
                            marginBottom: "0.7rem",
                            opacity: loading ? 0.9 : 1,
                        }}
                    >
                        {loading
                            ? mode === "login"
                                ? "Logging in..."
                                : "Creating account..."
                            : mode === "login"
                                ? "Log in"
                                : "Sign up"}
                    </button>

                    <p
                        style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                            margin: 0,
                        }}
                    >
                        {mode === "login" ? (
                            <>
                                Don&apos;t have an account yet?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchTo("signup")}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        padding: 0,
                                        fontSize: "0.8rem",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Create one here.
                                </button>
                            </>
                        ) : (
                            <>
                                Already registered?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchTo("login")}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        padding: 0,
                                        fontSize: "0.8rem",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Log in here.
                                </button>
                            </>
                        )}
                    </p>
                </form>
            </div>
        </div>
    );
}