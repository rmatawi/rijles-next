/**
 * Quadrant relationship helper functions
 */

import {
  OPPOSITE_QUADRANT_MAP,
  LEFT_OF_QUADRANT_MAP,
  RIGHT_OF_QUADRANT_MAP,
} from "./constants.js";

/**
 * Get the opposite quadrant
 * @param {string} quadrant - Quadrant name
 * @returns {string} Opposite quadrant
 */
export const getOppositeQuadrant = (quadrant) => {
  return OPPOSITE_QUADRANT_MAP[quadrant];
};

/**
 * Get the quadrant to the left
 * @param {string} quadrant - Quadrant name
 * @returns {string} Left quadrant
 */
export const getLeftQuadrant = (quadrant) => {
  return LEFT_OF_QUADRANT_MAP[quadrant];
};

/**
 * Get the quadrant to the right
 * @param {string} quadrant - Quadrant name
 * @returns {string} Right quadrant
 */
export const getRightQuadrant = (quadrant) => {
  return RIGHT_OF_QUADRANT_MAP[quadrant];
};

/**
 * Get main road quadrants for a T-junction
 * @param {string} inritQuadrant - The inrit/T-cross quadrant
 * @returns {Array} Array of two main road quadrants
 */
export const getMainRoadQuadrants = (inritQuadrant) => {
  return [
    LEFT_OF_QUADRANT_MAP[inritQuadrant],
    RIGHT_OF_QUADRANT_MAP[inritQuadrant],
  ];
};

/**
 * Get side road quadrant for a T-junction
 * @param {string} inritQuadrant - The inrit/T-cross quadrant
 * @returns {string} Side road quadrant
 */
export const getSideRoadQuadrant = (inritQuadrant) => {
  return OPPOSITE_QUADRANT_MAP[inritQuadrant];
};

/**
 * Get adjacent quadrants (left and right neighbors)
 * @param {string} quadrant - Quadrant name
 * @returns {Array} Array of adjacent quadrants
 */
export const getAdjacentQuadrants = (quadrant) => {
  return [
    LEFT_OF_QUADRANT_MAP[quadrant],
    RIGHT_OF_QUADRANT_MAP[quadrant]
  ];
};
