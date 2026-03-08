/**
 * Zandweg (sand road) detection and priority functions
 *
 * Zandweg Priority Rules:
 *
 * 1. STANDARD RULE:
 *    When two adjacent quadrants are both zandweg (unpaved roads) and the other
 *    two adjacent quadrants are both regular roads, the regular roads form the
 *    main road and have priority. Zandweg vehicles must yield to regular road traffic.
 *
 * 2. T-CROSS EXCEPTION:
 *    In a T-cross situation where:
 *    - The regular road is the side road (entering the junction)
 *    - Two adjacent zandweg roads form the straight main road (opposite quadrants)
 *    Then the zandweg roads are treated as the main road despite being unpaved,
 *    and the regular side road must yield.
 *
 * 3. NO PRIORITY PATTERN:
 *    If zandweg roads are not adjacent, or if there are more/fewer than two
 *    zandweg quadrants, then this priority rule does not apply and normal
 *    T-junction or equal-priority rules are used instead.
 */

import { QUADRANTS, OPPOSITE_QUADRANT_MAP } from "../constants.js";
import { getAdjacentQuadrants } from "../quadrants.js";
import { detectTJunction } from "./tJunction.js";

/**
 * Check if a quadrant is a zandweg (unpaved/sand road)
 * @param {Object} maquetteData - Full maquette data
 * @param {string} quadrant - Quadrant name
 * @returns {boolean}
 */
export const isZandweg = (maquetteData, quadrant) => {
  if (!maquetteData || !quadrant) return false;

  const quadrantData = maquetteData[quadrant];
  if (!quadrantData) return false;

  // Check roadSurface or roadType property
  const roadSurface = (quadrantData.roadSurface || "").toLowerCase();
  const roadType = (quadrantData.roadType || "").toLowerCase();
  const note = (quadrantData.note || "").toLowerCase();

  return (
    roadSurface === "zandweg" ||
    roadSurface === "sand" ||
    roadSurface === "unpaved" ||
    roadType === "zandweg" ||
    roadType === "sand" ||
    note.includes("zandweg")
  );
};

/**
 * Detect zandweg pairs (adjacent quadrants that are both zandweg)
 * Returns all pairs of adjacent zandweg quadrants
 * @param {Object} maquetteData - Full maquette data
 * @returns {Array} Array of zandweg pairs, each pair is [quadrant1, quadrant2]
 */
export const detectZandwegPairs = (maquetteData) => {
  const zandwegPairs = [];
  const checkedPairs = new Set();

  for (const quadrant of QUADRANTS) {
    if (!isZandweg(maquetteData, quadrant)) continue;

    const adjacents = getAdjacentQuadrants(quadrant);
    for (const adjacent of adjacents) {
      if (isZandweg(maquetteData, adjacent)) {
        // Create a unique key for this pair (sorted to avoid duplicates)
        const pairKey = [quadrant, adjacent].sort().join("-");
        if (!checkedPairs.has(pairKey)) {
          zandwegPairs.push([quadrant, adjacent]);
          checkedPairs.add(pairKey);
        }
      }
    }
  }

  return zandwegPairs;
};

/**
 * Detect regular road pairs (adjacent quadrants that are both regular roads)
 * @param {Object} maquetteData - Full maquette data
 * @returns {Array} Array of regular road pairs, each pair is [quadrant1, quadrant2]
 */
export const detectRegularRoadPairs = (maquetteData) => {
  const regularPairs = [];
  const checkedPairs = new Set();

  for (const quadrant of QUADRANTS) {
    if (isZandweg(maquetteData, quadrant)) continue; // Skip zandweg

    const adjacents = getAdjacentQuadrants(quadrant);
    for (const adjacent of adjacents) {
      if (!isZandweg(maquetteData, adjacent)) {
        // Both are regular roads
        const pairKey = [quadrant, adjacent].sort().join("-");
        if (!checkedPairs.has(pairKey)) {
          regularPairs.push([quadrant, adjacent]);
          checkedPairs.add(pairKey);
        }
      }
    }
  }

  return regularPairs;
};

/**
 * Check if a quadrant is an inrit/driveway (without T-junction markers)
 * @param {Object} maquetteData - Full maquette data
 * @param {string} quadrant - Quadrant name
 * @returns {boolean}
 */
export const isInrit = (maquetteData, quadrant) => {
  if (!maquetteData || !quadrant) return false;

  const quadrantData = maquetteData[quadrant];
  if (!quadrantData) return false;

  const roadType = (quadrantData.roadType || "").toLowerCase();
  const note = (quadrantData.note || "").toLowerCase();

  // Check for inrit/driveway markers (but exclude T-cross markers which are handled separately)
  return (
    roadType === "inrit" ||
    roadType === "driveway" ||
    (note.includes("inrit") && !note.includes("tcross"))
  );
};

