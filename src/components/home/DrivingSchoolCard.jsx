// src/components/home/DrivingSchoolCard.jsx
import { CardContent, f7 } from "framework7-react";
import { getLayout, isLocalhost } from "../../js/utils";
import { createGradient } from "../../utils/colorUtils";

const DrivingSchoolCard = ({
  drivingSchool,
  isAdminStatus,
  openSchoolEditSheet,
  handleShareSchool,
}) => {
  if (!drivingSchool) return null;

  const baseColor = getLayout()?.colorScheme?.[0];
  const gradient = createGradient(baseColor, 40, "135deg");

  return (
    <div
      className="neu-card"
      style={{
        margin: "16px",
        padding: "0",
        marginTop: "80px",
        overflow: "visible",
      }}
    >
      {/* With hero image */}
      {getLayout()?.hero_image && (
        <div style={{ width: "100%" }}>
          <div
            style={{
              height: "180px",
              backgroundImage: `url(${
                drivingSchool.coverPhoto || "/placeholders/placeholder-a01.jpg"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              textAlign: "center",
              padding: "20px 16px",
              position: "relative",
              borderRadius: "10px",
            }}
          >
            {/* Logo */}
            <div
              className="neu-avatar"
              style={{
                width: "120px",
                height: "120px",
                position: "relative",
                top: "-80px",
                left: "50%",
                transform: "translateX(-50%)",
                overflow: "hidden",
              }}
              onClick={() => f7.actions.open("#actions-contact-school")}
            >
              <img
                src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
                alt={`${drivingSchool?.name || process.env.VITE_SEO_BUSINESS_NAME || 'Rijschool'} Logo`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scale(1.4)",
                }}
              />
            </div>

            {/* School Name */}
            <h3
              className="neu-text-primary"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                position: "absolute",
                bottom: "40px",
                left: "50%",
                transform: "translate(-50%, 0%)",
                color: "white",
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
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
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
