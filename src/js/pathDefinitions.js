// Shared path definitions for maquette animations
// These SVG path definitions are used across multiple components for consistent animation paths

export const PATH_DEFINITIONS = {
  right: [
    "M0,321.11H58c85.7,0,264.6-136.81,264.6-171.2V1.42",
    "M.5,301.11H92.78c91.61,0,200.07-109.76,200.07-152V1.42",
    "M.5,301.07H93.09c97,0,172.11-98.7,172.11-152.33V1.42",
    "M.5,278.61H73c76,0,134.83-91.3,134.83-140.91V1.42",
  ],
  left: [
    "M496.5,174.26H343.57c-15.14,0-21-7.25-21-12.49V1.42",
    "M496.5,194.59H349.9c-37.12,0-57-16.16-57-40.16V1.42",
    "M496.5,217.57H313.57c-57.52,0-105.7-22.42-105.7-68.87V1.42",
    "M496.5,195.15H349.9c-46.1,0-84.7-2.63-84.7-40.19V1.42",
  ],
  straight: [
    "M322.6,0.25V496.75", // Converted from line element
    "M292.85,0V496.5",
    "M265.2,0V161.76c0,83.35,27,139.31,27,201.52V496.5",
    "M207.87,0V161.76c0,83.35,57.33,139.31,57.33,201.52V496.5", // Additional straight path
  ],
};

// Helper function to get a specific path by direction and index
export const getPathDefinition = (direction, index) => {
  if (!PATH_DEFINITIONS[direction]) {
    console.warn(`Invalid direction: ${direction}`);
    return null;
  }
  
  if (index < 0 || index >= PATH_DEFINITIONS[direction].length) {
    console.warn(`Invalid index: ${index} for direction: ${direction}`);
    return null;
  }
  
  return PATH_DEFINITIONS[direction][index];
};

// Helper function to get all paths for a direction
export const getPathsForDirection = (direction) => {
  return PATH_DEFINITIONS[direction] || [];
};

// Helper function to get all path definitions
export const getAllPathDefinitions = () => {
  return PATH_DEFINITIONS;
};