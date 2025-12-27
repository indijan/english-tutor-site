"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type AuthMode = "login" | "signup" | "reset";

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!email || (mode !== "reset" && !password) || (mode === "signup" && !fullName)) {
            setError("Kérjük, töltsd ki az összes kötelező mezőt.");
            return;
        }

        try {
            setLoading(true);

            if (mode === "login") {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                setMessage("Sikeres bejelentkezés. Átirányítás…");
                // Small delay so the user sees feedback
                setTimeout(() => {
                    window.location.href = "/videos";
                }, 400);
                return;
            }

            if (mode === "signup") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (signUpError) throw signUpError;

                setMessage(
                    "A fiók létrejött. Kérjük, ellenőrizd az e-mailt a cím megerősítéséhez (ha szükséges), majd jelentkezz be."
                );
                return;
            }

            if (mode === "reset") {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
                if (resetError) throw resetError;

                setMessage("A jelszó-visszaállító e-mail elküldve. Kérjük, ellenőrizd a postaládádat.");
                return;
            }
        } catch (err) {
            console.error(err);
            setError("Valami hiba történt. Kérjük, próbáld újra.");
        } finally {
            setLoading(false);
        }
    };

    const switchTo = (newMode: AuthMode) => {
        setMode(newMode);
        setMessage(null);
        setError(null);
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data } = await supabase.auth.getUser();
            if (cancelled) return;
            setUserEmail(data.user?.email ?? null);
        })();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserEmail(session?.user?.email ?? null);
        });

        return () => {
            cancelled = true;
            sub.subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        setMessage(null);
        setError(null);
        try {
            setLoading(true);
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
            setMessage("Sikeresen kijelentkeztél.");
            setUserEmail(null);
            setMode("login");
        } catch (err) {
            console.error(err);
            setError("Nem sikerült kijelentkezni. Kérjük, próbáld újra.");
        } finally {
            setLoading(false);
        }
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
                {userEmail && (
                    <div style={{ marginBottom: "1.25rem" }}>
                        <h1 style={{ fontSize: "1.35rem", marginBottom: "0.35rem", color: "#111827" }}>
                            Fiókod
                        </h1>
                        <p style={{ fontSize: "0.9rem", color: "#4b5563", margin: 0 }}>
                            Bejelentkezve mint <strong>{userEmail}</strong>
                        </p>

                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                            <Link
                                href="/videos"
                                style={{
                                    textDecoration: "none",
                                    color: "#2563eb",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                }}
                            >
                                Ugrás a videókhoz
                            </Link>
                            <Link
                                href="/favorites"
                                style={{
                                    textDecoration: "none",
                                    color: "#2563eb",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                }}
                            >
                                Kedvencek megtekintése
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={loading}
                            style={{
                                marginTop: "1rem",
                                width: "100%",
                                padding: "0.7rem 0.8rem",
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                cursor: loading ? "default" : "pointer",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: "1rem",
                                fontWeight: 600,
                                opacity: loading ? 0.9 : 1,
                            }}
                        >
                            {loading ? "Kijelentkezés..." : "Kijelentkezés"}
                        </button>
                    </div>
                )}
                {/* Tabs */}
                {!userEmail && (
                <>
                {mode !== "reset" && (
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
                            Bejelentkezés
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
                            Regisztráció
                        </button>
                    </div>
                )}

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
                            ? "Örülünk, hogy visszatértél!"
                            : mode === "signup"
                                ? "Kezdd el teljes hozzáféréssel"
                                : "Jelszó visszaállítása"}
                    </h1>
                    <p
                        style={{
                            fontSize: "0.9rem",
                            color: "#4b5563",
                            margin: 0,
                        }}
                    >
                        {mode === "login"
                            ? "Jelentkezz be, hogy megnézhesd az összes leckét és elérd a kedvenceidet."
                            : mode === "signup"
                                ? "Hozz létre fiókot a teljes videótár eléréséhez és a kedvencek mentéséhez."
                                : "Add meg az e-mail címed, és küldünk egy jelszó-visszaállító linket."}
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
                                Teljes név
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

                    {mode !== "reset" && (
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
                                Jelszó
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
                            {mode === "login" && (
                                <button
                                    type="button"
                                    onClick={() => switchTo("reset")}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        padding: 0,
                                        marginTop: "0.5rem",
                                        fontSize: "0.85rem",
                                        textDecoration: "underline",
                                        textAlign: "left",
                                    }}
                                >
                                    Elfelejtetted a jelszavad?
                                </button>
                            )}
                        </div>
                    )}

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
                                ? "Bejelentkezés..."
                                : mode === "signup"
                                    ? "Fiók létrehozása..."
                                    : "Visszaállító e-mail küldése..."
                            : mode === "login"
                                ? "Bejelentkezés"
                                : mode === "signup"
                                    ? "Regisztráció"
                                    : "Visszaállító e-mail küldése"}
                    </button>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                        <p
                            style={{
                                fontSize: "0.8rem",
                                color: "#6b7280",
                                margin: 0,
                            }}
                        >
                            {mode === "login" ? (
                                <>
                                    Még nincs fiókod?{" "}
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
                                        Itt hozhatsz létre.
                                    </button>
                                </>
                            ) : mode === "signup" ? (
                                <>
                                    Már regisztráltál?{" "}
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
                                        Itt jelentkezhetsz be.
                                    </button>
                                </>
                            ) : (
                                <>
                                    Eszedbe jutott a jelszavad?{" "}
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
                                        Vissza a bejelentkezéshez.
                                    </button>
                                </>
                            )}
                        </p>

                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
                                ← Vissza a főoldalra
                            </Link>
                        </div>
                    </div>
                </form>
                </>
                )}
            </div>
        </div>
    );
}
