// js/utils.js - Simplified utility functions
// ========================
// STRING FORMATTING UTILITIES
// ========================
import store from "../js/store";
import { adminService } from "../services/adminService";

export const toSnakeCase = (input) => {
  if (!input || typeof input !== "string") {
    return "";
  }

  return (
    input
      // Convert to lowercase
      .toLowerCase()
      // Replace non-alphanumeric characters (except spaces) with spaces
      .replace(/[^a-z0-9\s]/g, " ")
      // Replace multiple spaces with single space
      .replace(/\s+/g, " ")
      // Trim leading/trailing spaces
      .trim()
      // Replace spaces with underscores
      .replace(/\s+/g, "_")
  );
};

export function toKebabCase(str) {
  return str
    .trim() // remove leading/trailing spaces
    .toLowerCase() // convert to lowercase
    .replace(/\s+/g, "-"); // replace spaces with hyphens
}

// ========================
// CONSTANTS
// ========================
// Get primary color from env or fallback
const getPrimaryColor = () => {
  if (
    typeof window !== "undefined" &&
    typeof getComputedStyle !== "undefined"
  ) {
    const root = document.documentElement;
    const cssVar = getComputedStyle(root)
      .getPropertyValue("--app-primary-color")
      .trim();
    if (cssVar) return cssVar;
  }
  return process.env.VITE_COLOR_SCHEME?.split(",")?.[0] || "#1A73E8";
};

// Function to get layout from f7 params
export const getLayout = () => {
  // Check if f7 is available and has layout configuration
  if (
    typeof window !== "undefined" &&
    window.f7 &&
    window.f7.params &&
    window.f7.params.layout
  ) {
    return window.f7.params.layout;
  }

  // Fallback to default layout with colorScheme from env
  const defaultColorScheme = process.env.VITE_COLOR_SCHEME?.split(",") || [
    "#1A73E8", // Primary Blue (fallback)
    "#34A853", // Accent Green
    "#FBBC05", // Warm Yellow
    "#EA4335", // Alert Red
    "#202124", // Dark Neutral
  ];

  return {
    modules_grid: 1,
    rounded: true,
    hero_image: true,
    colorScheme: defaultColorScheme,
  };
};

// Get gradient for theme based on layout color scheme
export const getThemeGradient = () => {
  const layout = getLayout();
  const colorScheme = layout?.colorScheme;
  if (colorScheme && colorScheme[0] && colorScheme[2]) {
    // Use primary and secondary (darker) colors
    return `linear-gradient(135deg, ${colorScheme[0]} 0%, ${colorScheme[2]} 100%)`;
  } else if (colorScheme && colorScheme[0] && colorScheme[1]) {
    // Fallback to primary and accent
    return `linear-gradient(135deg, ${colorScheme[0]} 0%, ${colorScheme[1]} 100%)`;
  }
  // Hardcoded fallback
  return "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
};

export const COLORS = {
  get primary() {
    return getPrimaryColor();
  },
  success: "#4CD964",
  warning: getLayout()?.colorScheme?.[0],
  danger: "#FF3B30",
  info: "#5856D6",
  gray: "#8E8E93",
};

export const STATUS_COLORS = {
  completed: "green",
  in_progress: "orange",
  locked: "gray",
  available: "blue",
  confirmed: "green",
  pending: "orange",
  cancelled: "red",
};

// ========================
// DATE AND TIME UTILITIES
// ========================
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

export const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isTomorrow = (dateString) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateString);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

export const getRelativeDate = (dateString) => {
  if (isToday(dateString)) return "Vandaag";
  if (isTomorrow(dateString)) return "Morgen";
  return formatDate(dateString);
};

// ========================
// PROGRESS UTILITIES
// ========================
export const calculateOverallProgress = (skills) => {
  if (!skills || skills.length === 0) return 0;
  const totalProgress = skills.reduce((sum, skill) => sum + skill.progress, 0);
  return Math.round(totalProgress / skills.length);
};

