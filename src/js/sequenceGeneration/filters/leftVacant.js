/**
 * Left Vacant (LV) filtering
 *
 * PRIORITY 4: Filter vehicles with Left Vacant (LV)
 *
 * SURINAME LEFT-HAND TRAFFIC RULES (Equal rank roads):
 * - LV (linksvrij) = STRAIGHT-GOING or RIGHT-TURNING vehicles with left side vacant
 * - LA (linksaffer) = LEFT-TURNING vehicles (do NOT require left vacant)
 * - Both LA and LV can proceed if they don't need to yield
 * - LA and LV can go together if no collision
 * - Traffic from the LEFT has priority at equal-rank intersections
 *
 * APPLIES TO: Equal-rank junctions with NO special rules (no zandweg, no T-cross, no inrit-s, no inrit-b)
 *
 * IMPORTANT: LV applies to straight + right turns only, NOT left turns
 */

import {
  OPPOSITE_QUADRANT_MAP,
  LEFT_OF_QUADRANT_MAP,
  RIGHT_OF_QUADRANT_MAP,
  LEFT_QUADRANT_MAP,
} from "../constants.js";
import { isSequenceVehicle, createVehicleId } from "../utils.js";
import { detectTJunction } from "../junctionDetection/tJunction.js";

/**
 * Check if a position has Left Vacant (LV) condition
 * At T-junctions, side road vehicles don't block main road LV checks
 * @param {Object} maquetteData - Full maquette data
 * @param {string} direction - Current quadrant direction
 * @param {number} rowIndex - Row index
 * @param {Set} processedVehicles - Set of already processed vehicle IDs
 * @returns {boolean}
 */
export const hasLeftVacant = (
  maquetteData,
  direction,
  rowIndex,
  processedVehicles
) => {
  const leftQuadrant = LEFT_QUADRANT_MAP[direction];
  const leftDirSection = maquetteData[leftQuadrant];

  if (
    !leftDirSection ||
    !leftDirSection.vehicles ||
    rowIndex >= leftDirSection.vehicles.length
  ) {
    return true; // No vehicles in left quadrant = vacant
  }

  const leftRow = leftDirSection.vehicles[rowIndex];
  if (!leftRow || !Array.isArray(leftRow)) {
    return true;
  }

  // At T-junction, check if the current vehicle is on main road
  // and the left quadrant is the side road - if so, ignore side road vehicles
  const tJunction = detectTJunction(maquetteData);
  let ignoreSideRoad = false;
  if (tJunction) {
    const inritQuadrant = tJunction.inritQuadrant;
    const sideRoadQuadrant = OPPOSITE_QUADRANT_MAP[inritQuadrant];
    const mainRoad1 = LEFT_OF_QUADRANT_MAP[inritQuadrant];
    const mainRoad2 = RIGHT_OF_QUADRANT_MAP[inritQuadrant];

    // If current vehicle is on main road and left quadrant is side road, ignore it
    const isOnMainRoad = direction === mainRoad1 || direction === mainRoad2;
    const leftIsSideRoad = leftQuadrant === sideRoadQuadrant;
    ignoreSideRoad = isOnMainRoad && leftIsSideRoad;
  }

  if (ignoreSideRoad) {
    return true; // Side road doesn't block main road LV
  }

  // Check for vehicles in the same row index in the left quadrant
  // Scan ALL columns, not just 0 and 1
  for (let leftColIndex = 0; leftColIndex < leftRow.length; leftColIndex++) {
    const leftVehicle = leftRow[leftColIndex];
    if (
      leftVehicle &&
      isSequenceVehicle(leftVehicle.type) &&
      leftVehicle.name &&
      !processedVehicles.has(
        createVehicleId(leftQuadrant, rowIndex, leftColIndex)
      )
    ) {
      return false; // Found unprocessed vehicle in left quadrant
    }
  }

  return true; // Left side has no unprocessed vehicle
};

/**
 * Filter vehicles with Left Vacant condition
 * Among LV vehicles, straight-going traffic has priority over turning traffic
 * when side-by-side (same row) and paths would collide
 * @param {Array} vehicles - Array of vehicle info objects
 * @param {Object} maquetteData - Full maquette data
 * @param {Set} processedVehicles - Set of already processed vehicle IDs
 * @returns {Object} { lvVehicles: [], others: [] }
 */
export const filterLeftVacant = (vehicles, maquetteData, processedVehicles) => {
  const lvVehicles = [];
  const others = [];

  for (const vInfo of vehicles) {
    const hasLV = hasLeftVacant(
      maquetteData,
      vInfo.direction,
      vInfo.rowIndex,
      processedVehicles
    );

    // LV applies ONLY to straight-going or right-turning vehicles with left vacant
    // Left-turners are excluded (they are LA, not LV)
    const isLeftTurn = vInfo.vehicle.direction === "left";

    if (hasLV && !isLeftTurn) {
      lvVehicles.push(vInfo);
    } else {
      others.push(vInfo);
    }
  }

  // Sort LV vehicles: straight-going first, then right-turning
  // This handles the case where straight traffic with LV has priority
  // over turning traffic with LV when they're side-by-side
  lvVehicles.sort((a, b) => {
    const aStraight = a.vehicle.direction === "straight" || !a.vehicle.direction;
    const bStraight = b.vehicle.direction === "straight" || !b.vehicle.direction;

    if (aStraight && !bStraight) return -1; // a goes first
    if (!aStraight && bStraight) return 1;  // b goes first
    return 0; // keep original order
  });

  return { lvVehicles, others };
};
