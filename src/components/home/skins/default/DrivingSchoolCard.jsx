// src/components/home/skins/default/DrivingSchoolCard.jsx
// Default skin-specific DrivingSchoolCard component
// Features: Classic neumorphic design with CSS classes

import { CardContent, f7, useStore } from "framework7-react";
import { getLayout, isLocalhost, isUserAdmin } from "../../../../js/utils";
import { createGradient } from "../../../../utils/colorUtils";
import { defaultStyles } from "./styles";

const DrivingSchoolCard = ({
  drivingSchool,
  isAdminStatus,
  openSchoolEditSheet,
  handleShareSchool,
}) => {
  if (!drivingSchool) return null;

  const baseColor = getLayout()?.colorScheme?.[0];
  const gradient = createGradient(baseColor, 40, "135deg");

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
    "Geen Instructeur";
  const hasAdmin = !!(
    currentAdminName ||
    drivingSchool?.admin_name ||
    drivingSchool?.email ||
    drivingSchool?.admin_phone ||
    drivingSchool?.adminPhoneNumber
  );

  return (
    <div
      className="neu-card"
      style={{
        ...defaultStyles.drivingSchoolCard
      }}
    >
      {/* With hero image */}
      {getLayout()?.hero_image && (
        <div style={{ width: "100%" }}>
          <div
            style={{
              ...defaultStyles.heroImageContainer,
              backgroundImage: `url(${
                drivingSchool.coverPhoto || "/placeholders/placeholder-a01.jpg"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
        >

            {/* Admin Selection Badge */}
            <div
              className="neu-badge"
              style={{
                position: "absolute",
                left: "10px",
                top: "10px",
                color: getLayout()?.colorScheme?.[0],
                color: getLayout()?.colorScheme?.[0],
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>INSTRUCTEUR</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      background: hasAdmin ? "#4ade80" : "#f59e0b",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "6px",
                      boxShadow: hasAdmin ? "0 0 8px #4ade80" : "none",
                    }}
                  ></span>
                  {badgeText}
                </div>
              </div>
            </div>

            {/* Logo */}
            <div
              className="neu-avatar"
              style={{
                ...defaultStyles.logoContainer
              }}
              onClick={() => f7.actions.open("#actions-contact-school")}
            >
              <img
                src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
                alt={`${drivingSchool?.name || process.env.VITE_SEO_BUSINESS_NAME || 'Rijschool'} Logo`}
                style={{
                  ...defaultStyles.neuAvatarImage,
                  transform: "scale(1.4)",
                }}
              />
            </div>

            {/* School Name */}
            <h3
              className="neu-text-primary"
              style={{
                ...defaultStyles.schoolName
              }}
            >
              {drivingSchool.name}
            </h3>

            {/* Phone Number */}
            {drivingSchool?.adminPhoneNumber && (
              <div
                className="neu-btn-circle"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "10px",
                  width: "40px",
                  height: "40px",
                  transform: "translateX(-50%)",
                }}
                onClick={() => f7.actions.open("#actions-contact-school")}
              >
                <i
                  className="f7-icons"
                  style={{
                    fontSize: "22px",
                    color: getLayout()?.colorScheme?.[0],
                  }}
                >
                  chat_bubble
                </i>
              </div>
            )}

            {/* Edit Button - Bottom Left */}
            {isAdminStatus && (
              <div
                className="neu-btn-circle"
                style={{
                  position: "absolute",
                  left: "10px",
                  bottom: "10px",
                  width: "40px",
                  height: "40px",
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

            {/* Missing Phone Warning */}
            {!drivingSchool?.adminPhoneNumber && (
              <div
                className="neu-badge"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: "10px",
                  color: getLayout()?.colorScheme?.[0],
                  cursor: "pointer",
                }}
                onClick={openSchoolEditSheet}
              >
                <i
                  className="f7-icons"
                  style={{ fontSize: "12px", marginRight: "4px" }}
                >
                  exclamationmark_triangle_fill
                </i>
                Missing: Phone number
              </div>
            )}

            {/* Share Button - Bottom Right */}
            <div
              className="neu-btn-circle"
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                width: "40px",
                height: "40px",
                background: gradient,
              }}
              onClick={handleShareSchool}
            >
              <i
                className="f7-icons"
                style={{ fontSize: "18px", color: "white" }}
              >
                arrowshape_turn_up_right
              </i>
            </div>
          </div>
        </div>
      )}

      {/* No hero image */}
      {!getLayout()?.hero_image && (
        <div style={{ marginTop: "60px" }}>
          <CardContent
            className="neu-content-bak"
            style={{
              textAlign: "center",
              padding: "20px 16px",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* Admin Selection Badge (Non-hero version) */}
            <div
              className="neu-badge"
              style={{
                position: "absolute",
                left: "10px",
                top: "10px",
                color: getLayout()?.colorScheme?.[0],
                color: getLayout()?.colorScheme?.[0],
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "600",
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>INSTRUCTEUR</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      background: hasAdmin ? "#4ade80" : "#f59e0b",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "6px",
                    }}
                  ></span>
                  {badgeText}
                </div>
              </div>
            </div>

            {/* Logo */}
            <div
              className="neu-avatar"
              style={{
                width: "100px",
                height: "100px",
                position: "absolute",
                top: "-50px",
                left: "50%",
                transform: "translateX(-50%)",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onClick={() => f7.actions.open("#actions-contact-school")}
            >
              <img
                src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
                alt={`${drivingSchool?.name || process.env.VITE_SEO_BUSINESS_NAME || 'Rijschool'} Logo`}
                style={{
                  ...defaultStyles.neuAvatarImage,
                  transform: "scale(1.4)",
                }}
              />
            </div>

            {/* School Name */}
            <h3
              className="neu-text-primary"
              style={{
                marginTop: "60px",
                marginBottom: "50px",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              {drivingSchool.name}
            </h3>

            {/* Phone Number / Contact Button */}
            {drivingSchool?.adminPhoneNumber && (
              <div
                className="neu-btn-circle"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "10px",
                  width: "40px",
                  height: "40px",
                  transform: "translateX(-50%)",
                }}
                onClick={() => f7.actions.open("#actions-contact-school")}
              >
                <i
                  className="f7-icons"
                  style={{
                    fontSize: "22px",
                    color: getLayout()?.colorScheme?.[0],
                  }}
                >
                  chat_bubble
                </i>
              </div>
            )}

            {/* Edit Button - Bottom Left */}
            <div
              className="neu-btn-circle"
              style={{
                position: "absolute",
                left: "10px",
                bottom: "10px",
                width: "40px",
                height: "40px",
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

            {/* Missing Phone Warning */}
            {!drivingSchool?.adminPhoneNumber && (
              <div
                className="neu-badge"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: "10px",
                  color: getLayout()?.colorScheme?.[0],
                  cursor: "pointer",
                }}
                onClick={openSchoolEditSheet}
              >
                <i
                  className="f7-icons"
                  style={{ fontSize: "12px", marginRight: "4px" }}
                >
                  exclamationmark_triangle_fill
                </i>
                Missing: Phone number
              </div>
            )}

            {/* Share Button - Bottom Right */}
            <div
              className="neu-btn-circle"
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                width: "40px",
                height: "40px",
                background: gradient,
              }}
              onClick={handleShareSchool}
            >
              <i
                className="f7-icons"
                style={{ fontSize: "18px", color: "white" }}
              >
                arrowshape_turn_up_right
              </i>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
};

export default DrivingSchoolCard;