export const getProgressColor = (progress) => {
  if (progress >= 80) return "green";
  if (progress >= 60) return "orange";
  if (progress >= 40) return "yellow";
  return "red";
};

export const getSkillStatusText = (status) => {
  const statusMap = {
    completed: "Voltooid",
    in_progress: "Bezig",
    locked: "Vergrendeld",
    available: "Beschikbaar",
  };
  return statusMap[status] || status;
};

// ========================
// VALIDATION UTILITIES
// ========================
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Suriname phone number validation (simplified)
  const phoneRegex = /^(\+597|597)?[0-9]{6,7}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ""));
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

// ========================
// STORAGE UTILITIES
// ========================
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn("Error reading from localStorage:", error);
    return defaultValue;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Error writing to localStorage:", error);
    return false;
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn("Error removing from localStorage:", error);
    return false;
  }
};

// ========================
// ARRAY UTILITIES
// ========================
export const sortBy = (array, key, direction = "asc") => {
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];

    if (direction === "desc") {
      return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
    }
    return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
  });
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const value = item[key];
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {});
};

// ========================
// SEARCH UTILITIES
// ========================
export const searchInText = (text, searchTerm) => {
  if (!searchTerm || !text) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

export const searchInObject = (obj, searchTerm, searchKeys = []) => {
  if (!searchTerm) return true;

  const searchableText =
    searchKeys.length > 0
      ? searchKeys.map((key) => obj[key]).join(" ")
      : Object.values(obj).join(" ");

  return searchInText(searchableText, searchTerm);
};

// ========================
// FORMATTING UTILITIES
// ========================
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const formatNumber = (num, decimals = 0) => {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// ========================
// DEVICE UTILITIES
// ========================
export const isMobile = () => {
  return window.innerWidth <= 768;
};

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};

export const getDeviceType = () => {
  if (isMobile()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
};

export const isLocalhost = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1"
  );
};

export const isLocalHost = isLocalhost;

// Check if user is a rijschool admin (uses stored status from checkAdminStatus)
export const isAdmin = () => {
  // Use the persistent store getter which should be more reliable
  if (store.getters && typeof store.getters.persistentIsAdmin === "function") {
    try {
      const persistentIsAdmin = store.getters.persistentIsAdmin({
        state: store.state,
      });
      if (persistentIsAdmin) {
        return true;
      }
    } catch (error) {
      // Silently handle errors and fallback to other methods
    }
  }

  // Test the persistent admin status getters
  if (
    store.getters &&
    typeof store.getters.persistentAdminStatus === "function"
  ) {
    try {
      const persistentAdminStatus = store.getters.persistentAdminStatus({
        state: store.state,
      });
      if (persistentAdminStatus === "approved") {
        return true;
      }
    } catch (error) {
      // Silently handle errors and fallback to other methods
    }
  }

  // Use the store getter which is the single source of truth for admin status
  if (
    store.getters &&
    store.getters.isAdmin &&
    typeof store.getters.isAdmin === "function"
  ) {
    try {
      return store.getters.isAdmin({ state: store.state });
    } catch (error) {
      // Silently handle errors and fallback to other methods
    }
  }

  // Fallback: check the state directly
  const authUser = store.state.authUser;

  // Special case: Check if it's a super admin email (always an admin)
  if (isSuperAdmin(authUser?.email)) {
    return true;
  }

  // Primary check: Check for approved admin status in store
  if (
    authUser &&
    (authUser.isAdmin === true || authUser.admin_status === "approved")
  ) {
    return true;
  }

  return false;
};

export function mergeStreetSettings({ defaultSettings, data }) {
  // Deep clone so we don't mutate the original
  const result = defaultSettings.map((row) => row.map((cell) => ({ ...cell })));

  if (data?.vehicles) {
    data.vehicles.forEach((vehicleRow, rowIndex) => {
      if (rowIndex < result.length) {
        vehicleRow.forEach((vehicle, colIndex) => {
          if (colIndex < result[rowIndex].length) {
            result[rowIndex][colIndex] = {
              ...result[rowIndex][colIndex],
              ...vehicle,
            };
          }
        });
      }
    });
  }

  return result;
}

