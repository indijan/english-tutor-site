import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
    return (
        <div
            style={{
                maxWidth: "960px",
                margin: "0 auto",
                padding: "1.5rem 1rem 2.5rem",
            }}
        >
            {/* Hero szekció – teljes szélességű kép + tartalom alatta */}
            <section
                style={{
                    width: "100%",
                    margin: "0 0 2.5rem 0",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "360px",
                        overflow: "hidden",
                        borderRadius: "18px",
                        marginBottom: "1.75rem",
                        position: "relative",
                    }}
                >
                    <Image
                        src="/hero_elvira.jpg"
                        alt="English teacher hero"
                        fill
                        priority
                        sizes="(max-width: 960px) 100vw, 960px"
                        style={{ objectFit: "cover" }}
                    />
                </div>

                {/* Tartalom két oszlopban */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
                        gap: "1.75rem",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: "2.1rem",
                                marginBottom: "0.75rem",
                                color: "#111827",
                            }}
                        >
                            English with [Teacher Name]
                        </h1>
                        <p
                            style={{
                                fontSize: "1rem",
                                color: "#374151",
                                marginBottom: "0.75rem",
                            }}
                        >
                            Videóleckék középhaladó és haladó nyelvtanulóknak –
                            érthető nyelvtan, természetes kifejezések, valódi
                            magyarázatok.
                        </p>
                        <p
                            style={{
                                fontSize: "0.95rem",
                                color: "#4b5563",
                            }}
                        >
                            Video lessons for intermediate and advanced learners –
                            clear grammar explanations, natural example sentences,
                            and higher-level vocabulary, all in one place.
                        </p>

                        <div
                            style={{
                                marginTop: "1.25rem",
                                display: "flex",
                                gap: "0.75rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <Link
                                href="/#free-videos"
                                style={{
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "999px",
                                    background:
                                        "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color: "white",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    display: "inline-block",
                                }}
                            >
                                ▶ Try 2 free lessons
                            </Link>
                            <Link
                                href="/videos"
                                style={{
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "999px",
                                    border: "1px solid #cbd5e1",
                                    color: "#111827",
                                    fontSize: "0.9rem",
                                    textDecoration: "none",
                                    backgroundColor: "#ffffff",
                                    display: "inline-block",
                                }}
                            >
                                Browse full video library
                            </Link>
                        </div>
                    </div>

                    {/* Oldalsó információs kártya */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            border: "1px solid #e5e7eb",
                            padding: "1.25rem",
                            boxShadow:
                                "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "1.1rem",
                                marginBottom: "0.5rem",
                                color: "#111827",
                            }}
                        >
                            For intermediate & advanced learners
                        </h2>
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "#4b5563",
                                marginBottom: "0.6rem",
                            }}
                        >
                            Structured video lessons designed to help you:
                        </p>
                        <ul
                            style={{
                                paddingLeft: "1.1rem",
                                margin: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.25rem",
                                fontSize: "0.9rem",
                                color: "#374151",
                            }}
                        >
                            <li>Understand tricky grammar more clearly</li>
                            <li>Build higher-level, natural vocabulary</li>
                            <li>Gain confidence using English in real life</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Cél / mission – világos doboz */}
            <section
                style={{
                    marginBottom: "2.5rem",
                    padding: "1.75rem 1.25rem",
                    borderRadius: "18px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.4rem",
                        marginBottom: "0.75rem",
                        color: "#111827",
                    }}
                >
                    A sorozat célja / Purpose of this video series
                </h2>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#374151",
                        marginBottom: "0.5rem",
                    }}
                >
                    Az <strong>angolozzotthonrol.hu</strong> célja, hogy
                    középhaladó és haladó nyelvtanulók számára segítséget
                    nyújtson jobban megérteni bizonyos nyelvtani szabályokat és
                    összefüggéseket, valamint példamondatokon keresztül
                    lehetőséget adjon magasabb szintű szókincs elsajátítására.
                </p>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#4b5563",
                    }}
                >
                    The goal of <strong>angolozzotthonrol.hu</strong> is to
                    support intermediate and advanced learners in better
                    understanding specific grammar rules and patterns, and to
                    help them acquire higher-level vocabulary through carefully
                    selected example sentences.
                </p>
            </section>

            {/* 2 ingyenes videó */}
            <section id="free-videos" style={{ marginBottom: "2.5rem" }}>
                <h2
                    style={{
                        fontSize: "1.3rem",
                        marginBottom: "0.75rem",
                        color: "#111827",
                    }}
                >
                    Try two free video lessons
                </h2>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#4b5563",
                        marginBottom: "1rem",
                    }}
                >
                    Get a taste of the lessons: clear explanations, lots of
                    examples, and a calm, structured approach.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "1.5rem",
                    }}
                >
                    <div>
                        <h3
                            style={{
                                fontSize: "1rem",
                                marginBottom: "0.4rem",
                                color: "#111827",
                            }}
                        >
                            Free Lesson 1 – [Title]
                        </h3>
                        <div
                            style={{
                                position: "relative",
                                paddingBottom: "56.25%",
                                height: 0,
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#000000",
                            }}
                        >
                            <iframe
                                src="https://www.youtube.com/embed/VIDEO_ID_1"
                                title="Free English lesson 1"
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
                        </div>
                    </div>

                    <div>
                        <h3
                            style={{
                                fontSize: "1rem",
                                marginBottom: "0.4rem",
                                color: "#111827",
                            }}
                        >
                            Free Lesson 2 – [Title]
                        </h3>
                        <div
                            style={{
                                position: "relative",
                                paddingBottom: "56.25%",
                                height: 0,
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#000000",
                            }}
                        >
                            <iframe
                                src="https://www.youtube.com/embed/VIDEO_ID_2"
                                title="Free English lesson 2"
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
                        </div>
                    </div>
                </div>
            </section>

            {/* Rövid Rólam teaser */}
            <section
                style={{
                    borderRadius: "18px",
                    padding: "1.5rem 1.25rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0,1fr)",
                    gap: "1rem",
                    alignItems: "center",
                }}
            >
                <Image
                    src="/teacher_portrait.jpg"
                    alt="English teacher portrait"
                    width={90}
                    height={90}
                    style={{
                        borderRadius: "999px",
                        objectFit: "cover",
                        border: "2px solid #22c55e",
                    }}
                />
                <div>
                    <p
                        style={{
                            fontSize: "0.95rem",
                            color: "#374151",
                            marginBottom: "0.35rem",
                        }}
                    >
                        I am an English teacher specialising in adult learners at
                        intermediate and advanced levels. My focus is on clear
                        explanations, lots of meaningful examples, and building
                        real confidence in communication.
                    </p>
                    <a
                        href="/about"
                        style={{
                            fontSize: "0.9rem",
                            color: "#2563eb",
                            textDecoration: "none",
                        }}
                    >
                        Learn more about me →
                    </a>
                </div>
            </section>
        </div>
    );
}