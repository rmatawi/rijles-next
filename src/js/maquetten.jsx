// Utility functions for maquette management
//
// Vehicle condition detection:
// - Added formula to detect vehicle turning direction (straight/left/right)
// - Added detection for vehicles on special road types (INRIT S/INRIT B/TCROSS/ZANDWEG)
// - Added detection for vehicles turning into special road types
// - Added CSS classes for visualization: direction-*, on-*, turning-into-*

// Create a template for a new maquette
export const createMaquetteTemplate = (number) => {
  // Create a fully occupied street side (3 rows x 4 vehicles)
  const createFullStreetSide = () => ({
    note: "",
    vehicles: [
      [
        { type: "bike", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
      ],
      [
        { type: "bike", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
      ],
      [
        { type: "bike", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
        { type: "car", direction: "straight", name: "X", },
      ],
    ],
  });

  return {
    title: number.toString(),
    answName: "",
    importantNotes: "",
    notes: "",
    roadsize: "S/B",
    sequence: "",
    top: createFullStreetSide(),
    bottom: createFullStreetSide(),
    left: createFullStreetSide(),
    right: createFullStreetSide(),
  };
};

// Get the next available maquette number
export const getNextMaquetteNumber = (existingData) => {
  const existingNumbers = Object.keys(existingData)
    .map((key) => parseInt(key.replace("maquette_", "")))
    .filter((num) => !isNaN(num));
  return existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
};

// Get maquettes for a specific group with proper integer-based sorting
export const getMaquettesForGroup = (
  groupName,
  maquettenData,
  allMaquetteGroups
) => {
  const group = allMaquetteGroups.find((g) => g.id === groupName);
  if (!group) return [];

  // Find all maquettes that belong to this group (including dynamically added ones)
  const groupMaquettes = Object.keys(maquettenData)
    .filter((key) => {
      const maquette = maquettenData[key];
      return maquette && maquette.groupName === groupName;
    })
    .map((key) => {
      const keyWithoutPrefix = key.replace("maquette_", "");
      // Preserve the original format for maquetteNumber to maintain leading zeros like "001", "002", etc.
      const maquetteNumber = keyWithoutPrefix;

      const maquette = maquettenData[key];
      return {
        key,
        maquette,
        maquetteNumber,
      };
    })
    .sort((a, b) => {
      // Use string comparison to achieve hierarchical sorting:
      // "001" < "0011" < "002" (child IDs come right after parent IDs)
      return a.maquetteNumber.localeCompare(b.maquetteNumber);
    });

  return groupMaquettes;
};

// Simplified add function - just for reference, actual logic is in MaquettePage
export const addMaquetteToGroup = (
  groupName,
  maquetteNumber,
  insertAtPosition = null
) => {
  console.warn(
    "addMaquetteToGroup is deprecated, use handleAddMaquette in MaquettePage"
  );
};

export const maquettenData = {};
