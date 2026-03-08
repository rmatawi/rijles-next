import { personCircle, school, construct } from "ionicons/icons";
import { f7 } from "framework7-react";
import { getLayout, getThemeGradient } from "../../js/utils";
import { t } from "../../i18n/translate";
import DashboardActionCard from "../DashboardActionCard";

const ProfileDashboardSection = ({
  isAdmin,
  isStudent,
  handleCardClick,
  isDarkMode = false,
}) => {
  const profileSections = [
    {
      label: "Admin",
      link: "/admin-profile",
      icon: construct,
      description:
        "Registreer als admin: • Bewerk Maquettes en Vragen • Voeg studenten toe",
    },
    {
      label: "Student",
      link: "/student-dashboard",
      icon: school,
      description:
        "Registreer als student: • Krijg toegang tot alle Maquettes en Vragen.",
    },
  ];

  const primaryColor = getLayout()?.colorScheme?.[0] || "var(--f7-theme-color)";
  const themeGradient = getThemeGradient();
  const guestCardBackground = isDarkMode
    ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
    : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
  const guestCardIconColor = isDarkMode ? "#ffffff" : primaryColor;
  const guestCardIconBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(0, 0, 0, 0.05)";

  if (isAdmin || isStudent) {
    return (
      <>
        <div className="neu-section-title">
          {t("home.profileAndDashboard")}
        </div>
        <div style={{ padding: "0 16px" }}>
          {isAdmin && (
            <DashboardActionCard
              title={`${profileSections[0].label} Dashboard`}
              description={profileSections[0].description}
              icon={profileSections[0].icon}
              background={themeGradient}
              iconColor="#fff"
              iconBackground="rgba(255, 255, 255, 0.25)"
              onClick={() => handleCardClick(profileSections[0].link)}
              style={{ marginBottom: "16px" }}
            />
          )}
          {isStudent && (
            <DashboardActionCard
              title={`${profileSections[1].label} Dashboard`}
              description={profileSections[1].description}
              icon={profileSections[1].icon}
              background={themeGradient}
              iconColor="#fff"
              iconBackground="rgba(255, 255, 255, 0.25)"
              onClick={() => handleCardClick(profileSections[1].link)}
              style={{ marginBottom: "16px" }}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <div style={{ padding: "0 16px", marginBottom: "16px" }}>
      <DashboardActionCard
        title="Log In / Registreer"
        description="Meld je aan om toegang te krijgen tot alle functies"
        icon={personCircle}
        background={guestCardBackground}
        iconColor={guestCardIconColor}
        iconBackground={guestCardIconBackground}
        onClick={() => f7.sheet.open("#sheet-register")}
      />
    </div>
  );
};

export default ProfileDashboardSection;
