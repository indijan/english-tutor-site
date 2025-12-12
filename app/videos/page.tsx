// app/videos/page.tsx

type VideoLevel = "intermediate" | "upper-intermediate" | "advanced";

type VideoItem = {
  id: string;
  title: string;
  level: VideoLevel;
  isFree: boolean;
  youtubeId: string;
  description: string;
};

const videos: VideoItem[] = [
  {
    id: "v1",
    title: "Talking About Daily Routines",
    level: "intermediate",
    isFree: true,
    youtubeId: "VIDEO_ID_FREE_1",
    description:
        "Clear examples and useful phrases to talk about your typical day in a natural way.",
  },
  {
    id: "v2",
    title: "Past Tenses in Real Conversations",
    level: "intermediate",
    isFree: false,
    youtubeId: "VIDEO_ID_INT_1",
    description:
        "How native speakers really mix past simple, past continuous and present perfect.",
  },
  {
    id: "v3",
    title: "Expressing Opinions Politely",
    level: "upper-intermediate",
    isFree: false,
    youtubeId: "VIDEO_ID_UPPER_1",
    description:
        "Useful structures to agree, disagree and soften your opinion in a natural way.",
  },
  {
    id: "v4",
    title: "Advanced Conditionals in Context",
    level: "advanced",
    isFree: false,
    youtubeId: "VIDEO_ID_ADV_1",
    description:
        "A deeper look at mixed conditionals and how they appear in real-life situations.",
  },
];

const levelLabels: Record<VideoLevel, string> = {
  intermediate: "Intermediate",
  "upper-intermediate": "Upper-Intermediate",
  advanced: "Advanced",
};

export default function VideosPage() {
  const grouped: Record<VideoLevel, VideoItem[]> = {
    intermediate: [],
    "upper-intermediate": [],
    advanced: [],
  };

  for (const v of videos) {
    grouped[v.level].push(v);
  }

  const levelsInOrder: VideoLevel[] = [
    "intermediate",
    "upper-intermediate",
    "advanced",
  ];

  return (
      <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "2rem 1rem 3rem",
          }}
      >
        <header style={{ marginBottom: "1.75rem" }}>
          <h1
              style={{
                fontSize: "2rem",
                marginBottom: "0.6rem",
                color: "#111827",
              }}
          >
            Video Library
          </h1>
          <p
              style={{
                fontSize: "0.95rem",
                color: "#4b5563",
                maxWidth: "640px",
              }}
          >
            Watch free lessons or unlock the full library for structured
            practice at intermediate and advanced levels. Clear
            explanations, lots of examples, and natural English.
          </p>
        </header>

        <section
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              marginBottom: "2rem",
              fontSize: "0.9rem",
              color: "#4b5563",
            }}
        >
          <p style={{ marginBottom: "0.4rem" }}>
            <strong>Free videos</strong> are marked with a green badge
            and can be watched without logging in.
          </p>
          <p style={{ marginBottom: "0.4rem" }}>
            <strong>Locked videos</strong> are part of the paid library.
            Later we will connect this page to a subscription and login
            system so students can access the full content.
          </p>
          <p>
            For now, this page is a preview of how the structure and
            levels will look.
          </p>
        </section>

        {levelsInOrder.map((levelKey) => {
          const items = grouped[levelKey];
          if (items.length === 0) return null;

          return (
              <section key={levelKey} style={{ marginBottom: "2.5rem" }}>
                <h2
                    style={{
                      fontSize: "1.4rem",
                      marginBottom: "0.9rem",
                      color: "#111827",
                    }}
                >
                  {levelLabels[levelKey]} videos
                </h2>

                <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                          "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "1.5rem",
                    }}
                >
                  {items.map((video) => (
                      <article
                          key={video.id}
                          style={{
                            borderRadius: "14px",
                            padding: "0.9rem",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                            boxShadow:
                                "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
                          }}
                      >
                        <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                        >
                          <h3
                              style={{
                                fontSize: "1rem",
                                margin: 0,
                                color: "#111827",
                              }}
                          >
                            {video.title}
                          </h3>
                          <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.1rem 0.5rem",
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                color: "#4b5563",
                                whiteSpace: "nowrap",
                                backgroundColor: "#f9fafb",
                              }}
                          >
                      {levelLabels[video.level]}
                    </span>
                        </div>

                        <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#4b5563",
                              margin: 0,
                            }}
                        >
                          {video.description}
                        </p>

                        <div
                            style={{
                              position: "relative",
                              paddingBottom: "56.25%",
                              height: 0,
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid #e5e7eb",
                              marginTop: "0.35rem",
                              backgroundColor: "#000000",
                            }}
                        >
                          {video.isFree ? (
                              <iframe
                                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                  title={video.title}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                  }}
                                  allowFullScreen
                              ></iframe>
                          ) : (
                              <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to bottom, rgba(248,250,252,0.85), rgba(241,245,249,0.96))",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.4rem",
                                  }}
                              >
                                <div
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      borderRadius: "999px",
                                      border: "2px solid #e5e7eb",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "1.1rem",
                                    }}
                                >
                                  🔒
                                </div>
                                <div
                                    style={{
                                      fontSize: "0.9rem",
                                      color: "#111827",
                                    }}
                                >
                                  Locked lesson
                                </div>
                                <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#6b7280",
                                      textAlign: "center",
                                      maxWidth: "220px",
                                    }}
                                >
                                  Login and subscription will unlock this level
                                  later.
                                </div>
                                <a
                                    href="/auth"
                                    style={{
                                      marginTop: "0.3rem",
                                      padding: "0.35rem 0.85rem",
                                      borderRadius: "999px",
                                      fontSize: "0.8rem",
                                      textDecoration: "none",
                                      background:
                                          "linear-gradient(135deg, #22c55e, #16a34a)",
                                      color: "white",
                                      fontWeight: 600,
                                    }}
                                >
                                  Go to login
                                </a>
                              </div>
                          )}
                        </div>

                        <div
                            style={{
                              marginTop: "0.45rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.8rem",
                              color: "#6b7280",
                            }}
                        >
                          {video.isFree ? (
                              <span
                                  style={{
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#ecfdf3",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0",
                                  }}
                              >
                        Free lesson
                      </span>
                          ) : (
                              <span
                                  style={{
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                  }}
                              >
                        Part of the full library
                      </span>
                          )}

                          <span
                              style={{
                                opacity: 0.6,
                              }}
                          >
                      ★ Add to favourites (coming soon)
                    </span>
                        </div>
                      </article>
                  ))}
                </div>
              </section>
          );
        })}
      </div>
  );
}