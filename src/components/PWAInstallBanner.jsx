// src/components/PWAInstallBanner.jsx
// Banner notification to prompt PWA installation

import React, { useState, useEffect } from 'react';
import { Block, Button, Link, f7 } from 'framework7-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * PWA Install Banner Component
 * Shows a dismissible banner prompting users to install the app
 */
const PWAInstallBanner = ({
  position = 'top', // 'top' or 'bottom'
  autoShowDelay = 5000, // Show banner after 5 seconds
  persistDismissal = true, // Remember if user dismissed
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    promptInstall,
    canInstall,
    isInstalled,
    isIOS,
  } = usePWAInstall();

  useEffect(() => {
    // Check if user previously dismissed the banner
    if (persistDismissal) {
      const wasDismissed = localStorage.getItem('pwa_install_banner_dismissed');
      if (wasDismissed === 'true') {
        setDismissed(true);
        return;
      }
    }

    // Show banner after delay if app can be installed
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, autoShowDelay, persistDismissal]);

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
      // Trigger install prompt
      const result = await promptInstall();

      if (result.success && result.outcome === 'accepted') {
        setVisible(false);
        f7.toast.show({
          text: '✅ App wordt geïnstalleerd...',
          position: 'center',
          closeTimeout: 2000,
        });
      }
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);

    if (persistDismissal) {
      localStorage.setItem('pwa_install_banner_dismissed', 'true');
    }
  };

  // Don't render if not visible, dismissed, already installed, or can't install
  if (!visible || dismissed || isInstalled || !canInstall) {
    return null;
  }

  const bannerStyle = {
    position: 'fixed',
    [position]: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    margin: 0,
    padding: '12px 16px',
    backgroundColor: 'var(--app-primary-color)',
    color: 'white',
    boxShadow: position === 'top'
      ? '0 2px 8px rgba(0, 0, 0, 0.2)'
      : '0 -2px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    animation: position === 'top'
      ? 'slideInDown 0.3s ease-out'
      : 'slideInUp 0.3s ease-out',
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const iconStyle = {
    fontSize: '24px',
    flexShrink: 0,
  };

  const textContainerStyle = {
    flex: 1,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '15px',
    fontWeight: 'bold',
  };

  const descriptionStyle = {
    margin: '2px 0 0 0',
    fontSize: '13px',
    opacity: 0.9,
  };

  const buttonsStyle = {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pwa-install-button {
          background: white !important;
          color: var(--app-primary-color) !important;
          font-weight: bold;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
        }

        .pwa-dismiss-button {
          color: white;
          opacity: 0.8;
          font-size: 24px;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwa-dismiss-button:hover {
          opacity: 1;
        }
      `}</style>

      <div style={bannerStyle}>
        <div style={contentStyle}>
          <div style={iconStyle}>📱</div>
          <div style={textContainerStyle}>
            <p style={titleStyle}>Installeer App</p>
            <p style={descriptionStyle}>
              {isIOS
                ? 'Gebruik de app ook offline!'
                : 'Snellere toegang en offline beschikbaar'}
            </p>
          </div>
        </div>

        <div style={buttonsStyle}>
          <Button
            className="pwa-install-button"
            onClick={handleInstall}
          >
            Installeer
          </Button>
          <Link
            className="pwa-dismiss-button"
            onClick={handleDismiss}
          >
            ✕
          </Link>
        </div>
      </div>
    </>
  );
};

export default PWAInstallBanner;
