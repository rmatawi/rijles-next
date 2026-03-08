// src/components/home/skins/rayer/styles.js
// Rayer skin styles as JavaScript objects

export const rayerStyles = {
  // Global page background
  pageBackground: {
    background: 'var(--brand-gradient, #f2f6fa)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },

  // Medical Card - Clean white, soft distinct shadow
  medCard: {
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.03), 0px 1px 3px rgba(0, 0, 0, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  },

  medCardActive: {
    transform: 'scale(0.99)'
  },

  // Premium Hero Card - Solid Primary Color with Gradient Mesh
  medHeroCard: {
    color: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0px 15px 35px -5px rgba(0, 0, 0, 0.15), 0px 5px 15px -3px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  },

  medHeroGlass: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '12px'
  },

  // Search Bar / Input Field Style - Pill Shape
  medInputField: {
    background: '#ffffff',
    borderRadius: '100px',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04), 0px 0px 2px rgba(0, 0, 0, 0.02)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#94a3b8',
    border: '1px solid transparent',
    transition: 'all 0.2s ease'
  },

  medInputFieldFocus: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-1px)'
  },

  // Icon Container - Soft Squircle
  medIconSquircle: {
    width: '100%',
    maxWidth: '84px',
    aspectRatio: '1 / 1',
    height: 'auto',
    borderRadius: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    background: '#ffffff',
    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.06), 0px 2px 8px rgba(0, 0, 0, 0.04)'
  },

  medIconSquircleActive: {
    transform: 'scale(0.92)'
  },

  // Section Headers
  medSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px',
    marginBottom: '24px',
    marginTop: '32px'
  },

  medTitle: {
    fontSize: '19px',
    fontWeight: '700',
    color: 'var(--rayer-title-color, #0f172a)',
    letterSpacing: '-0.02em',
    margin: 0
  },

  medLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-blue-primary)',
    textDecoration: 'none',
    background: 'rgba(59, 130, 246, 0.08)',
    padding: '6px 12px',
    borderRadius: '100px',
    transition: 'background 0.2s ease'
  },

  medLinkActive: {
    background: 'rgba(59, 130, 246, 0.15)'
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
    marginBottom: '32px',
    minHeight: '200px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },

  backgroundTexture: {
    position: 'absolute',
    top: '-60%',
    right: '-20%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    pointerEvents: 'none'
  },

  backgroundTextureBottom: {
    position: 'absolute',
    bottom: '-50%',
    left: '-20%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    pointerEvents: 'none'
  },

  contentContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1
  },

  leftContent: {
    paddingRight: '10px'
  },

  badge: {
    display: 'inline-flex',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '0.3px'
  },

  schoolName: {
    fontSize: '26px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    lineHeight: '1.1',
    color: 'white'
  },

  schoolDescription: {
    opacity: 0.9,
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '0.2px'
  },

  rightAvatar: {
    width: '68px',
    height: '68px',
    borderRadius: '22px',
    padding: '4px',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    flexShrink: 0
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '18px',
    background: 'white'
  },

  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
    position: 'relative',
    zIndex: 1
  },

  contactButton: {
    background: '#1e293b',
    color: 'white',
    fontWeight: '700',
    flex: 1,
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    fontSize: '15px',
    height: '48px'
  },

  shareButton: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontWeight: '600',
    width: '60px',
    height: '48px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)'
  },

  // LearningModulesGrid specific styles
  sectionHeader: {
    marginTop: '40px',
    padding: '0 8px'
  },

  modulesGrid: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },

  moduleItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    flex: 1,
    minWidth: '0'
  },

  moduleTitle: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--rayer-module-title-color, #1e293b)',
    textAlign: 'center',
    letterSpacing: '-0.01em'
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
