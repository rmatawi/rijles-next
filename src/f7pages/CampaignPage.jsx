import React, { useRef, useState, useEffect } from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Link,
  Block,
  f7,
  BlockTitle,
  Button,
  useStore,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { arrowBack, downloadOutline, copyOutline } from "ionicons/icons";
import html2canvas from "html2canvas";
import { schoolService } from "../services/schoolService";
import { adminService } from "../services/adminService";
import { instructorService } from "../services/instructorService";
import { isUserAdmin } from "../js/utils";
import ProCampaignCard from "../components/ProCampaignCard";
import NavHomeButton from "../components/NavHomeButton";

const CampaignPage = () => {
  const design1Ref = useRef(null);
  const design2Ref = useRef(null);
  const design3Ref = useRef(null);
  const design4Ref = useRef(null);
  const design5Ref = useRef(null);
  const design6Ref = useRef(null);
  const design7Ref = useRef(null);
  const design8Ref = useRef(null);
  const design9Ref = useRef(null);
  const design10Ref = useRef(null);
  const design11Ref = useRef(null);
  const design12Ref = useRef(null);
  const design13Ref = useRef(null);
  const design14Ref = useRef(null);
  const design15Ref = useRef(null);
  const design16Ref = useRef(null);
  const design17Ref = useRef(null);
  const design18Ref = useRef(null);
  const design19Ref = useRef(null);
  const design20Ref = useRef(null);
  const design21Ref = useRef(null);
  const design22Ref = useRef(null);
  const design23Ref = useRef(null);
  const design24Ref = useRef(null);
  const design25Ref = useRef(null);
  const proDesign1Ref = useRef(null);
  const proDesign2Ref = useRef(null);
  const proDesign3Ref = useRef(null);
  const [schoolLogo, setSchoolLogo] = useState("/icons/favicon.png");
  const [schoolName, setSchoolName] = useState("Rijles Suriname");
  const [schoolCoverPhoto, setSchoolCoverPhoto] = useState(null);
  const [shareUrl, setShareUrl] = useState(window.location.origin);
  const authUser = useStore("authUser");

  const sanitizeAlias = (value) =>
    String(value || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

  // App primary color from env
  const colorScheme = process.env.VITE_COLOR_SCHEME?.split(",") || ["#1A73E8", "#34A853", "#0d47a1"];
  const primaryColor = colorScheme[0];
  const accentColor = colorScheme[1];
  const secondaryColor = colorScheme[2]; // Usually a darker version of primary

  // Load school logo and name
  useEffect(() => {
    const loadSchoolData = async () => {
      const schoolId =
        process.env.VITE_REACT_APP_DEFAULTSCHOOL ||
        process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (schoolId) {
        const { data: school, error } = await schoolService.getSchoolById(
          schoolId
        );
        if (!error && school) {
          if (school?.logo_url) {
            setSchoolLogo(school.logo_url);
          }
          if (school?.name) {
            setSchoolName(school.name);
          }
          if (school?.cover_image_url) {
            setSchoolCoverPhoto(school.cover_image_url);
          }
        }
      }
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
        console.error("[CampaignPage] Failed to resolve admin alias URL:", error);
        setShareUrl(window.location.origin);
      }
    };

    resolveCampaignShareUrl();
  }, [authUser]);

  const downloadDesign = async (designRef, filename) => {
    if (!designRef.current) return;

    try {
      f7.preloader.show();

      // Get the original dimensions
      const originalWidth = designRef.current.offsetWidth;
      const originalHeight = designRef.current.offsetHeight;

      const targetWidth = 1080;
      const scale = targetWidth / originalWidth;
      const targetHeight = Math.round(originalHeight * scale);

      const canvas = await html2canvas(designRef.current, {
        scale: scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: originalWidth,
        height: originalHeight,
        onclone: (clonedDoc) => {
          // html2canvas can crash on modern CSS Color 4 functions (`color(...)`)
          // present in app/framework stylesheets. The cards are mostly inline-styled,
          // so strip stylesheet rules in the cloned document for export stability.
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
                // Ignore and fall back to original segment.
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
      const mimeType = filename.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      const quality = mimeType === "image/jpeg" ? 0.95 : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const link = document.createElement("a");
            link.href = canvas.toDataURL(mimeType, quality);
            link.download = filename;
            link.click();
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
          }
          f7.preloader.hide();
          f7.toast.show({
            text: `Design gedownload! (${targetWidth}x${targetHeight}px)`,
            position: "center",
            closeTimeout: 2200,
          });
        },
        mimeType,
        quality
      );
    } catch (error) {
      console.error("Error downloading design:", error);
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
        closeTimeout: 2000,
      });
    });
  };

  const caption1 = `🎓 Leer rijden op jouw eigen tempo! 📱

Met onze interactieve rijles app heb je altijd en overal toegang tot je lesmateriaal:

✅ 24/7 mobiel beschikbaar
✅ Interactieve maquettes voor duidelijke uitleg
✅ Geen papieren stencils meer nodig
✅ Leer waar en wanneer jij wilt

Bezoek de app en start vandaag nog!

👉 ${shareUrl}

#Rijles #Rijbewijs #Suriname #RijlesApp #MobielLeren #24x7`;

  const caption2 = `📚 Alles wat je nodig hebt voor je rijbewijs! 🚗

Onze app biedt:

📖 Korte en duidelijke uitleg van regels en borden
🎯 Proefexamens om jezelf te testen
🔖 Bookmark functie - ga door waar je stopte
🌓 Dark mode voor 's avonds studeren

Geen gedoe met losse papieren meer!

🔗 ${shareUrl}

#Rijschool #Theorie #RijbewijsHalen #LerenRijden #Suriname`;

  const caption3 = `🎓 Interactieve maquettes maken het verschil! ✨

Leer verkeersregels met:

🖼️ Visuele interactieve maquettes
👨‍🏫 Persoonlijke assistentie van je rij-instructeur
📱 Alles op je mobiel - overal bij
💡 Duidelijke uitleg die blijft hangen

Vergeet losse stencils - leer modern en effectief!

 📲 ${shareUrl}

#Rijexamen #Rijschool #InteractiefLeren #Maquettes #Suriname`;

  const caption4 = `🚗 Jouw rijbewijs begint hier! 📱

Bezoek de meest complete rijles app:

✅ 24/7 toegang tot alle lesmaterialen
✅ Interactieve maquettes voor duidelijke uitleg
✅ Persoonlijke begeleiding van je instructeur
✅ Proefexamens om jezelf te testen
✅ Bookmark functie - hervat waar je stopte

Leer waar en wanneer jij wilt!

👉 ${shareUrl}

#RijlesApp #Rijbewijs #LerenRijden #Rijschool #Suriname`;

  const caption5 = `📱 Waarom onze app kiezen? 💯

🌟 Altijd en overal toegang - geen papier nodig
🖼️ Interactieve maquettes voor beter begrip
🔖 Bookmark functie - hervat waar je stopte
👨‍🏫 Persoonlijke hulp van je instructeur
🌓 Light & Dark mode
🎯 Proefexamens

Leer slim, leer efficiënt, slaag sneller!

🔗 ${shareUrl}

#ModernRijles #AppLeren #Rijbewijs #Suriname #SmartLearning`;

  const caption6 = `🎁 Deel met vrienden en krijg GRATIS dagen! 🚀

Hoe werkt het?

1️⃣ Deel de app met vrienden via WhatsApp
2️⃣ Zij schrijven zich in met jouw code
3️⃣ Jullie beiden krijgen extra gratis dagen!

🎉 Hoe meer je deelt, hoe meer je krijgt!
💯 Win-win voor iedereen

Start vandaag met delen en geniet van gratis toegang!

👉 ${shareUrl}

#DeelEnKrijgGratis #RijlesApp #GratisDagen #ShareAndEarn #Suriname`;

  const caption7 = `📚 Van Papier naar App - De Revolutie is Hier! 🚀

Vergeet losse en verouderde stencils!

❌ VROEGER:
- Losse stencils
- Verouderde informatie
- Pagina's zoeken
- Geen updates mogelijk

✅ NU MET ONZE APP:
- Alles op je mobiel
- Altijd actuele content
- Direct zoeken en vinden
- Milieuvriendelijk!

Dit is de toekomst van rijles in Suriname! 🇸🇷

📱 ${shareUrl}

#RijlesRevolutie #GeenPapierMeer #DigitalLeren #ModernRijles #Suriname`;

  const caption8 = `🎁 Het Perfecte Cadeau Voor Je Kind! 👨‍👩‍👧‍👦

Waarom dit het beste cadeau is:

✅ Investering in hun toekomst
✅ Meer carrièrekansen
✅ Onafhankelijkheid en vrijheid
✅ Praktisch en waardevol
✅ Direct te gebruiken

Perfect voor:
🎂 Verjaardagen
🎓 Diploma's
🎉 Feestdagen
💝 Zomaar, omdat je om ze geeft

Geef meer dan een cadeau - geef de sleutel tot vrijheid! 🚗🔑

👉 ${shareUrl}

#RijlesGift #PerfectCadeau #KindCadeau #Suriname #GiftOfFreedom`;

  const caption9 = `🇸🇷 Vier Onafhankelijkheid - Drive Your Freedom! 🚗

Suriname is onafhankelijk, word JIJ dat ook!

💪 Persoonlijke vrijheid begint met mobiliteit
🚗 Jouw rijbewijs = jouw onafhankelijkheid
🇸🇷 Trots Surinaams, modern leren

SPECIALE ONAFHANKELIJKHEIDS AANBIEDING:
🎉 Extra dagen gratis
🎯 Speciaal tarief
🎁 Perfect patriottisch cadeau

Vier jouw vrijheid, vier jouw toekomst!

Groen • Wit • Rood • Geel - One Love, One Drive! ⭐

📱 ${shareUrl}

#SurinameIndependence #OnafhankelijkheidSR #DriveYourFreedom #TrotsSurinaams`;

  const caption10 = `🪔 Shubh Divali! Licht jouw weg naar succes! ✨

Deze Divali, vier niet alleen het festival van het licht - vier ook een nieuw begin voor jouw toekomst!

🎆 Divali = Festival van het licht & nieuwe kansen
🚗 Jouw rijbewijs = Verlicht op jouw path naar vrijheid
📱 Onze app = Kennis die blijft schijnen

SPECIALE DIVALI AANBIEDING:
✨ Extra gratis dagen voor nieuwe inschrijvingen
🎁 Perfect cadeau voor familie
🪔 Start vandaag, vier morgen!

Net als de diya die duisternis verdrijft, verlicht onze rijles app jouw weg naar je rijbewijs!

Shubh Divali! 🙏

👉 ${shareUrl}

#Divali #DivaliMubarak #RijlesApp #NieuwBegin #Suriname #HindiFeest`;

  const caption11 = `Shubh Holi! Vier met Kleur & Vrijheid! 

Phagwa is het festival van kleuren en vreugde - perfect moment om kleur te geven aan je toekomst!

🎇 Phagwa = Festival van kleuren & nieuwe start
🚗 Rijbewijs = Kleur in je leven
📱 Leer met vreugde = Slaag met glans

SPECIALE PHAGWA AANBIEDING:
🎉 Kleurrijk korting voor nieuwe studenten
💐 Cadeau-optie voor familie & vrienden
🎨 Maak je droom waar dit seizoen!

Vier Phagwa door te investeren in jezelf!

Shubh Holi! 🙌

👉 ${shareUrl}

#Phagwa #Pagwa #Holi #RijlesApp #Suriname #FestivalVanKleuren`;

  const caption12 = `🐰 Pasen: Het Perfecte Moment Voor Een Nieuw Begin! 🌷

Deze Pasen, geef jezelf of je geliefden het cadeau van vrijheid en onafhankelijkheid!

🥚 Pasen = Nieuw leven, nieuwe kansen
🚗 Rijbewijs = Jouw nieuwe vrijheid
🌸 Lente = Perfect seizoen om te beginnen

PAAS AANBIEDING:
🐰 Speciale Paastarief
🌷 Gratis extra dagen bij inschrijving
🎁 Ideaal Paascadeau voor kinderen/familie
🌈 Vier vernieuwing met vooruitgang!

Geef geen chocolade-ei, geef een rijbewijs! 🚗🔑

Vrolijk Pasen! 🌸

👉 ${shareUrl}

#Pasen #Easter #PaasCadeau #RijlesApp #NieuwBegin #Suriname`;

  const caption13 = `☪ Eid Mubarak! Vier dit met het Cadeau van Vrijheid! 🕋

Na een maand van discipline en toewijding, vier Idul Fitre met een geschenk dat blijft geven!

🕌 Ramadan eindigde met discipline
🚗 Nu begin je met jouw rijbewijs!
🎊 Vier met een cadeau voor de toekomst

SPECIALE IDUL FITRI AANBIEDING:
🌙 Extra gratis dagen
⭐ Speciaal Eid-tarief
🎁 Perfect cadeau na de vastenmaand
💚 Voor heel de familie!

Net zoals je Ramadan volbracht hebt met discipline, behaal nu je rijbewijs met dezelfde toewijding!

Eid Mubarak! 🤲

👉 ${shareUrl}

#IdulFitri #EidMubarak #Ramadan #RijlesApp #IslamischFeest #Suriname`;

  const caption14 = `☀️ School Vakantie = Perfect Moment Voor Je Rijbewijs! 🏖️

Maak je vakantie waardevol! Gebruik je vrije tijd om je rijbewijs te halen!

📚 School is uit = Tijd voor rijles!
🚗 Vakantie leren = Voor school beginnen klaar!
☀️ Zomer investering = Levenslange vrijheid

VAKANTIE VOORDELEN:
⏰ Meer tijd om te studeren
🏆 Start nieuw schooljaar met rijbewijs!
💪 Productieve vakantie

Waarom alleen chillen als je kan chillen én leren? 😎

VAKANTIE AANBIEDING:
🎉 Speciale student korting
📱 24/7 leren - zelfs op het strand!
🎁 Verras jezelf dit schoolvakantie

👉 ${shareUrl}

#SchoolVakantie #RijlesApp #StudentenLeven #Suriname #ProductieveVakantie`;

  const caption15 = `Woon je in Nederland en ga je binnenkort naar Suriname?

Start nu al mobiel met je theorievoorbereiding voor Suriname.

- Volg lessen waar en wanneer het uitkomt
- Interactieve uitleg voor Surinaamse verkeerssituaties
- Geen trage portals die je lang vasthouden
- Direct contact met de instructeur

Begin vandaag en kom voorbereid aan.

${shareUrl}

#Nederland #Suriname #Rijles #MobieleTheorie #Toerist #VoorbereidReizen`;

  const caption16 = `Toerist of tijdelijk in Suriname? Bereid je slim voor.

Onze app is gemaakt voor mensen die flexibiliteit willen:

- Volledig mobiel volgen op je eigen moment
- Praktische en moderne theorie-uitleg
- Specifiek relevant voor Suriname
- Direct hulp van je instructeur

Plan je reis, start je theorie nu.

${shareUrl}

#Holland #SurinameTrip #TheorieLeren #Rijbewijs #MobielLeren #TravelPrep`;

  const caption17 = `Uniek concept voor Suriname, ook ideaal vanuit Nederland.

Andere zogenaamde online lessen vragen vaak laptop, veel login-stappen en kosten tijd.
Deze app laat je direct leren wanneer jij kunt.

- Modern en mobiel
- Interactieve lessen
- Contact met instructeur zonder gedoe

Voor toeristen en reizigers die voorbereid in Suriname willen aankomen.

${shareUrl}

#NederlandersInSuriname #Rijtheorie #SurinameRijles #FlexibelLeren #ReisVoorbereiding`;

  const caption18 = `BLACK FRIDAY DEAL - Alleen tijdelijk!

Pak nu extra voordeel op jouw rijles voorbereiding:

- Speciale Black Friday korting
- Extra dagen toegang bij inschrijving
- Start direct met interactieve lessen

Wacht niet te lang, deze actie is beperkt.

${shareUrl}

#BlackFriday #RijlesApp #Rijbewijs #Suriname #Aanbieding`;

  const caption19 = `Halloween Special - Trick or Treat jezelf op succes.

Durf jij te starten met je rijbewijs traject?

- Spookachtig goede deal
- Extra toegang voor nieuwe studenten
- Leer slim met moderne, interactieve theorie

Claim je Halloween actie vandaag.

${shareUrl}

#Halloween #RijlesApp #Rijbewijs #Suriname #SpecialDeal`;

  const caption20 = `Bespaar tijd en geld met mobiele rijles theorie.

Waarom onnodig rijden naar een locatie en daar uren zitten?

- Leer direct vanuit huis
- Geen reistijd en transportkosten
- Korte, duidelijke lessen op jouw moment

Start slimmer en houd tijd over.

${shareUrl}

#RijlesApp #BespaarTijd #BespaarGeld #MobielLeren #Suriname`;

  const caption21 = `Stop met tijd verliezen aan reizen voor theorie.

Met onze app leer je waar en wanneer het jou uitkomt:

- Geen rit naar een leslocatie
- Geen uren wachten of zitten
- Meer focus, minder kosten

Begin vandaag en leer efficiënter.

${shareUrl}

#Rijbewijs #MobieleTheorie #TijdWinst #KostenBesparen #Suriname`;

  const caption22 = `Slimmer rijles theorie leren? Kies voor mobiel-first.

Je hoeft niet meer te rijden naar een locatie om lang te zitten.

- Volledig mobiel op je eigen tempo
- Minder benzine en vervoerskosten
- Meer resultaat in minder tijd

Pak je voordeel en start nu.

${shareUrl}

#Rijles #Suriname #DigitaleRijles #EfficientLeren #Bespaar`;

  const caption23 = `Niet alle zogenaamde online rijlessen zijn echt mobiel.

Bij veel aanbieders betekent "online" een laptop + lange Zoom-call waarin je uren moet blijven zitten.

Bij ons leer je anders:

- Interactief systeem, geen passieve call
- Leren wanneer het jou uitkomt
- Hulp vragen op elk moment via chat

Wij reageren zo snel mogelijk op je vraag.

${shareUrl}

#RijlesApp #MobielRijles #InteractiefLeren #Suriname #SlimLeren`;

  const caption24 = `Zoom-les van uren? Dat is geen vrijheid.

Onze rijles app is gebouwd voor studenten met een druk schema:

- Complete interactieve theorie omgeving
- Zelfstudie op jouw tempo
- Vraag stellen wanneer je vastloopt

Je hoeft niet "vast" te zitten in lange sessies.

${shareUrl}

#Rijbewijs #MobieleTheorie #FlexibelLeren #Suriname #Rijles`;

  const caption25 = `Kies interactief leren in plaats van urenlange videocalls.

Wat ons anders maakt:

- Volledig interactief systeem
- Leren op elk gewenst moment
- Doorlopend ondersteuning mogelijk

Studeer slim. Vraag hulp wanneer nodig. Ga sneller vooruit.

${shareUrl}

#InteractieveRijles #RijlesApp #MobielLeren #Suriname #SlaagSlim`;

  const maxWidth = "400px";
  const campaignBackgroundImage = schoolCoverPhoto || "/app-image.jpg";
  const getAttentionBadge = (ad, index) => {
    const seasonalPattern =
      /black-friday|halloween|eid|divali|phagwa|pasen|schoolvakantie/i;
    if (seasonalPattern.test(ad.filename || "")) return "Seizoenspiek";
    if (index < 3) return "Top Presteerder";
    const rotatingBadges = ["Stop Scroll", "Hot", "Nieuw", "Direct Resultaat"];
    return rotatingBadges[index % rotatingBadges.length];
  };

  const getToneClass = (index) => {
    const tones = ["tone-sun", "tone-sky", "tone-lime"];
    return tones[index % tones.length];
  };
  const convertedAdRefs = [
    design1Ref,
    design2Ref,
    design3Ref,
    design4Ref,
    design5Ref,
    design6Ref,
    design7Ref,
    design8Ref,
    design9Ref,
    design10Ref,
    design11Ref,
    design12Ref,
    design13Ref,
    design14Ref,
    design15Ref,
    design16Ref,
    design17Ref,
    design18Ref,
    design19Ref,
    design20Ref,
    design21Ref,
    design22Ref,
    design23Ref,
    design24Ref,
    design25Ref,
  ];
  const convertedAds = [
    {
      filename: "ad-01-leer-op-jouw-tempo.jpg",
      title: "Stop met uitstellen: start je rijbewijs nu",
      subtitle: "24/7 mobiele theorie die je echt afmaakt.",
      features: [
        { icon: "✓", text: "24/7 mobiele toegang" },
        { icon: "✓", text: "Interactieve maquettes" },
        { icon: "✓", text: "Geen papieren stencils" },
      ],
      theme: "modern",
      cta: "Start Nu",
      caption: caption1,
    },
    {
      filename: "ad-02-alles-voor-rijbewijs.jpg",
      title: "Alles in 1 app, sneller klaar",
      subtitle: "Regels, borden en proefexamens zonder ruis.",
      features: [
        { icon: "✓", text: "Korte duidelijke uitleg" },
        { icon: "✓", text: "Proefexamens" },
        { icon: "✓", text: "Bookmark functie" },
      ],
      theme: "success",
      cta: "Bekijk Demo",
      caption: caption2,
    },
    {
      filename: "ad-03-interactieve-maquettes.jpg",
      title: "Snap verkeer in minuten",
      subtitle: "Interactieve maquettes maken lastige situaties direct duidelijk.",
      features: [
        { icon: "✓", text: "Visuele verkeerssituaties" },
        { icon: "✓", text: "Begeleiding door instructeur" },
        { icon: "✓", text: "Mobiel en direct beschikbaar" },
      ],
      theme: "modern",
      cta: "Bekijk Maquettes",
      caption: caption3,
    },
    {
      filename: "ad-04-jouw-rijbewijs-begint-hier.jpg",
      title: "Je rijbewijs start vandaag",
      subtitle: "Leren, oefenen en begeleiding in 1 flow.",
      features: [
        { icon: "✓", text: "Alle lesmaterialen" },
        { icon: "✓", text: "Persoonlijke begeleiding" },
        { icon: "✓", text: "Proefexamens + bookmarks" },
      ],
      theme: "modern",
      cta: "Meld Je Vandaag Aan",
      caption: caption4,
    },
    {
      filename: "ad-05-waarom-onze-app.jpg",
      title: "Waarom studenten voor ons kiezen",
      subtitle: "Flexibel leren met hogere focus en minder stress.",
      features: [
        { icon: "✓", text: "Altijd toegang" },
        { icon: "✓", text: "Light & dark mode" },
        { icon: "✓", text: "Interactief leren" },
      ],
      theme: "minimal",
      cta: "Probeer Gratis",
      caption: caption5,
    },
    {
      filename: "ad-06-deel-en-krijg-gratis.jpg",
      title: "Deel nu, pak gratis dagen",
      subtitle: "Verwijs 1 vriend en verdien direct extra toegang.",
      features: [
        { icon: "+", text: "Deel via WhatsApp" },
        { icon: "+", text: "Zij schrijven zich in" },
        { icon: "+", text: "Jullie krijgen beide extra dagen" },
      ],
      theme: "success",
      cta: "Deel & Verdien",
      caption: caption6,
    },
    {
      filename: "ad-07-van-papier-naar-app.jpg",
      title: "Papier is voorbij. Dit werkt.",
      subtitle: "Sneller zoeken, sneller snappen, sneller slagen.",
      features: [
        { icon: "✓", text: "Alles op je mobiel" },
        { icon: "✓", text: "Altijd actuele content" },
        { icon: "✓", text: "Sneller zoeken en leren" },
      ],
      theme: "modern",
      cta: "Stap Nu Over",
      caption: caption7,
    },
    {
      filename: "ad-08-perfect-cadeau.jpg",
      title: "Het cadeau dat vrijheid geeft",
      subtitle: "Praktisch, direct bruikbaar en waardevol voor later.",
      features: [
        { icon: "✓", text: "Investering in de toekomst" },
        { icon: "✓", text: "Direct te gebruiken" },
        { icon: "✓", text: "Waardevol voor familie" },
      ],
      theme: "festive",
      backgroundEmojis: [
        { emoji: "🎁", top: "18px", right: "18px", size: "48px", opacity: 0.2 },
        { emoji: "✨", bottom: "18px", left: "18px", size: "40px", opacity: 0.16 },
        { emoji: "🚗", top: "52%", left: "50%", transform: "translate(-50%, -50%) rotate(-12deg)", size: "110px", opacity: 0.08 },
      ],
      cta: "Geef Vrijheid",
      caption: caption8,
    },
    {
      filename: "ad-09-drive-your-freedom.jpg",
      title: "Drive Your Freedom",
      subtitle: "Word onafhankelijk met een rijbewijs dat deuren opent.",
      features: [
        { icon: "*", text: "Vrijheid door mobiliteit" },
        { icon: "*", text: "Speciale actie" },
        { icon: "*", text: "Perfect als cadeau" },
      ],
      theme: "success",
      backgroundEmojis: [
        { emoji: "🇸🇷", top: "18px", left: "18px", size: "44px", opacity: 0.18 },
        { emoji: "⭐", top: "18px", right: "20px", size: "34px", opacity: 0.2 },
        { emoji: "🚗", bottom: "14px", right: "16px", size: "54px", opacity: 0.12 },
      ],
      cta: "Claim Je Voordeel",
      caption: caption9,
    },
    {
      filename: "ad-10-divali-actie.jpg",
      title: "Divali Deal: start met licht voordeel",
      subtitle: "Nieuw begin, extra dagen, direct starten.",
      features: [
        { icon: "✓", text: "Extra gratis dagen" },
        { icon: "✓", text: "Mooi familiecadeau" },
        { icon: "✓", text: "Start vandaag" },
      ],
      theme: "festive",
      backgroundEmojis: [
        { emoji: "🪔", top: "18px", right: "18px", size: "48px", opacity: 0.2 },
        { emoji: "✨", top: "18px", left: "18px", size: "36px", opacity: 0.16 },
        { emoji: "🪔", bottom: "18px", left: "22px", size: "42px", opacity: 0.14 },
      ],
      cta: "Pak Divali Deal",
      caption: caption10,
    },
    {
      filename: "ad-11-phagwa-holi.jpg",
      title: "Phagwa Deal: kleur je toekomst",
      subtitle: "Vier met voordeel en investeer in je rijbewijs.",
      features: [
        { icon: "✓", text: "Seizoensaanbieding" },
        { icon: "✓", text: "Cadeau-optie" },
        { icon: "✓", text: "Leer met plezier" },
      ],
      theme: "festive",
      backgroundEmojis: [
        { emoji: "🎨", top: "18px", right: "18px", size: "42px", opacity: 0.18 },
        { emoji: "🎉", bottom: "18px", left: "18px", size: "42px", opacity: 0.16 },
        { emoji: "🌈", top: "52%", left: "50%", transform: "translate(-50%, -50%)", size: "92px", opacity: 0.08 },
      ],
      cta: "Pak Phagwa Deal",
      caption: caption11,
    },
    {
      filename: "ad-12-pasen.jpg",
      title: "Pasen Deal: geef een nieuw begin",
      subtitle: "Perfect moment om vrijheid cadeau te doen.",
      features: [
        { icon: "✓", text: "Paasactie" },
        { icon: "✓", text: "Gratis extra dagen" },
        { icon: "✓", text: "Perfect voor familie" },
      ],
      theme: "festive",
      backgroundEmojis: [
        { emoji: "🐰", top: "18px", right: "18px", size: "46px", opacity: 0.18 },
        { emoji: "🌸", bottom: "18px", left: "18px", size: "42px", opacity: 0.16 },
        { emoji: "🥚", top: "48%", left: "14px", size: "40px", opacity: 0.12 },
      ],
      cta: "Pak Paas Deal",
      caption: caption12,
    },
    {
      filename: "ad-13-eid.jpg",
      title: "Eid Deal: cadeau met impact",
      subtitle: "Vier vooruitgang met extra dagen en speciaal tarief.",
      features: [
        { icon: "✓", text: "Extra gratis dagen" },
        { icon: "✓", text: "Speciaal tarief" },
        { icon: "✓", text: "Voor het hele gezin" },
      ],
      theme: "success",
      backgroundEmojis: [
        { emoji: "🌙", top: "16px", right: "18px", size: "44px", opacity: 0.2 },
        { emoji: "⭐", top: "18px", left: "20px", size: "32px", opacity: 0.18 },
        { emoji: "✨", bottom: "18px", left: "18px", size: "34px", opacity: 0.14 },
      ],
      cta: "Pak Eid Voordeel",
      caption: caption13,
    },
    {
      filename: "ad-14-schoolvakantie.jpg",
      title: "Vakantievoordeel: haal voorsprong",
      subtitle: "Gebruik vrije tijd slim en start sterk.",
      features: [
        { icon: "✓", text: "Meer tijd om te leren" },
        { icon: "✓", text: "Geen schoolstress" },
        { icon: "✓", text: "Start sterk in het nieuwe schooljaar" },
      ],
      theme: "modern",
      backgroundEmojis: [
        { emoji: "☀️", top: "16px", right: "16px", size: "46px", opacity: 0.18 },
        { emoji: "🏖️", bottom: "14px", left: "14px", size: "44px", opacity: 0.16 },
        { emoji: "🚗", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(10deg)", size: "108px", opacity: 0.08 },
      ],
      cta: "Start in Vakantie",
      caption: caption14,
    },
    {
      filename: "ad-15-nederland-naar-suriname.jpg",
      title: "In Nederland? Start nu al voor Suriname",
      subtitle: "Kom voorbereid aan met mobiel-first theorie.",
      features: [
        { icon: "*", text: "Leren op je eigen tijd" },
        { icon: "*", text: "Suriname-gerichte theorie" },
        { icon: "*", text: "Direct contact met instructeur" },
      ],
      theme: "modern",
      cta: "Start Vanuit Nederland",
      caption: caption15,
    },
    {
      filename: "ad-16-toerist-voorbereiding.jpg",
      title: "Toerist in Suriname? Begin slim",
      subtitle: "Bereid je flexibel voor, waar je ook bent.",
      features: [
        { icon: "*", text: "Flexibel mobiel volgen" },
        { icon: "*", text: "Modern en mobiel leren" },
        { icon: "*", text: "Praktische uitleg voor Suriname" },
      ],
      theme: "success",
      cta: "Plan & Start Nu",
      caption: caption16,
    },
    {
      filename: "ad-17-uniek-suriname-voor-nederland.jpg",
      title: "Uniek in Suriname: direct mobiel leren",
      subtitle: "Geen trage portals, wel directe progressie.",
      features: [
        { icon: "*", text: "Interactieve rijles app" },
        { icon: "*", text: "Leren wanneer het jou uitkomt" },
        { icon: "*", text: "Snelle lijn met instructeur" },
      ],
      theme: "minimal",
      cta: "Bekijk Het Verschil",
      caption: caption17,
    },
    {
      filename: "ad-18-black-friday.jpg",
      title: "Black Friday: hoogste korting nu",
      subtitle: "Tijdelijk voordeel voor snelle beslissers.",
      features: [
        { icon: "*", text: "Speciale actieprijs" },
        { icon: "*", text: "Extra dagen toegang" },
        { icon: "*", text: "Direct mobiel starten" },
      ],
      theme: "success",
      backgroundEmojis: [
        { emoji: "🛍️", top: "16px", right: "16px", size: "44px", opacity: 0.2 },
        { emoji: "⚡", top: "18px", left: "18px", size: "34px", opacity: 0.16 },
        { emoji: "💸", bottom: "16px", left: "18px", size: "40px", opacity: 0.14 },
      ],
      cta: "Claim Black Friday",
      caption: caption18,
    },
    {
      filename: "ad-19-halloween.jpg",
      title: "Halloween Deal: limited drop",
      subtitle: "Tijdelijke actie met extra toegang.",
      features: [
        { icon: "*", text: "Limited Halloween deal" },
        { icon: "*", text: "Extra gratis toegang" },
        { icon: "*", text: "Start vandaag zonder gedoe" },
      ],
      theme: "festive",
      backgroundEmojis: [
        { emoji: "🎃", top: "18px", right: "18px", size: "46px", opacity: 0.2 },
        { emoji: "🦇", top: "20px", left: "18px", size: "36px", opacity: 0.14 },
        { emoji: "👻", bottom: "16px", left: "18px", size: "40px", opacity: 0.14 },
      ],
      cta: "Claim Nu",
      caption: caption19,
    },
    {
      filename: "ad-20-bespaar-tijd-en-geld-1.jpg",
      title: "Bespaar direct tijd en geld",
      subtitle: "Geen reistijd, wel dagelijkse progressie.",
      features: [
        { icon: "*", text: "Geen rit naar leslocatie" },
        { icon: "*", text: "Geen uren wachten of zitten" },
        { icon: "*", text: "Direct starten vanaf huis" },
      ],
      theme: "modern",
      featurePattern: "row3",
      cta: "Start Slim Vandaag",
      caption: caption20,
    },
    {
      filename: "ad-21-bespaar-tijd-en-geld-2.jpg",
      title: "Stop met reistijd verbranden",
      subtitle: "Meer leertijd, minder kosten, sneller resultaat.",
      features: [
        { icon: "*", text: "Mobiele theorie op jouw tempo" },
        { icon: "*", text: "Minder transportkosten" },
        { icon: "*", text: "Meer tijd voor wat telt" },
      ],
      theme: "success",
      featurePattern: "top-full",
      cta: "Pak Dit Voordeel",
      caption: caption21,
    },
    {
      filename: "ad-22-bespaar-tijd-en-geld-3.jpg",
      title: "Waarom rijden om te wachten?",
      subtitle: "Volledig mobiel leren zonder locatiebezoek.",
      features: [
        { icon: "*", text: "Volledig mobiel leren" },
        { icon: "*", text: "Geen uren op een stoel" },
        { icon: "*", text: "Snel en efficient resultaat" },
      ],
      theme: "minimal",
      featurePattern: "bottom-full",
      cta: "Start Zonder Wachten",
      caption: caption22,
    },
    {
      filename: "ad-23-geen-zoom-hostage-1.jpg",
      title: "Geen urenlange Zoom-calls meer",
      subtitle: "Interactief leren op jouw tempo, zonder vast te zitten.",
      features: [
        { icon: "*", text: "Geen passieve videocall lessen" },
        { icon: "*", text: "Interactief systeem met eigen tempo" },
        { icon: "*", text: "Vraag hulp wanneer jij wilt" },
      ],
      theme: "modern",
      featurePattern: "row3",
      cta: "Leer Zonder Calls",
      caption: caption23,
    },
    {
      filename: "ad-24-flexibel-met-hulp.jpg",
      title: "Flexibel leren, echte ondersteuning",
      subtitle: "Studeer wanneer je kunt en vraag hulp wanneer nodig.",
      features: [
        { icon: "*", text: "Studeren op elk moment" },
        { icon: "*", text: "Asynchrone hulp van instructeur" },
        { icon: "*", text: "Reactie zo snel mogelijk" },
      ],
      theme: "success",
      featurePattern: "top-full",
      cta: "Start Flexibel Nu",
      caption: caption24,
    },
    {
      filename: "ad-25-interactief-in-plaats-van-call.jpg",
      title: "Interactief wint van videocalls",
      subtitle: "Complete mobiel-first rijles met support op aanvraag.",
      features: [
        { icon: "*", text: "Complete interactieve leeromgeving" },
        { icon: "*", text: "Leren en herhalen wanneer jij kan" },
        { icon: "*", text: "Hulp vragen op ieder moment" },
      ],
      theme: "minimal",
      featurePattern: "bottom-full",
      cta: "Bekijk Waarom",
      caption: caption25,
    },
  ];

  return (
    <Page name="campaign" className="campaign-page campaign-page--attention">
      <style>{`
        .campaign-page--attention {
          background:
            radial-gradient(circle at 8% 0%, rgba(255, 191, 120, 0.34), transparent 28%),
            radial-gradient(circle at 92% 14%, rgba(90, 171, 255, 0.2), transparent 32%),
            linear-gradient(180deg, #f6f8ff 0%, #edf3ff 100%);
        }

        .campaign-ads-feed {
          display: grid;
          gap: 22px;
          padding-bottom: 8px;
        }

        .campaign-card-container--attention {
          position: relative;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(16, 26, 50, 0.08);
          box-shadow:
            0 16px 34px rgba(20, 28, 50, 0.1),
            0 2px 0 rgba(255, 255, 255, 0.8) inset;
        }

        .campaign-card-container--attention::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.7);
          z-index: 0;
        }

        .campaign-card-container--attention .campaign-ad-meta,
        .campaign-card-container--attention > .campaign-export-card,
        .campaign-card-container--attention > div:last-child {
          position: relative;
          z-index: 1;
        }

        .campaign-ad-meta {
          width: min(100%, 400px);
          margin: 0 auto 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .campaign-ad-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.35px;
          text-transform: uppercase;
          color: #17253e;
          background: linear-gradient(135deg, #ffe9b1 0%, #ffcd6d 100%);
          border: 1px solid rgba(180, 120, 25, 0.28);
          box-shadow: 0 10px 18px rgba(203, 134, 44, 0.24);
        }

        .campaign-ad-badge::before {
          content: "●";
          color: #ef3a2d;
          font-size: 8px;
        }

        .campaign-ad-format {
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.45px;
          text-transform: uppercase;
          color: #2a3a57;
          background: rgba(239, 244, 255, 0.95);
          border: 1px solid rgba(58, 84, 126, 0.14);
        }

        .campaign-card-container--attention.tone-sun {
          background:
            radial-gradient(circle at 88% 8%, rgba(255, 206, 119, 0.2), transparent 38%),
            #fff;
        }

        .campaign-card-container--attention.tone-sky {
          background:
            radial-gradient(circle at 84% 12%, rgba(122, 184, 255, 0.23), transparent 42%),
            #fff;
        }

        .campaign-card-container--attention.tone-lime {
          background:
            radial-gradient(circle at 86% 12%, rgba(173, 234, 139, 0.22), transparent 38%),
            #fff;
        }

        .campaign-card-actions {
          margin-top: 16px;
          display: flex;
          gap: 12px;
        }

        .campaign-card-actions .button,
        .campaign-card-actions button.button {
          min-height: 48px;
          border-radius: 13px;
        }
      `}</style>
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>Social Media Campagne</NavTitle>
      </Navbar>

      <BlockTitle>Ads</BlockTitle>

      <div className="campaign-ads-feed">
        {/* Pro Design 1 - Glassmorphism Modern */}
        <div className="campaign-card-container campaign-card-container--attention tone-sun">
          <div className="campaign-ad-meta">
            <span className="campaign-ad-badge">Top Converter</span>
            <span className="campaign-ad-format">Feed 4:5</span>
          </div>
          <ProCampaignCard
            designRef={proDesign1Ref}
            title="Nog geen rijbewijs? Start vandaag."
            subtitle="Mobiel leren dat je sneller richting slagen brengt."
            features={[
              { icon: "✨", text: "24/7 maquettes die echt uitleggen" },
              { icon: "📱", text: "Leren waar en wanneer jij wilt" },
              { icon: "🎯", text: "Proefexamens voor snelle check" }
            ]}
            featurePattern="row3"
            schoolLogo={schoolLogo}
            schoolName={schoolName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            theme="modern"
            maxWidth={maxWidth}
            ratio="4:5"
            backgroundImage={campaignBackgroundImage}
          />
          <div className="campaign-card-actions">
            <button
              className="button button-fill"
              onClick={() => downloadDesign(proDesign1Ref, "pro-rijles-1.jpg")}
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
              Download Post
            </button>
            <button
              className="button button-outline"
              onClick={() => copyCaption(caption1)}
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

        {/* Pro Design 2 - Square Format */}
        <div className="campaign-card-container campaign-card-container--attention tone-sky">
          <div className="campaign-ad-meta">
            <span className="campaign-ad-badge">Hoge Interactie</span>
            <span className="campaign-ad-format">Feed 4:5</span>
          </div>
          <ProCampaignCard
            designRef={proDesign2Ref}
            title="Wil je sneller slagen?"
            subtitle="Stop scrollen en start vandaag met je theorie."
            features={[
              { icon: "🚗", text: "Duidelijke verkeerssituaties" },
              { icon: "📚", text: "Geen losse stencils meer" },
              { icon: "🏆", text: "Meer grip op je examen" }
            ]}
            featurePattern="bottom-full"
            schoolLogo={schoolLogo}
            schoolName={schoolName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            theme="success"
            maxWidth={maxWidth}
            ratio="4:5"
            backgroundImage={campaignBackgroundImage}
          />
          <div className="campaign-card-actions">
            <button
              className="button button-fill"
              onClick={() => downloadDesign(proDesign2Ref, "pro-rijles-2.jpg")}
              style={{
                flex: 1,
                background: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <IonIcon icon={downloadOutline} />
              Download Post
            </button>
            <button
              className="button button-outline"
              onClick={() => copyCaption(caption2)}
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
        {convertedAds.map((ad, index) => {
          const designRef = convertedAdRefs[index];
          return (
            <div
              className={`campaign-card-container campaign-card-container--attention ${getToneClass(index + 2)}`}
              key={ad.filename}
            >
              <div className="campaign-ad-meta">
                <span className="campaign-ad-badge">{getAttentionBadge(ad, index)}</span>
                <span className="campaign-ad-format">Feed 4:5</span>
              </div>
              <ProCampaignCard
                designRef={designRef}
                title={ad.title}
                subtitle={ad.subtitle}
                features={ad.features}
                featurePattern={
                  ad.featurePattern ||
                  (index % 3 === 0
                    ? "row3"
                    : index % 3 === 1
                      ? "top-full"
                      : "bottom-full")
                }
                cta={ad.cta}
                theme={ad.theme}
                holidayEmoji={ad.holidayEmoji}
                backgroundEmojis={ad.backgroundEmojis || []}
                schoolLogo={schoolLogo}
                schoolName={schoolName}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                maxWidth={maxWidth}
                ratio="4:5"
                backgroundImage={campaignBackgroundImage}
              />
              <div className="campaign-card-actions">
                <button
                  className="button button-fill"
                  onClick={() => downloadDesign(designRef, ad.filename)}
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

      <Block strong inset>
        <h3 style={{ margin: "0 0 12px 0", color: "#333", textAlign: "left" }}>
          💡 Tips voor beste resultaten:
        </h3>
        <ul
          style={{
            textAlign: "left",
            color: "#666",
            lineHeight: "1.8",
            paddingLeft: "20px",
          }}
        >
          <li>Post op piekmomenten (18:00-21:00 uur)</li>
          <li>Gebruik alle relevante hashtags</li>
          <li>Reageer op comments binnen 1 uur</li>
          <li>Deel ook in Instagram Stories</li>
          <li>Tag relevante accounts in je post</li>
          <li>Vertel over de interactieve maquettes - dat is uniek!</li>
          <li>Highlight de 24/7 toegang en bookmark functie</li>
        </ul>
      </Block>

      <div style={{ height: "50px" }} />
    </Page>
  );
};

export default CampaignPage;



