// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Angolozz Otthonról – English with [Teacher Name]",
  description:
    "Video lessons for intermediate and advanced learners – grammar clarity and real-life vocabulary.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <header
          style={{
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            zIndex: 20,
            backgroundColor: "#ffffff",
          }}
        >
          <nav
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "0.6rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
              angolozzotthonrol.hu
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                fontSize: "0.9rem",
              }}
            >
              <Link href="/" style={{ textDecoration: "none", color: "#111827" }}>
                Home
              </Link>
              <Link href="/about" style={{ textDecoration: "none", color: "#111827" }}>
                About
              </Link>
              <Link href="/videos" style={{ textDecoration: "none", color: "#111827" }}>
                Video Library
              </Link>
              <Link
                href="/auth"
                style={{
                  textDecoration: "none",
                  color: "#16a34a",
                  fontWeight: 600,
                }}
              >
                Login
              </Link>
            </div>
          </nav>
        </header>

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
          © {new Date().getFullYear()} angolozzotthonrol.hu – All rights
          reserved.
        </footer>
      </body>
    </html>
  );
}