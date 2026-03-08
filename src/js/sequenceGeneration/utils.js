/**
 * Basic utility functions for vehicle sequence handling
 */

import { SEQUENCE_VEHICLE_TYPES, SEQUENCE_OPERATORS, QUADRANTS } from "./constants.js";

/**
 * Check if a vehicle type is valid for sequence participation
 * @param {string} type - Vehicle type
 * @returns {boolean}
 */
export const isSequenceVehicle = (type) => {
  return SEQUENCE_VEHICLE_TYPES.includes(type);
};

/**
 * Create a unique vehicle identifier
 * @param {string} direction - Quadrant direction
 * @param {number} rowIndex - Row index
 * @param {number} colIndex - Column index
 * @returns {string}
 */
export const createVehicleId = (direction, rowIndex, colIndex) => {
  return `${direction}-${rowIndex}-${colIndex}`;
};

/**
 * Create a unique vehicle identifier from vehicle object (for test mode)
 * @param {Object} vehicle - Vehicle object with name, type, direction
 * @returns {string}
 */
export const createVehicleIdFromObject = (vehicle) => {
  return `${vehicle.name}_${vehicle.type}_${vehicle.direction}`;
};

/**
 * Parse a sequence string into an array of steps
 * Each step is either a single vehicle or an array of simultaneous vehicles
 * @param {string} sequence - Sequence string like "A+B-C-D"
 * @returns {Array} Array of steps, where each step is a string or array of strings
 */
export const parseSequence = (sequence) => {
  if (!sequence || typeof sequence !== "string") {
    return [];
  }

  // Split by sequential operator first
  const steps = sequence.split(SEQUENCE_OPERATORS.SEQUENTIAL);

  return steps.map((step) => {
    // Check if step contains simultaneous vehicles
    if (step.includes(SEQUENCE_OPERATORS.SIMULTANEOUS)) {
      return step.split(SEQUENCE_OPERATORS.SIMULTANEOUS).map((v) => v.trim());
    }
    return step.trim();
  });
};

/**
 * Tokenize a sequence string into an array of individual tokens (vehicles and operators)
 * @param {string} sequence - Sequence string like "F1+1-2"
 * @returns {Array} Array of tokens like ["F1", "+", "1", "-", "2"]
 */
export const tokenizeSequence = (sequence) => {
  if (!sequence || typeof sequence !== "string") {
    return [];
  }

  const tokens = [];
  let currentToken = "";

  for (const char of sequence) {
    if (
      char === SEQUENCE_OPERATORS.SIMULTANEOUS ||
      char === SEQUENCE_OPERATORS.SEQUENTIAL
    ) {
      if (currentToken.trim()) {
        tokens.push(currentToken.trim());
      }
      tokens.push(char);
      currentToken = "";
    } else if (char !== " ") {
      currentToken += char;
    }
  }

  // Don't forget the last token
  if (currentToken.trim()) {
    tokens.push(currentToken.trim());
  }

  return tokens;
};

/**
 * Convert tokens array back to sequence string
 * @param {Array} tokens - Array of tokens like ["F1", "+", "1", "-", "2"]
 * @returns {string} Sequence string like "F1+1-2"
 */
export const tokensToSequence = (tokens) => {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return "";
  }
  return tokens.join("");
};

/**
 * Check if a token is an operator
 * @param {string} token - Token to check
 * @returns {boolean}
 */
export const isOperator = (token) => {
  return (
    token === SEQUENCE_OPERATORS.SIMULTANEOUS ||
    token === SEQUENCE_OPERATORS.SEQUENTIAL
  );
};

/**
 * Toggle an operator between + and -
 * @param {string} operator - Current operator
 * @returns {string} Toggled operator
 */
export const toggleOperator = (operator) => {
  if (operator === SEQUENCE_OPERATORS.SIMULTANEOUS) {
    return SEQUENCE_OPERATORS.SEQUENTIAL;
  }
  return SEQUENCE_OPERATORS.SIMULTANEOUS;
};

/**
 * Insert a vehicle into tokens at a specific position
 * @param {Array} tokens - Current tokens array
 * @param {number} index - Position to insert after
 * @param {string} vehicleName - Vehicle name to insert
 * @param {string} operator - Operator to use before the vehicle
 * @returns {Array} New tokens array
 */
export const insertVehicleAtIndex = (
  tokens,
  index,
  vehicleName,
  operator = SEQUENCE_OPERATORS.SEQUENTIAL
) => {
  const newTokens = [...tokens];
  // Insert operator and vehicle after the specified index
  newTokens.splice(index + 1, 0, operator, vehicleName);
  return newTokens;
};

/**
 * Format an array of steps back into a sequence string
 * @param {Array} steps - Array of vehicle names or arrays of simultaneous vehicles
 * @returns {string}
 */
