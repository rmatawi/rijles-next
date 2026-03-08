// src/components/home/skins/rayer/LearningModulesGrid.jsx
// Rayer skin-specific LearningModulesGrid component
// Features: Modern medical UI design with glass effects and subtle gradients

import { f7 } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { car, helpCircle, warning, play, school } from "ionicons/icons";
import { getLayout } from "../../../../js/utils";
import { createGradient } from "../../../../utils/colorUtils";
import { rayerStyles } from "./styles";

const LearningModulesGrid = () => {
  const layout = getLayout();
  const colorScheme = layout?.colorScheme || [
    "#1A73E8", // Primary Blue
    "#34A853", // Accent Green
    "#FBBC05", // Warm Yellow
    "#EA4335", // Alert Red
    "#202124", // Dark Neutral
  ];

  const learningModules = [
    {
      label: "Maquettes",
      link: "/?page=maquette",
      icon: car,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[0]} 0%, #a0cfff 100%)`,
      description: "Oefen voorrang.",
      delay: "delay-100"
    },
    {
      label: "Regels",
      link: "/?page=qa",
      icon: helpCircle,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[1]} 0%, #b7e4c7 100%)`, 
      description: "Theorie vragen.",
      delay: "delay-200"
    },
    {
      label: "Borden",
      link: "/?page=verkeersborden",
      icon: warning,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[2]} 0%, #ffeaa7 100%)`,
      description: "Verkeersborden.",
      delay: "delay-300"
    },
    {
      label: "Examen",
      link: "/?page=mockexams",
      icon: school,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[3]} 0%, #fab1a0 100%)`,
      description: "Proefexamens.",
      delay: "delay-400"
    },
  ];

  return (
    <>
      <div className="med-section-header" style={rayerStyles.sectionHeader}>
        <div className="med-title">Categorieën</div>
      </div>
      
      <div style={rayerStyles.modulesGrid}>
        
        {learningModules.map((item, index) => (
          <div
            key={index}
            className={`animate-scale-in ${item.delay}`}
            onClick={() => f7.views.main.router.navigate(item.link)}
            style={rayerStyles.moduleItem}
          >
            <div
              className="med-icon-squircle"
              style={{
                ...rayerStyles.medIconSquircle,
                color: layout?.colorScheme?.[index % 5] || "#3b82f6",
                marginBottom: "12px",
                position: "relative"
              }}
            >
              <IonIcon icon={item.icon} style={{ fontSize: "34px" }} />
              
              {/* Subtle indicator dot for "active" feeling */}
              {index === 0 && (
                <div style={{
                  position: "absolute",
                  top: "18px",
                  right: "18px",
                  width: "8px",
                  height: "8px",
                  background: "#ef4444",
                  borderRadius: "50%",
                  border: "2px solid white"
                }} />
              )}
            </div>

            <div style={rayerStyles.moduleTitle}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default LearningModulesGrid;
