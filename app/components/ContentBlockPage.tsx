"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type ContentBlock = {
  key: string;
  title: string | null;
  body: string | null;
  is_published: boolean | null;
};

type ContentBlockPageProps = {
  blockKey: string;
  defaultTitle: string;
  defaultBody: string;
};

function splitParagraphs(body: string | null | undefined) {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function ContentBlockPage({ blockKey, defaultTitle, defaultBody }: ContentBlockPageProps) {
  const [block, setBlock] = useState<ContentBlock | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(defaultTitle);
  const [draftBody, setDraftBody] = useState(defaultBody);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("content_blocks")
        .select("key,title,body,is_published")
        .eq("key", blockKey)
        .eq("is_published", true)
        .maybeSingle();

      if (!cancelled) {
        setBlock((data as ContentBlock) ?? null);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [blockKey]);

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

  const title = block?.title ?? defaultTitle;
  const paragraphs = useMemo(() => splitParagraphs(block?.body ?? defaultBody), [block?.body, defaultBody]);

  function startEdit() {
    setDraftTitle(block?.title ?? defaultTitle);
    setDraftBody(block?.body ?? defaultBody);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function save() {
    if (!window.confirm("Mented a módosításokat?")) return;

    const payload = {
      key: blockKey,
      title: draftTitle.trim() || defaultTitle,
      body: draftBody.trim() || defaultBody,
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("content_blocks").upsert(payload, { onConflict: "key" }).select();
    if (error) {
      alert(error.message);
      return;
    }

    const nextRow = (data ?? []).find((row) => String((row as any).key) === blockKey) as ContentBlock | undefined;
    setBlock(
      nextRow ?? {
        key: blockKey,
        title: payload.title,
        body: payload.body,
        is_published: true,
      }
    );
    setEditing(false);
  }

  return (
    <div
      style={{
        maxWidth: "820px",
        margin: "0 auto",
        padding: "4.5rem 1rem 3rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          boxShadow: "0 3px 6px rgba(15,23,42,0.04), 0 8px 16px rgba(15,23,42,0.06)",
          padding: "1.75rem 1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              color: "#111827",
            }}
          >
            {title}
          </h1>
          {isAdmin && !editing ? (
            <button
              type="button"
              onClick={startEdit}
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

        {isAdmin && editing ? (
          <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <textarea
              rows={8}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              style={{ padding: "0.5rem 0.6rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={save}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                Mentés
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              >
                Mégse
              </button>
            </div>
          </div>
        ) : null}

        {paragraphs.map((text, idx) => (
          <p
            key={`${blockKey}-${idx}`}
            style={{
              fontSize: "0.95rem",
              color: idx === 0 ? "#374151" : "#4b5563",
              marginBottom: "0.75rem",
            }}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
