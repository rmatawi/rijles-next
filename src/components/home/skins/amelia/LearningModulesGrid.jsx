// src/components/home/skins/default/LearningModulesGrid.jsx
// Default skin-specific LearningModulesGrid component
// Features: Classic neumorphic design with CSS classes

import { IonIcon } from "@ionic/react";
import { car, helpCircle, warning, play, school } from "ionicons/icons";
import { getLayout } from "../../../../js/utils";
import { createGradient } from "../../../../utils/colorUtils";
import { defaultStyles } from "./styles";
import useAppNavigation from "../../../../hooks/useAppNavigation";

const LearningModulesGrid = () => {
  const { navigate } = useAppNavigation();
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
      link: "/maquette",
      icon: car,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[0]} 0%, #a0cfff 100%)`,
      description: "Oefen voorrang.",
      delay: "delay-100"
    },
    {
      label: "Regels",
      link: "/qa",
      icon: helpCircle,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[1]} 0%, #b7e4c7 100%)`, 
      description: "Theorie vragen.",
      delay: "delay-200"
    },
    {
      label: "Borden",
      link: "/verkeersborden",
      icon: warning,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[2]} 0%, #ffeaa7 100%)`,
      description: "Verkeersborden.",
      delay: "delay-300"
    },
    {
      label: "Examen",
      link: "/mockexams",
      icon: school,
      iconColor: "white",
      gradient: `linear-gradient(135deg, ${colorScheme[3]} 0%, #fab1a0 100%)`,
      description: "Proefexamens.",
      delay: "delay-400"
    },
  ];

  return (
    <>
      <div className="neu-section-title" style={defaultStyles.neuSectionTitle}>Categorieën</div>
      
      <div className="neu-grid neu-grid-2" style={{ ...defaultStyles.neuGridContainer, ...defaultStyles.neuGrid2 }}>
        {learningModules.map((item, index) => (
          <div
            key={index}
            className={`neu-module animate-scale-in ${item.delay}`}
            onClick={() => navigate(item.link)}
            style={defaultStyles.neuModule}
          >
            <div
              className="neu-icon"
              style={{
                ...defaultStyles.neuIcon,
                background: item.gradient,
                color: "white",
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

            <div className="neu-module-title" style={defaultStyles.neuModuleTitle}>{item.label}</div>
            <div className="neu-module-desc" style={defaultStyles.neuModuleDesc}>{item.description}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default LearningModulesGrid;
