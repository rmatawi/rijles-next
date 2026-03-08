// src/pages/SkinSelectPage.jsx
import React, { useState, useEffect } from "react";
import { Page, Navbar, Block, Button, f7, useStore } from "framework7-react";
import { isLocalHost, isSuperAdmin } from "../js/utils";

// Skin configurations
const skinConfigs = {
  default: {
    name: "Default",
    colors: ["#2196F3", "#4CAF50", "#FF9800", "#F44336", "#212121"],
    description: "Material design theme"
  },
  amelia: {
    name: "Amelia",
    colors: ["#1A73E8", "#34A853", "#FBBC05", "#EA4335", "#202124"],
    description: "Classic blue theme"
  },
  rayer: {
    name: "Rayer",
    colors: ["#FB8C00", "#34A853", "#FBBC05", "#EA4335", "#202124"],
    description: "Modern orange theme"
  }
};

const SkinSelectPage = () => {
  const authUser = useStore("authUser");
  const [selectedSkin, setSelectedSkin] = useState(null);

  useEffect(() => {
    // Load current selection from localStorage
        const currentSkin = localStorage.getItem('selectedSkin') || 'default';
    setSelectedSkin(currentSkin);
  }, []);

  const canAccess = isLocalHost() || isSuperAdmin(authUser?.email);

  if (!canAccess) {
    return null;
  }

  const handleSkinSelect = (skinKey) => {
    setSelectedSkin(skinKey);
    
    // Store selection in localStorage
    localStorage.setItem('selectedSkin', skinKey);
    
    // Apply the skin colors
    const skinConfig = skinConfigs[skinKey];
    const colors = skinConfig.colors;
    
    const root = document.documentElement;
    root.style.setProperty('--color-blue-primary', colors[0]);
    root.style.setProperty('--app-primary-color', colors[0]);
    root.style.setProperty('--app-accent-green', colors[1]);
    root.style.setProperty('--app-accent-yellow', colors[2]);
    root.style.setProperty('--app-accent-red', colors[3]);
    root.style.setProperty('--app-dark-neutral', colors[4]);
    
    // Show success message
    f7.toast.show({
      text: `Skin "${skinConfig.name}" selected!`,
      position: "center",
      closeTimeout: 2000
    });
  };

  const handleDone = () => {
    // Refresh browser and navigate back home.
    window.location.href = `${window.location.origin}/`;
  };

  return (
    <Page>
      <Navbar title="Select Skin" backLink="Back" />
      
      <Block>
        <p className="text-align-center">Select your preferred skin:</p>
      </Block>

      <div style={{ padding: "0 16px" }}>
        {Object.entries(skinConfigs).map(([key, config]) => (
          <div
            key={key}
            style={{
              marginBottom: "16px",
              padding: "16px",
              borderRadius: "12px",
              border: selectedSkin === key 
                ? `2px solid ${config.colors[0]}` 
                : "1px solid #e0e0e0",
              background: selectedSkin === key 
                ? `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`
                : "#ffffff",
              color: selectedSkin === key ? "#ffffff" : "#000000",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => handleSkinSelect(key)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`,
                  border: "2px solid rgba(255,255,255,0.3)"
                }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 700 }}>
                  {config.name}
                </h3>
                <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
                  {config.description}
                </p>
              </div>
              {selectedSkin === key && (
                <i className="f7-icons" style={{ fontSize: "24px" }}>
                  checkmark_circle_fill
                </i>
              )}
            </div>
          </div>
        ))}
      </div>

      <Block>
        <Button
          large
          fill
          style={{
            background: "linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)",
            border: "none",
            borderRadius: "12px"
          }}
          onClick={handleDone}
        >
          Done
        </Button>
      </Block>
    </Page>
  );
};

export default SkinSelectPage;
