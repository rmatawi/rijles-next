import { f7 } from "framework7-react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Block,
  Card,
  CardContent,
  CardHeader,
  Button,
  Icon,
} from "framework7-react";
import NavHomeButton from "../components/NavHomeButton";
import { openWhatsAppWithPhone } from "../services/adminContactService";

const ADVERTISER_EMAIL = "rianmatawi@gmail.com";
const ADVERTISER_WHATSAPP = "(597)8754335";

const PERFORMANCE_METRICS = {
  period: "Laatste 14 dagen",
  eventCount: "42,000",
  newUsers: "4,000",
  activeUsers: "4,000",
  activeUsersLast30m: "9",
  topCountries: [
    { name: "Suriname", users: "2,400" },
    { name: "United States", users: "77" },
    { name: "Germany", users: "29" },
    { name: "French Guiana", users: "15" },
  ],
  topPages: [
    { name: "home", views: "7,000" },
    { name: "Rijles Suriname | Rijs...", views: "4,600" },
    { name: "Rijles Suriname | Rijs... (2)", views: "3,400" },
    { name: "Rijschool Amelia", views: "2,100" },
  ],
};

const PACKAGES = [
  {
    name: "Starter Presence",
    subtitle: "Ideaal voor lokale garages en kleine diensten",
    priceUsd: 75,
    benefits: [
      "1 in-feed advertentieplaatsing (roterend, niet-exclusief)",
      "Tot 2 creatives per maand",
      "1 CTA-link (website of WhatsApp)",
      "Maandelijkse rapportage: impressies, klikken, CTR",
    ],
  },
  {
    name: "Growth Sponsor",
    subtitle: "Voor dealers, verzekeraars en tweedehandsplatforms",
    priceUsd: 250,
    featured: true,
    benefits: [
      "2 in-feed plaatsingen op pagina's met hoog verkeer",
      "1 sectiesponsoring: 'Sponsored by [Brand]'",
      "Tot 4 creatives per maand",
      "2 CTA-bestemmingen + tweewekelijkse update",
    ],
  },
  {
    name: "Premium Exclusive",
    subtitle: "Voor merken die maximale zichtbaarheid willen",
    priceUsd: 450,
    benefits: [
      "Premium topplaatsing + in-feed zichtbaarheid",
      "Dagelijkse spotlight-vermelding",
      "Categorie-exclusiviteit op afspraak",
      "Wekelijkse rapportage en optimalisatie-advies",
    ],
  },
];

