"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ContentBlock = {
    key: string;
    title: string | null;
    body: string | null;
    is_published: boolean | null;
};

type FreeVideo = {
    id: string;
    title: string;
    vimeo_id: string | null;
};

const DEFAULT_BLOCKS: Record<string, { title?: string; body?: string }> = {
    "home.intro": {
        title: "Angolozz Otthonról",
        body:
            "Videóleckék középhaladó és haladó nyelvtanulóknak – érthető nyelvtan, természetes kifejezések, valódi magyarázatok.\n\nVideóleckék középhaladó és haladó tanulóknak – érthető nyelvtani magyarázatok, természetes példamondatok és magasabb szintű szókincs egy helyen.",
    },
    "home.intro_side": {
        title: "Középhaladó és haladó tanulóknak",
        body:
            "A nehezebb nyelvtan tisztább megértésében\nMagasabb szintű, természetes szókincs építésében\nMagabiztos angol használatban a való életben",
    },
    "home.series_goal": {
        title: "A sorozat célja",
        body:
            "Az angolozzotthonrol.hu célja, hogy középhaladó és haladó nyelvtanulók számára segítséget nyújtson jobban megérteni bizonyos nyelvtani szabályokat és összefüggéseket, valamint példamondatokon keresztül lehetőséget adjon magasabb szintű szókincs elsajátítására.\n\nAz angolozzotthonrol.hu célja, hogy középhaladó és haladó tanulókat támogasson bizonyos nyelvtani szabályok és összefüggések jobb megértésében, és segítsen magasabb szintű szókincs elsajátításában gondosan kiválasztott példamondatokon keresztül.",
    },
    "home.about": {
        body:
            "Angoltanár vagyok, felnőtt tanulókra specializálódva középhaladó és haladó szinten. A fókuszom az érthető magyarázatokon, a sok értelmes példán és a valódi kommunikációs magabiztosság építésén van.",
    },
};

function splitParagraphs(body: string | null | undefined) {
    if (!body) return [];
    return body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

function splitListItems(body: string | null | undefined) {
    if (!body) return [];
    return body
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-*]\s+/, ""));
}

