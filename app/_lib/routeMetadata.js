import { getSeoConfig } from "./seoConfig";

export const noIndexRoutes = new Set([
  "auth",
  "student-login",
  "school-selection",
  "profile",
  "admin-profile",
  "admin-request",
  "student-dashboard",
  "admin-access",
  "school-access-request",
  "student-access-request",
  "student-access-registration",
  "verify-access",
  "student-access-grant",
  "accountmanager",
  "admin-management",
  "superadmin-tools",
  "ads-dashboard",
  "ads-campaign",
]);

export const seoMap = {
  home: {
    title: "Rijles Suriname",
    description:
      "Start met rijles in Suriname bij een professionele rijschool in Paramaribo.",
    url: "/",
  },
  qa: {
    title: "Theorie Examen Suriname - Vraag en Antwoord",
    description:
      "Bereid je theorie examen in Suriname voor met duidelijke vraag en antwoord uitleg.",
    url: "/qa",
  },
  verkeersborden: {
    title: "Verkeersborden Suriname Oefenen",
    description:
      "Leer en oefen verkeersborden in Suriname met voorbeelden en uitleg.",
    url: "/verkeersborden",
  },
  maquette: {
    title: "Rijexamen Oefenen Suriname - Verkeerssituaties",
    description:
      "Oefen realistische verkeerssituaties en maquettes voor je rijexamen in Suriname.",
    url: "/maquette",
  },
  videos: {
    title: "Instructievideo's",
    description: "Bekijk handige instructievideo's voor praktijkexamen voorbereiding.",
    url: "/videos",
  },
  rijscholen: {
    title: "Rijschool Suriname en Rijschool Paramaribo",
    description:
      "Vergelijk rijscholen in Suriname en vind een rijschool die bij je past.",
    url: "/rijscholen",
  },
  services: {
    title: "Autorijles Paramaribo en Rijbewijs Halen Suriname",
    description:
      "Bekijk diensten voor autorijles in Paramaribo en praktische stappen voor je rijbewijs.",
    url: "/services",
  },
  "free-trial-signup": {
    title: "Online Rijles App Suriname - Gratis Proefles",
    description:
      "Meld je aan voor een gratis proefdag in onze online rijles app voor Suriname.",
    url: "/free-trial-signup",
  },
  referral: {
    title: "Referral Programma",
    description: "Nodig je vrienden uit en verdien beloningen.",
    url: "/referral",
  },
  about: {
    title: "Over Ons",
    description: "Leer meer over onze missie en de instructeurs achter de rijschool.",
    url: "/about",
  },
  profile: {
    title: "Profiel",
    description: "Beheer je profiel en bekijk je voortgang.",
    url: "/profile",
  },
  "student-login": {
    title: "Student Login",
    description: "Log in op je studentenomgeving en bekijk je lessen en voortgang.",
    url: "/student-login",
  },
  "school-selection": {
    title: "School Selectie",
    description: "Selecteer je rijschool om verder te gaan.",
    url: "/school-selection",
  },
  maquettebuilder: {
    title: "Maquette Builder",
    description: "Bouw en bewerk verkeerssituaties voor oefendoeleinden.",
    url: "/maquettebuilder",
  },
  insurance: {
    title: "Verzekeringen",
    description: "Informatie over autoverzekeringen voor beginnende bestuurders.",
    url: "/insurance",
  },
  mockexams: {
    title: "Proefexamens",
    description: "Test je kennis met proefexamens.",
    url: "/mockexams",
  },
  mockexamssequenced: {
    title: "Theorie Examen Oefenen",
    description: "Oefen met gesimuleerde theorie-examens in de juiste volgorde.",
    url: "/mockexamssequenced",
  },
  emergency: {
    title: "Noodgevallen",
    description: "Belangrijke informatie voor noodgevallen en hulpdiensten.",
    url: "/emergency",
  },
  form: {
    title: "Formulier",
    description: "Vul het formulier in voor aanvullende aanvragen.",
    url: "/form",
  },
  "dynamic-route": {
    title: "Dynamische Pagina",
    description: "Dynamische route binnen het platform.",
    url: "/dynamic-route",
  },
  "request-and-load": {
    title: "Request And Load",
    description: "Pagina voor request/load workflow.",
    url: "/request-and-load",
  },
  "single-maquette": {
    title: "Verkeerssituatie",
    description: "Bestudeer deze specifieke verkeerssituatie.",
    url: "/single-maquette",
  },
  auth: {
    title: "Authenticatie",
    description: "Meld je aan of log in om toegang te krijgen tot het platform.",
    url: "/auth",
  },
  "admin-profile": {
    title: "Admin Profiel",
    description: "Beheer je rijschoolprofiel en instellingen.",
    url: "/admin-profile",
  },
  "admin-request": {
    title: "Admin Aanvraag",
    description: "Vraag beheertoegang aan voor je rijschool.",
    url: "/admin-request",
  },
  "student-dashboard": {
    title: "Student Dashboard",
    description: "Je persoonlijk dashboard met lessen, examens en voortgang.",
    url: "/student-dashboard",
  },
  "admin-access": {
    title: "Admin Toegang",
    description: "Beheer en verifieer admin-toegangsverzoeken.",
    url: "/admin-access",
  },
  "school-access-request": {
    title: "School Toegang Aanvraag",
    description: "Vraag toegang aan tot een specifieke rijschoolomgeving.",
    url: "/school-access-request",
  },
  "student-access-request": {
    title: "Student Toegang Aanvraag",
    description: "Vraag studenttoegang aan voor het platform.",
    url: "/student-access-request",
  },
  "student-access-registration": {
    title: "Student Registratie",
    description: "Rond je studentregistratie af om te starten.",
    url: "/student-access-registration",
  },
  "verify-access": {
    title: "Toegang Verifiëren",
    description: "Verifieer je toegang tot de applicatie.",
    url: "/verify-access",
  },
  accountmanager: {
    title: "Accountmanager",
    description: "Beheer account- en gebruikersgegevens.",
    url: "/accountmanager",
  },
  "offline-demo": {
    title: "Offline Demo",
    description: "Bekijk offline functionaliteit van de applicatie.",
    url: "/offline-demo",
  },
  "pwa-install-demo": {
    title: "PWA Install Demo",
    description: "Instructies en demo voor installatie van de app.",
    url: "/pwa-install-demo",
  },
  "admin-management": {
    title: "Beheer",
    description: "Beheer studenten, lessen en rijschoolinstellingen.",
    url: "/admin-management",
  },
  "student-access-grant": {
    title: "Student Toegang Verlenen",
    description: "Verleen toegang aan studenten binnen de rijschoolomgeving.",
    url: "/student-access-grant",
  },
  campaign: {
    title: "Campagne",
    description: "Bekijk lopende campagnes en promoties.",
    url: "/campaign",
  },
  "campaign-fresh": {
    title: "Campagne Fresh",
    description: "Nieuwe campagnepagina met actuele promotie-inhoud.",
    url: "/campaign-fresh",
  },
  stepbystepinfo: {
    title: "Stap Voor Stap Info",
    description: "Volg stapsgewijze informatie en instructies.",
    url: "/stepbystepinfo",
  },
  "skin-settings": {
    title: "Skin Instellingen",
    description: "Pas thema- en skin-instellingen van de app aan.",
    url: "/skin-settings",
  },
  "skin-select": {
    title: "Skin Selectie",
    description: "Kies een visuele skin voor de app.",
    url: "/skin-select",
  },
  "registration-requirements": {
    title: "Inschrijvingseisen",
    description: "Bekijk alle eisen en documenten voor inschrijving.",
    url: "/registration-requirements",
  },
  "admin-marketing-guide": {
    title: "Admin Marketing Gids",
    description: "Handleiding en richtlijnen voor marketing als admin.",
    url: "/admin-marketing-guide",
  },
  adverteren: {
    title: "Adverteren",
    description: "Informatie over advertentiemogelijkheden op het platform.",
    url: "/adverteren",
  },
  "ads-dashboard": {
    title: "Ads Dashboard",
    description: "Beheer advertentieprestaties en campagnes.",
    url: "/ads-dashboard",
  },
  "ads-campaign": {
    title: "Ads Campagne",
    description: "Beheer en optimaliseer advertentiecampagnes.",
    url: "/ads-campaign",
  },
  "superadmin-tools": {
    title: "Superadmin Tools",
    description: "Geavanceerde beheerhulpmiddelen voor superadmins.",
    url: "/superadmin-tools",
  },
};

