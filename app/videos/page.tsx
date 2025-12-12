"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type VideoRow = {
  id: string;
  title: string;
  youtube_id: string;
  level: string;
};

type UserLite = {
  id: string;
  email?: string | null;
} | null;

type SubscriptionLevel =
  | "none"
  | "intermediate"
  | "upper-intermediate"
  | "upper_intermediate"
  | "advanced";

function prettyLevel(level: string) {
  const s = (level ?? "").trim().toLowerCase();
  if (s === "upper-intermediate" || s === "upper_intermediate") return "Upper-Intermediate";
  if (s === "intermediate") return "Intermediate";
  if (s === "advanced") return "Advanced";
  if (s === "none") return "None";
  if (!s) return "Other";
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function levelRank(level: string): number {
  const s = (level ?? "").trim().toLowerCase();

  // FREE / beginner tier
  if (!s || s === "beginner" || s === "free" || s === "basic" || s === "none") return 0;

  if (s === "intermediate") return 1;
  if (s === "upper-intermediate" || s === "upper_intermediate" || s === "upper intermediate") return 2;
  if (s === "advanced") return 3;

  // Unknown levels -> lock to be safe
  return 99;
}

function subscriptionRank(sub: SubscriptionLevel): number {
  const s = (sub ?? "none").toString().trim().toLowerCase();
  if (s === "advanced") return 3;
  if (s === "upper-intermediate" || s === "upper_intermediate") return 2;
  if (s === "intermediate") return 1;
  return 0;
}

export default function VideosPage() {
  const [user, setUser] = useState<UserLite>(null);
  const [subscriptionLevel, setSubscriptionLevel] = useState<SubscriptionLevel>("none");
  const [videos, setVideos] = useState<VideoRow[]>([]);
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

  // 2) Load videos
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("videos")
        .select("id,title,youtube_id,level")
        .order("level", { ascending: true })
        .order("title", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setVideos([]);
      } else {
        setVideos((data ?? []) as VideoRow[]);
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

  // 4) Load subscription level for this user
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setSubscriptionLevel("none");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data?.subscription_level) {
        setSubscriptionLevel("none");
        return;
      }

      setSubscriptionLevel(String(data.subscription_level) as SubscriptionLevel);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const groups = useMemo(() => {
    return videos.reduce<Record<string, VideoRow[]>>((acc, v) => {
      const key = v.level || "other";
      (acc[key] ||= []).push(v);
      return acc;
    }, {});
  }, [videos]);

  const sortedLevels = useMemo(() => {
    const levelOrder = ["intermediate", "upper-intermediate", "upper_intermediate", "advanced", "other"];
    return Object.keys(groups).sort((a, b) => {
      const ai = levelOrder.indexOf(a);
      const bi = levelOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [groups]);

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
      alert(e?.message ?? "Could not update favourites.");
    } finally {
      setFavBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#111827" }}>Video Library</h1>
          <div style={{ fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap" }}>
            {user ? (
              <>Signed in{user.email ? `: ${user.email}` : ""}</>
            ) : (
              <>
                Not signed in ·{" "}
                <Link href="/auth" style={{ color: "#2563eb", textDecoration: "none" }}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        <p style={{ color: "#4b5563", maxWidth: "820px" }}>
          Videos are loaded from Supabase. Save favourites with the star.
          {user ? ` Your plan: ${prettyLevel(subscriptionLevel)}.` : ""}
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
          <p style={{ margin: 0, color: "#b91c1c" }}>Couldn’t load videos: {error}</p>
        </div>
      ) : null}

      {loading ? (
        <div style={{ color: "#6b7280" }}>Loading videos…</div>
      ) : videos.length === 0 ? (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "1.5rem" }}>
          <p style={{ margin: 0, color: "#4b5563" }}>
            No videos yet. Add rows into <code>public.videos</code> in Supabase and refresh.
          </p>
        </div>
      ) : (
        sortedLevels.map((level) => (
          <section key={level} style={{ marginBottom: "2.25rem" }}>
            <h2 style={{ fontSize: "1.35rem", marginBottom: "0.9rem", color: "#111827" }}>{prettyLevel(level)}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
              {groups[level].map((video) => {
                const isFav = favoritesSet.has(video.id);
                const busy = favBusyId === video.id;
                const canWatch = !!user && levelRank(video.level) <= subscriptionRank(subscriptionLevel);

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
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.55rem",
                            borderRadius: "999px",
                            backgroundColor: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            color: "#4b5563",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {prettyLevel(video.level)}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(video.id)}
                          disabled={busy}
                          title={user ? (isFav ? "Remove from favourites" : "Add to favourites") : "Log in to save favourites"}
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
                      {canWatch ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtube_id}`}
                          title={video.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
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
                            <div style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>🔒 Locked</div>

                            {!user ? (
                              <>
                                <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0.75rem" }}>
                                  Please log in to access this video.
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
                                  Log in
                                </Link>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "0.35rem" }}>
                                  Your plan ({prettyLevel(subscriptionLevel)}) doesn’t include this level.
                                </div>
                                <div style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "0.75rem" }}>
                                  Required: {prettyLevel(video.level)}
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
                                  Upgrade
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
                      <span style={{ opacity: 0.75 }}>{canWatch ? "✅ Included" : "🔒 Locked"}</span>
                      <span style={{ opacity: 0.75 }}>Requires: {prettyLevel(video.level)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      <footer style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
          ← Back to Home
        </Link>
        <Link href="/favorites" style={{ color: "#2563eb", textDecoration: "none" }}>
          View favourites →
        </Link>
      </footer>
    </div>
  );
}