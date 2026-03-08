import { warning } from "ionicons/icons";
import { getLayout } from "../../js/utils";
import DashboardActionCard from "../DashboardActionCard";
import { openExternalUrl } from "../../utils/externalLinks";

const CommunitySections = ({ handleCardClick }) => {
  const communitySections = [
    {
      label: "Noodcontacten",
      link: "/?page=emergency",
      icon: warning,
      description: "Belangrijke telefoonnummers.",
    },
  ];

  const accentColor = getLayout()?.colorScheme?.[3] || "var(--f7-theme-color)";

  return (
    <>
      <div className="neu-section-title">Community</div>
      <div style={{ padding: "0 16px" }}>
        {communitySections.map((item, index) => (
          <DashboardActionCard
            key={index}
            title={item.label}
            description={item.description}
            icon={item.icon}
            background="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
            iconColor={accentColor}
            iconBackground="rgba(0, 0, 0, 0.05)"
            onClick={() =>
              item.externalLink
                ? openExternalUrl(item.externalLink)
                : handleCardClick(item.link)
            }
            style={{ marginBottom: "16px" }}
          />
        ))}
      </div>
    </>
  );
};

export default CommunitySections;
