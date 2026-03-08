/**
 * Bike path exception filtering
 *
 * PRIORITY 7: Filter bike path exceptions
 * Two LA or two RA side-by-side on bike paths can go together
 * Enhanced with bike lane detection for bike + car combinations
 */

import { hasLeftTurn, getVehicleDestination } from "../utils.js";
import { hasBikeLane } from "../junctionDetection/bikeLanes.js";

/**
 * Check if two side-by-side vehicles (bike + car) can go together based on bike lane rules
 *
 * Rules:
 * - Both turning LEFT (bike on outer left, car on inner right):
 *   - If destination has bike lanes → both go together
 *   - If no bike lanes → bike goes first, car follows
 *
 * - Both turning RIGHT (car on left, bike on right):
 *   - If destination has bike lanes → both go together
 *   - If no bike lanes → car goes first, bike follows
 *
 * @param {Object} v1 - First vehicle info
 * @param {Object} v2 - Second vehicle info
 * @param {Object} maquetteData - Full maquette data (for bike lane detection)
 * @returns {Object} { canGoTogether: boolean, priority: 'v1'|'v2'|'equal', reason: string }
 */
export const checkBikeCarPriority = (v1, v2, maquetteData) => {
  // Check if one is a bike and one is a car
  const v1IsBike = v1.vehicle.type === "bike";
  const v2IsBike = v2.vehicle.type === "bike";

  // Must be exactly one bike and one car
  if ((v1IsBike && v2IsBike) || (!v1IsBike && !v2IsBike)) {
    return { canGoTogether: false, priority: "equal", reason: "Not bike+car combination" };
  }

  // Check if they're side-by-side in the same row
  if (v1.direction !== v2.direction || v1.rowIndex !== v2.rowIndex) {
    return { canGoTogether: false, priority: "equal", reason: "Not side-by-side" };
  }

  if (Math.abs(v1.colIndex - v2.colIndex) !== 1) {
    return { canGoTogether: false, priority: "equal", reason: "Not adjacent" };
  }

  // Determine which is left and which is right
  const leftVehicle = v1.colIndex < v2.colIndex ? v1 : v2;
  const rightVehicle = v1.colIndex < v2.colIndex ? v2 : v1;

  const leftIsBike = leftVehicle.vehicle.type === "bike";
  const rightIsBike = rightVehicle.vehicle.type === "bike";

  // Get turn directions
  const leftTurn = leftVehicle.vehicle.direction;
  const rightTurn = rightVehicle.vehicle.direction;

  // CASE 1: Both turning LEFT
  if (leftTurn === "left" && rightTurn === "left") {
    // Bike should be on outer left (col 0), car on inner right (col 1)
    if (leftIsBike && !rightIsBike) {
      // Correct positioning: bike left, car right
      const destination = getVehicleDestination(leftVehicle);
      const destinationHasBikeLane = destination && hasBikeLane(maquetteData, destination);

      if (destinationHasBikeLane) {
        console.log(`[BIKELANE] Both LA: Destination ${destination} has bike lane → simultaneous`);
        return {
          canGoTogether: true,
          priority: "equal",
          reason: "Both LA, destination has bike lane"
        };
      } else {
        console.log(`[BIKELANE] Both LA: No bike lane in ${destination} → bike first, car second`);
        return {
          canGoTogether: false,
          priority: leftVehicle === v1 ? "v1" : "v2",
          reason: "Both LA, no bike lane, bike has priority"
        };
      }
    } else if (!leftIsBike && rightIsBike) {
      // Wrong positioning for left turns: car on left, bike on right
      // Still apply the rule but note unusual positioning
      const destination = getVehicleDestination(leftVehicle);
      const destinationHasBikeLane = destination && hasBikeLane(maquetteData, destination);

      if (destinationHasBikeLane) {
        console.log(`[BIKELANE] Both LA: Destination ${destination} has bike lane → simultaneous`);
        return {
          canGoTogether: true,
          priority: "equal",
          reason: "Both LA, destination has bike lane"
        };
      } else {
        // Bike goes first even though it's on the right
        console.log(`[BIKELANE] Both LA: No bike lane in ${destination} → bike first`);
        return {
          canGoTogether: false,
          priority: rightVehicle === v1 ? "v1" : "v2",
          reason: "Both LA, no bike lane, bike has priority"
        };
      }
    }
  }

  // CASE 2: Both turning RIGHT
  if (leftTurn === "right" && rightTurn === "right") {
    const destination = getVehicleDestination(leftVehicle);
    const destinationHasBikeLane = destination && hasBikeLane(maquetteData, destination);

    if (destinationHasBikeLane) {
      console.log(`[BIKELANE] Both RA: Destination ${destination} has bike lane → simultaneous`);
      return {
        canGoTogether: true,
        priority: "equal",
        reason: "Both RA, destination has bike lane"
      };
    } else {
      // Car goes first (car is on left for right turns)
      console.log(`[BIKELANE] Both RA: No bike lane in ${destination} → car first, bike second`);
      if (leftIsBike) {
        // Bike on left, car on right: car has priority
        return {
          canGoTogether: false,
          priority: rightVehicle === v1 ? "v1" : "v2",
          reason: "Both RA, no bike lane, car has priority"
        };
      } else {
        // Car on left, bike on right: car has priority
        return {
          canGoTogether: false,
          priority: leftVehicle === v1 ? "v1" : "v2",
          reason: "Both RA, no bike lane, car has priority"
        };
      }
    }
  }

  // Mixed turns or other cases: use standard collision detection
  return { canGoTogether: false, priority: "equal", reason: "Mixed turn directions" };
};

