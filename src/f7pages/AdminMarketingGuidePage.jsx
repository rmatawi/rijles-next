import React from "react";
import {
  Page,
  Navbar,
  NavTitle,
  NavLeft,
  Link,
  Block,
  f7,
} from "framework7-react";
import { chevronBack } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { useStore } from "framework7-react";
import { isAdminUser } from "../js/utils";
import { openStudentAccessGrantDialog } from "../services/studentAccessGrantService";

const AdminMarketingGuidePage = () => {
  const authUser = useStore("authUser");
  const isAdmin = isAdminUser(authUser);

  return (
    <Page name="admin-marketing-guide" className="page-neu">
      <Navbar sliding={false} className="neu-navbar">
        <NavLeft>
          <Link
            back
            iconOnly
            style={{ color: "var(--f7-theme-color)" }}
            className="neu-btn-circle"
          >
            <IonIcon icon={chevronBack} style={{ fontSize: "24px" }} />
          </Link>
        </NavLeft>
        <NavTitle className="neu-text-primary">Admin Marketing Gids</NavTitle>
      </Navbar>

      <Block style={{ paddingTop: "12px", paddingBottom: "28px" }}>
        {!isAdmin ? (
          <div className="guide-card">
            <h2>Alleen voor admins</h2>
            <p className="neu-text-secondary">
              Deze pagina is bedoeld voor admin accounts.
            </p>
          </div>
        ) : (
          <>
            <div className="guide-card">
              <h2>1. Stappen voor studenten</h2>
              <p className="neu-text-secondary" style={{ marginTop: 0 }}>
                Laat studenten meteen documenten meenemen zoals beschreven in
                {" "}
                <Link
                  className="inline-link"
                  onClick={() => {
                    f7.views.main.router.navigate(
                      "/registration-requirements",
                    );
                  }}
                >
                  Inschrijfvoorwaarden
                </Link>
                , inclusief betaling van <b>SRD 3500</b>.
              </p>
              <ul className="guide-list">
                <li>
                  Controleer dat alle documenten compleet zijn voor
                  intake/examenproces.
                </li>
                <li>
                  Verzamel naam, telefoonnummer en e-mail bij iedere lead.
                </li>
                <li>
                  Plan direct een vervolgafspraak terwijl de student nog
                  gemotiveerd is.
                </li>
                <li>Geef student 90 dagen toegang.</li>
                <li>
                  Is een student gezakt, dan kost het herexamen SRD 1500 met
                  opnieuw 90 dagen toegang.
                </li>
                <li>
                  Open{" "}
                  <Link
                    className="inline-link"
                    onClick={async () => {
                      const schoolId =
                        localStorage.getItem("selectedSchoolId") ||
                        authUser?.schoolIds?.[0] ||
                        null;
                      await openStudentAccessGrantDialog({
                        adminId: authUser?.id,
                        schoolId,
                      });
                    }}
                  >
                    Toegang aan Student
                  </Link>{" "}
                  om de modal te zien en toegang te versturen.
                </li>
              </ul>
            </div>

            <div className="guide-card">
              <h2>2. Social media workflow</h2>
              <ul className="guide-list">
                <li>
                  Open{" "}
                  <Link
                    className="inline-link"
                    onClick={() => {
                      f7.views.main.router.navigate("/campaign");
                    }}
                  >
                    Campagne
                  </Link>{" "}
                  of{" "}
                  <Link
                    className="inline-link"
                    onClick={() => {
                      f7.views.main.router.navigate("/campaign-fresh");
                    }}
                  >
                    Campagne Fresh
                  </Link>{" "}
                  en kies een kant-en-klare post of flyer.
                </li>
                <li>
                  Download de visual, pas de tekst licht aan voor je doelgroep,
                  en plaats direct op WhatsApp, Facebook en Instagram.
                </li>
                <li>
                  Plaats dagelijks consistente content met duidelijke
                  call-to-action: &quot;Start 24 uur gratis&quot;.
                </li>
                <li>
                  Voeg per post het aanmeldlinkje van de rijschool toe om
                  twijfelaars te bewegen naar proefgebruik en registratie.
                </li>
                <li>
                  Reageer binnen dezelfde dag op DM&apos;s en comments om leads
                  warm te houden.
                </li>
              </ul>
            </div>

            <div className="guide-card">
              <h2>3. Heractiveren via dashboard</h2>
              <ul className="guide-list">
                <li>
                  Open het{" "}
                  <Link
                    className="inline-link"
                    onClick={() => {
                      f7.views.main.router.navigate("/admin-profile");
                    }}
                  >
                    admin dashboard
                  </Link>{" "}
                  en zoek inactieve of oude studenten.
                </li>
                <li>
                  Stuur een herstart-bericht met 24 uur gratis toegang als
                  trigger.
                </li>
                <li>
                  Volg binnen 24-48 uur op met een persoonlijk bericht en
                  concrete volgende stap.
                </li>
                <li>
                  Doel: student terugbrengen naar actieve lessen en
                  examenplanning.
                </li>
              </ul>
            </div>

            <div className="guide-card">
              <h2>4. Reward-programma en 24 uur gratis</h2>
              <p className="neu-text-secondary">
                Strategie: geef nieuwe leads eerst 24 uur gratis om de app te
                ervaren. Deze lage instap verlaagt weerstand, verhoogt
                vertrouwen en maakt het makkelijker om daarna betaald te
                converteren.
              </p>
              <ul className="guide-list">
                <li>
                  Beloning en gratis proef werken als &quot;taste first, commit
                  later&quot; model.
                </li>
                <li>
                  Lage drempel helpt om meer telefoonnummers en e-mails te
                  verzamelen.
                </li>
                <li>
                  Gebruik die contactgegevens voor opvolging, herinneringen en
                  conversiecampagnes.
                </li>
              </ul>
            </div>
          </>
        )}
      </Block>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .guide-card {
            background: var(--neu-bg);
            border-radius: 18px;
            padding: 16px;
            margin-bottom: 14px;
            box-shadow: 5px 5px 10px var(--neu-shadow-dark), -5px -5px 10px var(--neu-shadow-light);
          }
          .guide-card h2 {
            margin: 0 0 10px 0;
            font-size: 17px;
            line-height: 1.35;
          }
          .guide-list {
            margin: 0;
            padding-left: 20px;
          }
          .guide-list li {
            margin: 0 0 10px 0;
            font-size: 14px;
            line-height: 1.35;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .inline-link {
            display: inline;
            font-weight: 600;
            text-decoration: underline;
          }
          .guide-card p {
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .neu-btn-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--neu-bg);
            box-shadow: 4px 4px 8px var(--neu-shadow-dark), -4px -4px 8px var(--neu-shadow-light);
          }
        `,
        }}
      />
    </Page>
  );
};

export default AdminMarketingGuidePage;
