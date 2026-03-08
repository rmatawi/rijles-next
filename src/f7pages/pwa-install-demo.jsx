// src/pages/pwa-install-demo.jsx
// Demo page showing PWA install functionality

import React from 'react';
import {
  Page,
  Navbar,
  Block,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  BlockTitle,
} from 'framework7-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import PWAInstallButton from '../components/PWAInstallButton';
import PWAInstallBanner from '../components/PWAInstallBanner';

const PWAInstallDemo = () => {
  const {
    canInstall,
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
  } = usePWAInstall();

  return (
    <Page>
      <Navbar title="PWA Install Demo" backLink="Back" />

      {/* Install Banner Demo */}
      <PWAInstallBanner position="top" autoShowDelay={2000} />

      <Block>
        {/* Status Card */}
        <Card>
          <CardHeader>PWA Installation Status</CardHeader>
          <CardContent>
            <List>
              <ListItem
                title="Can Install"
                after={canInstall ? '✅ Yes' : '❌ No'}
              />
              <ListItem
                title="Install Prompt Available"
                after={isInstallable ? '✅ Yes' : '❌ No'}
              />
              <ListItem
                title="Already Installed"
                after={isInstalled ? '✅ Yes' : '❌ No'}
              />
              <ListItem
                title="Running as PWA"
                after={isStandalone ? '✅ Yes' : '❌ No'}
              />
              <ListItem
                title="iOS Device"
                after={isIOS ? '✅ Yes' : '❌ No'}
              />
            </List>
          </CardContent>
        </Card>

        {/* Install Button Examples */}
        <BlockTitle>Install Button Examples</BlockTitle>

        <Card>
          <CardHeader>Default Button</CardHeader>
          <CardContent>
            <PWAInstallButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Large Outline Button</CardHeader>
          <CardContent>
            <PWAInstallButton
              large
              outline
              text="Download App"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Round Button (No Icon)</CardHeader>
          <CardContent>
            <PWAInstallButton
              round
              color="green"
              showIcon={false}
              text="Get the App"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Custom Styled Button</CardHeader>
          <CardContent>
            <PWAInstallButton
              fill
              large
              round
              color="orange"
              text="Installeer App"
              iconMaterial="get_app"
              style={{ width: '100%' }}
            />
          </CardContent>
        </Card>

        {/* Information */}
        <Card>
          <CardHeader>How It Works</CardHeader>
          <CardContent>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>Android / Chrome:</strong></p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Click the install button</li>
                <li>Browser shows native install prompt</li>
                <li>Accept to install as app</li>
                <li>App icon appears on home screen</li>
              </ul>

              <p style={{ marginTop: '15px' }}><strong>iOS / Safari:</strong></p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Click the install button</li>
                <li>Bilingual instructions appear (iOS doesn't support auto-install)</li>
                <li>Follow steps in Dutch or English</li>
                <li>Uses Safari's "Add to Home Screen" / "Zet op beginscherm" feature</li>
              </ul>

              <p style={{ marginTop: '15px' }}><strong>Features:</strong></p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Works offline with cached data</li>
                <li>Faster load times</li>
                <li>Native app-like experience</li>
                <li>Push notifications (if enabled)</li>
                <li>No app store required</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>Testing Instructions</CardHeader>
          <CardContent>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>To test the install prompt:</strong></p>
              <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Build the app: <code>npm run build</code></li>
                <li>Serve production build: <code>npx serve www</code></li>
                <li>Open in Chrome/Edge (not Safari on desktop)</li>
                <li>Install button should appear</li>
                <li>Banner appears after 2 seconds</li>
              </ol>

              <p style={{ marginTop: '15px', color: '#666' }}>
                <strong>Note:</strong> Install prompts only work:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: '#666' }}>
                <li>On HTTPS or localhost</li>
                <li>If app not already installed</li>
                <li>If service worker is registered</li>
                <li>In supported browsers (Chrome, Edge, Samsung Internet)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default PWAInstallDemo;