/**
 * Updates the maquette data structure after a drag and drop operation
 * @param {Object} currentData - Current maquette data structure
 * @param {Object} dragData - Data from the drag operation { vehicle, fromQuadrant, rowIndex, colIndex }
 * @param {Object} dropLocation - Location where the drop occurred { toQuadrant, rowIndex, colIndex }
 * @returns {Object} Updated maquette data structure
 */
export function updateVehiclePosition(currentData, dragData, dropLocation) {
  // Create a deep copy of the current data
  const newData = JSON.parse(JSON.stringify(currentData));

  const { fromQuadrant, rowIndex: fromRow, colIndex: fromCol } = dragData;
  const { toQuadrant, rowIndex: toRow, colIndex: toCol } = dropLocation;

  // Get the vehicle being moved
  const movedVehicle = JSON.parse(JSON.stringify(dragData.vehicle));

  // Calculate position for 3x4 grid (4 columns per row)
  const fromPosition = fromRow * 4 + fromCol + 1;
  const toPosition = toRow * 4 + toCol + 1;

  // Clear the original position (set to space)
  if (newData[fromQuadrant]?.vehicles?.[fromRow]?.[fromCol]) {
    const newSpace = {
      type: "space",
      direction: "straight",
      id: `${fromQuadrant}_${fromPosition}`,
      name: `S${fromPosition}`,
    };
    newData[fromQuadrant].vehicles[fromRow][fromCol] = newSpace;
  }

  // Set the vehicle to the new position
  if (newData[toQuadrant]?.vehicles?.[toRow]?.[toCol]) {
    // Update the vehicle ID to match the new position
    const updatedVehicle = {
      ...movedVehicle,
      id: `${toQuadrant}_${toPosition}`,
    };
    newData[toQuadrant].vehicles[toRow][toCol] = updatedVehicle;
  }

  return newData;
}

export function incrementSuffix(str) {
  return str.replace(/_(\d+)$/, (_, num) => `_${parseInt(num) + 1}`);
}

// ========================
// AUTHENTICATION STATE MANAGEMENT
// ========================
/**
 * Preserve admin status across auth state changes
 * This function can be used to re-apply admin properties after auth state updates
 */
export const preserveAdminStatus = async () => {
  // Re-check admin status to ensure it's preserved after auth state change
  try {
    const result = await adminService.checkAdminStatus(false, null, store);
    return result;
  } catch (error) {
    console.error(
      "preserveAdminStatus: Error re-checking admin status:",
      error
    );
    return {
      isAdmin: false,
      isAdminForSchool: false,
      schoolIds: [],
      user: null,
    };
  }
};

// ========================
// NOTIFICATION UTILITIES (Framework7 independent)
// ========================
export const showToast = (message, type = "info") => {
  // For now, just use a simple alert - replace with F7 toast when available
  if (type === "error") {
    alert(`Error: ${message}`);
  }
};

// Function to safely update the selected school ID in localStorage to prevent multiple changes
let isUpdatingSchoolId = false;

export const setSafeSelectedSchoolId = (schoolId, schoolName = null) => {
  try {
    // School ID setting is no longer needed since we use .env default
    // This function is now obsolete as selectedSchoolId is handled via environment variables
    return;
  } catch (error) {
    console.error("Error setting selected school ID:", error);
    isUpdatingSchoolId = false; // Reset flag on error
  }
};

// Function to check if a student's access has expired
export const isStudentAccessExpired = () => {
  try {
    // We need to check the specific school relationship expiration, not the student record
    const studentId = localStorage.getItem("studentId");
    const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    if (!studentId || !selectedSchoolId) {
      return false; // If no student ID or school ID, return false (not expired)
    }

    // This function can't be async, so we'll use a synchronous check from localStorage
    // The actual check should happen in the components where we can use async calls
    // For now, we'll return false to allow the component to handle the check
    return false;
  } catch (error) {
    console.error("Error checking student access expiration:", error);
    return false;
  }
};

