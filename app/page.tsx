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
                        alt="Angoltanár nyitókép"
                        fill
                        priority
                        sizes="(max-width: 960px) 100vw, 960px"
                        style={{ objectFit: "cover" }}
                    />
                </div>

                {/* Tartalom két oszlopban */}
                <div className="hero-grid">
                    <div>
                        <h1
                            style={{
                                fontSize: "2.1rem",
                                marginBottom: "0.75rem",
                                color: "#111827",
                            }}
                        >
                            Angolozz Otthonról
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
                            Videóleckék középhaladó és haladó tanulóknak –
                            érthető nyelvtani magyarázatok, természetes
                            példamondatok és magasabb szintű szókincs egy helyen.
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
                                ▶ Nézd meg a 2 ingyenes leckét
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
                                Teljes videótár megtekintése
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
                            Középhaladó és haladó tanulóknak
                        </h2>
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "#4b5563",
                                marginBottom: "0.6rem",
                            }}
                        >
                            Felépített videóleckék, amelyek segítenek:
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
                            <li>A nehezebb nyelvtan tisztább megértésében</li>
                            <li>Magasabb szintű, természetes szókincs építésében</li>
                            <li>Magabiztos angol használatban a való életben</li>
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
                    A sorozat célja
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
                    Az <strong>angolozzotthonrol.hu</strong> célja, hogy
                    középhaladó és haladó tanulókat támogasson bizonyos
                    nyelvtani szabályok és összefüggések jobb megértésében,
                    és segítsen magasabb szintű szókincs elsajátításában
                    gondosan kiválasztott példamondatokon keresztül.
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
                    Próbáld ki két ingyenes videóleckét
                </h2>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#4b5563",
                        marginBottom: "1rem",
                    }}
                >
                    Kóstolj bele a leckékbe: érthető magyarázatok, sok
                    példa és nyugodt, felépített megközelítés.
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
                            Ingyenes lecke 1 – [Cím]
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
                                title="Ingyenes angol lecke 1"
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
                            Ingyenes lecke 2 – [Cím]
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
                                title="Ingyenes angol lecke 2"
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
                    alt="Angoltanár portré"
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
                        Angoltanár vagyok, felnőtt tanulókra specializálódva
                        középhaladó és haladó szinten. A fókuszom az érthető
                        magyarázatokon, a sok értelmes példán és a valódi
                        kommunikációs magabiztosság építésén van.
                    </p>
                    <a
                        href="/about"
                        style={{
                            fontSize: "0.9rem",
                            color: "#2563eb",
                            textDecoration: "none",
                        }}
                    >
                        Tudj meg rólam többet →
                    </a>
                </div>
            </section>
        </div>
    );
}
