// src/components/home/AdditionalServicesGrid.jsx
import { IonIcon } from "@ionic/react";
import { hammer, shield } from "ionicons/icons";
import { getLayout } from "../../js/utils";

const AdditionalServicesGrid = ({ handleCardClick }) => {
  const additionalServices = [
    {
      label: "Auto Services",
      link: "/services",
      icon: hammer,
      description: "Onderhoud en reparatie.",
    },
    {
      label: "Verzekeringen",
      link: "/insurance",
      icon: shield,
      description: "Vergelijk verzekeringen.",
    },
  ];

  return (
    <>
      <div className="neu-section-title">Auto Gerelateerde Diensten</div>
      <div className="neu-grid neu-grid-2" style={{ padding: "0 16px" }}>
        {additionalServices.map((item, index) => (
          <div
            key={index}
            className="neu-module"
            onClick={() => handleCardClick(item.link)}
          >
            <div className="neu-icon" style={{ marginBottom: "12px" }}>
              <IonIcon
                icon={item.icon}
                style={{
                  fontSize: "28px",
                  color: getLayout()?.colorScheme?.[index + 1],
                }}
              />
            </div>
            <p className="neu-module-title">{item.label}</p>
            <p className="neu-module-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdditionalServicesGrid;
