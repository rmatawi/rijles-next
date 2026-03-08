import Link from "next/link";

export const metadata = {
  title: "Pagina Niet Gevonden",
  robots: {
    index: false,
    follow: true,
  },
};

const links = [
  { href: "/", label: "Home" },
  { href: "/qa", label: "Theorie Vragen" },
  { href: "/maquette", label: "Maquette Oefenen" },
  { href: "/verkeersborden", label: "Verkeersborden" },
  { href: "/rijscholen", label: "Rijscholen" },
];

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <section style={{ maxWidth: 720, width: "100%" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>404 - Pagina niet gevonden</h1>
        <p style={{ marginBottom: "1.25rem" }}>
          Deze pagina bestaat niet of is verplaatst. Gebruik een van de links hieronder.
        </p>
        <nav aria-label="Aanbevolen pagina's">
          <ul style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", padding: 0 }}>
            {links.map((item) => (
              <li key={item.href} style={{ listStyle: "none" }}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </main>
  );
}
