import Link from "next/link";
import { headers } from "next/headers";
import { getRouteMetadata } from "./_lib/routeMetadata";
import { resolveSiteUrl } from "./_lib/seoConfig";
import styles from "./page.module.css";

export async function generateMetadata() {
  const siteUrl = resolveSiteUrl(await headers());
  return getRouteMetadata("home", "/", siteUrl);
}

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Rijles Suriname</p>
        <h1>Sneller leren, met echte examen-situaties</h1>
        <p className={styles.lead}>
          Oefen theorie, verkeersborden en maquettes op een lichte, snelle homepage.
          Open de volledige app wanneer je klaar bent om te trainen.
        </p>
        <div className={styles.actions}>
          <Link href="/home" className={styles.primary}>
            Open App
          </Link>
          <Link href="/qa" className={styles.secondary}>
            Theorie Vragen
          </Link>
          <Link href="/maquette" className={styles.secondary}>
            Maquette Oefenen
          </Link>
        </div>
      </section>

      <section className={styles.grid} aria-label="Belangrijkste onderdelen">
        <article className={styles.card}>
          <h2>Verkeersborden</h2>
          <p>Bekijk borden met uitleg en herken ze sneller tijdens je examen.</p>
          <Link href="/verkeersborden">Ga naar verkeersborden</Link>
        </article>
        <article className={styles.card}>
          <h2>Rijscholen</h2>
          <p>Vergelijk rijscholen en kies een aanpak die bij je planning past.</p>
          <Link href="/rijscholen">Bekijk rijscholen</Link>
        </article>
        <article className={styles.card}>
          <h2>Diensten</h2>
          <p>Bekijk pakketten, extra hulp en stappen om je rijbewijs te halen.</p>
          <Link href="/services">Bekijk diensten</Link>
        </article>
      </section>
    </main>
  );
}
