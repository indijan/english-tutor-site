import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.35rem" }}>Admin</h1>
        <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/admin/videos" style={{ color: "#2563eb", textDecoration: "none" }}>
            Videók
          </Link>
          <Link href="/admin/categories" style={{ color: "#2563eb", textDecoration: "none" }}>
            Kategóriák
          </Link>
          <Link href="/admin/users" style={{ color: "#2563eb", textDecoration: "none" }}>
            Userek
          </Link>
          <Link href="/" style={{ color: "#6b7280", textDecoration: "none" }}>
            Főoldal
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
