import React from 'react';
import { List, ListItem, Block, BlockTitle } from 'framework7-react';
import { value } from 'dom7';

const skinConfigs = {
  amelia: {
    name: "Amelia",
    value: "amelia",
    colors: ["#1A73E8", "#34A853", "#FBBC05", "#EA4335", "#202124"], // Blue primary
    description: "Classic blue theme"
  },
  default: {
    name: "Default",
    value: "default",
    colors: ["#2196F3", "#4CAF50", "#FF9800", "#F44336", "#212121"], // Material blue
    description: "Material design theme"
  },
  rayer: {
    name: "Rayer",
    value: "rayer",
    colors: ["#FB8C00", "#34A853", "#FBBC05", "#EA4335", "#202124"], // Orange primary
    description: "Modern orange theme"
  }
};

const SkinSelector = ({ selectedSkin, onSkinChange }) => {
  const handleSkinChange = (skinKey) => {
    onSkinChange(skinKey);
    // Apply colors immediately
    const colors = skinConfigs[skinKey].colors;
    const root = document.documentElement;
    root.style.setProperty('--color-blue-primary', colors[0]);
    root.style.setProperty('--app-primary-color', colors[0]);
    root.style.setProperty('--app-accent-green', colors[1]);
    root.style.setProperty('--app-accent-yellow', colors[2]);
    root.style.setProperty('--app-accent-red', colors[3]);
    root.style.setProperty('--app-dark-neutral', colors[4]);
    // Save to localStorage
    localStorage.setItem('selectedSkin', skinKey);
  };

  return (
    <Block>
      <BlockTitle>Skin Selector</BlockTitle>
      <List>
        {Object.entries(skinConfigs).map(([key, config]) => (
          <ListItem
            key={key}
            radio
            name="skin-radio"
            value={config.value}
            title={config.name}
            subtitle={config.description}
            checked={selectedSkin === key}
            onChange={() => handleSkinChange(key)}
          >
            <div slot="media" style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: config.colors[0],
              marginRight: '10px'
            }}></div>
          </ListItem>
        ))}
      </List>
    </Block>
  );
};

export default SkinSelector;
