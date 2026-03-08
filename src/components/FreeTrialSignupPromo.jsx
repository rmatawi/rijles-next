import React from "react";
import { f7 } from "framework7-react";
import { getLayout } from "../js/utils";

const FreeTrialSignupPromo = ({
  title = "Probeer 1 Dag Gratis!",
  description = "Start vandaag met leren voor je rijexamen. Krijg direct toegang tot alle verkeersborden en meer.",
  buttonText = "Begin Gratis Proefdag",
  onButtonClick = () => f7.views.main.router.navigate("/free-trial-signup/")
}) => {
  const colorScheme = getLayout()?.colorScheme;
  // Use the first and third colors from the env color scheme for the gradient (like CampaignPage)
  const envGradientColor1 = colorScheme?.[0] || "#667eea";
  const envGradientColor2 = colorScheme?.[2] || colorScheme?.[1] || "#764ba2";

  return (
    <div
      className="neu-card"
      style={{
        padding: "24px",
        textAlign: "center",
        background: `linear-gradient(135deg, ${envGradientColor1} 0%, ${envGradientColor2} 100%)`,
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <i className="f7-icons" style={{ fontSize: "48px", color: "#fff" }}>
          gift_fill
        </i>
      </div>
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "24px",
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.9)",
        }}
      >
        {description}
      </p>
      <div
        className="neu-btn"
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 600,
          background: "#fff",
          color: envGradientColor1,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
        }}
        onClick={onButtonClick}
      >
        <i className="f7-icons" style={{ fontSize: "20px" }}>
          arrow_right_circle_fill
        </i>
        {buttonText}
      </div>
    </div>
  );
};

export default FreeTrialSignupPromo;