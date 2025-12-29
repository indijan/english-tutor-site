"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  access_revoked: boolean | null;
};

const STATUS_OPTIONS = ["active", "trialing", "past_due", "canceled", "inactive"];

function confirmAction(message: string) {
  return window.confirm(message);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "2-digit" });
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !userData.user) {
        window.location.href = "/auth";
        return;
      }

      const { data: adminProfile, error: adminErr } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (adminErr) {
        setError(adminErr.message);
        setLoading(false);
        return;
      }
      if (!adminProfile?.is_admin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: profileRows, error: profErr } = await supabase
        .from("profiles")
        .select("user_id,email,full_name,subscription_status,current_period_end,access_revoked")
        .order("email", { ascending: true, nullsFirst: false });
      if (profErr) {
        setError(profErr.message);
        setLoading(false);
        return;
      }

      setProfiles((profileRows ?? []) as ProfileRow[]);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(row: ProfileRow) {
    if (!confirmAction("Módosítod a felhasználó hozzáférését?")) return;

    const payload = {
      subscription_status: row.subscription_status,
      access_revoked: !!row.access_revoked,
    };

    const { error: updateErr } = await supabase.from("profiles").update(payload).eq("user_id", row.user_id);
    if (updateErr) {
      alert(updateErr.message);
    }
  }

  if (loading) {
    return <div>Betöltés…</div>;
  }

  if (accessDenied) {
    return (
      <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", padding: "0.75rem" }}>
        Nincs admin jogosultságod.
      </div>
    );
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Userek</h2>
      {error ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", padding: "0.75rem" }}>
          <strong>Hiba:</strong> {error}
        </div>
      ) : null}

      {profiles.length === 0 ? (
        <div style={{ color: "#6b7280" }}>Még nincs user.</div>
      ) : (
        profiles.map((row, idx) => (
          <div
            key={row.user_id}
            style={{ display: "grid", gap: "0.5rem", borderTop: idx === 0 ? "none" : "1px solid #e5e7eb", paddingTop: idx === 0 ? 0 : "1rem" }}
          >
            <div style={{ fontWeight: 600 }}>{row.full_name || "Név nélkül"}</div>
            <div style={{ color: "#6b7280" }}>{row.email || "Email nélkül"}</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#6b7280" }}>{row.user_id}</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={row.subscription_status ?? "inactive"}
                onChange={(e) =>
                  setProfiles((prev) =>
                    prev.map((p) => (p.user_id === row.user_id ? { ...p, subscription_status: e.target.value } : p))
                  )
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={!!row.access_revoked}
                  onChange={(e) =>
                    setProfiles((prev) =>
                      prev.map((p) => (p.user_id === row.user_id ? { ...p, access_revoked: e.target.checked } : p))
                    )
                  }
                />
                Hozzáférés megvonva
              </label>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                Period vége: {formatDate(row.current_period_end)}
              </div>
              <button
                type="button"
                onClick={() => saveProfile(row)}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                Mentés
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
