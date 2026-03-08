/**
 * Collision Detection Module for Left-Hand Traffic
 *
 * This module handles collision detection and priority rules for vehicles
 * approaching an intersection from the same quadrant (side-by-side).
 *
 * Assumes LEFT-HAND traffic (like UK, Australia, South Africa, etc.)
 */

/**
 * Check if two vehicles are side-by-side (same quadrant, same row, adjacent columns)
 * @param {Object} v1 - First vehicle info
 * @param {Object} v2 - Second vehicle info
 * @returns {boolean}
 */
export const areSideBySide = (v1, v2) => {
  return (
    v1.direction === v2.direction &&
    v1.rowIndex === v2.rowIndex &&
    Math.abs(v1.colIndex - v2.colIndex) === 1
  );
};

/**
 * Determine physical positions of side-by-side vehicles
 * @param {Object} v1 - First vehicle info
 * @param {Object} v2 - Second vehicle info
 * @returns {Object} { leftVehicle, rightVehicle }
 */
export const getPhysicalPositions = (v1, v2) => {
  if (v1.colIndex < v2.colIndex) {
    return { leftVehicle: v1, rightVehicle: v2 };
  }
  return { leftVehicle: v2, rightVehicle: v1 };
};

/**
 * Get turn direction of a vehicle
 * @param {Object} vehicle - Vehicle object
 * @returns {string} 'straight', 'left', or 'right'
 */
export const getTurnDirection = (vehicle) => {
  if (!vehicle.direction || vehicle.direction === "straight") {
    return "straight";
  }
  return vehicle.direction; // 'left' or 'right'
};

/**
 * Check if paths would collide for side-by-side vehicles (LEFT-HAND TRAFFIC)
 *
 * In left-hand traffic, vehicles drive on the left side of the road:
 * - Left position vehicle uses the leftmost lane
 * - Right position vehicle uses the rightmost lane
 *
 * @param {Object} leftVehicle - Left position vehicle info
 * @param {Object} rightVehicle - Right position vehicle info
 * @returns {boolean} true if paths collide
 */
export const pathsCollide = (leftVehicle, rightVehicle) => {
  const leftTurn = getTurnDirection(leftVehicle.vehicle);
  const rightTurn = getTurnDirection(rightVehicle.vehicle);

  // Non-collision cases for LEFT-HAND traffic:

  // 1. Both going straight (parallel paths)
  if (leftTurn === "straight" && rightTurn === "straight") {
    return false;
  }

  // 2. Both turning left (parallel left turns)
  if (leftTurn === "left" && rightTurn === "left") {
    return false;
  }

  // 3. Both turning right (parallel right turns)
  if (leftTurn === "right" && rightTurn === "right") {
    return false;
  }

  // 4. Left vehicle turns left, right vehicle turns right (diverging paths)
  if (leftTurn === "left" && rightTurn === "right") {
    return false;
  }

  // 5. Left vehicle turns left, right vehicle goes straight (NO collision in left-hand traffic)
  // The left vehicle stays in the left lane turning left
  // The right vehicle stays in the right lane going straight
  if (leftTurn === "left" && rightTurn === "straight") {
    return false;
  }

  // 6. Left vehicle goes straight, right vehicle turns right (NO collision in left-hand traffic)
  // The left vehicle stays in the left lane going straight
  // The right vehicle stays in the right lane turning right
  if (leftTurn === "straight" && rightTurn === "right") {
    return false;
  }

  // Collision cases for LEFT-HAND traffic:
  // 7. Left vehicle goes straight, right vehicle turns left (COLLISION)
  //    Right vehicle crosses the left vehicle's straight path
  // 8. Left vehicle turns right, right vehicle goes straight (COLLISION)
  //    Left vehicle crosses the right vehicle's straight path
  // 9. Left vehicle turns right, right vehicle turns left (COLLISION)
  //    Paths cross each other

  return true;
};

