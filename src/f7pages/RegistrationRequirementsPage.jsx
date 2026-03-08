import React from "react";
import {
  Page,
  Navbar,
  NavTitle,
  NavLeft,
  Link,
  Block,
  List,
  ListItem,
  Toolbar,
  ToolbarPane,
  Tabs,
  Tab,
} from "framework7-react";
import { chevronBack } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import DashboardActionCard from "../components/DashboardActionCard";
import { getThemeGradient } from "../js/utils";
import useAppNavigation from "../hooks/useAppNavigation";

const RegistrationRequirementsPage = () => {
  const { back } = useAppNavigation();
  const requirements = [
    {
      title: "Aanvraag rijbewijs uittreksel",
      details: ["Bij de CBB duidelijk aangeven dat het voor een rijbewijs is"],
    },
    {
      title: "Rij-examen kosten: SRD 140.-",
      details: ["Te betalen bij Min. OW, Bank of Commissariaat (t.o. Hotel Torarica)"],
    },
    {
      title:
        "Twee (2) pasfoto's (kleur, niet ouder dan zes maanden, met een witte achtergrond)",
      details: [
        "Met naam en telefoonnummer op de achterzijde",
        "Duidelijk aangeven dat het voor een rijbewijs is",
        "Zo natuurlijk mogelijk verschijnen (geen/minimale make-up, etc.)",
        "Geen uniform, werk/schoolkleding of witte kleding",
      ],
    },
    {
      title: "Doktersverklaring (niet ouder dan 14 dagen)",
      details: ["Doktersverklaring zonder datum (dit duidelijk aangeven bij de dokter)"],
    },
    {
      title: "Kopie nationale ID-kaart (voor- en achterkant in kleur)",
      details: ["Kopie van zowel de voor- als achterzijde"],
    },
    {
      title: "Originele nationale ID-kaart",
      details: ["Dient geldig te zijn bij indiening"],
    },
  ];

  const categoryARequirements = [
    { title: "Rijbewijs uittreksel", details: [] },
    { title: "Doktersverklaring (niet ouder dan 14 dagen)", details: [] },
    { title: "Stortingsbewijs van SRD 125.-", details: [] },
    {
      title: "Twee (2) pasfoto's (kleur, met een witte achtergrond)",
      details: [],
    },
    { title: "Kopie E-ID-kaart (voor- en achterkant in kleur)", details: [] },
    { title: "Originele E-ID-kaart", details: [] },
    {
      title: "Indien je reeds in het bezit bent van een rijbewijs",
      details: ["Ook een kopie van je rijbewijs (voor- en achterkant) en het origineel"],
    },
  ];

  const categoryCDRequirements = [
    { title: "Rijbewijs uittreksel", details: [] },
    {
      title: "Twee (2) pasfoto's (kleur, met een witte achtergrond)",
      details: [],
    },
    { title: "Stortingsbewijs (leges) van SRD 150.-", details: [] },
    { title: "Doktersverklaring (niet ouder dan 14 dagen)", details: [] },
    { title: "Kopie rijbewijs (voor- en achterkant in kleur)", details: [] },
    { title: "Kopie E-ID-kaart (voor- en achterkant in kleur)", details: [] },
    { title: "Origineel rijbewijs", details: [] },
  ];

  const pricingData = [
    {
      title: "Losse Rijles",
      description: "SRD 350 per uur",
      details: ["Persoonlijke begeleiding", "Ophalen en afzetten in overleg"],
      icon: "car_fill",
    },
    {
      title: "Tussentijdse Toets",
      description: "SRD 1500",
      details: ["Inclusief autohuur", "Voorbereiding op examen"],
      icon: "checkmark_circle_fill",
    },
    {
      title: "Rijexamen",
      description: "SRD 2500",
      details: [
        "Inclusief autohuur",
        "Begeleiding naar examenlocatie",
        "Eerste keer of herexamen",
      ],
      icon: "flag_fill",
    },
    {
      title: "Theorie Cursus",
      description: "SRD 750",
      details: ["Klassikaal of online", "Inclusief lesmateriaal"],
      icon: "book_fill",
    },
  ];

  return (
    <Page name="registration-requirements" className="page-neu">
      <Navbar sliding={false} className="neu-navbar">
        <NavLeft>
          <button
            type="button"
            onClick={back}
            style={{ color: "var(--f7-theme-color)" }}
            className="neu-btn-circle"
            aria-label="Ga terug"
          >
            <IonIcon icon={chevronBack} style={{ fontSize: "24px" }} />
          </button>
        </NavLeft>
        <NavTitle className="neu-text-primary">Benodigde documenten</NavTitle>
      </Navbar>

      <Toolbar bottom tabbar icons className="neu-toolbar" style={{ display: "none" }}>
        <ToolbarPane>
          <Link
            tabLink="#requirements"
            tabLinkActive
            text="Voorwaarden"
            iconIos="f7:doc_text_fill"
            iconMd="material:description"
          />
          <Link
            tabLink="#pricing"
            text="Tarieven"
            iconIos="f7:money_dollar_circle_fill"
            iconMd="material:attach_money"
          />
        </ToolbarPane>
      </Toolbar>

      <Tabs>
        <Tab id="requirements" className="page-content" tabActive>
          <Block className="neu-block tab-content-active" style={{ marginTop: "24px" }}>
            <div className="requirements-header">
              <h1>Rijexamen-aanvraag</h1>
              <p className="neu-text-secondary">Categorie B - E</p>
            </div>

            <List className="requirements-list" mediaList>
              {requirements.map((item, index) => (
                <li key={item.title} className="item-content requirements-item">
                  <div className="item-media">
                    <div className="requirements-index">{index + 1}</div>
                  </div>
                  <div className="item-inner">
                    <div className="item-title">{item.title}</div>
                    {item.details.length > 0 && (
                      <ul className="requirements-details">
                        {item.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </List>

            <div className="requirements-header requirements-subsection-header">
              <p className="neu-text-secondary">Cat A</p>
            </div>

            <List className="requirements-list" mediaList>
              {categoryARequirements.map((item, index) => (
                <li key={`a-${item.title}`} className="item-content requirements-item">
                  <div className="item-media">
                    <div className="requirements-index">{index + 1}</div>
                  </div>
                  <div className="item-inner">
                    <div className="item-title">{item.title}</div>
                    {item.details.length > 0 && (
                      <ul className="requirements-details">
                        {item.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </List>

            <div className="requirements-header requirements-subsection-header">
              <p className="neu-text-secondary">Cat.C (Truck) & D (Bus)</p>
            </div>

            <List className="requirements-list" mediaList>
              {categoryCDRequirements.map((item, index) => (
                <li key={`cd-${item.title}`} className="item-content requirements-item">
                  <div className="item-media">
                    <div className="requirements-index">{index + 1}</div>
                  </div>
                  <div className="item-inner">
                    <div className="item-title">{item.title}</div>
                    {item.details.length > 0 && (
                      <ul className="requirements-details">
                        {item.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </List>
          </Block>
        </Tab>

        <Tab id="pricing" className="page-content">
          <Block className="neu-block tab-content-active" style={{ marginTop: "24px" }}>
            <p
              className="neu-text-secondary"
              style={{
                textAlign: "center",
                marginBottom: "32px",
                padding: "0 10px",
              }}
            >
              Onze actuele tarieven voor rijlessen en examens.
            </p>

            <div
              className="pricing-grid"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                paddingBottom: "40px",
              }}
            >
              {pricingData.map((price, index) => (
                <DashboardActionCard
                  key={index}
                  title={price.title}
                  description={price.description}
                  details={price.details}
                  icon={price.icon}
                  background={getThemeGradient()}
                  iconColor="#fff"
                  iconBackground="rgba(255, 255, 255, 0.2)"
                  showChevron={false}
                  style={{ borderRadius: "24px" }}
                />
              ))}
            </div>
          </Block>
        </Tab>
      </Tabs>

      <style dangerouslySetInnerHTML={{ __html: `
        .neu-block {
          padding: 0 16px;
        }
        .requirements-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 0 8px;
        }
        .requirements-header h1 {
          font-size: 20px;
          line-height: 1.3;
          margin: 0 0 6px 0;
          color: var(--f7-text-color);
          font-weight: 700;
        }
        .requirements-header p {
          margin: 0;
          font-size: 14px;
        }
        .requirements-subsection-header {
          margin-top: 12px;
          margin-bottom: 12px;
        }
        .requirements-subsection-header p {
          font-size: 16px;
          font-weight: 700;
          color: var(--f7-theme-color);
        }
        .requirements-list {
          background: var(--neu-bg);
          border-radius: 20px;
          box-shadow: 6px 6px 12px var(--neu-shadow-dark), -6px -6px 12px var(--neu-shadow-light);
          overflow: hidden;
          margin-bottom: 32px;
        }
        .requirements-list .item-content {
          padding-top: 14px;
          padding-bottom: 14px;
        }
        .requirements-list .item-title {
          white-space: normal;
          line-height: 1.35;
        }
        .requirements-item .item-inner {
          padding-top: 14px;
          padding-bottom: 14px;
        }
        .requirements-details {
          margin: 8px 0 0 0;
          padding-left: 16px!important;
          font-size: 13px;
          line-height: 1.35;
          color: var(--f7-text-color);
          opacity: 0.7;
        }
        .requirements-details li + li {
          margin-top: 6px;
        }
        .requirements-index {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--f7-theme-color);
          background: rgba(0, 0, 0, 0.04);
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
        .tab-content-active {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom toolbar styling to match neumorphic theme */
        .neu-toolbar {
            background: var(--neu-bg);
            box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
        }
        .neu-toolbar .tab-link-active {
            color: var(--f7-theme-color);
            position: relative;
        }
        .neu-toolbar .tab-link-active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 3px;
            background: var(--f7-theme-color);
            border-radius: 4px 4px 0 0;
        }
      ` }} />
    </Page>
  );
};

export default RegistrationRequirementsPage;

