// app/favorites/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type FavRow = {
  id: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    youtube_id: string;
    level: string;
  } | null;
};

type FavRowDb = {
  id: string;
  created_at: string;
  video_id: string;
};

function levelRank(level: string) {
  const s = (level ?? "").trim().toLowerCase();

  // FREE tier
  if (!s || s === "beginner" || s === "free" || s === "basic" || s === "none") return 0;

  if (s === "intermediate") return 1;
  if (s === "upper-intermediate" || s === "upper_intermediate" || s === "upper intermediate") return 2;
  if (s === "advanced") return 3;

  // Unknown -> treat as locked (safer)
  return 99;
}

function canAccessVideo(userSubLevel: string | null, videoLevel: string) {
  return levelRank(userSubLevel ?? "free") >= levelRank(videoLevel);
}

function prettyLevel(level: string) {
  const s = (level ?? "").trim().toLowerCase();
  if (s === "upper-intermediate" || s === "upper_intermediate") return "Upper-Intermediate";
  if (s === "intermediate") return "Intermediate";
  if (s === "advanced") return "Advanced";
  if (!s) return "Other";
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<FavRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyFavId, setBusyFavId] = useState<string | null>(null);
  const [userSubLevel, setUserSubLevel] = useState<string | null>("free");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userErr || !userData.user) {
        setUserId(null);
        setRows([]);
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      // Load subscription level (defaults to "free")
      try {
        const { data: prof, error: profErr } = await supabase
            .from("profiles")
            .select("subscription_level")
            .eq("user_id", userData.user.id)
            .maybeSingle();

        if (!profErr) {
          const subscription_level = (prof as { subscription_level?: string | null } | null)?.subscription_level;
          setUserSubLevel(subscription_level ?? "free");
        } else {
          setUserSubLevel("free");
        }
      } catch {
        setUserSubLevel("free");
      }

      const { data: favData, error: favErr } = await supabase
        .from("favorites")
        .select("id, created_at, video_id")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (favErr) {
        setError(favErr.message);
        setRows([]);
      } else {
        const favRows: FavRowDb[] = (favData ?? []) as FavRowDb[];
        const videoIds = Array.from(
          new Set(
            favRows
              .map((r) => r.video_id)
              .filter((v): v is string => typeof v === "string" && v.length > 0)
          )
        );

        // Fetch the related videos in one go
        const { data: vidData, error: vidErr } = await supabase
          .from("videos")
          .select("id, title, youtube_id, level")
          .in("id", videoIds);

        if (vidErr) {
          // If videos fetch fails, still show the favourites list (without previews)
          setError(vidErr.message);
          setRows(
            favRows.map((r) => ({
              id: r.id,
              created_at: r.created_at,
              videos: null,
            }))
          );
        } else {
          const byId = new Map<string, NonNullable<FavRow["videos"]>>(
            (vidData ?? []).map((v) => [
              String(v.id),
              {
                id: String(v.id),
                title: String(v.title),
                youtube_id: String(v.youtube_id),
                level: String(v.level ?? ""),
              },
            ])
          );

          const normalized: FavRow[] = favRows.map((r) => ({
            id: r.id,
            created_at: r.created_at,
            videos: byId.get(String(r.video_id)) ?? null,
          }));

          setRows(normalized);
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => rows.map((r) => r.videos).filter(Boolean) as NonNullable<FavRow["videos"]>[],
    [rows]
  );

  async function removeFavorite(favId: string) {
    if (!userId) {
      window.location.href = "/auth";
      return;
    }

    setBusyFavId(favId);

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favId)
        .eq("user_id", userId);

      if (error) {
        alert(error.message);
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== favId));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not remove from favourites.";
      alert(message);
    } finally {
      setBusyFavId(null);
    }
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#111827" }}>Favourites</h1>
        <p style={{ color: "#4b5563", maxWidth: "820px" }}>
          Your saved videos.
        </p>
      </header>

      {!userId ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "1.25rem",
            boxShadow: "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
          }}
        >
          <p style={{ margin: 0, color: "#4b5563" }}>
            Please{" "}
            <Link href="/auth" style={{ color: "#2563eb", textDecoration: "none" }}>
              log in
            </Link>{" "}
            to view your favourites.
          </p>
        </div>
      ) : error ? (
        <div style={{ color: "#b91c1c" }}>Couldn’t load favourites: {error}</div>
      ) : loading ? (
        <div style={{ color: "#6b7280" }}>Loading favourites…</div>
      ) : items.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "1.25rem",
            boxShadow: "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
          }}
        >
          <p style={{ margin: 0, color: "#4b5563" }}>
            You haven’t saved any favourites yet. Go to the video library and tap the star.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {rows.map((r) => {
              const video = r.videos;
              const busy = busyFavId === r.id;
              const unlocked = video ? canAccessVideo(userSubLevel, video.level) : false;
              const upgradeHref = "/about"; // ide NE 404 legyen

              if (!video) {
                return (
                  <article
                    key={r.id}
                    style={{
                      borderRadius: "14px",
                      padding: "0.95rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                      This favourite could not be loaded (missing video details).
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFavorite(r.id)}
                      disabled={busy}
                      style={{
                        alignSelf: "flex-start",
                        border: "1px solid #e5e7eb",
                        background: "#fff7ed",
                        color: "#c2410c",
                        borderRadius: "999px",
                        padding: "0.4rem 0.75rem",
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      {busy ? "Removing…" : "Remove"}
                    </button>
                  </article>
                );
              }

              return (
                <article
                  key={r.id}
                  style={{
                    borderRadius: "14px",
                    padding: "0.95rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
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
                        onClick={() => removeFavorite(r.id)}
                        disabled={busy}
                        title="Remove from favourites"
                        style={{
                          border: "1px solid #e5e7eb",
                          background: "#fff7ed",
                          color: "#c2410c",
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
                        {busy ? "…" : "★"}
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
                    <iframe
                        src={`https://www.youtube.com/embed/${video.youtube_id}`}
                        title={video.title}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                          pointerEvents: unlocked ? "auto" : "none",
                          filter: unlocked ? "none" : "grayscale(1) blur(1px)",
                          opacity: unlocked ? 1 : 0.55,
                        }}
                        allowFullScreen
                    />

                    {!unlocked ? (
                        <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0.9rem",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.55))",
                            }}
                        >
                          <div
                              style={{
                                backgroundColor: "rgba(255,255,255,0.92)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "14px",
                                padding: "0.75rem 0.85rem",
                                maxWidth: "92%",
                                textAlign: "center",
                                boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
                              }}
                          >
                            <div style={{ fontSize: "0.9rem", color: "#111827", marginBottom: "0.35rem" }}>
                              🔒 Locked — requires {prettyLevel(video.level)}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#4b5563", marginBottom: "0.6rem" }}>
                              Upgrade your subscription to watch this lesson.
                            </div>
                            <Link
                                href={upgradeHref}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "0.45rem 0.75rem",
                                  borderRadius: "999px",
                                  backgroundColor: "#111827",
                                  color: "#ffffff",
                                  textDecoration: "none",
                                  fontSize: "0.85rem",
                                }}
                            >
                              Upgrade →
                            </Link>
                          </div>
                        </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </div>
      )}

      <footer style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/videos" style={{ color: "#2563eb", textDecoration: "none" }}>
          ← Back to Video Library
        </Link>
      </footer>
    </div>
  );
}