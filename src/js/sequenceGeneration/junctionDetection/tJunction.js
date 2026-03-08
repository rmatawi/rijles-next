/**
 * T-junction detection functions
 */

import { QUADRANTS } from "../constants.js";

/**
 * Detect T-junction configuration from maquette data
 * Looks for "TCROSS" or "INRIT" in quadrant notes
 * @param {Object} maquetteData - Full maquette data
 * @returns {Object|null} { inritQuadrant: string } or null if not a T-junction
 */
export const detectTJunction = (maquetteData) => {
  if (!maquetteData) return null;

  // Check for explicit junctionType and inritQuadrant at root level
  if (maquetteData.junctionType === "tcross" && maquetteData.inritQuadrant) {
    return { inritQuadrant: maquetteData.inritQuadrant };
  }

  // Check each quadrant's note for TCROSS or INRIT markers
  for (const direction of QUADRANTS) {
    const quadrant = maquetteData[direction];
    if (!quadrant) continue;

    const note = (quadrant.note || "").toUpperCase();
    if (note.includes("TCROSS") || note.includes("INRIT")) {
      console.log(`[SEQGEN] T-junction detected: ${direction} is the inrit/tcross`);
      return { inritQuadrant: direction };
    }
  }

  return null;
};
