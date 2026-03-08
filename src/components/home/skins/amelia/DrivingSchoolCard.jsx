// src/components/home/skins/default/DrivingSchoolCard.jsx
// Default skin-specific DrivingSchoolCard component
// Features: Classic neumorphic design with CSS classes

import { f7, useStore } from "framework7-react";
import { useEffect } from "react";
import { getLayout, isLocalhost, isUserAdmin } from "../../../../js/utils";
import { createGradient } from "../../../../utils/colorUtils";
import { defaultStyles } from "./styles";

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

  const baseColor = getLayout()?.colorScheme?.[0];
  const gradient = createGradient(baseColor, 40, "135deg");

  const authUser = useStore("authUser");
  const envDefaultInstructor =
    process.env.VITE_REACT_APP_DEFAULT_INSTRUCTOR || null;
  const localSelectedInstructorId = localStorage.getItem("selectedInstructorId");
  const localInviteAdminId = localStorage.getItem("inviteAdminId");
  const localSchoolInstructorId = drivingSchool?.id
    ? localStorage.getItem(`schoolInstructor_${drivingSchool.id}`)
    : null;

  // If an admin is logged in, use their information for the badge (overrides .env)
  const currentAdminName = isUserAdmin(authUser) ?
    (authUser?.adminProfile?.name || authUser?.name || authUser?.email) :
    null;
  const displayedInstructor =
    currentAdminName ||
    drivingSchool?.admin_name ||
    drivingSchool?.email ||
    drivingSchool?.admin_phone ||
    drivingSchool?.adminPhoneNumber ||
    "Geen Instructeur";

  useEffect(() => {
    console.log("[DrivingSchoolCard][InstructorDisplay]", {
      envDefaultInstructor,
      localStorage: {
        selectedInstructorId: localSelectedInstructorId,
        inviteAdminId: localInviteAdminId,
        schoolInstructorId: localSchoolInstructorId,
      },
      displayedInstructor,
      schoolId: drivingSchool?.id || null,
    });
  }, [
    envDefaultInstructor,
    localSelectedInstructorId,
    localInviteAdminId,
    localSchoolInstructorId,
    displayedInstructor,
    drivingSchool?.id,
  ]);

  const bgImage = drivingSchool.coverPhoto || "/placeholders/placeholder-a01.jpg";
  const gradientOverlay = `linear-gradient(180deg, ${hexToRgba(baseColor, 1)}, ${hexToRgba(baseColor, 0.7)})`;


  return (
    <div
      className="neu-card"
      style={{
        ...defaultStyles.drivingSchoolCard,
      }}
    >
      {/* Hero image */}
      <div style={{ width: "100%" }}>
        <div
          style={{
            ...defaultStyles.heroImageContainer,
            backgroundImage: `${gradientOverlay}, url(${
              bgImage
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Logo */}
          <div
            className="neu-avatar"
            style={{
              ...defaultStyles.logoContainer,
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
              ...defaultStyles.schoolName,
            }}
          >
            {drivingSchool.name}
          </h3>

          <div
            className="neu-badge"
            style={{
              position: "absolute",
              left: "10px",
              top: "10px",
              color: getLayout()?.colorScheme?.[0],
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>INSTRUCTEUR</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "#f59e0b",
                    borderRadius: "50%",
                    display: "inline-block",
                    marginRight: "6px",
                  }}
                ></span>
                {displayedInstructor}
              </div>
            </div>
          </div>

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
    </div>
  );
};

export default DrivingSchoolCard;
