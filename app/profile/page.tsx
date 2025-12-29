"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type UserLite = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: {
    full_name?: string | null;
  };
} | null;

type ProfileData = {
  subscription_status?: string | null;
  current_period_end?: string | null;
  access_revoked?: boolean | null;
  full_name?: string | null;
  email?: string | null;
};

function prettyStatus(status?: string | null, accessRevoked?: boolean | null) {
  if (accessRevoked) return "Megvonva";
  const s = (status ?? "").trim().toLowerCase();
  if (!s || s === "inactive") return "Nincs aktív előfizetés";
  if (s === "active") return "Aktív";
  if (s === "trialing") return "Próbaidőszak";
  if (s === "past_due") return "Fizetés elmaradt";
  if (s === "canceled") return "Lemondva";
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "Nincs adat";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Nincs adat";
  return date.toLocaleDateString("hu-HU");
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserLite>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      const { data, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userErr || !data.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const nextUser: UserLite = {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at ?? null,
        user_metadata: data.user.user_metadata ?? undefined,
      };
      setUser(nextUser);
      const metadataFullName = (data.user.user_metadata as any)?.full_name ?? null;
      setFullName((metadataFullName as string | undefined) ?? (data.user.email ?? ""));

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("subscription_status, current_period_end, access_revoked, full_name, email")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileErr) {
        setProfile(null);
      } else {
        const nextProfile = (profileData ?? {}) as ProfileData;
        setProfile(nextProfile);
        if (profileData?.full_name) setFullName(profileData.full_name);
        if (!profileData?.full_name && metadataFullName) setFullName(metadataFullName as string);
      }

      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const subscriptionLabel = useMemo(
    () => prettyStatus(profile?.subscription_status ?? null, profile?.access_revoked ?? null),
    [profile?.subscription_status, profile?.access_revoked]
  );

  const subscriptionUntil = useMemo(
    () => formatDate(profile?.current_period_end ?? null),
    [profile?.current_period_end]
  );

  const registeredAt = useMemo(
    () => formatDate(user?.created_at ?? null),
    [user?.created_at]
  );

  const handleNameSave = async () => {
    setMessage(null);
    setError(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("A név nem lehet üres.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (updateErr) throw updateErr;
      if (user?.id) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .upsert({ user_id: user.id, full_name: trimmed, email: user.email ?? null }, { onConflict: "user_id" });
        if (profileErr) throw profileErr;
      }
      setMessage("A név frissítve.");
    } catch (e: any) {
      setError(e?.message ?? "Nem sikerült frissíteni a nevet.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setMessage(null);
    setError(null);

    if (!newPassword) {
      setError("Add meg az új jelszót.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Az új jelszó legalább 8 karakter legyen.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A jelszavak nem egyeznek.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;
      setMessage("A jelszó frissítve.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message ?? "Nem sikerült frissíteni a jelszót.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.href = "/";
    } catch (e: any) {
      setError(e?.message ?? "Nem sikerült kijelentkezni.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1rem 3rem", color: "#6b7280" }}>
        Profil betöltése…
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1rem 3rem" }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.75rem", color: "#111827" }}>Profil</h1>
        <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
          A profil megtekintéséhez kérjük, jelentkezz be.
        </p>
        <Link href="/auth" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          Bejelentkezés →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.35rem", color: "#111827" }}>Profil</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Bejelentkezve: <strong>{user.email}</strong>
        </p>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "0.9rem",
            padding: "0.6rem 0.75rem",
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
            marginBottom: "0.9rem",
            padding: "0.6rem 0.75rem",
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

      <section
        style={{
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "#111827" }}>Előfizetés</h2>
        <div style={{ display: "grid", gap: "0.5rem", color: "#4b5563", fontSize: "0.95rem" }}>
          <div>Előfizetés státusz: <strong style={{ color: "#111827" }}>{subscriptionLabel}</strong></div>
          <div>Hozzáférés vége: <strong style={{ color: "#111827" }}>{subscriptionUntil}</strong></div>
          <div>Regisztráció dátuma: <strong style={{ color: "#111827" }}>{registeredAt}</strong></div>
        </div>
      </section>

      <section
        style={{
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "#111827" }}>Név módosítása</h2>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Teljes név"
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
          <button
            type="button"
            onClick={handleNameSave}
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: saving ? "default" : "pointer",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {saving ? "Mentés..." : "Név mentése"}
          </button>
        </div>
      </section>

      <section
        style={{
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "#111827" }}>Jelszó módosítása</h2>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Új jelszó"
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
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Új jelszó megerősítése"
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
          <button
            type="button"
            onClick={handlePasswordSave}
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: saving ? "default" : "pointer",
              background: "#111827",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {saving ? "Mentés..." : "Jelszó mentése"}
          </button>
        </div>
      </section>

      <section
        style={{
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          padding: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "#111827" }}>Kijelentkezés</h2>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={saving}
          style={{
            padding: "0.55rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Kijelentkezés..." : "Kijelentkezés"}
        </button>
      </section>
    </div>
  );
}