const AdvertisePage = () => {
  const openAdvertiserWhatsApp = () => {
    const pageUrl = window.location.origin + "/adverteren/";
    const message = [
      "Hi, ik wil adverteren in de Rijles App.",
      "",
      "Bedrijfsnaam:",
      "Branche:",
      "Doel:",
      "Budget per maand:",
      "",
      `Pagina: ${pageUrl}`,
    ].join("\n");

    const result = openWhatsAppWithPhone({ phone: ADVERTISER_WHATSAPP, message });
    if (!result.opened) {
      f7.dialog.alert("Kon WhatsApp niet openen. Probeer later opnieuw.");
    }
  };

  const openMailLead = () => {
    const subject = encodeURIComponent("Advertentieaanvraag Rijles App");
    const body = encodeURIComponent(
      [
        "Bedrijfsnaam:",
        "Branche:",
        "Doel van campagne:",
        "Gewenst pakket:",
        "Budget per maand:",
      ].join("\n"),
    );
    window.location.href = `mailto:${ADVERTISER_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <Page name="adverteren" className="page-neu advertise-page">
      <style>{`
        .advertise-page {
          --ad-bg-a: #ffe5d0;
          --ad-bg-b: #ffd8cc;
          --ad-bg-c: #fff4db;
          --ad-ink: #2b1d16;
          --ad-muted: #5c4a40;
          --ad-accent: #ff4a1c;
          --ad-accent-dark: #d93a13;
          --ad-chip: #fff2ea;
          --ad-border: rgba(255, 95, 46, 0.22);
          --ad-shadow: 0 18px 38px rgba(188, 73, 41, 0.16);
          font-family: "Sora", "Manrope", "Segoe UI", sans-serif;
          background: radial-gradient(circle at 10% 10%, var(--ad-bg-c) 0%, var(--ad-bg-b) 40%, var(--ad-bg-a) 100%);
          color: var(--ad-ink);
          overflow-x: hidden;
        }

        .ad-bg-blob {
          position: absolute;
          border-radius: 999px;
          filter: blur(1px);
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
          animation: adFloat 8s ease-in-out infinite alternate;
        }

        .ad-bg-blob.a {
          width: 180px;
          height: 180px;
          top: 88px;
          right: -60px;
          background: #ffc48f;
        }

        .ad-bg-blob.b {
          width: 140px;
          height: 140px;
          top: 340px;
          left: -45px;
          background: #ff9d8a;
          animation-delay: 0.8s;
        }

        .ad-content-wrap {
          position: relative;
          z-index: 1;
          padding: 10px 16px 28px;
        }

        .hero-card {
          border-radius: 20px;
          border: 1px solid var(--ad-border);
          box-shadow: var(--ad-shadow);
          background: linear-gradient(130deg, #fffefb 0%, #fff2e8 60%, #ffe8dc 100%);
          margin: 0 0 14px;
          animation: adRise 0.4s ease-out;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 999px;
          background: rgba(255, 74, 28, 0.1);
          color: var(--ad-accent-dark);
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .hero-title {
          margin: 12px 0 10px;
          font-size: clamp(22px, 4.9vw, 33px);
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .hero-subtitle {
          margin: 0;
          color: var(--ad-muted);
          line-height: 1.5;
          font-size: 14px;
        }

        .hero-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .hero-chip {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid #ffd3c1;
          background: var(--ad-chip);
          font-size: 12px;
          font-weight: 700;
          color: #85301f;
        }

        .hero-actions {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .info-card {
          margin: 0 0 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(255, 189, 161, 0.7);
          box-shadow: 0 8px 20px rgba(120, 53, 34, 0.08);
          animation: adRise 0.46s ease-out;
        }

        .info-title {
          font-size: 14px;
          font-weight: 700;
          color: #7f2e1d;
        }

        .quick-steps {
          margin: 0;
          padding-left: 18px;
          color: #3f2c25;
          line-height: 1.5;
          font-size: 14px;
        }

        .inline-cta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .benefit-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .metric-tile {
          border: 1px solid #ffd7c7;
          border-radius: 12px;
          padding: 10px;
          background: #fff7f2;
        }

        .metric-label {
          margin: 0 0 4px;
          font-size: 11px;
          color: #7a5a4f;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .metric-value {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #2f1f18;
          line-height: 1.1;
        }

        .metrics-list {
          margin: 0;
          padding-left: 18px;
          color: #3f2c25;
          line-height: 1.5;
          font-size: 14px;
        }

        .metrics-caption {
          margin: 10px 0 0;
          font-size: 12px;
          color: #6b5047;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #402e27;
          line-height: 1.45;
          font-size: 14px;
        }

        .package-card {
          margin: 0 0 12px;
          border-radius: 18px;
          border: 1px solid rgba(255, 188, 154, 0.78);
          background: #fffdf9;
          box-shadow: 0 10px 26px rgba(129, 57, 37, 0.1);
          animation: adRise 0.5s ease-out;
        }

        .package-card.featured {
          border-color: #ff7f55;
          box-shadow: 0 15px 30px rgba(217, 73, 35, 0.2);
          background: linear-gradient(145deg, #fff8f3 0%, #fff0e6 100%);
        }

        .package-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }

        .package-name {
          margin: 0;
          font-size: 19px;
          line-height: 1.1;
          font-weight: 800;
          color: #341e17;
        }

        .package-sub {
          margin: 5px 0 0;
          color: #6b5047;
          font-size: 12px;
        }

        .package-badge {
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.2px;
          color: #fff;
          background: linear-gradient(135deg, #f0522f, #df3e1f);
          white-space: nowrap;
        }

        .package-price {
          margin: 7px 0 8px;
          font-size: 14px;
          color: #4a3127;
        }

        .package-price strong {
          font-size: 22px;
          color: #22150f;
          letter-spacing: -0.3px;
        }

        .package-list {
          margin: 0;
          padding-left: 19px;
          line-height: 1.5;
          color: #3f2c25;
          font-size: 14px;
        }

        .foot-note {
          margin-top: 4px;
          color: #694e44;
          font-size: 11px;
          opacity: 0.85;
        }

        @keyframes adRise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes adFloat {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(16px);
          }
        }
      `}</style>

      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          Adverteren in de App
        </NavTitle>
      </Navbar>

      <div className="ad-bg-blob a" />
      <div className="ad-bg-blob b" />

      <Block className="ad-content-wrap">
        <Card className="hero-card">
          <CardContent>
            <span className="hero-badge">
              <Icon f7="sparkles" size="12px" />
              Voor adverteerders
            </span>
            <h1 className="hero-title">Bereik toekomstige bestuurders met hoge koopintentie</h1>
            <p className="hero-subtitle">
              U bereikt een lokaal publiek dat al actief bezig is met rijlessen, auto-keuze en verzekering.
            </p>
            <div className="hero-chip-row">
              <span className="hero-chip">Automotive doelgroep</span>
              <span className="hero-chip">Dagelijks mobiel bereik</span>
              <span className="hero-chip">Meetbare clicks</span>
            </div>
            <div className="hero-actions">
              <Button fill color="red" onClick={openAdvertiserWhatsApp}>
                Start via WhatsApp
              </Button>
              {/*
              <Button outline color="red" onClick={openMailLead}>
                Vraag media kit via e-mail
              </Button>
              */}
            </div>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardHeader className="info-title">Waarom dit goed converteert voor uw merk</CardHeader>
          <CardContent>
            <p style={{ marginTop: 0, marginBottom: "10px", lineHeight: 1.5 }}>
              De app wordt gebruikt door mensen in de fase vlak voor hun eerste rijbewijs en vaak ook hun eerste auto-gerelateerde aankoop.
            </p>
            <p style={{ margin: 0, fontWeight: 700, color: "#6f2d1f" }}>
              Minder ruis dan brede social targeting, meer relevante aandacht.
            </p>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardHeader className="info-title">Waarom adverteerders hiervoor kiezen</CardHeader>
          <CardContent>
            <ul className="benefit-list">
              <li className="benefit-item">
                <Icon f7="checkmark_seal_fill" size="16px" color="#df3e1f" />
                Eerste en enige mobiele rijtheorie-app in Suriname.
              </li>
              <li className="benefit-item">
                <Icon f7="checkmark_seal_fill" size="16px" color="#df3e1f" />
                Dagelijks terugkerend bereik in een relevante niche.
              </li>
              <li className="benefit-item">
                <Icon f7="checkmark_seal_fill" size="16px" color="#df3e1f" />
                Doelgroep met concrete interesse in auto's en mobiliteit.
              </li>
              <li className="benefit-item">
                <Icon f7="checkmark_seal_fill" size="16px" color="#df3e1f" />
                Lokale zichtbaarheid met meetbare resultaten.
              </li>
            </ul>
            <div className="inline-cta-row">
              <Button small fill color="red" onClick={openAdvertiserWhatsApp}>
                Plan kennismaking
              </Button>
              <Button small outline color="red" onClick={openMailLead}>
                Ontvang voorstel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardHeader className="info-title">Resultaten & metrics</CardHeader>
          <CardContent>
            <div className="metrics-grid">
              <div className="metric-tile">
                <p className="metric-label">Event count ({PERFORMANCE_METRICS.period})</p>
                <p className="metric-value">{PERFORMANCE_METRICS.eventCount}</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">New users ({PERFORMANCE_METRICS.period})</p>
                <p className="metric-value">{PERFORMANCE_METRICS.newUsers}</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">Active users ({PERFORMANCE_METRICS.period})</p>
                <p className="metric-value">{PERFORMANCE_METRICS.activeUsers}</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">Active users (laatste 30 min)</p>
                <p className="metric-value">{PERFORMANCE_METRICS.activeUsersLast30m}</p>
              </div>
            </div>

            <p style={{ marginTop: 0, marginBottom: "8px", fontWeight: 700, color: "#6f2d1f" }}>
              Top landen op actief gebruik
            </p>
            <ol className="metrics-list">
              {PERFORMANCE_METRICS.topCountries.map((country) => (
                <li key={country.name}>
                  {country.name}: {country.users} actieve gebruikers
                </li>
              ))}
            </ol>

            <p style={{ marginTop: "10px", marginBottom: "8px", fontWeight: 700, color: "#6f2d1f" }}>
              Populairste pagina's op views
            </p>
            <ol className="metrics-list">
              {PERFORMANCE_METRICS.topPages.map((page) => (
                <li key={page.name}>
                  {page.name}: {page.views} views
                </li>
              ))}
            </ol>
            <p className="metrics-caption">
              Bron: interne GA4-snapshot (indicatieve cijfers).
            </p>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardHeader className="info-title">Zo starten we binnen 48 uur</CardHeader>
          <CardContent>
            <ol className="quick-steps">
              <li>U kiest een pakket en doelgroepfocus.</li>
              <li>U stuurt logo, aanbod en CTA-link (site of WhatsApp).</li>
              <li>Wij plaatsen en sturen uw eerste rapportage.</li>
            </ol>
          </CardContent>
        </Card>

        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.name}
            className={`package-card${pkg.featured ? " featured" : ""}`}
          >
            <CardContent>
              <div className="package-top">
                <div>
                  <h3 className="package-name">{pkg.name}</h3>
                  <p className="package-sub">{pkg.subtitle}</p>
                </div>
                {/* {pkg.featured && <span className="package-badge">Populair</span>} */}
              </div>
              <p className="package-price">
                <strong>USD {pkg.priceUsd}</strong> / maand
              </p>
              <ul className="package-list">
                {pkg.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <p className="foot-note">
          Prijzen zijn indicatief. Vraag een voorstel op maat voor langere campagnes.
        </p>
        <div className="hero-actions" style={{ marginTop: 10, marginBottom: 8 }}>
          <Button fill color="red" onClick={openAdvertiserWhatsApp}>
            Reserveer advertentieplek
          </Button>
        </div>
      </Block>
    </Page>
  );
};

export default AdvertisePage;
