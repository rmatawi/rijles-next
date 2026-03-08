import React from 'react';
import { IonIcon } from '@ionic/react';
import { giftOutline } from 'ionicons/icons';
import { f7 } from 'framework7-react';
import { useAdminStatus } from '../contexts/AdminStatusContext';
import { useStudentStatus } from '../contexts/StudentStatusContext';
import store from '../js/store';
import { isSuperAdmin } from '../js/utils';

/**
 * Reusable ReferralCard component for "Verwijs & Verdien" functionality
 * Not visible to admins, superadmins, or anonymous users
 * @param {Object} props
 * @param {string} props.variant - 'purple' or 'pink' gradient variant
 * @param {string} props.subtitle - Card subtitle (default: "Nodig vrienden uit en ontvang beloningen!")
 * @param {string} props.onClick - Click handler or navigation path
 * @param {Object} props.style - Additional styles
 */
const ReferralCard = ({
  variant = 'purple',
  subtitle = 'Nodig vrienden uit en ontvang beloningen!',
  onClick,
  style = {},
  className = ''
}) => {
  const { isAdmin } = useAdminStatus();
  const { isStudent } = useStudentStatus();

  // Check if user is authenticated
  const authUser = store.state.authUser;
  
  // Check if user is superadmin
  const isSuperAdminUser = isSuperAdmin(authUser?.email);
  
  // Check if user is a trial user
  const isTrial = localStorage.getItem('isTrial') === 'true';

  // Hide component for admins and superadmins
  if (isAdmin || isSuperAdminUser) {
    return null;
  }

  // Hide component for anonymous users (not authenticated, not a student, and not a trial user)
  if (!authUser && !isStudent && !isTrial) {
    return null;
  }
  const handleClick = () => {
    if (typeof onClick === 'string') {
      f7.views.main.router.navigate(onClick);
    } else if (typeof onClick === 'function') {
      onClick();
    }
  };

  const gradientStyles = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    pink: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };

  return (
    <div
      className={`neu-card ${className}`}
      style={{
        padding: '20px',
        cursor: 'pointer',
        background: gradientStyles[variant],
        ...style
      }}
      onClick={handleClick}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonIcon
            icon={giftOutline}
            style={{ fontSize: '32px', color: '#fff' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            Verwijs & Verdien
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {subtitle}
          </p>
        </div>
        <i
          className="f7-icons"
          style={{ fontSize: '24px', color: '#fff', opacity: 0.8 }}
        >
          chevron_right
        </i>
      </div>
    </div>
  );
};

export default ReferralCard;
