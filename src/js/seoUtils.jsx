import React from 'react';
import { Helmet } from 'react-helmet-async';

const hiddenH1Style = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  border: '0',
};

/**
 * SEO Component using React Helmet
 * Provides dynamic metadata for each page
 */
export const SEO = ({ 
  page, 
  title: customTitle, 
  description: customDescription, 
  image: customImage,
  url: customUrl,
  h1: customH1,
  robots: customRobots,
  type = 'website'
}) => {
  // Get base values from environment
  const baseTitle = process.env.VITE_SEO_TITLE || "Rijschool";
  const baseDescription = process.env.VITE_SEO_DESCRIPTION || "Rijschool - Professionele Rijinstructeurs.";
  const baseUrl = process.env.VITE_SEO_CANONICAL_URL || window.location.origin;
  const defaultImage = process.env.VITE_SEO_OG_IMAGE || `${baseUrl}/icons/apple-touch-icon.png`;

  // Get SEO data from map if page is specified
  const seoData = page ? getSEODataForPage(page) : {};
  
  // Merge data with priority: custom props > page data > defaults
  const title = customTitle || seoData.title;
  const description = customDescription || seoData.description || baseDescription;
  const image = customImage || seoData.image || defaultImage;
  const robots = customRobots || seoData.robots || "index, follow";
  const pageUrlCandidate = customUrl || seoData.url;
  const pageUrl = pageUrlCandidate
    ? (pageUrlCandidate.startsWith("http")
      ? pageUrlCandidate
      : `${baseUrl.replace(/\/$/, "")}/${pageUrlCandidate.replace(/^\//, "")}`)
    : window.location.href;
  
  // Create full title
  const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
  const h1 = customH1 || seoData.h1 || fullTitle;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="title" content={fullTitle} />
        <meta name="description" content={description} />
        <meta name="robots" content={robots} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:locale" content="nl_SR" />
        <meta property="og:site_name" content={baseTitle} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Helmet>
      <h1 style={hiddenH1Style}>{h1}</h1>
    </>
  );
};

/**
 * Get SEO data for a specific page
 */
