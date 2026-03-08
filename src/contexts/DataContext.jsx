// src/contexts/DataContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { schoolService } from '../services/schoolService';
import { adminService } from '../services/adminService';

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SCHOOLS: 'SET_SCHOOLS',
  SET_ADMINS: 'SET_ADMINS',
  SET_ADMIN: 'SET_ADMIN',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE',
  CLEAR_CACHE: 'CLEAR_CACHE'
};

// Initial state
const initialState = {
  schools: {
    data: null,
    loading: false,
    lastFetched: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  },
  admins: {
    data: null,
    loading: false,
    lastFetched: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  },
  adminByEmail: {}, // Cache for individual admin lookups
  loadingStates: {}
};

// Reducer
function dataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.key]: action.loading
        }
      };

    case ACTIONS.SET_SCHOOLS:
      return {
        ...state,
        schools: {
          data: action.data,
          loading: false,
          lastFetched: Date.now()
        }
      };

    case ACTIONS.SET_ADMINS:
      return {
        ...state,
        admins: {
          data: action.data,
          loading: false,
          lastFetched: Date.now()
        }
      };

    case ACTIONS.SET_ADMIN:
      return {
        ...state,
        adminByEmail: {
          ...state.adminByEmail,
          [action.email]: {
            data: action.data,
            lastFetched: Date.now()
          }
        }
      };

    case ACTIONS.INVALIDATE_CACHE:
      if (action.cacheType === 'schools') {
        return {
          ...state,
          schools: {
            ...state.schools,
            lastFetched: null
          }
        };
      } else if (action.cacheType === 'admins') {
        return {
          ...state,
          admins: {
            ...state.admins,
            lastFetched: null
          }
        };
      } else if (action.cacheType === 'admin' && action.email) {
        return {
          ...state,
          adminByEmail: {
            ...state.adminByEmail,
            [action.email]: {
              ...state.adminByEmail[action.email],
              lastFetched: null
            }
          }
        };
      }
      return state;

    case ACTIONS.CLEAR_CACHE:
      return initialState;

    default:
      return state;
  }
}

// Context
const DataContext = createContext();

// Provider component
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Helper functions
  const isCacheValid = (cacheInfo, expiryTime) => {
    if (!cacheInfo || !cacheInfo.lastFetched) return false;
    return (Date.now() - cacheInfo.lastFetched) < expiryTime;
  };

  const setLoading = (key, loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, key, loading });
  };

  // Schools methods
  const getSchools = useCallback(async (force = false) => {
    const cacheKey = 'schools';
    setLoading(cacheKey, true);

    try {
      // Check cache first (unless force refresh)
      if (!force && isCacheValid(state.schools, state.schools.cacheExpiry) && state.schools.data) {
        setLoading(cacheKey, false);
        return { data: state.schools.data, error: null, fromCache: true };
      }

      // Fetch from API
      const result = await schoolService.getSchools();

      if (!result.error && result.data) {
        dispatch({ type: ACTIONS.SET_SCHOOLS, data: result.data });
      }

      setLoading(cacheKey, false);
      return result;
    } catch (error) {
      setLoading(cacheKey, false);
      return { data: null, error };
    }
  }, [state.schools.lastFetched, state.schools.data]); // More specific dependencies

  const getSchoolById = useCallback(async (id, force = false) => {
    // First check if we have it in the schools cache
    if (!force && state.schools.data) {
      const cachedSchool = state.schools.data.find(school => school.id === id);
      if (cachedSchool) {
        return { data: cachedSchool, error: null, fromCache: true };
      }
    }

    // Fall back to service (which has its own cache)
    return await schoolService.getSchoolById(id);
  }, [state.schools.data]);

  // Admins methods
  const getAdmins = useCallback(async (force = false) => {
    const cacheKey = 'admins';
    setLoading(cacheKey, true);

    try {
      // Check cache first (unless force refresh)
      if (!force && isCacheValid(state.admins, state.admins.cacheExpiry) && state.admins.data) {
        setLoading(cacheKey, false);
        return { data: state.admins.data, error: null, fromCache: true };
      }

      // Fetch from API
      const result = await adminService.getAllAdmins();

      if (!result.error && result.data) {
        dispatch({ type: ACTIONS.SET_ADMINS, data: result.data });
      }

      setLoading(cacheKey, false);
      return result;
    } catch (error) {
      setLoading(cacheKey, false);
      return { data: null, error };
    }
  }, [state.admins]);

  const getAdminByEmail = useCallback(async (email, force = false) => {
    const cacheKey = `admin_${email}`;
    setLoading(cacheKey, true);

    try {
      // Check individual admin cache first
      const adminCache = state.adminByEmail[email];
      if (!force && adminCache && isCacheValid(adminCache, 5 * 60 * 1000) && adminCache.data) {
        setLoading(cacheKey, false);
        return { data: adminCache.data, error: null, fromCache: true };
      }

      // Check if admin is in the general admins cache
      if (!force && state.admins.data) {
        const cachedAdmin = state.admins.data.find(admin => admin.email === email);
        if (cachedAdmin) {
          dispatch({ type: ACTIONS.SET_ADMIN, email, data: cachedAdmin });
          setLoading(cacheKey, false);
          return { data: cachedAdmin, error: null, fromCache: true };
        }
      }

      // Fetch from API
      const result = await adminService.getAdminByEmail(email);

      if (!result.error && result.data) {
        dispatch({ type: ACTIONS.SET_ADMIN, email, data: result.data });
      }

      setLoading(cacheKey, false);
      return result;
    } catch (error) {
      setLoading(cacheKey, false);
      return { data: null, error };
    }
  }, [state.admins.data, state.adminByEmail]);

  // Cache management
  const invalidateCache = useCallback((cacheType, email = null) => {
    dispatch({ type: ACTIONS.INVALIDATE_CACHE, cacheType, email });
  }, []);

  const clearCache = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CACHE });
  }, []);

  // Context value
  const value = {
    // State
    schools: state.schools,
    admins: state.admins,
    adminByEmail: state.adminByEmail,
    loadingStates: state.loadingStates,

    // Methods
    getSchools,
    getSchoolById,
    getAdmins,
    getAdminByEmail,
    invalidateCache,
    clearCache,

    // Direct service access (for operations that need to bypass cache)
    schoolService,
    adminService
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook to use the data context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