/**
 * Filter bike path exceptions
 * Two LA or two RA side-by-side can go together
 * Enhanced with bike lane detection for bike + car combinations
 * @param {Array} vehicles - Array of vehicle info objects
 * @param {Object} maquetteData - Full maquette data (for bike lane detection)
 * @returns {Object} { bikePathPairs: [], others: [], bikePriority: [] }
 */
export const filterBikePathExceptions = (vehicles, maquetteData) => {
  const bikePathPairs = [];
  const bikePriority = []; // Vehicles with bike/car priority ordering
  const others = [];
  const processed = new Set();

  // Group vehicles by row and direction type
  const groupedByRow = {};
  for (const vInfo of vehicles) {
    const key = `${vInfo.direction}-${vInfo.rowIndex}`;
    if (!groupedByRow[key]) {
      groupedByRow[key] = [];
    }
    groupedByRow[key].push(vInfo);
  }

  // Check for pairs in the same row
  for (const key in groupedByRow) {
    const rowVehicles = groupedByRow[key];
    if (rowVehicles.length === 2) {
      const [v1, v2] = rowVehicles;
      const bothLA = hasLeftTurn(v1.vehicle) && hasLeftTurn(v2.vehicle);
      const bothRA =
        v1.vehicle.direction === "right" && v2.vehicle.direction === "right";

      if (bothLA || bothRA) {
        // Check for bike + car combination with bike lane logic
        const bikeCarResult = checkBikeCarPriority(v1, v2, maquetteData);

        if (bikeCarResult.canGoTogether) {
          // Both can go together (destination has bike lane)
          console.log(`[BIKELANE] Adding pair to simultaneous: ${v1.vehicle.name} + ${v2.vehicle.name}`);
          bikePathPairs.push(v1, v2);
          processed.add(v1.vehicleId);
          processed.add(v2.vehicleId);
        } else if (bikeCarResult.priority !== "equal") {
          // One has priority over the other
          console.log(`[BIKELANE] Priority ordering: ${bikeCarResult.reason}`);
          if (bikeCarResult.priority === "v1") {
            bikePriority.push({ first: v1, second: v2 });
          } else {
            bikePriority.push({ first: v2, second: v1 });
          }
          processed.add(v1.vehicleId);
          processed.add(v2.vehicleId);
        } else {
          // Both same type (both bikes or both cars) - can go together
          bikePathPairs.push(v1, v2);
          processed.add(v1.vehicleId);
          processed.add(v2.vehicleId);
        }
      }
    }
  }

  // Add remaining vehicles to others
  for (const vInfo of vehicles) {
    if (!processed.has(vInfo.vehicleId)) {
      others.push(vInfo);
    }
  }

  return { bikePathPairs, bikePriority, others };
};