const getSEODataForPage = (page) => {
  const seoMap = {
    // Main Pages
    home: { 
      title: "Rijles Suriname",
      description: "Start met rijles in Suriname bij een professionele rijschool in Paramaribo. Leer veilig rijden met praktijkoefeningen en duidelijke begeleiding.",
      h1: "Rijles in Suriname met professionele begeleiding",
      url: "/"
    },
    
    // Learning & Practice
    qa: { 
      title: "Theorie Examen Suriname - Vraag en Antwoord",
      description: "Bereid je theorie examen in Suriname voor met duidelijke vraag en antwoord uitleg over verkeersregels, examenonderdelen en veelgemaakte fouten.",
      h1: "Theorie examen Suriname oefenen met vraag en antwoord",
      url: "/page/qa"
    },
    verkeersborden: { 
      title: "Verkeersborden Suriname Oefenen",
      description: "Leer en oefen verkeersborden in Suriname met voorbeelden en uitleg. Handig voor theorie examen voorbereiding en veilige deelname aan het verkeer.",
      h1: "Verkeersborden Suriname leren en oefenen",
      url: "/page/verkeersborden"
    },
    maquette: { 
      title: "Rijexamen Oefenen Suriname - Verkeerssituaties",
      description: "Oefen realistische verkeerssituaties en maquettes om je rijexamen in Suriname beter voor te bereiden. Leer stap voor stap de juiste keuzes in het verkeer.",
      h1: "Rijexamen oefenen in Suriname met realistische verkeerssituaties",
      url: "/page/maquette"
    },
    "single-maquette": { 
      title: "Verkeersituatie", 
      description: "Bestudeer deze specifieke verkeersituatie en leer de juiste handelingen." 
    },
    mockexams: { 
      title: "Proefexamens", 
      description: "Test je kennis met onze proefexamens. Zie hoe goed je voorbereid bent voor het echte examen." 
    },
    mockexamssequenced: { 
      title: "Theorie Examen Oefenen", 
      description: "Oefen met gesimuleerde theorie-examens in de juiste volgorde." 
    },
    videos: { 
      title: "Instructievideo's", 
      description: "Bekijk handige instructievideo's voor je praktijkexamen. Leer van ervaren rijinstructeurs." 
    },

    // Services & Info
    rijscholen: { 
      title: "Rijschool Suriname en Rijschool Paramaribo",
      description: "Vergelijk rijscholen in Suriname en vind een rijschool in Paramaribo die past bij jouw planning, budget en leerdoelen.",
      h1: "Rijschool Suriname overzicht met focus op Paramaribo",
      url: "/rijscholen/"
    },
    services: { 
      title: "Autorijles Paramaribo en Rijbewijs Halen Suriname",
      description: "Bekijk diensten voor autorijles in Paramaribo, rijles voor beginners in Suriname en praktische stappen om je rijbewijs te halen.",
      h1: "Autorijles in Paramaribo en rijbewijs halen in Suriname",
      url: "/services/"
    },
    insurance: { 
      title: "Verzekeringen", 
      description: "Informatie over autoverzekeringen en wat je moet weten als nieuwe bestuurder." 
    },
    emergency: { 
      title: "Noodgevallen", 
      description: "Belangrijke informatie voor noodgevallen en hulpdiensten in Suriname." 
    },
    "registration-requirements": { 
      title: "Inschrijvingseisen", 
      description: "Alle eisen en documenten die je nodig hebt om je in te schrijven bij de rijschool." 
    },

    // User Pages
    profile: { 
      title: "Profiel", 
      description: "Beheer je profiel en bekijk je voortgang." 
    },
    "student-login": { 
      title: "Student Login", 
      description: "Log in op je studentenomgeving en bekijk je lessen en voortgang." 
    },
    "student-dashboard": { 
      title: "Student Dashboard", 
      description: "Je persoonlijk dashboard met al je lessen, examens en voortgang." 
    },
    
    // Special Pages
    referral: { 
      title: "Referral Programma", 
      description: "Nodig je vrienden uit en verdien beloningen. Deel je unieke referral link." 
    },
    "free-trial-signup": { 
      title: "Online Rijles App Suriname - Gratis Proefles",
      description: "Meld je aan voor een gratis proefdag in onze online rijles app voor Suriname. Start direct met theorie, verkeersborden en praktijkgerichte oefeningen.",
      h1: "Online rijles app Suriname met gratis proefles",
      url: "/free-trial-signup/"
    },
    campaign: { 
      title: "Campagne", 
      description: "Bekijk onze huidige acties en speciale aanbiedingen voor nieuwe studenten." 
    },
    about: { 
      title: "Over Ons", 
      description: "Leer meer over onze missie en de instructeurs achter de rijschool." 
    },

    // Admin Pages
    "admin-profile": { 
      title: "Admin Profiel", 
      description: "Beheer je rijschool profiel en instellingen." 
    },
    "admin-management": { 
      title: "Beheer", 
      description: "Beheer studenten, lessen en rijschool instellingen." 
    },
  };

  return seoMap[page] || { title: "", description: "" };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use SEO component instead
 */
export const updateSEO = (title, description) => {
  console.warn('updateSEO is deprecated. Use <SEO /> component instead.');
  
  const baseTitle = process.env.VITE_SEO_TITLE || "Rijschool";
  
  if (title) {
    document.title = `${title} | ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const baseDescription = process.env.VITE_SEO_DESCRIPTION || "Rijschool - Professionele Rijinstructeurs.";
    metaDescription.setAttribute('content', description || baseDescription);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title ? `${title} | ${baseTitle}` : baseTitle);
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getSEODataForPage instead
 */
export const getSEOForRoute = (route) => {
  const page = route.query?.page || route.path.split('/')[1] || 'home';
  return getSEODataForPage(page);
};
