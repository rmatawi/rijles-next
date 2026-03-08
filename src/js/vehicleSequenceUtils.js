/**
 * Centralized utilities for vehicle sequence handling in Maquette components.
 *
 * This file re-exports all functionality from the refactored modular structure
 * for backward compatibility with existing code.
 *
 * The actual implementation has been split into:
 * - sequenceGeneration/constants.js - Constants and mappings
 * - sequenceGeneration/utils.js - Basic utility functions
 * - sequenceGeneration/quadrants.js - Quadrant relationship helpers
 * - sequenceGeneration/junctionDetection/ - Junction and road detection
 * - sequenceGeneration/filters/ - Priority filtering functions
 * - sequenceGeneration/emergencyHandling/ - Emergency vehicle logic
 * - sequenceGeneration/generator.js - Main sequence generation algorithm
 */

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  SEQUENCE_VEHICLE_TYPES,
  SEQUENCE_OPERATORS,
  QUADRANTS,
  OPPOSITE_QUADRANT_MAP,
  LEFT_OF_QUADRANT_MAP,
  RIGHT_OF_QUADRANT_MAP,
  LEFT_QUADRANT_MAP,
} from "./sequenceGeneration/constants.js";

// ============================================================================
// BASIC UTILITIES
// ============================================================================
export {
  isSequenceVehicle,
  createVehicleId,
  createVehicleIdFromObject,
  parseSequence,
  tokenizeSequence,
  tokensToSequence,
  isOperator,
  toggleOperator,
  insertVehicleAtIndex,
  formatSequence,
  addVehicleToSequence,
  normalizeSequence,
  sequencesEqual,
  getRandomQuadrantOrder,
  hasLeftTurn,
  getValidVehiclesInRow,
  getVehicleDestination,
} from "./sequenceGeneration/utils.js";

// ============================================================================
// QUADRANT HELPERS
// ============================================================================
export {
  getOppositeQuadrant,
  getLeftQuadrant,
  getRightQuadrant,
  getMainRoadQuadrants,
  getSideRoadQuadrant,
  getAdjacentQuadrants,
} from "./sequenceGeneration/quadrants.js";

// ============================================================================
// JUNCTION DETECTION
// ============================================================================
export { detectTJunction } from "./sequenceGeneration/junctionDetection/tJunction.js";
export { hasBikeLane } from "./sequenceGeneration/junctionDetection/bikeLanes.js";
export {
  isZandweg,
  isInrit,
  detectZandwegPairs,
  detectRegularRoadPairs,
  determineZandwegPriority,
} from "./sequenceGeneration/junctionDetection/zandweg.js";

// ============================================================================
// PRIORITY FILTERS
// ============================================================================
export { filterEmergencyVehicles } from "./sequenceGeneration/filters/emergencyVehicles.js";
export {
  filterByRoadType,
  filterByRoadWidth,
} from "./sequenceGeneration/filters/roadType.js";
export {
  hasLeftVacant,
  filterLeftVacant,
} from "./sequenceGeneration/filters/leftVacant.js";
export {
  filterLeftTurners,
  filterRightTurners,
  applyTrafficCourtesy,
} from "./sequenceGeneration/filters/turningVehicles.js";
export {
  checkBikeCarPriority,
  filterBikePathExceptions,
} from "./sequenceGeneration/filters/bikePathExceptions.js";

// ============================================================================
// EMERGENCY VEHICLE HANDLING
// ============================================================================
export { scanForEmergencyVehicles } from "./sequenceGeneration/emergencyHandling/scanner.js";
export {
  getDestinationQuadrant,
  isDrivewayBusy,
  getDrivewayVehicles,
  clearDriveway,
} from "./sequenceGeneration/emergencyHandling/drivewayClearing.js";

// ============================================================================
// MAIN SEQUENCE GENERATOR
// ============================================================================
export { generateVehicleSequence } from "./sequenceGeneration/generator.js";