export const knownPageKeys = new Set(Object.keys(seoMap));

const toAbsolute = (path = "/", siteUrl) => {
  if (path.startsWith("http")) return path;
  const normalizedSite = siteUrl.replace(/\/$/, "");
  return `${normalizedSite}/${path.replace(/^\//, "")}`;
};

export const getIndexablePaths = () => {
  const paths = new Set(["/"]);

  Object.entries(seoMap).forEach(([pageKey, config]) => {
    if (noIndexRoutes.has(pageKey)) return;
    if (config?.url) paths.add(config.url);
  });

  return Array.from(paths);
};

export function getRouteMetadata(pageKey, pathFallback = "/", siteUrl) {
  const seoConfig = getSeoConfig(siteUrl);
  const seo = seoMap[pageKey] || {};
  const title = seo.title ? `${seo.title} | ${seoConfig.baseTitle}` : seoConfig.baseTitle;
  const description = seo.description || seoConfig.description;
  const canonicalPath = seo.url || pathFallback;
  const canonicalUrl = toAbsolute(canonicalPath, seoConfig.siteUrl);
  const noindex = noIndexRoutes.has(pageKey);

  return {
    title,
    description,
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [seoConfig.ogImage],
      siteName: seoConfig.baseTitle,
      locale: "nl_SR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [seoConfig.ogImage],
    },
  };
}
