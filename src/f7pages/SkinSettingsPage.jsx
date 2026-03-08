import React, { useState, useEffect } from 'react';
import { Page, Navbar, Block, useStore } from 'framework7-react';
import SkinSelector from '../components/SkinSelector';
import { isLocalHost, isSuperAdmin } from '../js/utils';

const SkinSettingsPage = () => {
    const authUser = useStore("authUser");
    const [selectedSkin, setSelectedSkin] = useState('default');

  useEffect(() => {
    // Load saved skin from localStorage
    const savedSkin = localStorage.getItem('selectedSkin') || 'default';
    setSelectedSkin(savedSkin);
  }, []);

  const canAccess = isLocalHost() || isSuperAdmin(authUser?.email);

  if (!canAccess) {
    return null; // Or show a 404/Access Denied message
  }

  return (
    <Page>
      <Navbar title="Skin Settings" backLink="Back" />
      <SkinSelector
        selectedSkin={selectedSkin}
        onSkinChange={setSelectedSkin}
      />
      <Block>
        <p>Select your preferred skin theme. Changes are applied immediately.</p>
      </Block>
    </Page>
  );
};

export default SkinSettingsPage;