/**
 * Apply priority rules for side-by-side vehicles with no collision (LEFT-HAND TRAFFIC)
 * Returns which vehicle(s) should go first based on priority rules
 *
 * Priority hierarchy (among non-colliding vehicles):
 * 1. For non-colliding combinations, vehicles can go together
 * 2. No priority needed since paths don't conflict
 *
 * @param {Object} leftVehicle - Left position vehicle info
 * @param {Object} rightVehicle - Right position vehicle info
 * @returns {Object} { canGoTogether: boolean, priority: 'left'|'right'|'equal' }
 */
export const applyPriorityRules = (leftVehicle, rightVehicle) => {
  const leftTurn = getTurnDirection(leftVehicle.vehicle);
  const rightTurn = getTurnDirection(rightVehicle.vehicle);

  // If this function is called, it means paths don't collide (checked by caller)
  // So all non-colliding combinations can go together

  // Same direction - can go together
  if (leftTurn === rightTurn) {
    return { canGoTogether: true, priority: "equal" };
  }

  // Left vehicle turns left, right vehicle turns right - can go together (diverging)
  if (leftTurn === "left" && rightTurn === "right") {
    return { canGoTogether: true, priority: "equal" };
  }

  // Left vehicle turns left, right vehicle goes straight - can go together (LEFT-HAND traffic)
  if (leftTurn === "left" && rightTurn === "straight") {
    return { canGoTogether: true, priority: "equal" };
  }

  // Left vehicle goes straight, right vehicle turns right - can go together (LEFT-HAND traffic)
  if (leftTurn === "straight" && rightTurn === "right") {
    return { canGoTogether: true, priority: "equal" };
  }

  // For colliding combinations (shouldn't reach here if pathsCollide check passed):
  // - Left straight + Right left: collision
  // - Left right + Right straight: collision
  // - Left right + Right left: collision

  // Default: can't go together (collision case)
  return { canGoTogether: false, priority: "equal" };
};

/**
 * Main decision function: Can two side-by-side vehicles go together?
 * Combines collision detection and priority rules
 *
 * @param {Object} v1 - First vehicle info
 * @param {Object} v2 - Second vehicle info
 * @returns {Object} {
 *   canGoTogether: boolean,
 *   reason: string,
 *   priority: 'v1'|'v2'|'equal',
 *   vehiclesToProcess: Array
 * }
 */
export const canGoTogether = (v1, v2) => {
  // Check if they're side-by-side
  if (!areSideBySide(v1, v2)) {
    return {
      canGoTogether: false,
      reason: "Not side-by-side",
      priority: "equal",
      vehiclesToProcess: [v1, v2],
    };
  }

  // Get physical positions
  const { leftVehicle, rightVehicle } = getPhysicalPositions(v1, v2);

  // Check for collision
  if (pathsCollide(leftVehicle, rightVehicle)) {
    return {
      canGoTogether: false,
      reason: "Paths collide",
      priority: "equal",
      vehiclesToProcess: [v1, v2], // Process separately, order determined by other rules
    };
  }

  // No collision - apply priority rules
  const priorityResult = applyPriorityRules(leftVehicle, rightVehicle);

  if (priorityResult.canGoTogether) {
    return {
      canGoTogether: true,
      reason: "No collision, equal priority",
      priority: "equal",
      vehiclesToProcess: [v1, v2], // Both together
    };
  }

  // One has priority over the other
  const firstVehicle =
    priorityResult.priority === "left" ? leftVehicle : rightVehicle;
  const secondVehicle =
    priorityResult.priority === "left" ? rightVehicle : leftVehicle;

  // Map back to v1/v2
  const v1IsFirst = firstVehicle === v1;

  return {
    canGoTogether: false,
    reason: `${priorityResult.priority} vehicle has priority`,
    priority: v1IsFirst ? "v1" : "v2",
    vehiclesToProcess: [firstVehicle, secondVehicle], // Order matters
  };
};