/**
 * Determine main road based on zandweg/inrit priority rules for regular 4-way crossings
 *
 * Rules:
 * 1. SINGLE LOW-PRIORITY ROAD (1 zandweg/inrit, 3 regular roads):
 *    - For regular crossings (no T-junction markers)
 *    - Zandweg/inrit has lowest priority
 *    - Two opposite regular roads form the main road
 *    - Regular road opposite zandweg/inrit is the side road
 *
 * 2. DUAL ZANDWEG (2 zandweg, 2 regular roads):
 *    - If pairs are adjacent or opposite, regular roads form main road
 *    - Exception: In T-cross where regular road is side road and two zandweg
 *      form the straight main road, then zandweg are treated as main road
 *
 * @param {Object} maquetteData - Full maquette data
 * @returns {Object|null} { mainRoadQuadrants: [], secondaryQuadrants: [], zandwegQuadrants: [], type: string } or null
 */
export const determineZandwegPriority = (maquetteData) => {
  if (!maquetteData) return null;

  // Collect all low-priority (zandweg/inrit) and regular quadrants
  const lowPriorityQuadrants = [];
  const regularQuadrants = [];

  for (const quadrant of QUADRANTS) {
    if (isZandweg(maquetteData, quadrant) || isInrit(maquetteData, quadrant)) {
      lowPriorityQuadrants.push(quadrant);
    } else {
      regularQuadrants.push(quadrant);
    }
  }


  // CASE 1: Single low-priority road (1 zandweg/inrit + 3 regular roads)
  if (lowPriorityQuadrants.length === 1 && regularQuadrants.length === 3) {
    const lowPriorityQuad = lowPriorityQuadrants[0];
    const oppositeOfLowPriority = OPPOSITE_QUADRANT_MAP[lowPriorityQuad];

    // Find the two regular roads that are opposite to each other (and not opposite to low-priority road)
    const mainRoadQuadrants = regularQuadrants.filter(q => q !== oppositeOfLowPriority);
    const sideRoadQuadrant = oppositeOfLowPriority; // The regular road opposite low-priority road

    const roadType = isZandweg(maquetteData, lowPriorityQuad) ? "zandweg" : "inrit";

    return {
      mainRoadQuadrants: mainRoadQuadrants,
      secondaryQuadrants: [sideRoadQuadrant],
      zandwegQuadrants: [lowPriorityQuad],
      type: `single-${roadType}-priority`
    };
  }

  // For backward compatibility, continue using zandwegQuadrants for dual scenarios
  const zandwegQuadrants = lowPriorityQuadrants.filter(q => isZandweg(maquetteData, q));

  // CASE 2: Dual zandweg (2 zandweg + 2 regular roads)
  if (zandwegQuadrants.length !== 2 || regularQuadrants.length !== 2) {
    return null;
  }

  const zandwegPairs = detectZandwegPairs(maquetteData);
  const regularPairs = detectRegularRoadPairs(maquetteData);


  // Check if we have 2 zandweg and 2 regular quadrants (can be adjacent OR opposite)
  const [zandweg1, zandweg2] = zandwegQuadrants;
  const [regular1, regular2] = regularQuadrants;


  // Check if they form proper pairs (adjacent or opposite)
  const zandwegAreAdjacent = getAdjacentQuadrants(zandweg1).includes(zandweg2);
  const zandwegAreOpposite = OPPOSITE_QUADRANT_MAP[zandweg1] === zandweg2;
  const regularAreAdjacent = getAdjacentQuadrants(regular1).includes(regular2);
  const regularAreOpposite = OPPOSITE_QUADRANT_MAP[regular1] === regular2;


  // Both pairs must be either adjacent or opposite (not random quadrants)
  const zandwegFormPair = zandwegAreAdjacent || zandwegAreOpposite;
  const regularFormPair = regularAreAdjacent || regularAreOpposite;

  if (zandwegFormPair && regularFormPair) {

    // Check for T-cross exception
    const tJunction = detectTJunction(maquetteData);

    if (tJunction) {
      const inritQuadrant = tJunction.inritQuadrant;
      const sideRoadQuadrant = OPPOSITE_QUADRANT_MAP[inritQuadrant];


      // Check if regular road pair includes the side road
      const regularIncludesSideRoad =
        regular1 === sideRoadQuadrant || regular2 === sideRoadQuadrant;

      if (regularIncludesSideRoad && zandwegAreOpposite) {
        return {
          mainRoadQuadrants: [zandweg1, zandweg2],
          secondaryQuadrants: [regular1, regular2],
          zandwegQuadrants: [],
          type: 'zandweg-priority-tcross-exception'
        };
      }
    }

    // Normal case: Regular roads form the main road
    return {
      mainRoadQuadrants: [regular1, regular2],
      secondaryQuadrants: [zandweg1, zandweg2],
      zandwegQuadrants: [],
      type: 'zandweg-priority'
    };
  }

  // No valid zandweg priority pattern
  return null;
};
