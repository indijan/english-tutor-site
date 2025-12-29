"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type VideoRow = {
  id: string;
  title: string;
  vimeo_id: string | null;
  is_published: boolean | null;
  is_free: boolean | null;
  sort_order: number | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

type UserLite = {
  id: string;
  email?: string | null;
} | null;

type AccessProfile = {
  subscription_status?: string | null;
  access_revoked?: boolean | null;
};

function prettyStatus(status?: string | null) {
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

export default function VideosPage() {
  const [user, setUser] = useState<UserLite>(null);
  const [accessProfile, setAccessProfile] = useState<AccessProfile | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [videoCategoryMap, setVideoCategoryMap] = useState<Record<string, string[]>>({});
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [favBusyId, setFavBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Track user session
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr) setUser(null);
      else setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 2) Load videos + categories
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("videos")
        .select("id,title,vimeo_id,is_published,is_free,sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });

      const { data: categoryRows, error: catErr } = await supabase
        .from("categories")
        .select("id,name,slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      const { data: mapRows, error: mapErr } = await supabase
        .from("video_categories")
        .select("video_id,category_id");

      if (cancelled) return;

      if (error || catErr || mapErr) {
        setError(error?.message ?? catErr?.message ?? mapErr?.message ?? "Nem sikerült betölteni az adatokat.");
        setVideos([]);
        setCategories([]);
        setVideoCategoryMap({});
      } else {
        setVideos((data ?? []) as VideoRow[]);
        setCategories((categoryRows ?? []) as CategoryRow[]);
        const map: Record<string, string[]> = {};
        for (const row of mapRows ?? []) {
          const vid = (row as any).video_id as string;
          const cat = (row as any).category_id as string;
          map[vid] = map[vid] ? [...map[vid], cat] : [cat];
        }
        setVideoCategoryMap(map);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 3) Load favourites for this user
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setFavoritesSet(new Set());
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("video_id")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        setFavoritesSet(new Set());
        return;
      }

      const s = new Set<string>();
      for (const row of data ?? []) {
        const vid = (row as any).video_id as string | undefined;
        if (vid) s.add(vid);
      }
      setFavoritesSet(s);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // 4) Load subscription access for this user
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setAccessProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, access_revoked")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setAccessProfile(null);
        return;
      }

      setAccessProfile((data ?? {}) as AccessProfile);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const accessStatusLabel = useMemo(
    () => prettyStatus(accessProfile?.subscription_status ?? null),
    [accessProfile?.subscription_status]
  );
  const accessGranted =
    !!user &&
    !!accessProfile &&
    !accessProfile.access_revoked &&
    ["active", "trialing"].includes(String(accessProfile.subscription_status ?? "").toLowerCase());

  const filteredVideos = useMemo(() => {
    if (activeCategories.size === 0) return videos;
    return videos.filter((video) => {
      const cats = videoCategoryMap[video.id] ?? [];
      return cats.some((id) => activeCategories.has(id));
    });
  }, [videos, videoCategoryMap, activeCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const video of videos) {
      const cats = videoCategoryMap[video.id] ?? [];
      for (const id of cats) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [videos, videoCategoryMap]);

  function toggleCategory(id: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleFavorite(videoId: string) {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    setFavBusyId(videoId);

    try {
      const isFav = favoritesSet.has(videoId);

      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", videoId);
        if (error) throw error;

        setFavoritesSet((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
        if (error) throw error;

        setFavoritesSet((prev) => {
          const next = new Set(prev);
          next.add(videoId);
          return next;
        });
      }
    } catch (e: any) {
      alert(e?.message ?? "Nem sikerült frissíteni a kedvenceket.");
    } finally {
      setFavBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#111827" }}>Videótár</h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap" }}>
            {user ? (
              <>Bejelentkezve{user.email ? `: ${user.email}` : ""}</>
            ) : (
              <>
                Nincs bejelentkezve ·{" "}
                <Link href="/auth" style={{ color: "#2563eb", textDecoration: "none" }}>
                  Bejelentkezés
                </Link>
              </>
            )}
          </div>
        </div>

        <p style={{ color: "#4b5563", maxWidth: "820px" }}>
          A videók a Supabase-ből töltődnek be. A csillaggal mentheted a kedvenceket.
          {user ? ` Előfizetésed: ${accessStatusLabel}.` : ""}
        </p>
      </header>

      {error ? (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #fecaca",
            borderRadius: "14px",
            padding: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <p style={{ margin: 0, color: "#b91c1c" }}>Nem sikerült betölteni a videókat: {error}</p>
        </div>
      ) : null}

      {loading ? (
        <div style={{ color: "#6b7280" }}>Videók betöltése…</div>
      ) : videos.length === 0 ? (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "1.5rem" }}>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Még nincs videó. Adj hozzá sorokat a Supabase <code>public.videos</code> táblájába, majd frissíts.
          </p>
        </div>
      ) : (
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)", gap: "1.75rem" }}>
          <aside
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "1rem",
              alignSelf: "start",
            }}
          >
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#111827" }}>Kategóriák</h2>
            {categories.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Nincs kategória.</div>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setActiveCategories(new Set())}
                  style={{
                    textAlign: "left",
                    border: "1px solid #e5e7eb",
                    background: activeCategories.size === 0 ? "#111827" : "#ffffff",
                    color: activeCategories.size === 0 ? "#ffffff" : "#111827",
                    borderRadius: "10px",
                    padding: "0.4rem 0.6rem",
                    cursor: "pointer",
                  }}
                >
                  Összes videó ({videos.length})
                </button>
                {categories.map((cat) => {
                  const active = activeCategories.has(cat.id);
                  const count = categoryCounts[cat.id] ?? 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        textAlign: "left",
                        border: "1px solid #e5e7eb",
                        background: active ? "#f97316" : "#ffffff",
                        color: active ? "#ffffff" : "#111827",
                        borderRadius: "10px",
                        padding: "0.4rem 0.6rem",
                        cursor: "pointer",
                      }}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
                {activeCategories.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveCategories(new Set())}
                    style={{
                      textAlign: "left",
                      border: "1px dashed #e5e7eb",
                      background: "#ffffff",
                      color: "#6b7280",
                      borderRadius: "10px",
                      padding: "0.4rem 0.6rem",
                      cursor: "pointer",
                    }}
                  >
                    Szűrők törlése
                  </button>
                ) : null}
              </div>
            )}
          </aside>

          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              Találat: {filteredVideos.length} videó
            </div>
            {filteredVideos.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Ebben a kategóriában nincs videó.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
                {filteredVideos.map((video) => {
                  const isFav = favoritesSet.has(video.id);
                  const busy = favBusyId === video.id;
                  const canWatch = !!video.is_free || accessGranted;
                  const cats = videoCategoryMap[video.id] ?? [];

              return (
                <article
                  key={video.id}
                  style={{
                    borderRadius: "14px",
                    padding: "0.95rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                      <h3 style={{ fontSize: "1rem", margin: 0, color: "#111827" }}>{video.title}</h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {video.is_free ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.55rem",
                            borderRadius: "999px",
                            backgroundColor: "#ecfeff",
                            border: "1px solid #a5f3fc",
                            color: "#0e7490",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ingyenes
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => toggleFavorite(video.id)}
                        disabled={busy}
                        title={
                          user
                            ? isFav
                              ? "Eltávolítás a kedvencek közül"
                              : "Hozzáadás a kedvencekhez"
                            : "Jelentkezz be a kedvencek mentéséhez"
                        }
                        style={{
                          border: "1px solid #e5e7eb",
                          background: isFav ? "#fff7ed" : "#ffffff",
                          color: isFav ? "#c2410c" : "#6b7280",
                          borderRadius: "999px",
                          width: "40px",
                          height: "32px",
                          cursor: busy ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          lineHeight: 1,
                        }}
                      >
                        {busy ? "…" : isFav ? "★" : "☆"}
                      </button>
                    </div>
                    </div>

                    {cats.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {cats.map((catId) => {
                          const cat = categories.find((c) => c.id === catId);
                          if (!cat) return null;
                          return (
                            <span
                              key={`${video.id}-${catId}`}
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.1rem 0.5rem",
                                borderRadius: "999px",
                                backgroundColor: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                color: "#374151",
                              }}
                            >
                              {cat.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}

                    <div
                      style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                      height: 0,
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#000",
                    }}
                  >
                    {canWatch && video.vimeo_id ? (
                      <iframe
                        src={`https://player.vimeo.com/video/${video.vimeo_id}`}
                        title={video.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "1rem",
                          textAlign: "center",
                          background:
                            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.10), rgba(0,0,0,0.85) 60%), linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.85))",
                          color: "#f9fafb",
                        }}
                      >
                        <div style={{ maxWidth: "340px" }}>
                          <div style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>
                            {video.vimeo_id ? "🔒 Zárolva" : "⚠️ Hiányzó Vimeo ID"}
                          </div>

                          {!user ? (
                            <>
                              <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0.75rem" }}>
                                A videó megtekintéséhez kérjük, jelentkezz be.
                              </div>
                              <Link
                                href="/auth"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "0.5rem 0.8rem",
                                  borderRadius: "999px",
                                  backgroundColor: "#ffffff",
                                  color: "#111827",
                                  textDecoration: "none",
                                  fontSize: "0.9rem",
                                  fontWeight: 600,
                                }}
                              >
                                Bejelentkezés
                              </Link>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0.75rem" }}>
                                A videó megtekintéséhez aktív előfizetés szükséges.
                              </div>
                              <Link
                                href="/account"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "0.5rem 0.8rem",
                                  borderRadius: "999px",
                                  backgroundColor: "#ffffff",
                                  color: "#111827",
                                  textDecoration: "none",
                                  fontSize: "0.9rem",
                                  fontWeight: 600,
                                }}
                              >
                                Előfizetés
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "0.25rem",
                      fontSize: "0.85rem",
                      color: "#6b7280",
                    }}
                  >
                    <span style={{ opacity: 0.75 }}>{canWatch ? "✅ Elérhető" : "🔒 Zárolva"}</span>
                    <span style={{ opacity: 0.75 }}>{video.is_free ? "Ingyenes" : "Előfizetéses"}</span>
                  </div>
                  </article>
                );
              })}
              </div>
            )}
          </div>
        </section>
      )}

      <footer style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
          ← Vissza a főoldalra
        </Link>
        <Link href="/favorites" style={{ color: "#2563eb", textDecoration: "none" }}>
          Kedvencek megtekintése →
        </Link>
      </footer>
    </div>
  );
}
