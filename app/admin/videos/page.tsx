"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type CategoryRow = {
  id: string;
  name: string;
};

type VideoRow = {
  id: string;
  title: string;
  vimeo_id: string | null;
  is_published: boolean | null;
  is_free: boolean | null;
  sort_order: number | null;
};

function confirmAction(message: string) {
  return window.confirm(message);
}

export default function AdminVideosPage() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [videoCategoryMap, setVideoCategoryMap] = useState<Record<string, string[]>>({});
  const [newVideo, setNewVideo] = useState({
    title: "",
    vimeo_id: "",
    is_published: true,
    is_free: false,
    sort_order: 0,
    category_ids: [] as string[],
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
        .select("id,name")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (catErr) {
        setError(catErr.message);
        setLoading(false);
        return;
      }

      const { data: videoRows, error: vidErr } = await supabase
        .from("videos")
        .select("id,title,vimeo_id,is_published,is_free,sort_order")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (vidErr) {
        setError(vidErr.message);
        setLoading(false);
        return;
      }

      const { data: videoCategoryRows, error: vcErr } = await supabase
        .from("video_categories")
        .select("video_id,category_id");
      if (vcErr) {
        setError(vcErr.message);
        setLoading(false);
        return;
      }

      const map: Record<string, string[]> = {};
      for (const row of videoCategoryRows ?? []) {
        const vid = (row as any).video_id as string;
        const cat = (row as any).category_id as string;
        map[vid] = map[vid] ? [...map[vid], cat] : [cat];
      }

      setCategories((categoryRows ?? []) as CategoryRow[]);
      setVideos((videoRows ?? []) as VideoRow[]);
      setVideoCategoryMap(map);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  async function addVideo() {
    if (!newVideo.title.trim() || !newVideo.vimeo_id.trim()) {
      alert("A videó cím és Vimeo ID kötelező.");
      return;
    }

    const payload = {
      title: newVideo.title.trim(),
      vimeo_id: newVideo.vimeo_id.trim(),
      is_published: !!newVideo.is_published,
      is_free: !!newVideo.is_free,
      sort_order: Number(newVideo.sort_order) || 0,
    };

    const { data, error: insertErr } = await supabase.from("videos").insert(payload).select().single();
    if (insertErr) {
      alert(insertErr.message);
      return;
    }

    const categoryIds = newVideo.category_ids;
    if (categoryIds.length > 0) {
      const rows = categoryIds.map((catId) => ({ video_id: (data as VideoRow).id, category_id: catId }));
      const { error: linkErr } = await supabase.from("video_categories").insert(rows);
      if (linkErr) {
        alert(linkErr.message);
      }
    }

    setVideos((prev) => [...prev, data as VideoRow]);
    setVideoCategoryMap((prev) => ({ ...prev, [(data as VideoRow).id]: categoryIds }));
    setNewVideo({ title: "", vimeo_id: "", is_published: true, is_free: false, sort_order: 0, category_ids: [] });
  }

  async function saveVideo(row: VideoRow) {
    const current = videos.find((v) => v.id === row.id) ?? row;
    if (!confirmAction(`Módosítod a "${current.title}" videót?`)) return;

    try {
      const payload = {
        title: current.title.trim(),
        vimeo_id: current.vimeo_id?.trim() || null,
        is_published: !!current.is_published,
        is_free: !!current.is_free,
        sort_order: Number(current.sort_order) || 0,
      };

      const { data, error: updateErr } = await supabase
        .from("videos")
        .update(payload)
        .eq("id", row.id)
        .select()
        .maybeSingle();
      if (updateErr) {
        alert(updateErr.message);
        return;
      }

      if (data) {
        setVideos((prev) => prev.map((v) => (v.id === row.id ? (data as VideoRow) : v)));
      }

      const nextCategoryIds = videoCategoryMap[row.id] ?? [];
      const { error: delErr } = await supabase.from("video_categories").delete().eq("video_id", row.id);
      if (delErr) {
        alert(delErr.message);
        return;
      }

      if (nextCategoryIds.length > 0) {
        const rows = nextCategoryIds.map((catId) => ({ video_id: row.id, category_id: catId }));
        const { error: linkErr } = await supabase.from("video_categories").insert(rows);
        if (linkErr) {
          alert(linkErr.message);
        }
      }
    } catch (err: any) {
      alert(err?.message ?? "Nem sikerült menteni a videót. Próbáld újra.");
    }
  }

  async function deleteVideo(id: string) {
    if (!confirmAction("Biztosan törlöd ezt a videót?")) return;

    const { error: delErr } = await supabase.from("videos").delete().eq("id", id);
    if (delErr) {
      alert(delErr.message);
      return;
    }

    setVideos((prev) => prev.filter((v) => v.id !== id));
    setVideoCategoryMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
      <h2 style={{ marginBottom: "1rem" }}>Videók</h2>
      {error ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", padding: "0.75rem" }}>
          <strong>Hiba:</strong> {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <input
          placeholder="Cím"
          value={newVideo.title}
          onChange={(e) => setNewVideo((prev) => ({ ...prev, title: e.target.value }))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}
        />
        <input
          placeholder="Vimeo ID"
          value={newVideo.vimeo_id}
          onChange={(e) => setNewVideo((prev) => ({ ...prev, vimeo_id: e.target.value }))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}
        />
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Sorrend"
            value={newVideo.sort_order}
            onChange={(e) => setNewVideo((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "10px", border: "1px solid #e5e7eb", width: "120px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={newVideo.is_published}
              onChange={(e) => setNewVideo((prev) => ({ ...prev, is_published: e.target.checked }))}
            />
            Publikus
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={newVideo.is_free}
              onChange={(e) => setNewVideo((prev) => ({ ...prev, is_free: e.target.checked }))}
            />
            Ingyenes
          </label>
        </div>
        <select
          multiple
          value={newVideo.category_ids}
          onChange={(e) =>
            setNewVideo((prev) => ({
              ...prev,
              category_ids: Array.from(e.target.selectedOptions).map((opt) => opt.value),
            }))
          }
          style={{ minHeight: "120px", borderRadius: "10px", border: "1px solid #e5e7eb", padding: "0.5rem" }}
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addVideo}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
          }}
        >
          Videó hozzáadása
        </button>
      </div>

      {videos.length === 0 ? (
        <div style={{ color: "#6b7280" }}>Még nincs videó.</div>
      ) : (
        videos.map((row, idx) => (
          <div
            key={row.id}
            style={{ display: "grid", gap: "0.75rem", borderTop: idx === 0 ? "none" : "1px solid #e5e7eb", paddingTop: idx === 0 ? 0 : "1rem" }}
          >
            <input
              value={row.title}
              onChange={(e) => setVideos((prev) => prev.map((v) => (v.id === row.id ? { ...v, title: e.target.value } : v)))}
              style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <input
              value={row.vimeo_id ?? ""}
              onChange={(e) =>
                setVideos((prev) => prev.map((v) => (v.id === row.id ? { ...v, vimeo_id: e.target.value } : v)))
              }
              style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <select
              multiple
              value={videoCategoryMap[row.id] ?? []}
              onChange={(e) =>
                setVideoCategoryMap((prev) => ({
                  ...prev,
                  [row.id]: Array.from(e.target.selectedOptions).map((opt) => opt.value),
                }))
              }
              style={{ minHeight: "120px", borderRadius: "10px", border: "1px solid #e5e7eb", padding: "0.5rem" }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="number"
                value={row.sort_order ?? 0}
                onChange={(e) =>
                  setVideos((prev) => prev.map((v) => (v.id === row.id ? { ...v, sort_order: Number(e.target.value) } : v)))
                }
                style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100px" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={!!row.is_published}
                  onChange={(e) =>
                    setVideos((prev) => prev.map((v) => (v.id === row.id ? { ...v, is_published: e.target.checked } : v)))
                  }
                />
                Publikus
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={!!row.is_free}
                  onChange={(e) =>
                    setVideos((prev) => prev.map((v) => (v.id === row.id ? { ...v, is_free: e.target.checked } : v)))
                  }
                />
                Ingyenes
              </label>
              <button
                type="button"
                onClick={() => saveVideo(row)}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                Mentés
              </button>
              <button
                type="button"
                onClick={() => deleteVideo(row.id)}
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
