import { Block, BlockTitle, Button, CardContent, List, ListItem, Navbar, NavLeft, NavRight, NavTitle, Page, Sheet, Icon } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { car, helpCircle, school } from "ionicons/icons";
import { useI18n } from "../i18n/i18n";

const RegistrationBenefitsSheet = () => {
  const { t } = useI18n();

  return (
    <Sheet id="sheet-registration-benefits" style={{ height: "70vh" }}>
      <Page>
        <Navbar>
          <NavTitle>{t('adminRequest.adminAccessRequired') || "Beheerders Toegang Vereist"}</NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>
        <Block style={{ padding: "0 16px" }}>
          <h2
            style={{
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            Om een rijschool te bewerken, moet u als beheerder geregistreerd
            of ingelogd zijn.
          </h2>
          <Block>
            <Button
              large
              fill
              style={{ marginTop: "10px" }}
              href="/admin-profile"
              onClick={() => {
                // This will be handled by the parent component
              }}
              text="Registreer / Inloggen"
              iconF7="person"
            />
          </Block>
          <h3
            style={{
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            Registreer gratis en geniet van de volgende voordelen:
          </h3>
          <List mediaList>
            <ListItem
              title="Voeg je eigen logo en afbeelding toe"
              text="Maak je profiel compleet met je eigen branding."
            >
              <IonIcon
                slot="media"
                icon={car}
                style={{ fontSize: "30px", color: "var(--f7-theme-color)" }}
              />
            </ListItem>
            <ListItem
              title="Maquettes aanmaken en bewerken"
              text="Creëer interactieve verkeerssituaties voor je studenten."
            >
              <IonIcon
                slot="media"
                icon={car}
                style={{ fontSize: "30px", color: "var(--f7-theme-color)" }}
              />
            </ListItem>
            <ListItem
              title="Vragen aanmaken en bewerken"
              text="Voeg theorievragen toe in de stijl van het Korps Politie Suriname."
            >
              <IonIcon
                slot="media"
                icon={helpCircle}
                style={{ fontSize: "30px", color: "var(--f7-theme-color)" }}
              />
            </ListItem>
            <ListItem
              title="Studenten toevoegen en beheren"
              text="Beheer je studenten en hun voortgang in één overzicht."
            >
              <IonIcon
                slot="media"
                icon={school}
                style={{ fontSize: "30px", color: "var(--f7-theme-color)" }}
              />
            </ListItem>
          </List>
          <Block style={{ textAlign: "center", marginTop: "20px" }}>
            <p>{t('adminRequest.registerFree')}</p>
            <Button
              large
              fill
              style={{ marginTop: "10px" }}
              href="/admin-profile"
              onClick={() => {
                // This will be handled by the parent component
              }}
              text={t('adminRequest.registerLogin') || "Registreer / Inloggen"}
              iconF7="person"
            />
          </Block>
        </Block>
      </Page>
    </Sheet>
  );
};

export default RegistrationBenefitsSheet;