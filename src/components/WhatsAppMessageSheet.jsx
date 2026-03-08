// components/WhatsAppMessageSheet.jsx
import React, { useState } from "react";
import {
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  PageContent,
  Block,
  BlockTitle,
  Card,
  CardContent,
  Button,
  f7,
  Icon,
  useStore,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { logoWhatsapp, sendOutline } from "ionicons/icons";
import { getLayout } from "../js/utils";
import { studentService } from "../services/studentService";
import { openExternalUrl } from "../utils/externalLinks";

/**
 * WhatsAppMessageSheet Component
 * Shows predefined message templates for student re-engagement and follow-ups
 */
const WhatsAppMessageSheet = () => {
  const [student, setStudent] = useState(null);
  const authUser = useStore("authUser");

  const getCurrentAdminName = () =>
    authUser?.adminProfile?.name || authUser?.name || authUser?.email || "Onbekende admin";

  const recordWhatsAppTemplateSend = async (studentData, template) => {
    if (!studentData?.id || !template?.title) return;

    const { data: latestStudent, error: fetchError } = await studentService.getStudentById(studentData.id);
    if (fetchError) {
      throw fetchError;
    }

    const existingHistory = Array.isArray(latestStudent?.whatsapp_template_history)
      ? latestStudent.whatsapp_template_history
      : [];

    const historyEntry = {
      templateTitle: template.title,
      adminName: getCurrentAdminName(),
      date: new Date().toISOString(),
    };

    const { error: updateError } = await studentService.updateStudent(studentData.id, {
      whatsapp_template_history: [...existingHistory, historyEntry],
    });

    if (updateError) {
      throw updateError;
    }
  };

  const formatDutchDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getAutoExpiryDateText = (studentData) => {
    const candidateDate =
      studentData?.expires_at ||
      studentData?.access_expires_at ||
      studentData?.subscription_expires_at ||
      studentData?.student_school_expires_at ||
      studentData?.student_school?.expires_at;

    const formattedCandidate = formatDutchDate(candidateDate);
    if (formattedCandidate) {
      return formattedCandidate;
    }

    // Fallback for the "just paid" template: assume a new 90-day access starts today.
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 90);
    return formatDutchDate(fallbackDate);
  };

  // Predefined message templates
  const messageTemplates = [
    {
      id: 101,
      title: "Re-engagement: 24 uur verlopen (vriendelijk)",
      emoji: "⏳",
      color: "#FF9500",
      message: (name) =>
        `Hoi ${name}! ⏳\n\nJe gratis 24 uur toegang tot de app is inmiddels verlopen.\n\nWil je weer verder oefenen met theorie en je voortgang oppakken?\n\nStuur me gerust een berichtje, dan help ik je direct verder met toegang en je volgende stappen. 🚗`,
    },
    {
      id: 102,
      title: "Re-engagement: verder met lessen",
      emoji: "📲",
      color: "#007AFF",
      message: (name) =>
        `Hoi ${name}! 📲\n\nIk zag dat je gratis 24 uur toegang is afgelopen.\n\nZonde om je voortgang stil te laten staan, want je was goed bezig.\n\nWil je doorgaan? Ik kan je helpen met de juiste optie zodat je weer verder kunt oefenen en plannen.`,
    },
    {
      id: 103,
      title: "Re-engagement: korte opvolging",
      emoji: "🚀",
      color: "#34C759",
      message: (name) =>
        `Hey ${name}! 🚀\n\nEven een korte check-in: je gratis 24 uur toegang is voorbij.\n\nHeb je interesse om weer toegang te krijgen en verder te gaan met je rijbewijstraject?\n\nLaat me weten, dan regel ik het voor je.`,
    },
    {
      id: 104,
      title: "Benodigde documenten (Cat. B - E)",
      emoji: "📄",
      color: "#5856D6",
      message: (name) =>
        `Hoi ${name}! 📄\n\nHierbij de lijst met benodigde documenten voor de rijexamen-aanvraag (Categorie B - E):\n\n1. Aanvraag rijbewijs uittreksel (bij de CBB aangeven dat het voor een rijbewijs is)\n2. Rij-examen kosten: SRD 140.- (te betalen bij Min. OW, Bank of Commissariaat t.o. Hotel Torarica)\n3. Twee (2) pasfoto's (kleur, niet ouder dan zes maanden, witte achtergrond)\n   - Met naam en telefoonnummer op de achterzijde\n   - Aangeven dat het voor een rijbewijs is\n   - Zo natuurlijk mogelijk (geen/minimale make-up)\n   - Geen uniform, werk/schoolkleding of witte kleding\n4. Doktersverklaring (niet ouder dan 14 dagen, graag zonder datum laten opmaken)\n5. Kopie nationale ID-kaart (voor- en achterkant in kleur)\n6. Originele nationale ID-kaart (geldig bij indiening)\n\nAls je wilt, kan ik je ook helpen om alles stap voor stap af te vinken.`,
    },
    {
      id: 108,
      title: "Benodigde documenten (Cat. A)",
      emoji: "📄",
      color: "#8E44AD",
      message: (name) =>
        `Hoi ${name}! 📄\n\nHierbij de lijst met benodigde documenten voor Cat A:\n\n1. Rijbewijs uittreksel\n2. Doktersverklaring (niet ouder dan 14 dagen)\n3. Stortingsbewijs van SRD 125.-\n4. Twee (2) pasfoto's (kleur, met een witte achtergrond)\n5. Kopie E-ID-kaart (voor- en achterkant in kleur)\n6. Originele E-ID-kaart\n7. Indien je reeds in het bezit bent van een rijbewijs: ook een kopie van je rijbewijs (voor- en achterkant) en het origineel\n\nAls je wilt, kan ik je ook helpen om alles stap voor stap af te vinken.`,
    },
    {
      id: 109,
      title: "Benodigde documenten (Cat. C/D)",
      emoji: "📄",
      color: "#16A085",
      message: (name) =>
        `Hoi ${name}! 📄\n\nHierbij de lijst met benodigde documenten voor Cat.C (Truck) & D (Bus):\n\n1. Rijbewijs uittreksel\n2. Twee (2) pasfoto's (kleur, met een witte achtergrond)\n3. Stortingsbewijs (leges) van SRD 150.-\n4. Doktersverklaring (niet ouder dan 14 dagen)\n5. Kopie rijbewijs (voor- en achterkant in kleur)\n6. Kopie E-ID-kaart (voor- en achterkant in kleur)\n7. Origineel rijbewijs\n\nAls je wilt, kan ik je ook helpen om alles stap voor stap af te vinken.`,
    },
    {
      id: 105,
      title: "Feedback vragen",
      emoji: "⭐",
      color: "#FFCC00",
      message: (name) =>
        `Hoi ${name}! ⭐\n\nIk hoor graag hoe je ervaring tot nu toe is met onze rijschool en de app.\n\nWat vond je prettig, en wat kunnen we verbeteren?\n\nJe feedback helpt ons echt om beter te worden. Alvast bedankt!`,
    },
    {
      id: 106,
      title: "Betaling en toegang uitleg",
      emoji: "💬",
      color: "#0A84FF",
      message: (name) =>
        `Hoi ${name}!\n\nHierbij een korte uitleg over betaling en toegang:\n\n• Na betaling van SRD 3500 krijg je 90 dagen toegang tot de app.\n\n• Blijkt dat je meer tijd nodig hebt? Dan kun je op verzoek extra dagen van ons krijgen.\n\n• Ben je voor je examen gezakt, dan betaal je SRD 1500 voor je herexamen en krijg je opnieuw 90 dagen toegang.`,
    },
    {
      id: 107,
      title: "Betaling bevestigd (90 dagen)",
      emoji: "✅",
      color: "#30D158",
      message: (name) =>
        `Hoi ${name}!\n\nU heeft SRD 3500 betaald en heeft nu 90 dagen toegang tot de app.\n\nUw toegang vervalt op [datum].\n\nVeel succes met studeren en probeer elke dag even te oefenen in de app.\n\nAls u vragen heeft of hulp nodig heeft, neem gerust contact met ons op.`,
    },
    {
      id: 1,
      title: "Welkomstbericht",
      emoji: "👋",
      color: "#34C759",
      message: (name) =>
        `Hoi ${name}! 👋\n\nWelkom bij onze rijschool! We zijn blij dat je er bent.\n\nHeb je al de kans gehad om de app te verkennen? Als je vragen hebt, laat het me weten!\n\nSucces met je lessen! 🚗`,
    },
    {
      id: 2,
      title: "Vriendelijke herinnering",
      emoji: "⏰",
      color: getLayout()?.colorScheme?.[0],
      message: (name) =>
        `Hoi ${name}! ⏰\n\nIk wilde even checken hoe het gaat met je rijlessen.\n\nHeb je nog vragen over de theorie of je volgende praktijkles?\n\nLaat het me weten als ik je ergens mee kan helpen!`,
    },
    {
      id: 3,
      title: "Motivatie bericht",
      emoji: "💪",
      color: "var(--app-primary-color)",
      message: (name) =>
        `Hey ${name}! 💪\n\nJe doet het geweldig! Blijf oefenen met de theorie in de app.\n\nElke vraag die je oefent brengt je dichter bij je rijbewijs! 🎯\n\nBlijf gemotiveerd, je kan het!`,
    },
    {
      id: 4,
      title: "Check-in na inactiviteit",
      emoji: "🔔",
      color: "#FF3B30",
      message: (name) =>
        `Hoi ${name}! 🔔\n\nIk heb je een tijdje niet gezien in de app.\n\nIs er iets waar ik je mee kan helpen? Heb je hulp nodig met het plannen van lessen?\n\nLaat het me weten, ik help je graag verder!`,
    },
    {
      id: 5,
      title: "Uitnodiging voor nieuwe les",
      emoji: "📅",
      color: "#AF52DE",
      message: (name) =>
        `Hoi ${name}! 📅\n\nEr zijn nieuwe tijdslots beschikbaar voor rijlessen!\n\nWil je een nieuwe les inplannen? Laat me weten welke dag en tijd jou het beste uitkomt.\n\nIk kijk ernaar uit om je te zien! 🚗`,
    },
  ];

  // Open WhatsApp with selected message
  const sendWhatsAppMessage = async (template) => {
    if (!student?.phone) {
      f7.dialog.alert("Geen telefoonnummer beschikbaar voor deze student.");
      return;
    }

    let message = template.message(student.name || "");
    if (message.includes("[datum]")) {
      message = message.replace("[datum]", getAutoExpiryDateText(student));
    }
    let phoneNumber = student.phone.replace(/\D/g, ""); // Remove non-numeric characters

    // Fix: Ensure Suriname country code (597) is present
    if (phoneNumber && !phoneNumber.startsWith("597")) {
      // Handle local mobile numbers starting with 0 (e.g. 08xxxxxx -> 5978xxxxxx)
      if (phoneNumber.startsWith("0")) {
        phoneNumber = "597" + phoneNumber.substring(1);
      } else {
        phoneNumber = "597" + phoneNumber;
      }
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    // Open WhatsApp
    openExternalUrl(whatsappUrl);

    try {
      await recordWhatsAppTemplateSend(student, template);
    } catch (error) {
      console.error("Error storing WhatsApp template send history:", error);
      f7.toast
        .create({
          text: "WhatsApp geopend, maar log opslaan is mislukt",
          position: "center",
          closeTimeout: 2500,
        })
        .open();
    }

    // Close the sheet
    f7.sheet.close(".whatsapp-message-sheet");

    // Show success toast
    f7.toast
      .create({
        text: "WhatsApp geopend met bericht",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  };

  // Expose function to open sheet
  React.useEffect(() => {
    window.openWhatsAppMessageSheet = (studentData) => {
      setStudent(studentData);
      f7.sheet.open(".whatsapp-message-sheet");
    };

    return () => {
      delete window.openWhatsAppMessageSheet;
    };
  }, []);

  const handleClose = () => {
    f7.sheet.close(".whatsapp-message-sheet");
    setTimeout(() => {
      setStudent(null);
    }, 300);
  };

  return (
    <Sheet
      className="whatsapp-message-sheet"
      style={{ height: "80vh" }}
      swipeToClose
      backdrop
      onSheetClosed={handleClose}
    >
      <Page>
        <Navbar>
          <NavTitle>
            <IonIcon
              icon={logoWhatsapp}
              style={{ fontSize: "24px", marginRight: "8px", color: "#25D366" }}
            />
            WhatsApp Berichten
          </NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <PageContent>
          {/* Student Info */}
          {student && (
            <Block className="text-align-center" style={{ paddingTop: "8px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                Verstuur naar:
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {student.name}
              </p>
              {student.phone && (
                <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "14px" }}>
                  {student.phone}
                </p>
              )}
            </Block>
          )}

          <BlockTitle>Kies een berichtsjabloon</BlockTitle>

          {/* Message Template Cards */}
          {messageTemplates.map((template) => (
            <Block key={template.id} strong inset>
              <Card className="elevation-3">
                <CardContent style={{ padding: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "32px",
                        flexShrink: 0,
                      }}
                    >
                      {template.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: template.color,
                        }}
                      >
                        {template.title}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.5",
                          marginBottom: "12px",
                        }}
                      >
                        {template.message(student?.name || "[Naam]")}
                      </div>
                      <Button
                        fill
                        round
                        style={{ backgroundColor: template.color }}
                        onClick={() => sendWhatsAppMessage(template)}
                      >
                        <IonIcon
                          icon={sendOutline}
                          style={{ marginRight: "8px" }}
                        />
                        Verstuur via WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Block>
          ))}

          <Block style={{ paddingBottom: "32px" }}>
            <Card>
              <CardContent>
                <div style={{ fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Tip: Je kunt het bericht aanpassen voordat je het verstuurt
                  in WhatsApp
                </div>
              </CardContent>
            </Card>
          </Block>
        </PageContent>
      </Page>
    </Sheet>
  );
};

export default WhatsAppMessageSheet;
