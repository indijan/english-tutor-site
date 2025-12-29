// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Angolozz Otthonról – Angol [Tanár neve]-vel",
  description:
    "Videóleckék középhaladó és haladó tanulóknak – érthető nyelvtan és való életben használt szókincs.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Server Components cannot set cookies.
          // Cookie updates should be handled in Route Handlers (e.g. /auth/signout) or Middleware.
        },
        remove() {
          // Server Components cannot remove cookies.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="hu">
      <body
        className="antialiased"
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, system-ui, Segoe UI, sans-serif",
        }}
      >
        <Header initialHasUser={!!user} />

        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#f7f3e9",
          }}
        >
          {children}
        </main>

        <footer
          style={{
            textAlign: "center",
            padding: "1.5rem 1rem 2rem",
            fontSize: "0.8rem",
            color: "#6b7280",
            borderTop: "1px solid #e5e7eb",
            marginTop: "2rem",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/terms" style={{ color: "#2563eb", textDecoration: "none" }}>
              ÁSZF
            </Link>
            <Link href="/privacy" style={{ color: "#2563eb", textDecoration: "none" }}>
              Adatkezelés
            </Link>
            <Link href="/contact" style={{ color: "#2563eb", textDecoration: "none" }}>
              Kapcsolat
            </Link>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            © {new Date().getFullYear()} angolozzotthonrol.hu – Minden jog fenntartva.
          </div>
        </footer>
      </body>
    </html>
  );
}
