// src/components/home/HomePageActions.jsx
import {
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
  Sheet,
  Navbar,
  NavTitle,
  NavRight,
  f7,
  Icon,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { shareSocial, qrCode, schoolOutline, shareOutline } from "ionicons/icons";
import { QRCodeSVG } from "qrcode.react";
import { openWhatsAppWithPhone } from "../../services/adminContactService";

const HomePageActions = ({
  drivingSchool,
  isAdminStatus,
  shareUrl,
  handleShareOnSocial,
  handleShowQRCode,
  generateAndSendAccessToken,
  sendStudentLoginCredentialsViaWhatsApp,
}) => {
  const handleThemeChange = (theme) => {
    // Save to localStorage for persistence
    localStorage.setItem("mode", theme);

    // Apply theme immediately using Framework7
    if (theme === "dark") {
      f7.setDarkMode(true);
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      f7.setDarkMode(false);
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    // Close the actions sheet
    f7.actions.close("#actions-styles");

    // Show confirmation toast
    f7.toast.create({
      text: `${theme === "dark" ? "Donkere" : "Lichte"} modus ingeschakeld`,
      position: "center",
      closeTimeout: 2000,
    }).open();
  };

  return (
    <>
      {/* Light/Dark mode Action Sheet */}
      <Actions id="actions-styles" className="neu-actions">
        <ActionsGroup>
          <ActionsLabel>Kies Thema</ActionsLabel>
          <ActionsButton onClick={() => handleThemeChange("light")}>
            ☀️ Lichte Modus
          </ActionsButton>
          <ActionsButton onClick={() => handleThemeChange("dark")}>
            🌙 Donkere Modus
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Cancel</ActionsButton>
        </ActionsGroup>
      </Actions>

      {/* Contact School Action Sheet */}
      <Actions id="actions-contact-school" className="neu-actions">
        <ActionsGroup>
          <ActionsLabel>Neem contact op over:</ActionsLabel>
          <ActionsButton
            onClick={() => {
              if (!drivingSchool?.adminPhoneNumber) {
                f7.dialog.alert("Geen telefoonnummer gevonden voor de beheerder.");
                return;
              }
              const message =
                `Hallo ${drivingSchool?.name || ""
                },\n\nIk wil mij graag inschrijven voor rijlessen.\n\nMet vriendelijke groet`;
              openWhatsAppWithPhone({
                phone: drivingSchool?.adminPhoneNumber,
                message,
              });
            }}
          >
            📝 Inschrijving
          </ActionsButton>
          <ActionsButton
            onClick={() => {
              if (!drivingSchool?.adminPhoneNumber) {
                f7.dialog.alert("Geen telefoonnummer gevonden voor de beheerder.");
                return;
              }
              const message =
                `Hallo ${drivingSchool?.name || ""
                },\n\nIk wil graag informatie over de tarieven voor rijlessen.\n\nMet vriendelijke groet`;
              openWhatsAppWithPhone({
                phone: drivingSchool?.adminPhoneNumber,
                message,
              });
            }}
          >
            💰 Tarieven
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Cancel</ActionsButton>
        </ActionsGroup>
      </Actions>

      {/* Share School Action Sheet */}
      <Actions id="actions-share-school" className="neu-actions">
        <ActionsGroup>
          <ActionsLabel>Deel {drivingSchool?.name || "Rijschool"}</ActionsLabel>

          {isAdminStatus && (
            <ActionsButton onClick={generateAndSendAccessToken}>
              🎓 Toegang aan Student
            </ActionsButton>
          )}

          {isAdminStatus && (
            <ActionsButton onClick={sendStudentLoginCredentialsViaWhatsApp}>
              🎓 Student logingegevens
            </ActionsButton>
          )}

          <ActionsButton onClick={handleShareOnSocial}>
            📣 Delen via Social Media
          </ActionsButton>
          {isAdminStatus && (
            <ActionsButton onClick={() => f7.views.main.router.navigate("/campaign/")}>
              📣 Advertenties
            </ActionsButton>
          )}
          <ActionsButton onClick={handleShowQRCode}>
            🔳 Toon QR Code
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Cancel</ActionsButton>
        </ActionsGroup>
      </Actions>

      {/* QR Code Sheet */}
      <Sheet
        id="sheet-qr-code"
        className="glass-sheet" // Updated class
        style={{ height: "auto", maxHeight: "80vh", borderRadius: "24px 24px 0 0" }}
        swipeToClose
        backdrop
      >
        <div className="page-content" style={{ background: "transparent" }}>
          <Navbar style={{ background: "transparent" }} sliding={false}>
            <NavTitle style={{ fontWeight: "700" }}>Scan QR Code</NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                onClick={() => f7.sheet.close("#sheet-qr-code")}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>

          <div
            style={{
              padding: "40px 24px 60px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="glass-card"
              style={{
                padding: "30px",
                display: "inline-block",
                borderRadius: "30px",
                background: "white"
              }}
            >
              <QRCodeSVG
                value={shareUrl || window.location.origin}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <p style={{ marginTop: "24px", color: "#666", textAlign: "center" }}>
              Scan deze code om direct toegang te krijgen tot de rijschool app.
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
};

export default HomePageActions;