// Function to check if a student is logged in
export const isStudentLoggedIn = () => {
  try {
    // Check if student ID and selected school ID exist in localStorage
    const studentId = localStorage.getItem("studentId");
    const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    if (!studentId || !selectedSchoolId) {
      return false;
    }

    // Optionally, we can also verify the credentials are valid by checking against the database
    // For now, we'll consider the student logged in if both IDs exist in localStorage
    return true;
  } catch (error) {
    console.error("Error checking student login status:", error);
    return false;
  }
};

// Check if user is an admin with centralized logic
export const isAdminUser = (authUser, { includePending = true } = {}) => {
  if (!authUser) return false;
  if (isSuperAdmin(authUser?.email)) return true;
  const schoolIds = Array.isArray(authUser?.schoolIds) ? authUser.schoolIds : [];
  const hasSchoolAccess = !!authUser?.isAdminForSchool || schoolIds.length > 0;
  if (authUser?.isAdmin && hasSchoolAccess) return true;
  if (includePending) {
    return ["approved", "pending"].includes(authUser?.admin_status) && hasSchoolAccess;
  }
  return authUser?.admin_status === "approved" && hasSchoolAccess;
};

// Backward-compatible alias used across the app
export const isUserAdmin = (authUser) => isAdminUser(authUser);

// Approved-only check (excludes pending admins)
export const isApprovedAdminUser = (authUser) =>
  isAdminUser(authUser, { includePending: false });

// Check if user is a super admin (email is in the comma-separated VITE_REACT_APP_OWNER string)
export const isSuperAdmin = (email = null) => {
  const userEmail = email || store.state.authUser?.email;
  if (!userEmail) return false;

  const ownerEmails = process.env.VITE_REACT_APP_OWNER?.split(",").map(
    (e) => e.trim()
  );
  if (!ownerEmails || ownerEmails.length === 0) return false;

  return ownerEmails.includes(userEmail);
};



// Function to get admin status from f7 params
export const getIsAdminFromF7Params = (f7Instance = null) => {
  // If f7Instance is provided, use it directly
  if (
    f7Instance &&
    f7Instance.params &&
    f7Instance.params.isadmin !== undefined
  ) {
    return f7Instance.params.isadmin;
  }
  // Otherwise, try to use window.f7 as fallback
  if (
    typeof window !== "undefined" &&
    window.f7 &&
    window.f7.params &&
    window.f7.params.isadmin !== undefined
  ) {
    return window.f7.params.isadmin;
  }
  // Fallback to checking via store
  return isAdmin();
};

// ========================
// MAQUETTE DATA CONVERSION UTILITIES
// ========================
/**
 * Converts an existing maquette data structure to a 3x4 grid and adds correct IDs
 * @param {Object} existingMaquette - The existing maquette data (may be 3x3, 3x4 or other format)
 * @returns {Object} Updated maquette data with 3x4 grid and correct IDs
 */
export const convertTo3x3Grid = (existingMaquette) => {
  // First ensure all quadrants exist with default data if missing
  const updatedMaquette = ensureQuadrantsExist({ ...existingMaquette });

  const quadrants = ["top", "right", "bottom", "left"];

  // Then process existing quadrants to ensure correct 3x4 grid format and IDs
  for (const quadrant of quadrants) {
    if (updatedMaquette[quadrant] && updatedMaquette[quadrant].vehicles) {
      // Use the convertGrid function to ensure proper sequential IDs for this quadrant
      updatedMaquette[quadrant].vehicles = convertGrid(
        updatedMaquette[quadrant].vehicles,
        quadrant
      );
    }
  }

  return updatedMaquette;
};

/**
 * Ensures all quadrants exist in the maquette data with default empty data if missing
 * @param {Object} existingMaquette - The existing maquette data
 * @returns {Object} Maquette data with all 4 quadrants present
 */
