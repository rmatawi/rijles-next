import React, { useEffect, useRef, useState } from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Block,
  BlockTitle,
  f7,
  useStore,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { downloadOutline, copyOutline } from "ionicons/icons";
import html2canvas from "html2canvas";
import ProCampaignCard from "../components/ProCampaignCard";
import NavHomeButton from "../components/NavHomeButton";
import { isAdminUser, isSuperAdmin } from "../js/utils";
import { schoolService } from "../services/schoolService";

const AdsCampaignPage = () => {
  const authUser = useStore("authUser");
  const canAccess = isAdminUser(authUser) && isSuperAdmin(authUser?.email);
  const [coverImage, setCoverImage] = useState("/app-image.jpg");

  const design1Ref = useRef(null);
  const design2Ref = useRef(null);
  const design3Ref = useRef(null);
  const design4Ref = useRef(null);
  const design5Ref = useRef(null);
  const design6Ref = useRef(null);
  const design7Ref = useRef(null);

  // Blood-red campaign gradient (same style direction as blue gradient cards, but red-toned).
  const primaryColor = "#2b0207";
  const accentColor = "#b11226";
  const secondaryColor = "#5f0d18";
  const maxWidth = "360px";

  useEffect(() => {
    const loadSchoolCover = async () => {
      const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL || null;
      if (!schoolId) return;

      const { data: school, error } = await schoolService.getSchoolById(schoolId);
      if (error || !school) return;
      if (school.cover_image_url) setCoverImage(school.cover_image_url);
    };

    loadSchoolCover();
  }, []);

  const cards = [
    {
      ref: design1Ref,
      filename: "ads-campaign-homefeed-portrait.jpg",
      title: "Adverteer in de Home Feed van de Rijles App",
      subtitle: "Waarom: uw merk verschijnt direct waar leerlingen dagelijks inloggen en starten.",
      features: [
        { icon: "1", text: "Plaatsing: Home feed + aanbevolen blok" },
        { icon: "2", text: "Unieke doelgroep: bestuurders in opleiding in Suriname" },
        { icon: "3", text: "24/7 mobiele zichtbaarheid met meetbare kliks" },
      ],
      cta: "Reserveer Home Feed",
      theme: "modern",
      caption:
        "Plaats uw advertentie in de home feed van de enige interactieve rijles-app van Suriname. Uw merk is 24/7 zichtbaar op mobiel en u ontvangt meetbare resultaten via kliks en CTR.",
    },
    {
      ref: design2Ref,
      filename: "ads-campaign-learningflow-portrait.jpg",
      title: "Adverteer in de Theorie- en Oefenflow",
      subtitle: "Waarom: u bereikt gebruikers midden in een actieve leer- en focusmodus.",
      features: [
        { icon: "1", text: "Plaatsing: theorielessen en oefenmodules" },
        { icon: "2", text: "Sterke context voor dealers, verzekeraars en garages" },
        { icon: "3", text: "Directe CTA naar WhatsApp of website mogelijk" },
      ],
      cta: "Vraag Leerflow Slot",
      theme: "success",
      caption:
        "Uw advertentie verschijnt midden in de actieve leerflow. Dat levert gerichte aandacht op van een niche doelgroep met concrete mobiliteitsintentie.",
    },
    {
      ref: design3Ref,
      filename: "ads-campaign-results-portrait.jpg",
      title: "Adverteer op Resultaat- en Scorepagina's",
      subtitle: "Waarom: op succesmomenten is merkherinnering en vertrouwen het sterkst.",
      features: [
        { icon: "1", text: "Plaatsing: score- en voortgangsschermen" },
        { icon: "2", text: "Premium sponsorlabel met merkzichtbaarheid" },
        { icon: "3", text: "Ideaal voor merkvertrouwen en recall" },
      ],
      cta: "Boek Premium Slot",
      theme: "modern",
      caption:
        "Gebruik scoremomenten om uw merk top-of-mind te maken. Perfect voor lokale sponsors die herkenning en vertrouwen willen opbouwen.",
    },
    {
      ref: design4Ref,
      filename: "ads-campaign-conversion-portrait.jpg",
      title: "Adverteer met CTA gericht op leads",
      subtitle: "Waarom: gebruikers kunnen direct doorklikken naar WhatsApp, telefoon of website.",
      features: [
        { icon: "1", text: "Plaatsing per slot: home, leerflow, resultaten" },
        { icon: "2", text: "CTR-tracking en optimalisatie per creative" },
        { icon: "3", text: "Gebouwd voor directe actie, niet alleen bereik" },
      ],
      cta: "Stuur Bericht",
      theme: "modern",
      caption:
        "Combineer meerdere in-app placements en stuur verkeer direct naar uw saleskanalen. U krijgt zichtbaarheid, kliks en opvolgbare leads.",
    },
    {
      ref: design5Ref,
      filename: "ads-campaign-unique-suriname-portrait.jpg",
      title: "Adverteer in de enige interactieve rijles-app van Suriname",
      subtitle: "Waarom: dit kanaal is uniek, lokaal en direct relevant voor uw markt.",
      features: [
        { icon: "1", text: "Uniek kanaal voor Surinaamse rijstudenten" },
        { icon: "2", text: "Geen brede social waste, wel hoge relevantie" },
        { icon: "3", text: "Sterke merkpositionering in lokale niche" },
      ],
      cta: "Meer Info",
      theme: "modern",
      caption:
        "Deze app biedt een unieke advertentiepositie in Suriname: lokaal, relevant en direct gekoppeld aan bestuurders in opleiding met hoge intentie.",
    },
    {
      ref: design6Ref,
      filename: "ads-campaign-daily-reach-portrait.jpg",
      title: "Adverteer met 24/7 bereik op mobiel",
      subtitle: "Waarom: uw campagne blijft zichtbaar, ook buiten kantooruren.",
      features: [
        { icon: "1", text: "Continu bereik via mobiel gebruik, dag en nacht" },
        { icon: "2", text: "Doelgroep rond auto, rijles en verzekering" },
        { icon: "3", text: "Meetbaar met impressies, clicks en CTR" },
      ],
      cta: "Boek Uw Plaatsing",
      theme: "success",
      caption:
        "Met 24/7 app-toegang blijft uw campagne zichtbaar buiten kantooruren. Ideaal voor adverteerders die constante lokale aanwezigheid willen.",
    },
    {
      ref: design7Ref,
      filename: "ads-campaign-mobile-first-portrait.jpg",
      title: "Adverteer met 4:5 portrait creatives",
      subtitle: "Waarom: dit formaat presteert sterk in social feeds en sluit aan op app-visuals.",
      features: [
        { icon: "1", text: "Formaat: 4:5 portrait (1080 x 1350)" },
        { icon: "2", text: "Met uw logo + merkaccenten in elke visual" },
        { icon: "3", text: "Klaar voor Facebook en Instagram doorplaatsing" },
      ],
      cta: "Ontvang Creatives",
      theme: "success",
      caption:
        "Elk campagnevoorbeeld is opgebouwd in 4:5 portrait formaat met merkaccenten, zodat u consistente branding heeft in de app en op social kanalen.",
    },
  ];

  const downloadDesign = async (designRef, filename) => {
    if (!designRef.current) return;
    try {
      f7.preloader.show();
      const originalWidth = designRef.current.offsetWidth;
      const originalHeight = designRef.current.offsetHeight;
      const targetWidth = 1080;
      const scale = targetWidth / originalWidth;

      const canvas = await html2canvas(designRef.current, {
        scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: originalWidth,
        height: originalHeight,
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll('style, link[rel="stylesheet"]')
            .forEach((node) => node.remove());

          const normalizeColorFunctions = (value) => {
            if (!value || typeof value !== "string" || !value.includes("color(")) {
              return value;
            }

            const probe = clonedDoc.createElement("span");
            clonedDoc.body.appendChild(probe);

            const replaceOne = (segment) => {
              try {
                probe.style.color = "";
                probe.style.color = segment;
                const computedColor = clonedDoc.defaultView
                  ?.getComputedStyle(probe)
                  ?.color;
                if (computedColor && !computedColor.includes("color(")) {
                  return computedColor;
                }
              } catch (e) {
                // Fallback: keep original segment.
              }
              return segment;
            };

            let result = "";
            let i = 0;
            while (i < value.length) {
              const start = value.indexOf("color(", i);
              if (start === -1) {
                result += value.slice(i);
                break;
              }
              result += value.slice(i, start);
              let depth = 0;
              let end = start;
              for (; end < value.length; end += 1) {
                const ch = value[end];
                if (ch === "(") depth += 1;
                if (ch === ")") {
                  depth -= 1;
                  if (depth === 0) {
                    end += 1;
                    break;
                  }
                }
              }
              const segment = value.slice(start, end);
              result += replaceOne(segment);
              i = end;
            }

            probe.remove();
            return result;
          };

          const normalizeComputedStyles = (el) => {
            const styles = clonedDoc.defaultView?.getComputedStyle(el);
            if (!styles) return;

            [
              "color",
              "background",
              "background-color",
              "background-image",
              "border",
              "border-color",
              "border-top",
              "border-right",
              "border-bottom",
              "border-left",
              "outline",
              "outline-color",
              "box-shadow",
              "text-shadow",
              "fill",
              "stroke",
            ].forEach((prop) => {
              const current = styles.getPropertyValue(prop);
              if (!current || !current.includes("color(")) return;
              const normalized = normalizeColorFunctions(current);
              if (normalized && normalized !== current) {
                el.style.setProperty(prop, normalized);
              }
            });
          };

          clonedDoc.querySelectorAll("*").forEach((el) => {
            if (!(el instanceof clonedDoc.defaultView.Element)) return;

            if (el.classList.contains("campaign-export-card")) {
              el.classList.remove(
                "campaign-export-card",
                "campaign-export-card--pro",
                "campaign-export-card--classic"
              );
              el.style.filter = "none";
            }

            if (el.style?.backdropFilter || el.style?.webkitBackdropFilter) {
              el.style.backdropFilter = "none";
              el.style.webkitBackdropFilter = "none";
            }

            normalizeComputedStyles(el);
          });
        },
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = filename;
      link.click();
      f7.preloader.hide();
      f7.toast.show({
        text: "Design gedownload.",
        position: "center",
        closeTimeout: 1800,
      });
    } catch (error) {
      console.error("Error downloading ad campaign design:", error);
      f7.preloader.hide();
      f7.toast.show({
        text: "Download mislukt. Probeer opnieuw.",
        position: "center",
        closeTimeout: 1800,
      });
    }
  };

  const copyCaption = (caption) => {
    navigator.clipboard.writeText(caption).then(() => {
      f7.toast.show({
        text: "Tekst gekopieerd.",
        position: "center",
        closeTimeout: 1600,
      });
    });
  };

  if (!canAccess) {
    return (
      <Page name="ads-campaign" className="page-neu">
        <Navbar className="neu-navbar">
          <NavLeft>
            <NavHomeButton />
          </NavLeft>
          <NavTitle className="neu-text-primary">Ads Campaign</NavTitle>
        </Navbar>
        <Block style={{ paddingTop: "24px" }}>
          Alleen toegankelijk voor admin gebruikers in `VITE_REACT_APP_OWNER`.
        </Block>
      </Page>
    );
  }

  return (
    <Page name="ads-campaign">
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>Ads Campaign Kit</NavTitle>
      </Navbar>

      <BlockTitle>Social posts om adverteerders te werven</BlockTitle>

      <div>
        {cards.map((card) => (
          <div className="campaign-card-container" key={card.filename}>
            <ProCampaignCard
              designRef={card.ref}
              title={card.title}
              subtitle={card.subtitle}
              features={card.features}
              cta={card.cta}
              theme={card.theme}
              ratio="4:5"
              brandSignature={false}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              maxWidth={maxWidth}
              featurePattern="row3"
              height={560}
              backgroundImage={coverImage}
            />
            <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
              <button
                className="button button-fill"
                onClick={() => downloadDesign(card.ref, card.filename)}
                style={{
                  flex: 1,
                  background: "#0f172a",
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
                onClick={() => copyCaption(card.caption)}
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
        ))}
      </div>

      <Block strong inset>
        <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>Gebruikstips</h3>
        <ul
          style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.7, color: "#666" }}
        >
          <li>Post 2-3 keer per week op Facebook en Instagram.</li>
          <li>Gebruik duidelijke CTA: WhatsApp of contactformulier.</li>
          <li>Stuur geinteresseerde leads direct naar `/adverteren/` of `/ads-dashboard/`.</li>
        </ul>
      </Block>

      <div style={{ height: "50px" }} />
    </Page>
  );
};

export default AdsCampaignPage;
