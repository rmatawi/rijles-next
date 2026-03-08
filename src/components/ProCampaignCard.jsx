import React from "react";
import { hexToRgba } from "../utils/colorUtils";

const ProCampaignCard = ({
  designRef,
  title,
  subtitle,
  cta,
  features = [],
  theme = "modern",
  ratio = "1:1",
  schoolLogo,
  schoolName,
  primaryColor = "#1A73E8",
  secondaryColor = "#0d47a1",
  accentColor = "#34A853",
  brandSignature = true,
  customIcon = null,
  holidayEmoji = null,
  backgroundEmojis = [],
  maxWidth = "360px",
  height = null,
  backgroundImage = null,
  shortCode = "T5ZIrXRW",
  featurePattern = "stack",
  logoTopLeft = false,
}) => {
  const isPost = ratio === "1:1";
  const isStory = ratio === "9:16";
  const isPortrait = ratio === "4:5";

  const widthNum = parseInt(maxWidth, 10) || 360;
  const contentWidth = widthNum - (isStory ? 60 : 64);

  let heightNum = height || widthNum;
  if (!height && isStory) heightNum = Math.round((widthNum * 16) / 9);
  if (!height && isPortrait) heightNum = Math.round((widthNum * 5) / 4);

  const isMinimal = theme === "minimal";
  const cardTextColor = isMinimal ? "#1E2430" : "#FFFFFF";
  const surfaceTextColor = isMinimal ? "#222" : "#FFFFFF";
  const schoolSubtitle = "Modern Rijles | Online";
  const primaryAccentColor = isMinimal ? primaryColor : hexToRgba(primaryColor, 0.9);
  const primaryAccentSoft = isMinimal ? hexToRgba(primaryColor, 0.16) : hexToRgba(primaryColor, 0.34);

  const getFeatureGridColumn = (index, totalFeatures) => {
    if (featurePattern === "top-full") {
      return index === 0 ? "span 2" : "span 1";
    }

    if (featurePattern === "bottom-full") {
      return index === totalFeatures - 1 ? "span 2" : "span 1";
    }

    if (featurePattern === "row3") {
      // If a row3 layout has an odd last item, center it on the next row.
      if (totalFeatures % 2 === 1 && index === totalFeatures - 1) {
        return "span 2";
      }
      return "span 1";
    }

    return "span 2";
  };

  const containerStyle = {
    width: `${widthNum}px`,
    height: `${heightNum}px`,
    backgroundColor: isMinimal ? "#ffffff" : primaryColor,
    backgroundImage: backgroundImage
      ? `linear-gradient(165deg, ${hexToRgba(primaryColor, 0.52)} 0%, ${hexToRgba(primaryColor, 0.2)} 34%, transparent 60%), linear-gradient(180deg, rgba(8,12,20,0.06) 0%, rgba(8,12,20,0.64) 90%), url('${backgroundImage}')`
      : isMinimal
        ? "linear-gradient(180deg, #ffffff 0%, #f6f8fd 100%)"
        : `linear-gradient(150deg, ${hexToRgba(primaryColor, 0.98)} 0%, ${hexToRgba(secondaryColor, 0.9)} 58%, ${hexToRgba(accentColor, 0.74)} 100%)`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center",
    borderRadius: "24px",
    padding: isStory ? "40px 30px" : "26px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.1)",
    fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif",
    color: cardTextColor,
    border: isMinimal
      ? "2px solid rgba(240,240,245,0.95)"
      : "1px solid rgba(255,255,255,0.14)",
    boxSizing: "border-box",
    isolation: "isolate",
  };

  const headerWidthStyle = {
    width: `${contentWidth}px`,
    boxSizing: "border-box",
    zIndex: 2,
  };

  const glassStyle = {
    background: isMinimal
      ? "rgba(255,255,255,0.92)"
      : "linear-gradient(180deg, rgba(7,13,25,0.66), rgba(7,13,25,0.52))",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRadius: "20px",
    padding: "12px",
    width: `${contentWidth}px`,
    border: isMinimal
      ? "1px solid rgba(0,0,0,0.06)"
      : "1px solid rgba(255,255,255,0.34)",
    boxShadow: isMinimal
      ? "0 12px 28px rgba(12,25,60,0.08)"
      : "0 12px 34px rgba(0,0,0,0.16)",
    zIndex: 1,
    boxSizing: "border-box",
  };

  const logoStyle = {
    width: "68px",
    height: "68px",
    borderRadius: "22px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    boxShadow: "0 10px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.85)",
    overflow: "hidden",
    padding: "7px",
    boxSizing: "border-box",
  };

  const brandBlockStyle = {
    ...headerWidthStyle,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: isMinimal ? 0 : "8px 10px",
    borderRadius: isMinimal ? 0 : "16px",
    background: isMinimal ? "transparent" : "rgba(7,12,24,0.4)",
    border: isMinimal
      ? `1px solid ${hexToRgba(primaryColor, 0.18)}`
      : `1px solid ${hexToRgba(primaryColor, 0.34)}`,
    boxShadow: isMinimal
      ? "none"
      : `0 0 0 1px ${hexToRgba(primaryColor, 0.1)} inset, 0 10px 26px rgba(5,10,24,0.22)`,
  };

  const brandTitleStyle = {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.2px",
    lineHeight: 1.2,
    color: isMinimal ? "#1E2430" : "#FFFFFF",
    textShadow: isMinimal ? "none" : "0 2px 10px rgba(0,0,0,0.26)",
  };

  const brandSubtitleStyle = {
    margin: "4px 0 0 0",
    fontSize: "11px",
    fontWeight: "700",
    lineHeight: 1.25,
    color: isMinimal ? "rgba(30,36,48,0.82)" : "rgba(255,255,255,0.94)",
    textShadow: isMinimal ? "none" : `0 1px 8px ${hexToRgba(primaryColor, 0.24)}`,
  };

  return (
    <div
      ref={designRef}
      className="campaign-export-card campaign-export-card--pro"
      style={containerStyle}
    >
      {!isMinimal && (
        <>
          <div
            style={{
              position: "absolute",
              inset: "9px",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.16)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 18% 18%, ${hexToRgba(primaryColor, 0.26)} 0%, transparent 36%)`,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 84% 90%, ${hexToRgba(accentColor, 0.26)} 0%, transparent 42%)`,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 16%, rgba(255,255,255,0.16), transparent 48%), linear-gradient(180deg, rgba(4,9,20,0) 52%, rgba(4,9,20,0.28) 100%)",
              zIndex: 0,
            }}
          />
          {backgroundEmojis.map((item, index) => {
            const isString = typeof item === "string";
            const emoji = isString ? item : item?.emoji;
            if (!emoji) return null;
            const rawSize = isString ? "44px" : item.size || "44px";
            const numericSize = Number.parseFloat(rawSize);
            const sizeUnit = String(rawSize).replace(String(numericSize), "") || "px";
            const doubledSize = Number.isFinite(numericSize)
              ? `${numericSize * 2}${sizeUnit}`
              : rawSize;
            return (
              <div
                key={`${emoji}-${index}`}
                style={{
                  position: "absolute",
                  top: isString ? undefined : item.top,
                  right: isString ? undefined : item.right,
                  bottom: isString ? undefined : item.bottom,
                  left: isString ? undefined : item.left,
                  transform: isString
                    ? undefined
                    : item.transform || "none",
                  fontSize: doubledSize,
                  opacity: isString ? 0.16 : item.opacity ?? 0.16,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                {emoji}
              </div>
            );
          })}
        </>
      )}

      {logoTopLeft && brandSignature && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 3,
          }}
        >
          <div style={{ ...logoStyle, width: "56px", height: "56px", borderRadius: "16px" }}>
            <img
              src={schoolLogo}
              alt={`${schoolName || process.env.VITE_SEO_BUSINESS_NAME || "Rijschool"} logo`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}

      {!logoTopLeft && (
        <div style={brandBlockStyle}>
          {brandSignature && (
            <>
              <div style={logoStyle}>
                <img
                  src={schoolLogo}
                  alt={`${schoolName || process.env.VITE_SEO_BUSINESS_NAME || "Rijschool"} logo`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={brandTitleStyle}>{schoolName}</p>
                <p style={brandSubtitleStyle}>{schoolSubtitle}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div
        style={{
          ...headerWidthStyle,
          textAlign: "center",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: isMinimal ? 0 : "10px 10px 8px",
          borderRadius: isMinimal ? 0 : "16px",
          background: isMinimal
            ? "transparent"
            : "linear-gradient(180deg, rgba(7,12,24,0.02), rgba(7,12,24,0.18))",
        }}
      >
        {(customIcon || holidayEmoji) && (
          <div style={{ fontSize: "34px", marginBottom: "6px" }}>
            {customIcon || holidayEmoji}
          </div>
        )}

        <h1
          style={{
            fontSize: isStory ? "30px" : "24px",
            fontWeight: "900",
            margin: "0 0 8px 0",
            lineHeight: "1.08",
            letterSpacing: "-0.3px",
            color: cardTextColor,
            textShadow: isMinimal
              ? "0 1px 0 rgba(255,255,255,0.45)"
              : `0 6px 16px rgba(0,0,0,0.34), 0 0 18px ${hexToRgba(primaryColor, 0.26)}`,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            width: "84px",
            height: "4px",
            borderRadius: "999px",
            margin: "0 auto 10px",
            background: `linear-gradient(90deg, ${primaryAccentColor}, ${hexToRgba(accentColor, 0.9)})`,
            boxShadow: `0 0 0 1px ${hexToRgba(primaryColor, 0.12)} inset, 0 3px 10px ${hexToRgba(primaryColor, 0.28)}`,
          }}
        />

        {subtitle && (
          <p
            style={{
              fontSize: "13px",
              opacity: 0.98,
              color: isMinimal ? "rgba(30,36,48,0.86)" : "rgba(255,255,255,0.96)",
              margin: "0 0 12px 0",
              fontWeight: "600",
              lineHeight: 1.35,
              textShadow: isMinimal ? "none" : "0 3px 8px rgba(0,0,0,0.28)",
            }}
          >
            {subtitle}
          </p>
        )}

        {features.length > 0 && (
          <div style={glassStyle}>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                textAlign: "left",
                display: featurePattern === "stack" ? "flex" : "grid",
                gridTemplateColumns: featurePattern === "stack" ? undefined : "1fr 1fr",
                flexDirection: featurePattern === "stack" ? "column" : undefined,
                gap: "6px",
              }}
            >
              {features.map((feature, index) => {
                const isBottomCenteredItem =
                  featurePattern === "bottom-full" &&
                  index === features.length - 1;
                const isRow3CenteredItem =
                  featurePattern === "row3" &&
                  features.length % 2 === 1 &&
                  index === features.length - 1;
                const isCenteredSingleItem =
                  isBottomCenteredItem || isRow3CenteredItem;

                return (
                <li
                  key={index}
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: surfaceTextColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "10px",
                    background: isMinimal
                      ? "rgba(246,248,253,0.95)"
                      : "rgba(6,12,24,0.42)",
                    border: isMinimal
                      ? "1px solid rgba(0,0,0,0.04)"
                      : `1px solid ${hexToRgba(primaryColor, 0.34)}`,
                    boxShadow: isMinimal ? "none" : `0 0 0 1px ${hexToRgba(primaryColor, 0.14)} inset`,
                    gridColumn:
                      featurePattern === "stack"
                        ? undefined
                        : getFeatureGridColumn(index, features.length),
                    justifySelf: isCenteredSingleItem ? "center" : undefined,
                    width: isCenteredSingleItem ? "calc(50% - 3px)" : undefined,
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "999px",
                      fontSize: "14px",
                      background: isMinimal
                        ? `${hexToRgba(primaryColor, 0.16)}`
                        : `linear-gradient(145deg, ${primaryAccentSoft} 0%, ${hexToRgba(accentColor, 0.26)} 100%)`,
                      border: `1px solid ${hexToRgba(primaryColor, 0.34)}`,
                      flexShrink: 0,
                    }}
                  >
                    {feature.icon || "*"}
                  </span>
                  <span
                    style={{
                      lineHeight: 1.25,
                      textShadow: isMinimal ? "none" : "0 2px 6px rgba(0,0,0,0.28)",
                    }}
                  >
                    {feature.text}
                  </span>
                </li>
                );
              })}
            </ul>
          </div>
        )}

        {cta && (
          <div
            style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.2px",
              color: "#FFFFFF",
              background: `linear-gradient(135deg, ${primaryAccentColor} 0%, ${hexToRgba(accentColor, 0.96)} 100%)`,
              border: `1px solid ${hexToRgba(primaryColor, 0.32)}`,
              boxShadow: `0 8px 18px ${hexToRgba(primaryColor, 0.3)}`,
              textTransform: "uppercase",
            }}
          >
            {cta}
          </div>
        )}
      </div>


    </div>
  );
};

export default ProCampaignCard;

