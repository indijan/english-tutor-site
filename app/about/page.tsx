// app/about/page.tsx
export default function AboutPage() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "5rem 1rem 3rem",
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
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "1rem",
            color: "#111827",
          }}
        >
          Rólam
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.1fr) auto",
            gap: "1.5rem",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#374151",
                marginBottom: "0.75rem",
              }}
            >
              [Itt jöhet a magyar bemutatkozó szöveg – tanítási tapasztalat, cél,
              stílus, stb.]
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#4b5563",
                marginBottom: "0.75rem",
              }}
            >
              [Itt jöhet a bemutatkozó szöveg folytatása – tanítási tapasztalat,
              fókusz, és hogy mire számíthatnak a diákok a leckéken.]
            </p>
            <a
              href="https://online.suli.hu/oktatok/adatlap/elvi0920"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                marginTop: "0.75rem",
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Értékelések az online.suli.hu oldalon
            </a>
          </div>

          <img
            src="/teacher_portrait.jpg"
            alt="Angoltanár portré"
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "999px",
              objectFit: "cover",
              border: "3px solid #22c55e",
            }}
          />
        </div>
      </div>
    </div>
  );
}
