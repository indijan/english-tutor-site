"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

function confirmAction(message: string) {
  return window.confirm(message);
}

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

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

      const { data: categoryRows, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (catErr) {
        setError(catErr.message);
        setLoading(false);
        return;
      }

      setCategories((categoryRows ?? []) as CategoryRow[]);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addCategory() {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      alert("A kategória név és slug kötelező.");
      return;
    }

    const payload = {
      name: newCategory.name.trim(),
      slug: newCategory.slug.trim(),
      description: newCategory.description.trim() || null,
      sort_order: Number(newCategory.sort_order) || 0,
      is_active: !!newCategory.is_active,
    };

    const { data, error: insertErr } = await supabase.from("categories").insert(payload).select().single();
    if (insertErr) {
      alert(insertErr.message);
      return;
    }

    setCategories((prev) => [...prev, data as CategoryRow]);
    setNewCategory({ name: "", slug: "", description: "", sort_order: 0, is_active: true });
  }

  async function saveCategory(row: CategoryRow) {
    if (!confirmAction(`Módosítod a "${row.name}" kategóriát?`)) return;

    const payload = {
      name: row.name.trim(),
      slug: row.slug.trim(),
      description: row.description?.trim() || null,
      sort_order: Number(row.sort_order) || 0,
      is_active: !!row.is_active,
    };

    const { error: updateErr } = await supabase.from("categories").update(payload).eq("id", row.id);
    if (updateErr) {
      alert(updateErr.message);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirmAction("Biztosan törlöd ezt a kategóriát?")) return;

    const { error: delErr } = await supabase.from("categories").delete().eq("id", id);
    if (delErr) {
      alert(delErr.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
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
      <h2 style={{ marginBottom: "1rem" }}>Kategóriák</h2>
      {error ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", padding: "0.75rem" }}>
          <strong>Hiba:</strong> {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <input
          placeholder="Név"
          value={newCategory.name}
          onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}
        />
        <input
          placeholder="Slug"
          value={newCategory.slug}
          onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}
        />
        <input
          placeholder="Leírás"
          value={newCategory.description}
          onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}
        />
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="number"
            placeholder="Sorrend"
            value={newCategory.sort_order}
            onChange={(e) => setNewCategory((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb", width: "120px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={newCategory.is_active}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Aktív
          </label>
          <button
            type="button"
            onClick={addCategory}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#111827",
              color: "#fff",
            }}
          >
            Kategória hozzáadása
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div style={{ color: "#6b7280" }}>Még nincs kategória.</div>
      ) : (
        categories.map((row, idx) => (
          <div
            key={row.id}
            style={{ display: "grid", gap: "0.5rem", borderTop: idx === 0 ? "none" : "1px solid #e5e7eb", paddingTop: idx === 0 ? 0 : "1rem" }}
          >
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <input
                value={row.name}
                onChange={(e) =>
                  setCategories((prev) => prev.map((c) => (c.id === row.id ? { ...c, name: e.target.value } : c)))
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <input
                value={row.slug}
                onChange={(e) =>
                  setCategories((prev) => prev.map((c) => (c.id === row.id ? { ...c, slug: e.target.value } : c)))
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <input
                value={row.description ?? ""}
                onChange={(e) =>
                  setCategories((prev) =>
                    prev.map((c) => (c.id === row.id ? { ...c, description: e.target.value } : c))
                  )
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="number"
                value={row.sort_order ?? 0}
                onChange={(e) =>
                  setCategories((prev) =>
                    prev.map((c) => (c.id === row.id ? { ...c, sort_order: Number(e.target.value) } : c))
                  )
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100px" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={!!row.is_active}
                  onChange={(e) =>
                    setCategories((prev) =>
                      prev.map((c) => (c.id === row.id ? { ...c, is_active: e.target.checked } : c))
                    )
                  }
                />
                Aktív
              </label>
              <button
                type="button"
                onClick={() => saveCategory(row)}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                Mentés
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(row.id)}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #fecaca", color: "#b91c1c", background: "#fff5f5" }}
              >
                Törlés
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
