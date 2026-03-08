/**
 * Turning vehicle filters (left and right turners)
 */

import { hasLeftTurn } from "../utils.js";

/**
 * PRIORITY 5: Filter Left-turners (LA)
 * LA vehicles have priority over right-turners
 * Multiple LA vehicles can go simultaneously
 * @param {Array} vehicles - Array of vehicle info objects
 * @returns {Object} { laVehicles: [], others: [] }
 */
export const filterLeftTurners = (vehicles) => {
  const laVehicles = [];
  const others = [];

  for (const vInfo of vehicles) {
    if (hasLeftTurn(vInfo.vehicle)) {
      laVehicles.push(vInfo);
    } else {
      others.push(vInfo);
    }
  }

  return { laVehicles, others };
};

/**
 * PRIORITY 6: Filter Right-turners (RA)
 * RA vehicles have the most restrictions and usually yield
 * @param {Array} vehicles - Array of vehicle info objects
 * @returns {Object} { raVehicles: [], others: [] }
 */
export const filterRightTurners = (vehicles) => {
  const raVehicles = [];
  const others = [];

  for (const vInfo of vehicles) {
    const isRightTurn = vInfo.vehicle.direction === "right";

    if (isRightTurn) {
      raVehicles.push(vInfo);
    } else {
      others.push(vInfo);
    }
  }

  return { raVehicles, others };
};

/**
 * PRIORITY 8: Traffic courtesy (VF/AVF)
 * Last resort when no other rules apply
 * @param {Array} vehicles - Array of vehicle info objects
 * @returns {Array} Vehicles sorted by courtesy rules
 */
export const applyTrafficCourtesy = (vehicles) => {
  // For now, return vehicles in the order they were provided
  // This could be enhanced with specific courtesy logic if needed
  return vehicles;
};