export default function HomePage() {
    const [blocks, setBlocks] = useState<Record<string, ContentBlock>>({});
    const [freeVideos, setFreeVideos] = useState<FreeVideo[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingKeys, setEditingKeys] = useState<string[]>([]);
    const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({});

    useEffect(() => {
        let cancelled = false;

        async function loadContent() {
            const keys = Object.keys(DEFAULT_BLOCKS);

            const { data: blockRows } = await supabase
                .from("content_blocks")
                .select("key,title,body,is_published")
                .in("key", keys)
                .eq("is_published", true);

            if (!cancelled) {
                const map: Record<string, ContentBlock> = {};
                for (const row of blockRows ?? []) {
                    const key = String((row as any).key);
                    map[key] = row as ContentBlock;
                }
                setBlocks(map);
            }

            const { data: videoRows } = await supabase
                .from("videos")
                .select("id,title,vimeo_id")
                .eq("is_published", true)
                .eq("is_free", true)
                .order("sort_order", { ascending: true })
                .order("title", { ascending: true })
                .limit(2);

            if (!cancelled) {
                setFreeVideos((videoRows ?? []) as FreeVideo[]);
            }
        }

        loadContent();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadAdmin() {
            const { data: userData, error: userErr } = await supabase.auth.getUser();
            if (cancelled) return;
            if (userErr || !userData.user) {
                setIsAdmin(false);
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("user_id", userData.user.id)
                .maybeSingle();

            if (!cancelled) {
                setIsAdmin(!!profileData?.is_admin);
            }
        }

        loadAdmin();

        return () => {
            cancelled = true;
        };
    }, []);

    const intro = blocks["home.intro"];
    const introSide = blocks["home.intro_side"];
    const seriesGoal = blocks["home.series_goal"];
    const about = blocks["home.about"];

    const introTitle = intro?.title ?? DEFAULT_BLOCKS["home.intro"].title ?? "";
    const introParagraphs = splitParagraphs(intro?.body ?? DEFAULT_BLOCKS["home.intro"].body);

    const sideTitle = introSide?.title ?? DEFAULT_BLOCKS["home.intro_side"].title ?? "";
    const sideItems = useMemo(
        () => splitListItems(introSide?.body ?? DEFAULT_BLOCKS["home.intro_side"].body),
        [introSide?.body]
    );

    const seriesTitle = seriesGoal?.title ?? DEFAULT_BLOCKS["home.series_goal"].title ?? "";
    const seriesParagraphs = splitParagraphs(seriesGoal?.body ?? DEFAULT_BLOCKS["home.series_goal"].body);

    const aboutText = about?.body ?? DEFAULT_BLOCKS["home.about"].body ?? "";

    function isEditing(key: string) {
        return editingKeys.includes(key);
    }

    function startEdit(key: string, title: string, body: string) {
        setDrafts((prev) => ({
            ...prev,
            [key]: { title, body },
        }));
        setEditingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }

    function cancelEdit(key: string) {
        setEditingKeys((prev) => prev.filter((k) => k !== key));
    }

    async function saveBlock(key: string) {
        if (!window.confirm("Mented a módosításokat?")) return;

        const draft = drafts[key];
        const payload = {
            key,
            title: draft?.title?.trim() || null,
            body: draft?.body?.trim() || null,
            is_published: true,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from("content_blocks").upsert(payload, { onConflict: "key" }).select();
        if (error) {
            alert(error.message);
            return;
        }

        const nextRow = (data ?? []).find((row) => String((row as any).key) === key) as ContentBlock | undefined;
        if (nextRow) {
            setBlocks((prev) => ({ ...prev, [key]: nextRow }));
        } else {
            setBlocks((prev) => ({
                ...prev,
                [key]: {
                    key,
                    title: payload.title,
                    body: payload.body,
                    is_published: true,
                },
            }));
        }
        cancelEdit(key);
    }

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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <h1
                                style={{
                                    fontSize: "2.1rem",
                                    marginBottom: "0.75rem",
                                    color: "#111827",
                                }}
                            >
                                {introTitle}
                            </h1>
                            {isAdmin && !isEditing("home.intro") ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        startEdit(
                                            "home.intro",
                                            intro?.title ?? introTitle,
                                            intro?.body ?? (DEFAULT_BLOCKS["home.intro"].body ?? "")
                                        )
                                    }
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        background: "#ffffff",
                                        color: "#111827",
                                        borderRadius: "999px",
                                        padding: "0.25rem 0.6rem",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    Szerkesztés
                                </button>
                            ) : null}
                        </div>
                        {isAdmin && isEditing("home.intro") ? (
                            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <input
                                    value={drafts["home.intro"]?.title ?? ""}
                                    onChange={(e) =>
                                        setDrafts((prev) => ({
                                            ...prev,
                                            ["home.intro"]: { ...prev["home.intro"], title: e.target.value },
                                        }))
                                    }
                                    style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                />
                                <textarea
                                    rows={5}
                                    value={drafts["home.intro"]?.body ?? ""}
                                    onChange={(e) =>
                                        setDrafts((prev) => ({
                                            ...prev,
                                            ["home.intro"]: { ...prev["home.intro"], body: e.target.value },
                                        }))
                                    }
                                    style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                />
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        onClick={() => saveBlock("home.intro")}
                                        style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    >
                                        Mentés
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => cancelEdit("home.intro")}
                                        style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </div>
                        ) : null}
                        {introParagraphs.map((text, idx) => (
                            <p
                                key={`intro-${idx}`}
                                style={{
                                    fontSize: idx === 0 ? "1rem" : "0.95rem",
                                    color: idx === 0 ? "#374151" : "#4b5563",
                                    marginBottom: idx === introParagraphs.length - 1 ? 0 : "0.75rem",
                                }}
                            >
                                {text}
                            </p>
                        ))}

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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <h2
                                style={{
                                    fontSize: "1.1rem",
                                    marginBottom: "0.5rem",
                                    color: "#111827",
                                }}
                            >
                                {sideTitle}
                            </h2>
                            {isAdmin && !isEditing("home.intro_side") ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        startEdit(
                                            "home.intro_side",
                                            introSide?.title ?? sideTitle,
                                            introSide?.body ?? (DEFAULT_BLOCKS["home.intro_side"].body ?? "")
                                        )
                                    }
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        background: "#ffffff",
                                        color: "#111827",
                                        borderRadius: "999px",
                                        padding: "0.25rem 0.6rem",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    Szerkesztés
                                </button>
                            ) : null}
                        </div>
                        {isAdmin && isEditing("home.intro_side") ? (
                            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <input
                                    value={drafts["home.intro_side"]?.title ?? ""}
                                    onChange={(e) =>
                                        setDrafts((prev) => ({
                                            ...prev,
                                            ["home.intro_side"]: { ...prev["home.intro_side"], title: e.target.value },
                                        }))
                                    }
                                    style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                />
                                <textarea
                                    rows={5}
                                    value={drafts["home.intro_side"]?.body ?? ""}
                                    onChange={(e) =>
                                        setDrafts((prev) => ({
                                            ...prev,
                                            ["home.intro_side"]: { ...prev["home.intro_side"], body: e.target.value },
                                        }))
                                    }
                                    style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                />
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        onClick={() => saveBlock("home.intro_side")}
                                        style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    >
                                        Mentés
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => cancelEdit("home.intro_side")}
                                        style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </div>
                        ) : null}
                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "#4b5563",
                                marginBottom: "0.6rem",
                            }}
                        >
                            Felépített videóleckék, amelyek segítenek:
                        </p>
                        {sideItems.length > 0 ? (
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
                                {sideItems.map((item, idx) => (
                                    <li key={`side-${idx}`}>{item}</li>
                                ))}
                            </ul>
                        ) : null}
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h2
                        style={{
                            fontSize: "1.4rem",
                            marginBottom: "0.75rem",
                            color: "#111827",
                        }}
                    >
                        {seriesTitle}
                    </h2>
                    {isAdmin && !isEditing("home.series_goal") ? (
                        <button
                            type="button"
                            onClick={() =>
                                startEdit(
                                    "home.series_goal",
                                    seriesGoal?.title ?? seriesTitle,
                                    seriesGoal?.body ?? (DEFAULT_BLOCKS["home.series_goal"].body ?? "")
                                )
                            }
                            style={{
                                border: "1px solid #e5e7eb",
                                background: "#ffffff",
                                color: "#111827",
                                borderRadius: "999px",
                                padding: "0.25rem 0.6rem",
                                fontSize: "0.8rem",
                            }}
                        >
                            Szerkesztés
                        </button>
                    ) : null}
                </div>
                {isAdmin && isEditing("home.series_goal") ? (
                    <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <input
                            value={drafts["home.series_goal"]?.title ?? ""}
                            onChange={(e) =>
                                setDrafts((prev) => ({
                                    ...prev,
                                    ["home.series_goal"]: { ...prev["home.series_goal"], title: e.target.value },
                                }))
                            }
                            style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                        />
                        <textarea
                            rows={5}
                            value={drafts["home.series_goal"]?.body ?? ""}
                            onChange={(e) =>
                                setDrafts((prev) => ({
                                    ...prev,
                                    ["home.series_goal"]: { ...prev["home.series_goal"], body: e.target.value },
                                }))
                            }
                            style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                type="button"
                                onClick={() => saveBlock("home.series_goal")}
                                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            >
                                Mentés
                            </button>
                            <button
                                type="button"
                                onClick={() => cancelEdit("home.series_goal")}
                                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            >
                                Mégse
                            </button>
                        </div>
                    </div>
                ) : null}
                {seriesParagraphs.map((text, idx) => (
                    <p
                        key={`series-${idx}`}
                        style={{
                            fontSize: "0.95rem",
                            color: idx === 0 ? "#374151" : "#4b5563",
                            marginBottom: idx === seriesParagraphs.length - 1 ? 0 : "0.5rem",
                        }}
                    >
                        {text}
                    </p>
                ))}
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

                {freeVideos.length === 0 ? (
                    <div
                        style={{
                            borderRadius: "14px",
                            border: "1px dashed #cbd5f5",
                            padding: "1rem",
                            color: "#6b7280",
                            background: "#f8fafc",
                        }}
                    >
                        Nincs beállítva ingyenes videó. Jelöld meg a videóknál az “Ingyenes” kapcsolót.
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "1.5rem",
                        }}
                    >
                        {freeVideos.map((video) => (
                            <div key={video.id}>
                                <h3
                                    style={{
                                        fontSize: "1rem",
                                        marginBottom: "0.4rem",
                                        color: "#111827",
                                    }}
                                >
                                    {video.title}
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
                                    {video.vimeo_id ? (
                                        <iframe
                                            src={`https://player.vimeo.com/video/${video.vimeo_id}`}
                                            title={video.title}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                border: "none",
                                            }}
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <p
                            style={{
                                fontSize: "0.95rem",
                                color: "#374151",
                                marginBottom: "0.35rem",
                            }}
                        >
                            {aboutText}
                        </p>
                        {isAdmin && !isEditing("home.about") ? (
                            <button
                                type="button"
                                onClick={() =>
                                    startEdit(
                                        "home.about",
                                        about?.title ?? "",
                                        about?.body ?? (DEFAULT_BLOCKS["home.about"].body ?? "")
                                    )
                                }
                                style={{
                                    border: "1px solid #e5e7eb",
                                    background: "#ffffff",
                                    color: "#111827",
                                    borderRadius: "999px",
                                    padding: "0.25rem 0.6rem",
                                    fontSize: "0.8rem",
                                }}
                            >
                                Szerkesztés
                            </button>
                        ) : null}
                    </div>
                    {isAdmin && isEditing("home.about") ? (
                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <textarea
                                rows={4}
                                value={drafts["home.about"]?.body ?? ""}
                                onChange={(e) =>
                                    setDrafts((prev) => ({
                                        ...prev,
                                        ["home.about"]: { ...prev["home.about"], body: e.target.value },
                                    }))
                                }
                                style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                            />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => saveBlock("home.about")}
                                    style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                >
                                    Mentés
                                </button>
                                <button
                                    type="button"
                                    onClick={() => cancelEdit("home.about")}
                                    style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                                >
                                    Mégse
                                </button>
                            </div>
                        </div>
                    ) : null}
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
