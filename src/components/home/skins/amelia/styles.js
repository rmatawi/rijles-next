// src/components/home/skins/default/styles.js
// Default skin styles as JavaScript objects

export const defaultStyles = {
  // Neumorphic Page Background
  pageBackground: {
    background: 'var(--neu-bg, #e8eef3)'
  },

  // Neumorphic Card - Raised Effect
  neuCard: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: 'var(--neu-radius, 20px)',
    boxShadow: '8px 8px 16px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -8px -8px 16px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    border: 'none',
    transition: 'var(--neu-transition, all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1))',
    overflow: 'hidden'
  },

  neuCardHover: {
    boxShadow: '10px 10px 20px var(--neu-shadow-dark-strong, rgba(163, 177, 198, 0.9)), -10px -10px 20px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    transform: 'translateY(-2px)'
  },

  neuCardActive: {
    boxShadow: '4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    transform: 'translateY(0)'
  },

  // Neumorphic Card - Inset/Pressed Effect
  neuCardInset: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: 'var(--neu-radius, 20px)',
    boxShadow: 'inset 4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), inset -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    border: 'none'
  },

  // Neumorphic Button - Raised
  neuBtn: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: 'var(--neu-radius-sm, 100px)',
    boxShadow: '4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    border: 'none',
    padding: '12px 24px',
    fontWeight: '600',
    transition: 'var(--neu-transition, all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1))',
    cursor: 'pointer'
  },

  neuBtnHover: {
    boxShadow: '6px 6px 12px var(--neu-shadow-dark-strong, rgba(163, 177, 198, 0.9)), -6px -6px 12px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  neuBtnActive: {
    boxShadow: 'inset 3px 3px 6px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), inset -3px -3px 6px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  // Neumorphic Button - Circle
  neuBtnCircle: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    border: 'none',
    transition: 'var(--neu-transition, all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1))',
    cursor: 'pointer'
  },

  neuBtnCircleHover: {
    boxShadow: '6px 6px 12px var(--neu-shadow-dark-strong, rgba(163, 177, 198, 0.9)), -6px -6px 12px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  neuBtnCircleActive: {
    boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), inset -2px -2px 4px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  // Neumorphic Avatar/Logo
  neuAvatar: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: '50%',
    boxShadow: '4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    padding: '4px'
  },

  neuAvatarImage: {
    borderRadius: '50%',
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  // Neumorphic Icon Container
  neuIcon: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: 'var(--neu-radius-sm, 100px)',
    padding: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    transition: 'var(--neu-transition, all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1))'
  },

  neuIconHover: {
    boxShadow: '6px 6px 12px var(--neu-shadow-dark-strong, rgba(163, 177, 198, 0.9)), -6px -6px 12px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  // Neumorphic Badge/Tag
  neuBadge: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '2px 2px 4px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -2px -2px 4px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  // Neumorphic Section Title
  neuSectionTitle: {
    fontSize: '1.1em',
    fontWeight: '700',
    color: '#5a6c7d',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '24px 16px 16px',
    paddingLeft: '12px',
    borderLeft: '4px solid var(--color-blue-primary, #007aff)'
  },

  // Neumorphic Module Card
  neuModule: {
    background: 'var(--neu-bg, #e8eef3)',
    borderRadius: 'var(--neu-radius, 20px)',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '6px 6px 12px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), -6px -6px 12px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))',
    transition: 'var(--neu-transition, all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1))',
    cursor: 'pointer'
  },

  neuModuleHover: {
    transform: 'translateY(-4px)',
    boxShadow: '10px 10px 20px var(--neu-shadow-dark-strong, rgba(163, 177, 198, 0.9)), -10px -10px 20px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  neuModuleActive: {
    transform: 'translateY(0)',
    boxShadow: 'inset 4px 4px 8px var(--neu-shadow-dark, rgba(163, 177, 198, 0.6)), inset -4px -4px 8px var(--neu-shadow-light, rgba(255, 255, 255, 0.8))'
  },

  neuModuleIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },

  neuModuleTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#3a4a5a',
    margin: 0
  },

  neuModuleDesc: {
    fontSize: '13px',
    color: '#7a8a9a',
    margin: '8px 0 0',
    lineHeight: '1.4'
  },

  // DrivingSchoolCard specific styles
  drivingSchoolCard: {
    margin: '16px',
    padding: '0',
    marginTop: '80px',
    overflow: 'visible'
  },

  heroImageContainer: {
    height: '180px',
    textAlign: 'center',
    padding: '20px 16px',
    position: 'relative',
    borderRadius: '10px'
  },

  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  },

  logoContainer: {
    width: '120px',
    height: '120px',
    position: 'relative',
    top: '-80px',
    left: '50%',
    transform: 'translateX(-50%)',
    overflow: 'hidden'
  },

  schoolName: {
    fontSize: '18px',
    fontWeight: '700',
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translate(-50%, 0%)',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },

  // LearningModulesGrid specific styles
  sectionTitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '1.2em',
    margin: '20px 0 10px 0',
    padding: '0 16px'
  },

  neuGrid: {
    padding: '0 16px'
  },

  neuGridContainer: {
    display: 'grid',
    gap: '16px'
  },

  neuGrid2: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },

  // Dark mode overrides
  darkPageBackground: {
    background: '#1a1a1a'
  },

  darkNeuCard: {
    background: '#252525'
  },

  darkNeuCardInset: {
    background: '#1a1a1a'
  },

  darkNeuTextPrimary: {
    color: '#e8eef3'
  },

  darkNeuTextSecondary: {
    color: '#b0bac5'
  },

  darkNeuSectionTitle: {
    color: '#d1d9e6'
  }
};
