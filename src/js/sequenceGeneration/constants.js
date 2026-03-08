/**
 * Constants and mappings for vehicle sequence generation
 *
 * IMPORTANT: SURINAME TRAFFIC SYSTEM
 * Although terminology is in Dutch, Suriname has NOT adopted Dutch traffic rules.
 * Suriname drives on the LEFT-HAND SIDE (similar to UK, not Netherlands).
 *
 * Key differences from Dutch (right-hand) traffic:
 * - Vehicles drive on the LEFT side of the road
 * - At equal-rank intersections, traffic from the LEFT has priority (not right)
 * - Driver's seat is on the RIGHT side of the vehicle
 * - Vehicles pass each other on the right
 */

// Vehicle types that participate in sequences
export const SEQUENCE_VEHICLE_TYPES = [
  "car",
  "ambulance",
  "firetruck",
  "police",
  "bike",
];

// Sequence operators
export const SEQUENCE_OPERATORS = {
  SIMULTANEOUS: "+", // Vehicles go at the same time
  SEQUENTIAL: "-", // Vehicles go one after another
};

// Quadrant directions
export const QUADRANTS = ["top", "left", "bottom", "right"];

// Opposite quadrant mapping
export const OPPOSITE_QUADRANT_MAP = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

// Left quadrant mapping (GEOMETRIC - physical left on diagram)
// Used for spatial/geometric calculations (e.g., T-junction main road positions)
export const LEFT_OF_QUADRANT_MAP = {
  top: "left",
  left: "bottom",
  bottom: "right",
  right: "top",
};

// Right quadrant mapping (GEOMETRIC - physical right on diagram)
// Used for spatial/geometric calculations (e.g., T-junction main road positions)
export const RIGHT_OF_QUADRANT_MAP = {
  top: "right",
  right: "bottom",
  bottom: "left",
  left: "top",
};

/**
 * CRITICAL: Left quadrant from DRIVER'S PERSPECTIVE
 *
 * Quadrant layout - imagine drivers facing the intersection center:
 *      TOP
 * LEFT -|- RIGHT
 *     BOTTOM
 *
 * Driver's perspective (facing center):
 * - Driver at TOP faces down → their left = RIGHT
 * - Driver at LEFT faces right → their left = TOP
 * - Driver at BOTTOM faces up → their left = LEFT
 * - Driver at RIGHT faces left → their left = BOTTOM
 *
 * This mapping is used for traffic priority rules (LV = Left Vacant)
 */
export const LEFT_QUADRANT_MAP = {
  top: "right",    // Driver at TOP, their left = RIGHT
  left: "top",     // Driver at LEFT, their left = TOP
  bottom: "left",  // Driver at BOTTOM, their left = LEFT
  right: "bottom", // Driver at RIGHT, their left = BOTTOM
};
