// src/components/AuthPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Page,
  Navbar,
  Block,
  Card,
  CardContent,
  Button,
  f7,
  useStore,
} from 'framework7-react';
import { authService } from '../services';
import store from '../js/store';
import { useI18n } from '../i18n/i18n';

const AuthPage = () => {
  const { t } = useI18n();
  const [drivingSchoolName, setDrivingSchoolName] = useState("Rijles App");
  
  // Get driving school name from localStorage
  useEffect(() => {
    const schoolName = localStorage.getItem("selectedSchoolName");
    if (schoolName) {
      setDrivingSchoolName(schoolName);
    }
  }, []);

  // Removed automatic redirect if already authenticated
  // Let users decide where to navigate after authentication status is known
  useEffect(() => {
    if (store.state.isAuthenticated && !store.state.authLoading) {
      console.log('User is already authenticated - no automatic redirect');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      
      const { data, error } = await authService.signInWithGoogle();
      
      
      if (error) {
        f7.toast.show({ text: `Google sign-in failed: ${error.message}` });
        return;
      }
      
      // The OAuth flow will redirect the user, so we don't need to do anything here
      // The user will be redirected back to the app after authentication
    } catch (error) {
      f7.preloader.hide();
      f7.toast.show({ text: 'Google sign-in failed. Please try again.' });
    }
  };

  const handleManualRedirect = () => {
    f7.views.main.router.navigate('/');
  };

  // Show loading state while checking auth status
  if (store.state.authLoading) {
    return (
      <Page>
        <Navbar title={drivingSchoolName || "Rijles App"} backLink="Back" />
        <Block style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--color-blue-primary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            R
          </div>
          <h1>{drivingSchoolName || "Rijles App"}</h1>
          <p style={{ color: 'var(--color-gray-text)' }}>{t('auth.checkingAuth')}</p>
        </Block>
      </Page>
    );
  }

  // Show user info if already authenticated (this will rarely be seen due to redirect, but good for edge cases)
  if (store.state.isAuthenticated) {
    return (
      <Page>
        <Navbar title={drivingSchoolName || "Rijles App"} backLink="Back" />
        <Block style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--color-blue-primary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            R
          </div>
          <h1>{drivingSchoolName || "Rijles App"}</h1>
          <p style={{ color: 'var(--color-gray-text)' }}>{t('auth.learnTrafficRules')}</p>
        </Block>

        <Card style={{ margin: '16px' }}>
          <CardContent>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-gray-border)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#666',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '15px'
              }}>
                {store.state.authUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h3 style={{ marginBottom: '5px' }}>{t('auth.alreadySignedIn')}</h3>
              <p style={{ color: 'var(--color-gray-text)', marginBottom: '20px' }}>
                {t('auth.signedInAs')} <strong>{store.state.authUser?.email || 'user'}</strong>
              </p>
              <p style={{ color: 'var(--color-gray-text)', marginBottom: '20px' }}>
                {t('auth.redirectingToApp') || "Redirecting to the app..."}
              </p>
              <Button 
                fill 
                large 
                color="blue" 
                onClick={handleManualRedirect}
                style={{ margin: '10px 0' }}
              >
                {t('auth.returnToAppNow') || "Return to App Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title={drivingSchoolName || "Rijles App"} backLink="Back" />
      
      <Block style={{ textAlign: 'center', marginTop: '40px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--app-primary-color)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          R
        </div>
        <h1>{drivingSchoolName || "Rijles App"}</h1>
        <p style={{ color: '#666' }}>{t('auth.learnTrafficRules')}</p>
      </Block>

      <Card style={{ margin: '16px' }}>
        <CardContent>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: 'var(--color-gray-text)', marginBottom: '20px' }}>
              {t('auth.signInWithGoogle') || "Sign in with your Google account to access the Rijles App"}
            </p>
            <Button 
              fill 
              large
              color="red" 
              onClick={handleGoogleSignIn}
              style={{ margin: '10px 0' }}
            >
              <i className="icon f7-icons" style={{ marginRight: '8px' }}>logo_google</i>
              {t('auth.signInWithGoogleBtn') || "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
};

export default AuthPage;