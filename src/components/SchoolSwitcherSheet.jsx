import { Block, BlockTitle, Button, List, ListItem, Navbar, NavRight, NavTitle, Page, Sheet, Icon } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { car } from "ionicons/icons";
import { useI18n } from "../i18n/i18n";

const SchoolSwitcherSheet = ({ getLayout, assignedSchools, otherSchools, requestSchoolAccess }) => {
  const { t } = useI18n();

  return (
    <Sheet id="sheet-school-switcher" style={{ height: "70vh" }}>
      <Page>
        <Navbar>
          <NavTitle>{t('school.switchSchool')}</NavTitle>
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
          {assignedSchools.length > 0 && (
            <BlockTitle>{t('school.yourSchools')}</BlockTitle>
          )}
          <List mediaList inset strong dividers>
            {assignedSchools.length > 0 ? (
              assignedSchools.map((school, index) => (
                <ListItem
                  key={school.id || `assigned-${index}`}
                  title={school.name}
                  text={school.description || "Rijschool"}
                  onClick={() => {
                    localStorage.setItem("selectedSchoolName", school.name);
                    window.location.reload();
                  }}
                  link
                  style={{
                    borderRadius: "8px",
                    margin: "5px 0",
                    cursor: "pointer",
                  }}
                >
                  <IonIcon
                    icon={car}
                    slot="media"
                  />
                </ListItem>
              ))
            ) : (
              <ListItem title={t('school.noSchoolsAssigned')} />
            )}
          </List>

          {otherSchools.length > 0 && (
            <>
              <BlockTitle>{t('school.otherSchools')}</BlockTitle>
              <List mediaList inset strong dividers>
                {otherSchools.map((school, index) => (
                  <ListItem
                    key={school.id || `other-${index}`}
                    title={school.name}
                    text={school.description || "Rijschool"}
                    onClick={() => {
                      requestSchoolAccess(school);
                    }}
                    link
                    style={{
                      borderRadius: "8px",
                      margin: "5px 0",
                      cursor: "pointer",
                    }}
                  >
                    <IonIcon
                      icon={car}
                      slot="media"
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Block>
      </Page>
    </Sheet>
  );
};

export default SchoolSwitcherSheet;