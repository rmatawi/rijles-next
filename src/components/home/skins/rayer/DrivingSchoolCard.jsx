// src/components/home/skins/rayer/DrivingSchoolCard.jsx
// Rayer skin-specific DrivingSchoolCard component
// Features: Modern medical UI design with admin selection and glass effects

import { f7, useStore } from "framework7-react";
import { getLayout, isUserAdmin } from "../../../../js/utils";
import { createGradient, isLight } from "../../../../utils/colorUtils";
import { rayerStyles } from "./styles";

const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) {
    // Fallback to default blue if hex is invalid
    return `rgba(59, 130, 246, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DrivingSchoolCard = ({
  drivingSchool,
  isAdminStatus,
  openSchoolEditSheet,
  handleShareSchool,
}) => {
  if (!drivingSchool) return null;

  const baseColor = getLayout()?.colorScheme?.[0] || "#3b82f6"; // Default blue if missing
  const isSchoolLight = isLight(baseColor);
  const textColor = isSchoolLight ? "#1e293b" : "#ffffff";
  const badgeBg = isSchoolLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)";
  const badgeTextColor = isSchoolLight ? "#1e293b" : "#ffffff";

  // Image overlay logic
  const bgImage = drivingSchool?.coverPhoto;

  const gradientBg = bgImage
    ? `linear-gradient(0deg, ${hexToRgba(baseColor, 1)}, ${hexToRgba(baseColor, 0.7)}), url('${bgImage}')`
    : isSchoolLight
      ? `linear-gradient(135deg, ${baseColor} 0%, ${baseColor} 100%)`
      : `linear-gradient(135deg, ${baseColor} 0%, ${createGradient(baseColor, 20)} 100%)`;

  // Determine background style
  const backgroundStyle = {
    ...rayerStyles.medHeroCard,
    backgroundImage: gradientBg,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    color: textColor,
    padding: "16px",
    marginTop: "16px",
  };

  const authUser = useStore("authUser");
  
  // If an admin is logged in, use their information for the badge (overrides .env)
  const currentAdminName = isUserAdmin(authUser) ? 
    (authUser?.adminProfile?.name || authUser?.name || authUser?.email) : 
    null;

  const badgeText =
    currentAdminName ||
    drivingSchool?.admin_name ||
    drivingSchool?.email ||
    drivingSchool?.admin_phone ||
    drivingSchool?.adminPhoneNumber ||
    "KIES INSTRUCTEUR";
  const hasAdmin = !!(
    currentAdminName ||
    drivingSchool?.admin_name ||
    drivingSchool?.email ||
    drivingSchool?.admin_phone ||
    drivingSchool?.adminPhoneNumber
  );

  return (
    <div className="med-hero-card animate-scale-in" style={backgroundStyle}>
      {/* Background Texture/Blob for depth - adjusted to not wash out light colors */}
      <div
        style={{
          ...rayerStyles.backgroundTexture,
          background: isSchoolLight
            ? "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)" // Reduced opacity
            : "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <div
        style={{
          ...rayerStyles.backgroundTextureBottom,
          background: isSchoolLight
            ? "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)" // Reduced opacity
            : "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <div style={rayerStyles.contentContainer}>
        {/* Left Content */}
        <div style={rayerStyles.leftContent}>
          <div
            className="med-hero-glass"
            style={{
              ...rayerStyles.medHeroGlass,
              ...rayerStyles.badge,
              background: badgeBg,
              color: badgeTextColor,
              border: isSchoolLight
                ? "1px solid rgba(0,0,0,0.05)"
                : "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>INSTRUCTEUR</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    background: hasAdmin ? "#4ade80" : "#94a3b8",
                    borderRadius: "50%",
                    boxShadow: hasAdmin ? `0 0 8px #4ade80` : "none",
                  }}
                ></span>
                {badgeText || (hasAdmin ? "" : "Geen Instructeur")}
              </div>
            </div>
          </div>

          <h1
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: '0',
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: '0',
            }}
          >
            {drivingSchool.name} - Expert Rijschool in Suriname
          </h1>
          <h2
            style={{
              ...rayerStyles.schoolName,
              textShadow: isSchoolLight ? "none" : "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {drivingSchool.name}
          </h2>
          <div style={rayerStyles.schoolDescription}>
            Expert Rijschool & Coaching
          </div>
        </div>

        {/* Right Avatar */}
        <div
          style={{
            ...rayerStyles.rightAvatar,
            background: isSchoolLight
              ? "rgba(255,255,255,0.6)"
              : "rgba(255,255,255,0.2)", // Glass border container
          }}
          onClick={() => f7.actions.open("#actions-contact-school")}
        >
          <img
            src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
            alt={`${drivingSchool?.name || process.env.VITE_SEO_BUSINESS_NAME || 'Rijschool'} Logo`}
            style={rayerStyles.avatarImage}
          />
        </div>
      </div>


      {/* Action Buttons */}
      <div style={rayerStyles.actionButtons}>
      {/* Edit Button - Bottom Left */}
      {isAdminStatus && (
        <div
          className="neu-btn-circle"
          style={{
            width: "45px",
            height: "45px",
          }}
          onClick={openSchoolEditSheet}
        >
          <i
            className="f7-icons"
            style={{
              fontSize: "18px",
              color: getLayout()?.colorScheme?.[0],
            }}
          >
            pencil
          </i>
        </div>
      )}
        <button
          className="button button-fill button-large button-round"
          style={{
            ...rayerStyles.contactButton,
            background: isSchoolLight ? "#1e293b" : "white", // Dark button for light cards, White for dark
            color: isSchoolLight ? "white" : baseColor,
          }}
          onClick={() => f7.actions.open("#actions-contact-school")}
        >
          Contact Opnemen
        </button>

        <button
          className="button button-large button-round"
          style={rayerStyles.shareButton}
          onClick={handleShareSchool}
        >
          <i className="f7-icons" style={{ fontSize: "18px", color: "white" }}>
            arrowshape_turn_up_right
          </i>
        </button>
      </div>
    </div>
  );
};

export default DrivingSchoolCard;
