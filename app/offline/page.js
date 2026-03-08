export const metadata = {
  title: "Offline | Rijklaar",
  description: "Je bent offline. Controleer je verbinding en probeer opnieuw.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section style={{ maxWidth: "540px" }}>
        <h1 style={{ marginBottom: "12px" }}>Je bent offline</h1>
        <p style={{ marginBottom: "16px" }}>
          De pagina kon niet worden geladen zonder internetverbinding.
        </p>
        <p>Controleer je verbinding en ververs de pagina.</p>
      </section>
    </main>
  );
}
