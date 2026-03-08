// src/components/home/LearningModulesGrid.jsx
import { f7 } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { car, helpCircle, warning, play, school } from "ionicons/icons";
import { getLayout } from "../../js/utils";
import { createGradient } from "../../utils/colorUtils";

const LearningModulesGrid = () => {
  const layout = getLayout();
  const colorScheme = layout?.colorScheme || [
    "#1A73E8", // Primary Blue (fallback)
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
      iconColor: colorScheme[0],
      gradient: createGradient(colorScheme[0], 40, "135deg"),
      description: "Oefen voorrangssituaties met interactieve maquettes.",
    },
    {
      label: "Regels",
      link: "/?page=qa",
      icon: helpCircle,
      iconColor: colorScheme[1],
      gradient: createGradient(colorScheme[1], 40, "135deg"),
      description: "Bereid je voor op het theorie-examen met oefenvragen.",
    },
    {
      label: "Borden",
      link: "/?page=verkeersborden",
      icon: warning,
      iconColor: colorScheme[2],
      gradient: createGradient(colorScheme[2], 40, "135deg"),
      description: "Leer alle verkeersborden en hun betekenis.",
    },
    {
      label: "Examen",
      link: "/?page=mockexams",
      icon: school,
      iconColor: colorScheme[3],
      gradient: createGradient(colorScheme[3], 40, "135deg"),
      description: "Maak een proefexamen om jezelf te testen.",
    },
  ];

  return (
    <>
      <div className="neu-section-title">Leermodules</div>
      <div className="neu-grid neu-grid-2" style={{ padding: "0 16px" }}>
        {learningModules.map((item, index) => (
          <div
            key={index}
            className="neu-module"
            onClick={() => f7.views.main.router.navigate(item.link)}
            style={{ position: "relative", overflow: "hidden" }}
          >
            {/* Gradient accent bar at top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: item.gradient,
                borderRadius: "20px 20px 0 0",
              }}
            />
            <div
              className="neu-icon"
              style={{
                marginBottom: "12px",
                marginTop: "8px",
              }}
            >
              <IonIcon
                icon={item.icon}
                style={{
                  fontSize: "32px",
                  color: item.iconColor,
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

export default LearningModulesGrid;
