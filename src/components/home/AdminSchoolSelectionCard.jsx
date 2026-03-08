// src/components/home/AdminSchoolSelectionCard.jsx
import { f7 } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { school } from "ionicons/icons";
import { getLayout } from "../../js/utils";

const AdminSchoolSelectionCard = ({
  authUser,
  assignedSchools,
  setEditingSchool,
  requestSchoolAccess,
  drivingSchool,
  handleSignOut,
}) => {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div className="med-card" style={{ padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="med-icon-squircle" style={{ margin: "0 auto 16px auto", background: "#f1f5f9", color: getLayout()?.colorScheme?.[0] }}>
            <IonIcon
              icon={school}
              style={{
                fontSize: "32px",
              }}
            />
          </div>
          <h3
            className="med-title"
            style={{
              margin: "0 0 8px 0",
              textAlign: "center"
            }}
          >
            {process.env.VITE_REACT_APP_MODE === "platform"
              ? "Rijschool Aanmaken"
              : "Waarschuwing"}
          </h3>
          <p
            style={{ margin: "0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}
          >
            {process.env.VITE_REACT_APP_MODE === "platform"
              ? "U bent ingelogd als admin maar heeft nog geen rijschool aangemaakt / geselecteerd."
              : "U bent geen admin van dit account"}
          </p>
        </div>

        {process.env.VITE_REACT_APP_MODE === "platform" && (
          <div
            className="button button-fill button-large button-round"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px",
              background: getLayout()?.colorScheme?.[0] || "var(--color-blue-primary)",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
            onClick={() => {
              setEditingSchool({
                id: null,
                name: "",
                description: "",
                logo_url: "",
                cover_image_url: "",
                address: "",
                area: "",
                district: "",
              });
              f7.sheet.open("#editschool-sheet");
            }}
          >
            <i className="f7-icons" style={{ fontSize: "18px" }}>
              plus
            </i>
            School Aanmaken
          </div>
        )}

        {process.env.VITE_REACT_APP_MODE === "platform" &&
          assignedSchools.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Beschikbare Scholen
              </div>
              {assignedSchools.map((schoolItem) => (
                <div
                  key={schoolItem.id}
                  className="med-input-field"
                  style={{
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => {
                    // School selection is now handled via environment variables
                    // No longer using localStorage for selectedSchoolId
                    window.location.reload();
                  }}
                >
                  <IonIcon
                    icon={school}
                    style={{
                      fontSize: "20px",
                      color: getLayout()?.colorScheme?.[0],
                    }}
                  />
                  <span
                    style={{ fontWeight: 600, color: "#333", fontSize: "15px", flex: 1 }}
                  >
                    {schoolItem.name}
                  </span>
                  <i className="f7-icons" style={{ fontSize: "16px", color: "#ccc" }}>chevron_right</i>
                </div>
              ))}
            </div>
          )}

        {process.env.VITE_REACT_APP_MODE !== "platform" && (
          <div
            className="button button-fill button-large button-round"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px",
              background: getLayout()?.colorScheme?.[0] || "var(--color-blue-primary)",
              fontWeight: 700,
            }}
            onClick={() => requestSchoolAccess(drivingSchool)}
          >
            <i className="f7-icons" style={{ fontSize: "18px" }}>
              plus
            </i>
            Admin Toegang Aanvragen
          </div>
        )}

        <div
          className="button button-large button-round button-outline color-red"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: 600,
            borderWidth: "2px",
            borderColor: "#fecaca",
            color: "#ef4444"
          }}
          onClick={handleSignOut}
        >
          <i className="f7-icons" style={{ fontSize: "18px" }}>
            person_badge_minus
          </i>
          Uitloggen
        </div>
      </div>
    </div>
  );
};

export default AdminSchoolSelectionCard;
