import React from "react";
import { IonIcon } from "@ionic/react";
import useAppNavigation from "../hooks/useAppNavigation";

/**
 * Reusable DashboardActionCard component for horizontal action cards
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string[]} props.details - Array of additional bullet points
 * @param {string} props.icon - Icon name (for f7-icons) or ionicon object
 * @param {string} props.iconType - 'f7' or 'ion' (default: 'f7' if string, 'ion' if object)
 * @param {string} props.background - Background style (gradient or color)
 * @param {string|function} props.onClick - Navigation path or click handler
 * @param {Object} props.style - Additional card styles
 * @param {string} props.className - Additional classes
 * @param {string} props.iconColor - Color of the icon and text (default: #fff)
 * @param {string} props.iconBackground - Background of the icon container
 * @param {boolean} props.showChevron - Whether to show the right chevron (default: true)
 */
const DashboardActionCard = ({
  title,
  description,
  details,
  icon,
  iconType,
  background,
  onClick,
  style = {},
  className = "",
  iconColor = "#fff",
  iconBackground = "rgba(255, 255, 255, 0.3)",
  showChevron = true,
}) => {
  const { navigate } = useAppNavigation();

  const handleClick = () => {
    if (typeof onClick === "string") {
      navigate(onClick);
    } else if (typeof onClick === "function") {
      onClick();
    }
  };

  const isIonIcon =
    iconType === "ion" ||
    (typeof icon !== "string" && icon !== undefined && icon !== null) ||
    (typeof icon === "string" &&
      (icon.includes("<svg") ||
        icon.includes("data:image/svg+xml") ||
        icon.length > 30));

  return (
    <div
      className={`neu-card ${className}`}
      style={{
        padding: "20px",
        cursor: "pointer",
        background: background || "var(--f7-theme-color)",
        ...style,
      }}
      onClick={handleClick}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isIonIcon ? (
            <IonIcon
              icon={icon}
              style={{ fontSize: "32px", color: iconColor }}
            />
          ) : (
            <i
              className="f7-icons"
              style={{ fontSize: "32px", color: iconColor }}
            >
              {icon}
            </i>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "18px",
              fontWeight: 700,
              color: iconColor,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: iconColor === "#fff" ? "rgba(255, 255, 255, 0.9)" : "inherit",
              opacity: iconColor === "#fff" ? 1 : 0.8,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {description}
          </p>
          {details && details.length > 0 && (
            <ul
              style={{
                margin: "12px 0 0 0",
                padding: "0 0 0 16px",
                fontSize: "13px",
                color: iconColor === "#fff" ? "rgba(255, 255, 255, 0.85)" : "inherit",
                listStyleType: "circle",
                lineHeight: "1.4",
              }}
            >
              {details.map((detail, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "6px",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
        {showChevron && (
          <i
            className="f7-icons"
            style={{ fontSize: "24px", color: iconColor, opacity: 0.8 }}
          >
            chevron_right
          </i>
        )}
      </div>
    </div>
  );
};

export default DashboardActionCard;
