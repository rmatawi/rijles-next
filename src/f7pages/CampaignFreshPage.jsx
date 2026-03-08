import React, { useEffect, useRef, useState } from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  BlockTitle,
  f7,
  useStore,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { copyOutline, downloadOutline } from "ionicons/icons";
import html2canvas from "html2canvas";
import NavHomeButton from "../components/NavHomeButton";
import { schoolService } from "../services/schoolService";
import { adminService } from "../services/adminService";
import { instructorService } from "../services/instructorService";
import { isUserAdmin } from "../js/utils";

const CARD_WIDTH = 420;
const CARD_HEIGHT = 525;
const categoryOrder = [
  "young-learners",
  "diaspora-nl-sr",
  "parents",
  "e-bike-riders-parents",
];
const categoryLabels = {
  "young-learners": "Jongeren & Startende Leerlingen",
  "diaspora-nl-sr": "Nederland <-> Suriname",
  parents: "Ouders & Familie",
  "e-bike-riders-parents": "E-bike Gebruikers & Ouders",
};

const sanitizeAlias = (value) =>
  String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

const hexToRgb = (hex) => {
  const normalized = String(hex || "")
    .replace("#", "")
    .trim();
  if (normalized.length !== 3 && normalized.length !== 6) return null;
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const toRgba = (hex, alpha) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(26, 115, 232, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const CampaignFreshPage = () => {
  const authUser = useStore("authUser");
  const cardRefs = useRef([]);
  const [schoolLogo, setSchoolLogo] = useState("/icons/favicon.png");
  const [schoolName, setSchoolName] = useState("Rijles Suriname");
  const [coverImage, setCoverImage] = useState("/app-image.jpg");
  const [shareUrl, setShareUrl] = useState(window.location.origin);

  const colorScheme = process.env.VITE_COLOR_SCHEME?.split(",") || ["#1A73E8", "#34A853", "#0d47a1"];
  const primaryColor = colorScheme[0];

  useEffect(() => {
    const loadSchoolData = async () => {
      const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL || null;
      if (!schoolId) return;

      const { data: school, error } = await schoolService.getSchoolById(schoolId);
      if (error || !school) return;

      if (school.logo_url) setSchoolLogo(school.logo_url);
      if (school.name) setSchoolName(school.name);
      if (school.cover_image_url) setCoverImage(school.cover_image_url);
    };

    loadSchoolData();
  }, []);

  useEffect(() => {
    const resolveCampaignShareUrl = async () => {
      try {
        const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL || null;
        const resolved = await instructorService.resolveAdminIdForFlow({
          schoolId,
          authUser,
          prioritizeCurrentAdmin: isUserAdmin(authUser),
          includeExplicitInstructor: true,
          includeEnvFallback: true,
        });

        const adminId = resolved.adminId;
        if (!adminId) {
          setShareUrl(window.location.origin);
          return;
        }

        let alias = sanitizeAlias(
          authUser?.adminProfile?.id === adminId ? authUser?.adminProfile?.alias : null
        );
        if (!alias) {
          const { data: adminData } = await adminService.getAdminById(adminId);
          alias = sanitizeAlias(adminData?.alias);
        }

        const finalRef = alias || adminId;
        setShareUrl(`${window.location.origin}/admin?${encodeURIComponent(finalRef)}`);
      } catch (error) {
        console.error("[CampaignFreshPage] Failed to resolve admin alias URL:", error);
        setShareUrl(window.location.origin);
      }
    };

    resolveCampaignShareUrl();
  }, [authUser]);

  const ads = [
    {
      category: "young-learners",
      filename: "fresh-01-stop-scroll-rijbewijs.jpg",
      badge: "Stop Scroll",
      headline: "Je rijbewijs hoeft geen jaarplan te zijn.",
      subline: "Begin vandaag. Bouw elke dag momentum.",
      bullets: ["24/7 mobiel leren", "Interactieve verkeerssituaties", "Persoonlijke support"],
      cta: "Start Vandaag",
      accent: "#12A3FF",
      caption: `Geen uitstel meer. Start vandaag met je rijbewijs en leer dagelijks in kleine, effectieve sessies.\n\n${shareUrl}\n\n#Rijbewijs #RijlesApp #Suriname`,
    },
    {
      category: "young-learners",
      filename: "fresh-02-slaag-versneller.jpg",
      badge: "Slaag Versneller",
      headline: "Leren op je telefoon. Resultaat in het echt.",
      subline: "Duidelijk, snel en gericht op slagen.",
      bullets: ["Korte lessen zonder ruis", "Proefexamens met focus", "Herhaal slim met bookmarks"],
      cta: "Bekijk Demo",
      accent: "#2ED573",
      caption: `Leren op je eigen ritme werkt beter dan wachten op het perfecte moment.\n\n${shareUrl}\n\n#Theorie #RijbewijsHalen #MobielLeren`,
    },
    {
      category: "young-learners",
      filename: "fresh-03-geen-stencil-meer.jpg",
      badge: "Nieuw Tijdperk",
      headline: "Van stencil-stress naar app-flow.",
      subline: "Alles wat je nodig hebt in een scherm.",
      bullets: ["Altijd actuele uitleg", "Direct zoeken wat je mist", "Geen losse papieren"],
      cta: "Stap Over",
      accent: "#FF8C42",
      caption: `Stop met versnipperd leren. Gebruik 1 systeem voor alles.\n\n${shareUrl}\n\n#Rijles #DigitalLearning #Suriname`,
    },
    {
      category: "young-learners",
      filename: "fresh-04-maquette-impact.jpg",
      badge: "Visueel Krachtig",
      headline: "Snap lastige verkeerssituaties in minuten.",
      subline: "Maquettes die uitleggen wat woorden niet doen.",
      bullets: ["Duidelijke voorrangssituaties", "Beter onthouden", "Meer zelfvertrouwen"],
      cta: "Zie Maquettes",
      accent: "#A66BFF",
      caption: `Visueel leren = sneller begrijpen = sterker examen.\n\n${shareUrl}\n\n#Maquette #Rijtheorie #SlaagSlim`,
    },
    {
      category: "young-learners",
      filename: "fresh-05-student-voordeel.jpg",
      badge: "Student Focus",
      headline: "Gebruik je vrije tijd slim. Scoor voorsprong.",
      subline: "15 minuten per dag maakt groot verschil.",
      bullets: ["Leren waar je bent", "Geen reistijd", "Altijd doorpakken"],
      cta: "Pak Voorsprong",
      accent: "#00C2A8",
      caption: `Kleine dagelijkse stappen leveren groot resultaat op.\n\n${shareUrl}\n\n#Studenten #Rijbewijs #RijlesApp`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-06-nl-sr-ready.jpg",
      badge: "NL -> SR",
      headline: "In Nederland? Kom voorbereid naar Suriname.",
      subline: "Start nu en bespaar tijd zodra je aankomt.",
      bullets: ["Mobiel-first theorie", "Suriname relevante context", "Begeleiding op afstand"],
      cta: "Start Vanuit NL",
      accent: "#FF5A7A",
      caption: `Wacht niet tot je landt. Start je voorbereiding nu.\n\n${shareUrl}\n\n#Nederland #Suriname #Rijbewijs`,
    },
    {
      category: "young-learners",
      filename: "fresh-07-referral-momentum.jpg",
      badge: "Bonus Mode",
      headline: "Deel met vrienden. Verdien extra dagen.",
      subline: "Jij wint. Je vriend wint. Iedereen vooruit.",
      bullets: ["Deel je link", "Inschrijving voltooid", "Bonus direct actief"],
      cta: "Deel en Verdien",
      accent: "#FFD93D",
      caption: `Laat je netwerk ook starten en verdien bonusdagen.\n\n${shareUrl}\n\n#Referral #RijlesApp #GratisDagen`,
    },
    {
      category: "young-learners",
      filename: "fresh-08-high-intent.jpg",
      badge: "High Intent",
      headline: "Dit is het moment om te starten.",
      subline: "Niet morgen. Niet volgende week.",
      bullets: ["Direct toegang", "Heldere leerroute", "Minder twijfel, meer actie"],
      cta: "Begin Nu",
      accent: "#7CFF6B",
      caption: `Actie verslaat motivatie. Begin vandaag.\n\n${shareUrl}\n\n#RijbewijsNu #Slaagkans #Suriname`,
    },
    {
      category: "parents",
      filename: "fresh-09-parent-gift.jpg",
      badge: "Cadeau Tip",
      headline: "Geef geen gadget. Geef mobiliteit.",
      subline: "Een cadeau dat jaren waarde houdt.",
      bullets: ["Praktisch en direct bruikbaar", "Toekomstgericht", "Perfect voor jongeren"],
      cta: "Geef Vrijheid",
      accent: "#FFB347",
      caption: `Geef iets dat echt impact heeft op de toekomst.\n\n${shareUrl}\n\n#Cadeau #Rijbewijs #Toekomst`,
    },
    {
      category: "young-learners",
      filename: "fresh-10-zoom-fatigue.jpg",
      badge: "No Zoom",
      headline: "Geen lange calls. Wel echte progressie.",
      subline: "Interactief leren op jouw tijd.",
      bullets: ["Eigen tempo", "Altijd terugkijken", "Hulp wanneer nodig"],
      cta: "Leer Vrij",
      accent: "#6BCBFF",
      caption: `Stop met passief meekijken. Start met actief leren.\n\n${shareUrl}\n\n#InteractiefLeren #Rijles #Mobiel`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-11-nl-cadeau-familie.jpg",
      badge: "NL Familie Cadeau",
      headline: "In Nederland? Geef familie in Suriname een rijstart cadeau.",
      subline: "Een direct bruikbaar cadeau met echte impact.",
      bullets: ["Ideaal voor neefjes en nichtjes", "Direct online toegang", "Persoonlijke begeleiding mogelijk"],
      cta: "Geef Rijstart",
      accent: "#FF6B6B",
      caption: `Zoek je een cadeau met lange waarde? Geef rijopleiding-support aan familie in Suriname.\n\n${shareUrl}\n\n#Nederland #Suriname #Familie #CadeauTip`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-12-vakantie-voorbereid.jpg",
      badge: "Trip Ready",
      headline: "Binnenkort naar Suriname? Kom voorbereid aan.",
      subline: "Start theorie in Nederland en win tijd tijdens je verblijf.",
      bullets: ["Voor vertrek al begonnen", "Minder tijdverlies op locatie", "Meer focus op praktijk"],
      cta: "Bereid Nu Voor",
      accent: "#4D96FF",
      caption: `Je reis naar Suriname wordt sterker met een voorsprong. Start je voorbereiding nu vanuit Nederland.\n\n${shareUrl}\n\n#Vakantie #SurinameTrip #Rijbewijs`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-13-diaspora-support.jpg",
      badge: "Diaspora Impact",
      headline: "Support je roots met iets dat echt helpt.",
      subline: "Investeer in mobiliteit en kansen voor je familie in Suriname.",
      bullets: ["Praktisch en toekomstgericht", "Helpt bij studie en werk", "Makkelijk op afstand te regelen"],
      cta: "Support Familie",
      accent: "#F7B801",
      caption: `Vanuit Nederland kun je direct bijdragen aan meer zelfstandigheid in Suriname.\n\n${shareUrl}\n\n#Diaspora #Nederland #Suriname #Impact`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-14-toerist-smart-time.jpg",
      badge: "Slimme Vakantie",
      headline: "Niet alleen vakantie. Ook vooruitgang.",
      subline: "Gebruik je tijd in Suriname slim en werk aan je rijbewijsdoel.",
      bullets: ["Combineren met familiebezoek", "Leren in korte sessies", "Meer resultaat uit je verblijf"],
      cta: "Gebruik Je Tijd Slim",
      accent: "#2EC4B6",
      caption: `Veel NL-bezoekers halen meer uit hun Suriname-periode door nu te starten met theorie.\n\n${shareUrl}\n\n#NederlandersInSuriname #Rijbewijs #SlimLeren`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-15-ouders-nl-kind-sr.jpg",
      badge: "Ouder Voordeel",
      headline: "Woon je in NL en heb je familie in Suriname?",
      subline: "Geef ze een voorsprong met moderne rijtheoriebegeleiding.",
      bullets: ["Veilig en gestructureerd leren", "Altijd inzicht in progressie", "Sterke basis voor examen"],
      cta: "Geef Voorsprong",
      accent: "#9B5DE5",
      caption: `Een sterke start met rijtheorie helpt jongeren sneller en zekerder richting examen.\n\n${shareUrl}\n\n#Ouders #Suriname #Rijtheorie #Toekomst`,
    },
    {
      category: "diaspora-nl-sr",
      filename: "fresh-16-nl-sr-bond.jpg",
      badge: "NL x SR Bond",
      headline: "Sterke band, slimme kansen.",
      subline: "Verbind Nederland en Suriname met onderwijs dat direct toepasbaar is.",
      bullets: ["Leren over grenzen heen", "Ideaal voor familie-netwerken", "Vandaag starten, morgen profijt"],
      cta: "Start Samen",
      accent: "#FF9F1C",
      caption: `De band tussen Nederland en Suriname kan ook leren versnellen. Start vandaag.\n\n${shareUrl}\n\n#NederlandSuriname #Rijles #Onderwijs`,
    },
    {
      category: "e-bike-riders-parents",
      filename: "fresh-17-ebike-veilig-op-weg.jpg",
      badge: "E-bike Safety",
      headline: "E-bike snel? Regels eerst.",
      subline: "Voor e-bike gebruikers en ouders die ongelukken willen voorkomen.",
      bullets: ["Verkeersregels helder uitgelegd", "Risico's vroeg herkennen", "Veiliger gedrag in druk verkeer"],
      cta: "Rij Slim, Rij Veilig",
      accent: "#38BDF8",
      caption: `Veel e-bike gebruikers kennen de verkeersregels nog niet goed. Dat vergroot het risico op ongelukken. Deze campagne richt zich op e-bike rijders en ouders die veiligheid serieus nemen.\n\n${shareUrl}\n\n#EBike #Verkeersveiligheid #Ouders #Rijtheorie`,
    },
    {
      category: "e-bike-riders-parents",
      filename: "fresh-18-ebike-ouders-alert.jpg",
      badge: "Ouder Alert",
      headline: "Je kind op e-bike? Ken de regels.",
      subline: "Ouders en jongeren die regels kennen, rijden veiliger in druk verkeer.",
      bullets: ["Fouten voorkomen bij kruisingen", "Meer inzicht in voorrang", "Veiligheid boven snelheid"],
      cta: "Check De Regels",
      accent: "#22C55E",
      caption: `Steeds meer jongeren rijden e-bike, maar verkeersregels zijn niet altijd duidelijk. Deze campagne helpt ouders en e-bike gebruikers om risico's te verkleinen.\n\n${shareUrl}\n\n#EBike #Ouders #Verkeersregels #VeiligOnderweg`,
    },
    {
      category: "e-bike-riders-parents",
      filename: "fresh-19-ebike-druk-verkeer.jpg",
      badge: "Druk Verkeer",
      headline: "E-bike in de stad? Rij met regelkennis.",
      subline: "Gericht op e-bike rijders en ouders die ongelukken willen voorkomen.",
      bullets: ["Herken gevaarlijke situaties", "Reageer sneller en rustiger", "Sterkere verkeersdiscipline"],
      cta: "Start Veilig",
      accent: "#0EA5E9",
      caption: `Onbekendheid met verkeersregels zorgt voor extra risico in druk verkeer. Met deze campagne targeten we e-bike gebruikers en ouders met een duidelijke veiligheidsboodschap.\n\n${shareUrl}\n\n#EBike #Verkeersveiligheid #Rijbewust #Ouders`,
    },
  ];
  const adsWithIndex = ads.map((ad, index) => ({ ...ad, index }));
  const groupedAds = categoryOrder
    .map((categoryKey) => ({
      key: categoryKey,
      label: categoryLabels[categoryKey] || categoryKey,
      items: adsWithIndex.filter((ad) => ad.category === categoryKey),
    }))
    .filter((group) => group.items.length > 0);

  const downloadDesign = async (index, filename) => {
    const target = cardRefs.current[index];
    if (!target) return;

    try {
      f7.preloader.show();
      const originalWidth = target.offsetWidth;
      const originalHeight = target.offsetHeight;
      const targetWidth = 1080;
      const scale = targetWidth / originalWidth;
      const targetHeight = Math.round(originalHeight * scale);

      const canvas = await html2canvas(target, {
        scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: originalWidth,
        height: originalHeight,
      });

      const mimeType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      const quality = mimeType === "image/jpeg" ? 0.96 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            f7.preloader.hide();
            f7.toast.show({
              text: "Download mislukt. Probeer opnieuw.",
              position: "center",
              closeTimeout: 2000,
            });
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          f7.preloader.hide();
          f7.toast.show({
            text: `Gedownload (${targetWidth}x${targetHeight}px)`,
            position: "center",
            closeTimeout: 2200,
          });
        },
        mimeType,
        quality
      );
    } catch (error) {
      console.error("[CampaignFreshPage] Download failed:", error);
      f7.preloader.hide();
      f7.toast.show({
        text: "Download mislukt. Probeer opnieuw.",
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  const copyCaption = (caption) => {
    navigator.clipboard.writeText(caption).then(() => {
      f7.toast.show({
        text: "Tekst gekopieerd!",
        position: "center",
        closeTimeout: 1800,
      });
    });
  };

  return (
    <Page name="campaign-fresh" className="fresh-campaign-page">
      <style>{`
        .fresh-campaign-page {
          background:
            radial-gradient(circle at 9% 0%, rgba(0, 255, 194, 0.14), transparent 26%),
            radial-gradient(circle at 95% 10%, rgba(0, 147, 255, 0.16), transparent 34%),
            linear-gradient(180deg, #0a111b 0%, #0f1a2b 46%, #0b1421 100%);
          color: #f3f8ff;
        }

        .fresh-campaign-wrap {
          width: min(1180px, calc(100% - 20px));
          margin: 0 auto;
          padding: 8px 0 44px;
          display: grid;
          gap: 22px;
        }

        .fresh-campaign-intro {
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(120deg, rgba(11, 24, 44, 0.76), rgba(15, 35, 64, 0.56));
          padding: 16px 18px;
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.24);
        }

        .fresh-campaign-intro h3 {
          margin: 0 0 6px;
          font-size: 20px;
          line-height: 1.1;
          letter-spacing: -0.25px;
          color: #ffffff;
        }

        .fresh-campaign-intro p {
          margin: 0;
          color: rgba(225, 237, 255, 0.86);
          font-size: 13px;
        }

        .fresh-campaign-grid {
          display: grid;
          gap: 18px;
        }

        .fresh-campaign-category {
          display: grid;
          gap: 12px;
        }

        .fresh-campaign-category-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.1px;
          color: #f7fbff;
        }

        .fresh-campaign-item {
          width: 100%;
          border-radius: 24px;
          padding: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(160deg, rgba(14, 28, 48, 0.84), rgba(8, 18, 32, 0.9));
          box-shadow: 0 22px 40px rgba(0, 0, 0, 0.28);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fresh-item-badge {
          width: min(100%, ${CARD_WIDTH}px);
          margin: 0 0 10px;
          display: flex;
          justify-content: flex-start;
        }

        .fresh-item-badge span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          font-weight: 800;
          color: #0a101d;
          background: linear-gradient(120deg, #fef3c7, #f59e0b);
          border: 1px solid rgba(255, 255, 255, 0.28);
        }

        .fresh-ad-export {
          width: min(100%, ${CARD_WIDTH}px);
          max-width: ${CARD_WIDTH}px;
          height: ${CARD_HEIGHT}px;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          font-family: "Poppins", "Inter", sans-serif;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.34);
          background: #081524;
        }

        .fresh-ad-bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.04) contrast(1.02);
          transform: scale(1.02);
          z-index: 0;
        }

        .fresh-ad-bg-shade {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(180deg, rgba(8, 14, 25, 0.18), rgba(8, 14, 25, 0.74)),
            linear-gradient(145deg, var(--ad-accent-soft), transparent 54%);
        }

        .fresh-ad-bg-splash {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(circle at 84% 88%, var(--ad-accent-mid) 0%, transparent 42%),
            radial-gradient(circle at 14% 12%, rgba(255, 255, 255, 0.15), transparent 36%);
        }

        .fresh-ad-frame {
          position: absolute;
          inset: 8px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          z-index: 0;
        }

        .fresh-ad-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 18px;
        }

        .fresh-ad-brand {
          display: flex;
          gap: 10px;
          align-items: center;
          border-radius: 16px;
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(8, 14, 25, 0.58);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28);
        }

        .fresh-ad-logo {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          background: #fff;
          padding: 6px;
          object-fit: contain;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .fresh-ad-school {
          margin: 0;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: 0.1px;
        }

        .fresh-ad-label {
          margin: 4px 0 0;
          color: rgba(228, 238, 252, 0.92);
          font-size: 11px;
          font-weight: 600;
        }

        .fresh-ad-body {
          margin-top: auto;
          margin-bottom: 2px;
        }

        .fresh-ad-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          font-weight: 800;
          color: #0a101d;
          background: linear-gradient(120deg, #fef3c7, #f59e0b);
        }

        .fresh-ad-headline {
          margin: 10px 0 8px;
          font-size: 46px;
          line-height: 0.96;
          letter-spacing: -0.75px;
          color: #ffffff;
          text-shadow: 0 8px 24px rgba(0, 0, 0, 0.34);
          font-weight: 900;
        }

        .fresh-ad-subline {
          margin: 0 0 12px;
          color: rgba(241, 247, 255, 0.95);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.25;
          text-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);
        }

        .fresh-ad-bullets {
          display: grid;
          gap: 7px;
          margin: 0 0 10px;
          padding: 0;
          list-style: none;
        }

        .fresh-ad-bullets li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 11px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(7, 13, 25, 0.56);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }

        .fresh-ad-dot {
          width: 21px;
          height: 21px;
          border-radius: 999px;
          background: var(--ad-accent-dot);
          color: #061120;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
          flex-shrink: 0;
        }

        .fresh-ad-footer {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-top: 4px;
        }

        .fresh-ad-cta {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18px;
          color: #fff;
          background: var(--ad-accent-cta);
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 10px;
          padding: 8px 12px;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
        }

        .fresh-tools {
          width: min(100%, ${CARD_WIDTH}px);
          margin-top: 12px;
          display: flex;
          gap: 10px;
        }

        .fresh-tools .button,
        .fresh-tools button.button {
          min-height: 46px;
          border-radius: 12px;
          font-weight: 800;
          letter-spacing: 0.1px;
        }

        .fresh-tools .button-outline {
          border-color: rgba(255, 255, 255, 0.4);
          color: #f0f6ff;
        }
      `}</style>

      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>Social Media Campagne - New Gen</NavTitle>
      </Navbar>

      <BlockTitle>Nieuwe Ad Set (Fresh Layout)</BlockTitle>

      <div className="fresh-campaign-wrap">
        <div className="fresh-campaign-intro">
          <h3>Volledig Nieuwe Creatives</h3>
          <p>
            Nieuwe structuur, nieuwe visual language, nieuwe hooks. Gemaakt voor stop-scroll gedrag en snelle herkenning in social feeds.
          </p>
        </div>

        <div className="fresh-campaign-grid">
          {groupedAds.map((group) => (
            <div className="fresh-campaign-category" key={group.key}>
              <h4 className="fresh-campaign-category-title">{group.label}</h4>
              {group.items.map((ad) => {
                const index = ad.index;
                return (
                  <div className="fresh-campaign-item" key={ad.filename}>
                    <div className="fresh-item-badge">
                      <span>{ad.badge}</span>
                    </div>
                    <div
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      className="fresh-ad-export"
                      style={{
                        "--ad-accent": ad.accent || primaryColor,
                        "--ad-accent-soft": toRgba(ad.accent || primaryColor, 0.38),
                        "--ad-accent-mid": toRgba(ad.accent || primaryColor, 0.3),
                        "--ad-accent-dot": toRgba(ad.accent || primaryColor, 0.72),
                        "--ad-accent-cta": toRgba(ad.accent || primaryColor, 0.84),
                      }}
                    >
                      <img className="fresh-ad-bg-image" src={coverImage} alt="" crossOrigin="anonymous" />
                      <div className="fresh-ad-bg-shade" />
                      <div className="fresh-ad-bg-splash" />
                      <div className="fresh-ad-frame" />

                      <div className="fresh-ad-content">
                        <div className="fresh-ad-brand">
                          <img
                            className="fresh-ad-logo"
                            src={schoolLogo}
                            alt={`${schoolName} logo`}
                            crossOrigin="anonymous"
                          />
                          <div style={{ minWidth: 0 }}>
                            <p className="fresh-ad-school">{schoolName}</p>
                            <p className="fresh-ad-label">Modern Rijles | Online</p>
                          </div>
                        </div>

                        <div className="fresh-ad-body">
                          <h1 className="fresh-ad-headline">{ad.headline}</h1>
                          <p className="fresh-ad-subline">{ad.subline}</p>

                          <ul className="fresh-ad-bullets">
                            {ad.bullets.map((bullet) => (
                              <li key={bullet}>
                                <span className="fresh-ad-dot">+</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="fresh-ad-footer">
                            <span className="fresh-ad-cta">{ad.cta}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="fresh-tools">
                      <button
                        className="button button-fill"
                        onClick={() => downloadDesign(index, ad.filename)}
                        style={{
                          flex: 1,
                          background: primaryColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <IonIcon icon={downloadOutline} />
                        Download
                      </button>
                      <button
                        className="button button-outline"
                        onClick={() => copyCaption(ad.caption)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <IonIcon icon={copyOutline} />
                        Kopieer Tekst
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};

export default CampaignFreshPage;

