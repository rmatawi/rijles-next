/**
 * Bike lane detection functions
 */

/**
 * Check if a quadrant has bike lanes
 * @param {Object} maquetteData - Full maquette data
 * @param {string} quadrant - Quadrant name
 * @returns {boolean}
 */
export const hasBikeLane = (maquetteData, quadrant) => {
  if (!maquetteData || !quadrant) return false;

  const quadrantData = maquetteData[quadrant];
  if (!quadrantData) return false;

  // Check bikeLane property or note for bike lane markers
  const bikeLane = quadrantData.bikeLane;
  const bikelane = quadrantData.bikelane;
  const bikelanes = quadrantData.bikelanes; // Plural variant
  const note = (quadrantData.note || "").toLowerCase();

  return (
    // Boolean checks
    bikeLane === true ||
    bikelane === true ||
    // String value checks
    bikeLane === "yes" ||
    bikelane === "yes" ||
    // Plural property checks (handles "both", "left", "right", "yes", true)
    bikelanes === true ||
    bikelanes === "yes" ||
    bikelanes === "both" ||
    bikelanes === "left" ||
    bikelanes === "right" ||
    // Note field checks
    note.includes("fietspad") ||
    note.includes("bike lane") ||
    note.includes("bikelane")
  );
};
