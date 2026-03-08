import { createContext, useContext, useRef, useCallback } from 'react';

// Event types used in the maquette system
export const MAQUETTE_EVENTS = {
  PLAY_ANIMATION: 'play-animation',
  ANIMATION_COMPLETE: 'animation-complete',
  INDIVIDUAL_VEHICLE_PLAY: 'individual-vehicle-play',
  SHOW_STEP_CRITERIA: 'show-step-criteria',
  RESET_ANIMATION: 'reset-animation',
  RESET_OTHER_ANIMATIONS: 'reset-other-animations',
  CANVAS_ANIMATION_COMPLETE: 'canvas-animation-complete',
};

const MaquetteEventContext = createContext(null);

export const MaquetteEventProvider = ({ children }) => {
  // Store event listeners in a ref to avoid re-renders
  const listenersRef = useRef({
    [MAQUETTE_EVENTS.PLAY_ANIMATION]: [],
    [MAQUETTE_EVENTS.ANIMATION_COMPLETE]: [],
    [MAQUETTE_EVENTS.INDIVIDUAL_VEHICLE_PLAY]: [],
    [MAQUETTE_EVENTS.SHOW_STEP_CRITERIA]: [],
    [MAQUETTE_EVENTS.RESET_ANIMATION]: [],
    [MAQUETTE_EVENTS.RESET_OTHER_ANIMATIONS]: [],
    [MAQUETTE_EVENTS.CANVAS_ANIMATION_COMPLETE]: [],
  });

  // Add event listener
  const addEventListener = useCallback((eventName, handler) => {
    if (!listenersRef.current[eventName]) {
      listenersRef.current[eventName] = [];
    }

    // Avoid duplicate listeners
    if (!listenersRef.current[eventName].includes(handler)) {
      listenersRef.current[eventName].push(handler);
    }

    // Return cleanup function
    return () => {
      removeEventListener(eventName, handler);
    };
  }, []);

  // Remove event listener
  const removeEventListener = useCallback((eventName, handler) => {
    if (listenersRef.current[eventName]) {
      listenersRef.current[eventName] = listenersRef.current[eventName].filter(
        h => h !== handler
      );
    }
  }, []);

  // Dispatch event to all listeners
  const dispatchEvent = useCallback((eventName, detail) => {
    const listeners = listenersRef.current[eventName];
    if (listeners && listeners.length > 0) {
      // Create event object compatible with CustomEvent structure
      const event = { detail };
      listeners.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in ${eventName} event handler:`, error);
        }
      });
    }
  }, []);

  const value = {
    addEventListener,
    removeEventListener,
    dispatchEvent,
    EVENTS: MAQUETTE_EVENTS,
  };

  return (
    <MaquetteEventContext.Provider value={value}>
      {children}
    </MaquetteEventContext.Provider>
  );
};

// Custom hook for using maquette events
export const useMaquetteEvents = () => {
  const context = useContext(MaquetteEventContext);

  if (!context) {
    throw new Error('useMaquetteEvents must be used within MaquetteEventProvider');
  }

  return context;
};

export default MaquetteEventContext;
