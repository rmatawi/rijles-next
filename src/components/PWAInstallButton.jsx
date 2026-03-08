// src/components/PWAInstallButton.jsx
// Reusable PWA install button component

import React from 'react';
import { Button, f7 } from 'framework7-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * PWA Install Button Component
 * Shows an install button when the app can be installed
 * Handles both Android/Chrome (prompt) and iOS (instructions)
 */
const PWAInstallButton = ({
  fill = true,
  large = false,
  round = false,
  outline = false,
  color = 'blue',
  className = '',
  style = {},
  text = 'Installeer App',
  iconMaterial = 'download',
  showIcon = true,
}) => {
  const {
    promptInstall,
    canInstall,
    isInstalled,
    isIOS
  } = usePWAInstall();

  // Don't show button if already installed or can't install
  if (isInstalled || !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS installation instructions
      f7.dialog.alert(
        `<div style="text-align: left; padding: 10px;">
          <p><strong>Installeer de app op je iPhone/iPad:</strong></p>
          <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
            <em>Install de app on your iPhone/iPad:</em>
          </p>
          <ol style="padding-left: 20px;">
            <li>Tik op het <strong>Deel</strong> icoon <span style="font-size: 20px;">⎙</span> in Safari<br>
                <span style="font-size: 13px; color: #666;">
                  <em>(Tap the <strong>Share</strong> icon in Safari)</em>
                </span>
            </li>
            <li style="margin-top: 8px;">
              Scroll naar beneden en tik op <strong>"Zet op beginscherm"</strong><br>
              <span style="font-size: 13px; color: #666;">
                <em>(Scroll down and tap <strong>"Add to Home Screen"</strong>)</em>
              </span>
            </li>
            <li style="margin-top: 8px;">
              Tik op <strong>"Voeg toe"</strong> rechtsboven<br>
              <span style="font-size: 13px; color: #666;">
                <em>(Tap <strong>"Add"</strong> in the top right)</em>
              </span>
            </li>
          </ol>
          <p style="margin-top: 15px; color: #666; font-size: 14px;">
            De app verschijnt dan als icoon op je beginscherm en werkt ook offline!<br>
            <em style="font-size: 13px;">The app will appear as an icon on your home screen and works offline!</em>
          </p>
        </div>`,
        'Installeer als App'
      );
    } else {
      // Trigger install prompt for Android/Chrome
      const result = await promptInstall();

      if (result.success && result.outcome === 'accepted') {
        f7.toast.show({
          text: '✅ App wordt geïnstalleerd...',
          position: 'center',
          closeTimeout: 2000,
        });
      } else if (result.outcome === 'dismissed') {
        f7.toast.show({
          text: 'Installatie geannuleerd',
          position: 'center',
          closeTimeout: 2000,
        });
      }
    }
  };

  return (
    <Button
      fill={fill}
      large={large}
      round={round}
      outline={outline}
      color={color}
      className={className}
      style={style}
      onClick={handleInstall}
      iconMaterial={showIcon ? iconMaterial : undefined}
    >
      {text}
    </Button>
  );
};

export default PWAInstallButton;
