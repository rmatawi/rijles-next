/**
 * Driveway clearing logic for emergency vehicles
 *
 * When an emergency vehicle needs to enter a busy driveway,
 * the driveway must be cleared first before the emergency vehicle proceeds.
 */

import {
  OPPOSITE_QUADRANT_MAP,
  LEFT_OF_QUADRANT_MAP,
  RIGHT_OF_QUADRANT_MAP,
  SEQUENCE_OPERATORS,
} from "../constants.js";
import { isSequenceVehicle, createVehicleId } from "../utils.js";
import { canGoTogether } from "../../collisionDetection.js";

/**
 * Determine which quadrant a vehicle will enter based on its turn direction
 *
 * Turn mappings (counterclockwise for left, clockwise for right):
 * - LEFT turn (counterclockwise) → goes to RIGHT_OF_QUADRANT_MAP
 * - RIGHT turn (clockwise) → goes to LEFT_OF_QUADRANT_MAP
 *
 * @param {Object} vehicle - Vehicle object with direction property
 * @param {string} currentQuadrant - Current quadrant the vehicle is in
 * @returns {string|null} Destination quadrant or null if staying in place
 */
export const getDestinationQuadrant = (vehicle, currentQuadrant) => {
  if (!vehicle || !vehicle.direction) {
    // No direction specified = going straight through to opposite quadrant
    return OPPOSITE_QUADRANT_MAP[currentQuadrant];
  }

  if (vehicle.direction === "straight") {
    return OPPOSITE_QUADRANT_MAP[currentQuadrant];
  } else if (vehicle.direction === "left") {
    // Left turn = counterclockwise rotation = go to what's on your RIGHT
    return RIGHT_OF_QUADRANT_MAP[currentQuadrant];
  } else if (vehicle.direction === "right") {
    // Right turn = clockwise rotation = go to what's on your LEFT
    return LEFT_OF_QUADRANT_MAP[currentQuadrant];
  }

  return null;
};

/**
 * Check if a quadrant (driveway) has unprocessed vehicles blocking it
 * @param {Object} maquetteData - Full maquette data
 * @param {string} quadrant - Quadrant to check
 * @param {Set} processedVehicles - Set of already processed vehicle IDs
 * @returns {boolean} True if quadrant has unprocessed vehicles
 */
export const isDrivewayBusy = (maquetteData, quadrant, processedVehicles) => {
  if (!maquetteData || !quadrant) return false;

  const dirSection = maquetteData[quadrant];
  if (!dirSection || !dirSection.vehicles) return false;

  // Check all rows and columns for unprocessed vehicles
  for (let rowIndex = 0; rowIndex < dirSection.vehicles.length; rowIndex++) {
    const row = dirSection.vehicles[rowIndex];
    if (!row || !Array.isArray(row)) continue;

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const vehicle = row[colIndex];
      const vehicleId = createVehicleId(quadrant, rowIndex, colIndex);

      if (
        vehicle &&
        vehicle.name &&
        isSequenceVehicle(vehicle.type) &&
        !processedVehicles.has(vehicleId)
      ) {
        return true; // Found unprocessed vehicle blocking the driveway
      }
    }
  }

  return false; // Driveway is clear
};

/**
 * Get all unprocessed vehicles in a quadrant (for clearing the driveway)
 * Returns vehicles in order: front rows first (row 0, then 1, then 2)
 * @param {Object} maquetteData - Full maquette data
 * @param {string} quadrant - Quadrant to get vehicles from
 * @param {Set} processedVehicles - Set of already processed vehicle IDs
 * @returns {Array} Array of vehicle info objects in exit order
 */
export const getDrivewayVehicles = (maquetteData, quadrant, processedVehicles) => {
  const vehicles = [];
  const dirSection = maquetteData[quadrant];

  if (!dirSection || !dirSection.vehicles) return vehicles;

  // Process rows in order (front to back: 0, 1, 2)
  // Vehicles in front rows should exit first
  for (let rowIndex = 0; rowIndex < dirSection.vehicles.length; rowIndex++) {
    const row = dirSection.vehicles[rowIndex];
    if (!row || !Array.isArray(row)) continue;

    // Within each row, scan all columns
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const vehicle = row[colIndex];
      const vehicleId = createVehicleId(quadrant, rowIndex, colIndex);

      if (
        vehicle &&
        vehicle.name &&
        isSequenceVehicle(vehicle.type) &&
        !processedVehicles.has(vehicleId)
      ) {
        vehicles.push({
          vehicle,
          direction: quadrant,
          rowIndex,
          colIndex,
          vehicleId,
        });
      }
    }
  }

  return vehicles;
};

/**
 * Process driveway vehicles to clear the way for an emergency vehicle
 * Applies simplified priority rules: process row by row, front to back
 * @param {Array} drivewayVehicles - Vehicles blocking the driveway
 * @param {Array} sequenceSteps - Current sequence steps array (will be modified)
 * @param {Set} processedVehicles - Set of processed vehicle IDs (will be modified)
 * @param {string} drivewayQuadrant - Name of the driveway quadrant being cleared
 * @returns {number} Number of vehicles cleared
 */
export const clearDriveway = (
  drivewayVehicles,
  sequenceSteps,
  processedVehicles,
  drivewayQuadrant
) => {
  console.log(
    `[DRIVEWAY] Clearing ${drivewayVehicles.length} vehicles from ${drivewayQuadrant} driveway`
  );

  let clearedCount = 0;

  // Group vehicles by row
  const vehiclesByRow = { 0: [], 1: [], 2: [] };
  for (const vInfo of drivewayVehicles) {
    if (vehiclesByRow[vInfo.rowIndex]) {
      vehiclesByRow[vInfo.rowIndex].push(vInfo);
    }
  }

  // Process each row in order (front to back)
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    const rowVehicles = vehiclesByRow[rowIndex];
    if (rowVehicles.length === 0) continue;

    console.log(`[DRIVEWAY]   Clearing row ${rowIndex}: ${rowVehicles.length} vehicles`);

    // Check if vehicles in this row can go together (side-by-side)
    if (rowVehicles.length === 2) {
      const v1 = rowVehicles[0];
      const v2 = rowVehicles[1];

      // Use collision detection to see if they can go together
      const result = canGoTogether(v1, v2);

      if (result.canGoTogether) {
        // Both vehicles can exit together
        const simultaneousGroup = `${v1.vehicle.name}${SEQUENCE_OPERATORS.SIMULTANEOUS}${v2.vehicle.name}`;
        console.log(`[DRIVEWAY]     → ${v1.vehicle.name} + ${v2.vehicle.name} (simultaneous exit)`);
        sequenceSteps.push(simultaneousGroup);
        processedVehicles.add(v1.vehicleId);
        processedVehicles.add(v2.vehicleId);
        clearedCount += 2;
        continue;
      }
    }

    // Process vehicles one by one if they can't go together
    for (const vInfo of rowVehicles) {
      console.log(`[DRIVEWAY]     → ${vInfo.vehicle.name} (sequential exit)`);
      sequenceSteps.push(vInfo.vehicle.name);
      processedVehicles.add(vInfo.vehicleId);
      clearedCount++;
    }
  }

  console.log(`[DRIVEWAY] Driveway cleared: ${clearedCount} vehicles processed`);
  return clearedCount;
};
