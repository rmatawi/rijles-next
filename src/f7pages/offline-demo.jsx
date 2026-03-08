// src/pages/offline-demo.jsx
// Demo page showing offline sync functionality

import React, { useState, useEffect } from 'react';
import {
  Page,
  Navbar,
  Block,
  Card,
  CardHeader,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  f7
} from 'framework7-react';
import { offlineSchoolService, offlineQAService } from '../services/offlineAwareServices';
import { isOnline, syncAllData, clearAllCache, getFromCache, CACHE_KEYS } from '../services/dataSyncService';
import store from '../js/store';

const OfflineDemo = () => {
  const [networkStatus, setNetworkStatus] = useState(isOnline());
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({});

  // Load schools data
  const loadSchools = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const { data, error, fromCache } = await offlineSchoolService.getSchools(forceRefresh);

      if (error) {
        console.error('Error loading schools:', error);
        f7.toast.show({
          text: error.message,
          position: 'center'
        });
        return;
      }

      setSchools(data || []);
      setIsFromCache(fromCache);

      if (fromCache) {
        f7.toast.show({
          text: '📦 Loaded from cache',
          position: 'center'
        });
      } else {
        f7.toast.show({
          text: '🌐 Fresh data from database',
          position: 'center'
        });
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      f7.toast.show({
        text: 'Error loading data',
        position: 'center'
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data (force fresh fetch)
  const handleRefresh = async () => {
    if (!isOnline()) {
      f7.dialog.alert(
        'Cannot refresh while offline. Please check your internet connection.',
        'Offline'
      );
      return;
    }

    await loadSchools(true);
  };

  // Sync all data
  const handleSyncAll = async () => {
    if (!isOnline()) {
      f7.dialog.alert('Cannot sync while offline.', 'Offline');
      return;
    }

    f7.dialog.preloader('Syncing data...');
    const result = await syncAllData();
    f7.dialog.close();

    if (result.success) {
      f7.toast.show({
        text: '✅ All data synced successfully',
        position: 'center'
      });
      await loadSchools(true);
    } else {
      f7.toast.show({
        text: '❌ Sync failed',
        position: 'center'
      });
    }
  };

  // Clear cache
  const handleClearCache = () => {
    f7.dialog.confirm(
      'Are you sure you want to clear all cached data?',
      'Clear Cache',
      () => {
        clearAllCache();
        setSchools([]);
        setCacheInfo({});
        f7.toast.show({
          text: '🗑️ Cache cleared',
          position: 'center'
        });
      }
    );
  };

  // Check cache status
  const checkCacheStatus = () => {
    const info = {};

    // Check if schools list is cached
    const cachedSchools = getFromCache(CACHE_KEYS.SCHOOLS_LIST);
    info.schoolsList = cachedSchools ? `${cachedSchools.length} schools cached` : 'Not cached';

    // Check localStorage size
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    info.storageSize = `${(totalSize / 1024).toFixed(2)} KB`;

    setCacheInfo(info);

    f7.dialog.alert(
      `<div style="text-align: left;">
        <p><strong>Schools List:</strong> ${info.schoolsList}</p>
        <p><strong>Storage Used:</strong> ${info.storageSize}</p>
      </div>`,
      'Cache Status'
    );
  };

  // Simulate offline mode
  const toggleOfflineMode = () => {
    const newStatus = !networkStatus;
    setNetworkStatus(newStatus);
    store.dispatch('setNetworkStatus', newStatus ? 'online' : 'offline');

    f7.toast.show({
      text: newStatus ? '🌐 Simulating ONLINE mode' : '📵 Simulating OFFLINE mode',
      position: 'center'
    });
  };

  // Monitor network status changes
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      f7.toast.show({
        text: '🌐 Back online!',
        position: 'center'
      });
    };

    const handleOffline = () => {
      setNetworkStatus(false);
      f7.toast.show({
        text: '📵 You are offline',
        position: 'center'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load
  useEffect(() => {
    loadSchools();
  }, []);

  return (
    <Page>
      <Navbar title="Offline Sync Demo" backLink="Back" />

      <Block>
        {/* Network Status Card */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: networkStatus ? '#4caf50' : '#f44336'
                }}
              />
              <span style={{ fontWeight: 'bold' }}>
                {networkStatus ? 'Online' : 'Offline'}
              </span>
              {isFromCache && (
                <Chip text="Cached Data" color="orange" style={{ marginLeft: 'auto' }} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p>
              This demo shows how the offline sync system works.
              {networkStatus
                ? ' Data is fetched from the database and cached.'
                : ' Data is loaded from cache since you\'re offline.'
              }
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>Actions</CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                fill
                onClick={() => loadSchools(false)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load Schools (Auto)'}
              </Button>

              <Button
                fill
                color="blue"
                onClick={handleRefresh}
                disabled={!networkStatus || loading}
              >
                Force Refresh (Online Only)
              </Button>

              <Button
                fill
                color="green"
                onClick={handleSyncAll}
                disabled={!networkStatus}
              >
                Sync All Data
              </Button>

              <Button
                fill
                color="orange"
                onClick={checkCacheStatus}
              >
                Check Cache Status
              </Button>

              <Button
                fill
                color="red"
                onClick={handleClearCache}
              >
                Clear All Cache
              </Button>

              <Button
                outline
                onClick={toggleOfflineMode}
              >
                {networkStatus ? '📵 Simulate Offline' : '🌐 Simulate Online'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schools List */}
        <Card>
          <CardHeader>
            Schools ({schools.length})
          </CardHeader>
          <CardContent>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading...
              </div>
            ) : schools.length > 0 ? (
              <List>
                {schools.slice(0, 5).map((school) => (
                  <ListItem
                    key={school.id}
                    title={school.name}
                    subtitle={school.description || 'No description'}
                  />
                ))}
                {schools.length > 5 && (
                  <ListItem
                    title={`... and ${schools.length - 5} more schools`}
                  />
                )}
              </List>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                No schools available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>How to Test</CardHeader>
          <CardContent>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Click "Load Schools" to fetch data</li>
              <li>Click "Simulate Offline" to test offline mode</li>
              <li>Try loading schools again - data comes from cache</li>
              <li>Click "Simulate Online" to go back online</li>
              <li>Use "Force Refresh" to get fresh data</li>
              <li>Check cache status to see what's stored</li>
            </ol>
            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              <strong>Tip:</strong> You can also use Chrome DevTools Network tab to test real offline mode.
            </p>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default OfflineDemo;