export const formatSequence = (steps) => {
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return "";
  }

  return steps
    .map((step) => {
      if (Array.isArray(step)) {
        return step.join(SEQUENCE_OPERATORS.SIMULTANEOUS);
      }
      return step;
    })
    .join(SEQUENCE_OPERATORS.SEQUENTIAL);
};

/**
 * Add a vehicle to a sequence with an operator
 * @param {string} currentSequence - Current sequence string
 * @param {string} vehicleName - Vehicle name to add
 * @param {string} operator - Operator to use ('+' or '-')
 * @returns {string} Updated sequence
 */
export const addVehicleToSequence = (
  currentSequence,
  vehicleName,
  operator
) => {
  if (!currentSequence) {
    return vehicleName;
  }
  return `${currentSequence} ${operator} ${vehicleName}`;
};

/**
 * Normalize a sequence string by removing extra spaces
 * @param {string} sequence - Sequence string
 * @returns {string}
 */
export const normalizeSequence = (sequence) => {
  if (!sequence) return "";
  return sequence
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*-\s*/g, "-")
    .trim();
};

/**
 * Compare two sequences for equality (normalized)
 * @param {string} seq1 - First sequence
 * @param {string} seq2 - Second sequence
 * @returns {boolean}
 */
export const sequencesEqual = (seq1, seq2) => {
  return normalizeSequence(seq1) === normalizeSequence(seq2);
};

/**
 * Generate a random starting quadrant order
 * @returns {Array} Shuffled quadrant order starting from random position
 */
export const getRandomQuadrantOrder = () => {
  const randomStartIndex = Math.floor(Math.random() * 4);
  const quadrantsOrder = [];
  for (let i = 0; i < 4; i++) {
    quadrantsOrder.push(QUADRANTS[(randomStartIndex + i) % 4]);
  }
  return quadrantsOrder;
};

/**
 * Check if a vehicle has Left Turn (LA) condition
 * @param {Object} vehicle - Vehicle object
 * @returns {boolean}
 */
export const hasLeftTurn = (vehicle) => {
  return vehicle && vehicle.direction === "left";
};

/**
 * Get all valid vehicles from a direction section at a specific row
 * @param {Object} dirSection - Direction section data
 * @param {number} rowIndex - Row index
 * @param {string} direction - Direction name
 * @param {Set} processedVehicles - Set of already processed vehicle IDs
 * @returns {Array} Array of vehicle info objects
 */
export const getValidVehiclesInRow = (
  dirSection,
  rowIndex,
  direction,
  processedVehicles
) => {
  const vehicles = [];

  if (
    !dirSection ||
    !dirSection.vehicles ||
    rowIndex >= dirSection.vehicles.length
  ) {
    return vehicles;
  }

  const row = dirSection.vehicles[rowIndex];
  if (!row || !Array.isArray(row)) {
    return vehicles;
  }

  // Scan ALL columns in the row, not just 0 and 1
  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const vehicle = row[colIndex];
    const vehicleId = createVehicleId(direction, rowIndex, colIndex);

    if (
      vehicle &&
      vehicle.name &&
      isSequenceVehicle(vehicle.type) &&
      !processedVehicles.has(vehicleId)
    ) {
      vehicles.push({
        vehicle,
        direction,
        rowIndex,
        colIndex,
        vehicleId,
      });
    }
  }

  return vehicles;
};

/**
 * Determine destination quadrant for a turning vehicle
 *
 * Turn mappings (counterclockwise for left, clockwise for right):
 * - LEFT turn (counterclockwise) → goes to RIGHT_OF_QUADRANT_MAP
 * - RIGHT turn (clockwise) → goes to LEFT_OF_QUADRANT_MAP
 *
 * @param {Object} vInfo - Vehicle info object with vehicle, direction (quadrant), rowIndex, colIndex
 * @returns {string|null} Destination quadrant
 */
export const getVehicleDestination = (vInfo) => {
  if (!vInfo || !vInfo.vehicle || !vInfo.direction) return null;

  // Import these locally to avoid circular dependencies
  const OPPOSITE_QUADRANT_MAP = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };

  const LEFT_OF_QUADRANT_MAP = {
    top: "left",
    left: "bottom",
    bottom: "right",
    right: "top",
  };

  const RIGHT_OF_QUADRANT_MAP = {
    top: "right",
    right: "bottom",
    bottom: "left",
    left: "top",
  };

  const turnDirection = vInfo.vehicle.direction;
  const currentQuadrant = vInfo.direction;

  if (!turnDirection || turnDirection === "straight") {
    return OPPOSITE_QUADRANT_MAP[currentQuadrant];
  } else if (turnDirection === "left") {
    // Left turn = counterclockwise rotation = go to what's on your RIGHT
    return RIGHT_OF_QUADRANT_MAP[currentQuadrant];
  } else if (turnDirection === "right") {
    // Right turn = clockwise rotation = go to what's on your LEFT
    return LEFT_OF_QUADRANT_MAP[currentQuadrant];
  }

  return null;
};
