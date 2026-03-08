/**
 * Road type filtering (main road, side road, inrit/driveway)
 *
 * PRIORITY 2: Filter by road type, zandweg rules, and T-junction rules
 */

import {
  OPPOSITE_QUADRANT_MAP,
  LEFT_OF_QUADRANT_MAP,
  RIGHT_OF_QUADRANT_MAP,
} from "../constants.js";
import { detectTJunction } from "../junctionDetection/tJunction.js";
import { determineZandwegPriority } from "../junctionDetection/zandweg.js";
import { getVehicleDestination } from "../utils.js";

/**
 * Filter vehicles by road type with T-junction and zandweg priority
 *
 * Priority order:
 * 1. Check for zandweg priority pattern (adjacent zandweg vs adjacent regular roads)
 * 2. If zandweg priority exists, main road = regular roads (or zandweg in T-cross exception)
 * 3. Otherwise, check for T-junction: main road vehicles have priority over side road and inrit
 * 4. Special rule: Vehicles turning INTO the inrit have LOWEST priority (below even inrit vehicles exiting)
 *
 * @param {Array} vehicles - Array of vehicle info objects
 * @param {Object} maquetteData - Full maquette data (contains junction type)
 * @returns {Object} { mainRoadVehicles: [], sideRoadVehicles: [], inritVehicles: [], turningIntoInritVehicles: [], equalRoadVehicles: [] }
 */
export const filterByRoadType = (vehicles, maquetteData) => {
  const mainRoadVehicles = [];
  const sideRoadVehicles = [];
  const inritVehicles = [];
  const turningIntoInritVehicles = [];
  const equalRoadVehicles = [];

  // First, check for zandweg priority pattern
  const zandwegPriority = determineZandwegPriority(maquetteData);

  if (zandwegPriority) {
    const zandwegInfo = zandwegPriority.zandwegQuadrants.length > 0
      ? `, zandweg (lowest)=[${zandwegPriority.zandwegQuadrants.join(", ")}]`
      : '';

    console.log(
      `[SEQGEN] Zandweg priority detected (${zandwegPriority.type}): main=[${zandwegPriority.mainRoadQuadrants.join(", ")}], secondary=[${zandwegPriority.secondaryQuadrants.join(", ")}]${zandwegInfo}`
    );

    // Determine inrit quadrant for checking vehicles turning into it
    const inritQuadrant = zandwegPriority.zandwegQuadrants && zandwegPriority.zandwegQuadrants.length > 0
      ? zandwegPriority.zandwegQuadrants[0]
      : null;

    for (const vInfo of vehicles) {
      // Check if this vehicle is turning INTO the inrit
      const destination = getVehicleDestination(vInfo);
      const isTurningIntoInrit = inritQuadrant && destination === inritQuadrant;

      if (isTurningIntoInrit) {
        // Vehicles turning INTO the inrit have the LOWEST priority
        console.log(`[SEQGEN]   Vehicle ${vInfo.vehicle.name} is turning INTO inrit ${inritQuadrant} - deferred to last`);
        turningIntoInritVehicles.push(vInfo);
      } else if (zandwegPriority.mainRoadQuadrants.includes(vInfo.direction)) {
        mainRoadVehicles.push(vInfo);
      } else if (zandwegPriority.secondaryQuadrants.includes(vInfo.direction)) {
        sideRoadVehicles.push(vInfo);
      } else if (zandwegPriority.zandwegQuadrants && zandwegPriority.zandwegQuadrants.includes(vInfo.direction)) {
        // Zandweg vehicles have low priority (exiting the inrit/driveway)
        inritVehicles.push(vInfo);
      } else {
        equalRoadVehicles.push(vInfo);
      }
    }

    return { mainRoadVehicles, sideRoadVehicles, inritVehicles, turningIntoInritVehicles, equalRoadVehicles };
  }

  // If no zandweg priority, check for T-junction configuration
  const tJunction = detectTJunction(maquetteData);

  if (tJunction) {
    const inritQuadrant = tJunction.inritQuadrant;
    // Side road = opposite of inrit quadrant
    const sideRoadQuadrant = OPPOSITE_QUADRANT_MAP[inritQuadrant];
    // Main roads = left and right of inrit quadrant
    const mainRoad1 = LEFT_OF_QUADRANT_MAP[inritQuadrant];
    const mainRoad2 = RIGHT_OF_QUADRANT_MAP[inritQuadrant];

    console.log(
      `[SEQGEN] T-junction: inrit=${inritQuadrant}, side=${sideRoadQuadrant}, main=[${mainRoad1}, ${mainRoad2}]`
    );

    for (const vInfo of vehicles) {
      // Check if this vehicle is turning INTO the inrit
      const destination = getVehicleDestination(vInfo);
      const isTurningIntoInrit = destination === inritQuadrant;

      if (isTurningIntoInrit && vInfo.direction !== inritQuadrant) {
        // Vehicles turning INTO the inrit have the LOWEST priority (even lower than inrit vehicles exiting)
        console.log(`[SEQGEN]   Vehicle ${vInfo.vehicle.name} is turning INTO inrit ${inritQuadrant} - deferred to last`);
        turningIntoInritVehicles.push(vInfo);
      } else if (vInfo.direction === inritQuadrant) {
        // Vehicles EXITING the inrit/driveway have low priority (but higher than those entering)
        inritVehicles.push(vInfo);
      } else if (vInfo.direction === sideRoadQuadrant) {
        sideRoadVehicles.push(vInfo);
      } else if (
        vInfo.direction === mainRoad1 ||
        vInfo.direction === mainRoad2
      ) {
        mainRoadVehicles.push(vInfo);
      } else {
        equalRoadVehicles.push(vInfo);
      }
    }
  } else {
    // Equal rank roads - all vehicles treated equally
    equalRoadVehicles.push(...vehicles);
  }

  return { mainRoadVehicles, sideRoadVehicles, inritVehicles, turningIntoInritVehicles, equalRoadVehicles };
};

/**
 * PRIORITY 3: Filter by road width (Smal vs Breed)
 * Narrow roads restrict overtaking and affect behavior
 * @param {Array} vehicles - Array of vehicle info objects
 * @param {Object} maquetteData - Full maquette data (contains road width info)
 * @returns {Object} { narrowRoadVehicles: [], wideRoadVehicles: [] }
 */
export const filterByRoadWidth = (vehicles, maquetteData) => {
  const narrowRoadVehicles = [];
  const wideRoadVehicles = [];

  for (const vInfo of vehicles) {
    const quadrantData = maquetteData?.[vInfo.direction];
    const isNarrow =
      quadrantData?.roadWidth === "narrow" || quadrantData?.roadWidth === "S";

    if (isNarrow) {
      narrowRoadVehicles.push(vInfo);
    } else {
      wideRoadVehicles.push(vInfo);
    }
  }

  return { narrowRoadVehicles, wideRoadVehicles };
};