export const ensureQuadrantsExist = (existingMaquette) => {
  // Create a copy of the existing maquette to avoid mutating the original
  const updatedMaquette = { ...existingMaquette };

  const quadrants = ["top", "right", "bottom", "left"];

  // Helper function to create default space vehicle
  const createSpace = (rowIndex, colIndex, direction) => {
    const positionNumber = rowIndex * 4 + colIndex + 1; // 4 columns per row for 3x4 grid
    return {
      type: "space",
      direction: "straight",
      id: `${direction}_${positionNumber}`,
      name: `S${positionNumber}`,
    };
  };

  // Ensure each quadrant exists with default data if missing
  for (const quadrant of quadrants) {
    if (!updatedMaquette[quadrant]) {
      updatedMaquette[quadrant] = {
        vehicles: [
          [
            createSpace(0, 0, quadrant),
            createSpace(0, 1, quadrant),
            createSpace(0, 2, quadrant),
            createSpace(0, 3, quadrant),
          ],
          [
            createSpace(1, 0, quadrant),
            createSpace(1, 1, quadrant),
            createSpace(1, 2, quadrant),
            createSpace(1, 3, quadrant),
          ],
          [
            createSpace(2, 0, quadrant),
            createSpace(2, 1, quadrant),
            createSpace(2, 2, quadrant),
            createSpace(2, 3, quadrant),
          ],
        ],
      };
    }
  }

  return updatedMaquette;
};

/**
 * Converts an array of maquette entries to 3x3 grid format
 * @param {Array} maquettesData - Array of maquette objects
 * @returns {Array} Converted array with 3x3 grid format
 */
export const convertMaquettesTo3x3Grid = (maquettesData) => {
  if (!Array.isArray(maquettesData)) {
    return [];
  }

  return maquettesData.map((maquette) => convertTo3x3Grid(maquette));
};

/**
 * Converts a 3x4 grid of vehicles to ensure sequential IDs
 * @param {Array} grid - The 3x4 grid array to convert
 * @param {string} quadrant - The quadrant name for ID prefix (e.g., 'top', 'right', 'bottom', 'left')
 * @returns {Array} Converted grid with updated sequential IDs
 */
export const convertGrid = (grid, quadrant = "top") => {
  if (!Array.isArray(grid) || grid.length === 0) {
    return grid;
  }

  // Create a deep copy to avoid mutating the original
  const newGrid = JSON.parse(JSON.stringify(grid));

  let positionCounter = 1;

  // Process each row in the grid
  for (let r = 0; r < newGrid.length; r++) {
    if (Array.isArray(newGrid[r])) {
      // Process each cell in the row (up to 4 columns for 3x4 grid)
      for (let c = 0; c < Math.min(newGrid[r].length, 4); c++) {
        if (newGrid[r][c] && typeof newGrid[r][c] === "object") {
          // Update the ID to follow the quadrant_position format (e.g., "top_1", "top_2", etc.)
          newGrid[r][c].id = `${quadrant}_${positionCounter}`;
          positionCounter++;
        }
      }
      // If the row has fewer than 4 elements, add space vehicles to make it 4
      while (newGrid[r].length < 4) {
        newGrid[r].push({
          type: "space",
          direction: "straight",
          id: `${quadrant}_${positionCounter}`,
          name: `S${positionCounter}`,
        });
        positionCounter++;
      }
    }
  }

  // If there are fewer than 3 rows, add rows to make it 3x4
  while (newGrid.length < 3) {
    const newRow = [];
    for (let c = 0; c < 4; c++) {
      newRow.push({
        type: "space",
        direction: "straight",
        id: `${quadrant}_${positionCounter}`,
        name: `S${positionCounter}`,
      });
      positionCounter++;
    }
    newGrid.push(newRow);
  }

  return newGrid;
};

export function getScrollParent(el) {
  let parent = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (/(auto|scroll)/.test(style.overflowY)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}
