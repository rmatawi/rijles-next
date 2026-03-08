import { Button, Navbar, NavRight, NavTitle, Page, Sheet, Icon } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { personCircle, school, key } from "ionicons/icons";
import { useI18n } from "../i18n/i18n";

const RegisterSheet = ({ profileSections = [], handleCardClick }) => {
  const { t } = useI18n();
  const studentLoginLink = "/?page=student-login";

  // Separate sections by type with safety checks
  const studentSection = profileSections.find(s => s.type === 'student') || profileSections.find(s => s.label === 'Student');
  const adminSection = profileSections.find(s => s.type === 'admin') || profileSections.find(s => s.label === 'Admin');

  return (
    <Sheet id="sheet-register" style={{ height: "70vh" }}>
      <Page>
        <Navbar>
          <NavTitle>{t('auth.loginRegisterAs') || "Log In / Registreer als:"}</NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Primary Student Option */}
          {studentSection && (
            <div
              onClick={() => handleCardClick(studentSection.link)}
              className="neu-card neu-pulse"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 20px",
                textAlign: "center",
                background: "linear-gradient(145deg, var(--neu-bg), var(--neu-bg-dark))",
                cursor: "pointer"
              }}
            >
              <div className="neu-icon" style={{ marginBottom: "20px", width: "80px", height: "80px", borderRadius: "50%" }}>
                <IonIcon
                  icon={studentSection.icon || personCircle}
                  style={{
                    fontSize: "40px",
                    color: "var(--color-blue-primary)",
                  }}
                />
              </div>
              <div className="neu-module-title" style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-blue-primary)" }}>
                {studentSection.label}
              </div>
              <div className="neu-module-desc" style={{ fontSize: "14px", marginTop: "10px", opacity: 0.9, maxWidth: "240px" }}>
                {studentSection.description || "Start vandaag nog met je rijlessen!"}
              </div>
              <Button
                large
                fill
                round
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(studentSection.link);
                }}
                className="margin-top"
                style={{ width: "100%", maxWidth: "200px", fontWeight: 700 }}
              >
                Let's Go!
              </Button>
              <Button
                outline
                round
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(studentLoginLink);
                }}
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  marginTop: "10px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <IonIcon icon={key} style={{ fontSize: "16px" }} />
                Ik heb al een toegangscode
              </Button>
            </div>
          )}

          {/* Secondary Admin Option at the bottom */}
          {adminSection && (
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", opacity: 0.6, marginBottom: "8px" }}>
                Ben je een instructeur of beheerder?
              </div>
              <Button
                onClick={() => handleCardClick(adminSection.link)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: 0.8,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--f7-text-color)"
                }}
              >
                <IonIcon icon={adminSection.icon || school} style={{ fontSize: "18px" }} />
                {adminSection.label} - {adminSection.description}
              </Button>
            </div>
          )}
        </div>
      </Page>
    </Sheet>
  );
};

export default RegisterSheet;
