import React from "react";
import {
  Block,
  BlockTitle,
  Card,
  CardContent,
  Icon,
  List,
  ListItem,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import { t } from "../i18n/translate";
import NavHomeButton from "../components/NavHomeButton";

const EmergencyPage = () => {
  const emergencyNumbers = useStore("emergencyNumbers");
  const importantNumbers = useStore("importantNumbers");

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const saveToContacts = (contact) => {
    f7.dialog.alert(
      `Nummer ${contact.number} kan worden opgeslagen in uw telefoonboek`,
      "Contact Opslaan"
    );
  };

  return (
    <Page name="emergency">
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>{t("nav.noodcontacten")}</NavTitle>
      </Navbar>

      <Block>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center" }}>
              <Icon f7="exclamationmark_triangle" size="48" color="red" />
              <h3 style={{ margin: "10px 0" }}>
                {t("emergency.inCaseOfEmergency")}
              </h3>
              <p style={{ fontSize: "14px", opacity: "0.8" }}>
                Voor directe hulp kunt u de noodnummers 112 (Ambulance), 113
                (Brandweer), 115 (Politie) of 116 (Kustwacht) bellen.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>

      <BlockTitle>
        Noodnummers
        <span
          style={{ float: "right", fontSize: "14px", fontWeight: "normal" }}
        >
          {emergencyNumbers.length} contacten
        </span>
      </BlockTitle>

      <List strong inset dividersIos>
        {emergencyNumbers.map((contact) => (
          <ListItem key={contact.id} link="#" noChevron>
            <Icon
              slot="media"
              f7={contact.icon}
              size="24"
              color={contact.color}
              style={{ marginRight: "10px" }}
            />
            <div slot="inner">
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {contact.name}
              </div>
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {contact.description}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                  {contact.number}
                </div>
                <div>
                  <Button
                    round
                    small
                    onClick={() => handleCall(contact.number)}
                    style={{ marginRight: "8px" }}
                  >
                    <Icon f7="phone_fill" slot="start" size="14" />
                    Bel
                  </Button>
                </div>
              </div>
            </div>
          </ListItem>
        ))}
      </List>

      <BlockTitle>
        Belangrijke Contacten
        <span
          style={{ float: "right", fontSize: "14px", fontWeight: "normal" }}
        >
          {importantNumbers.length} contacten
        </span>
      </BlockTitle>

      <List strong inset dividersIos>
        {importantNumbers.map((contact) => (
          <ListItem key={contact.id} link="#" noChevron>
            <Icon
              slot="media"
              f7={contact.icon}
              size="24"
              color={contact.color}
              style={{ marginRight: "10px" }}
            />
            <div slot="inner">
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {contact.name}
              </div>
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {contact.description}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                  {contact.number}
                </div>
                <div>
                  <Button
                    round
                    small
                    onClick={() => handleCall(contact.number)}
                    style={{ marginRight: "8px" }}
                  >
                    <Icon f7="phone_fill" slot="start" size="14" />
                    Bel
                  </Button>
                </div>
              </div>
            </div>
          </ListItem>
        ))}
      </List>

      <Block>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center" }}>
              <Icon f7="info_circle" size="32" color="blue" />
              <h4 style={{ margin: "10px 0 5px 0" }}>
                {t("emergency.usefulInfo")}
              </h4>
              <p style={{ fontSize: "14px", opacity: "0.8", margin: "5px 0" }}>
                Bewaar deze nummers in uw telefoon voor snelle toegang.
              </p>
              <p style={{ fontSize: "14px", opacity: "0.8", margin: "5px 0" }}>
                In geval van een ongeluk, zorg eerst voor uw veiligheid.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default EmergencyPage;
