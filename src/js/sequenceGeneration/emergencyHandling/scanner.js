/**
 * Emergency vehicle scanner
 * Scans entire maquette for emergency vehicles across all rows and quadrants
 */

import { QUADRANTS } from "../constants.js";
import { isSequenceVehicle, createVehicleId } from "../utils.js";

/**
 * Scan entire maquette for emergency vehicles across all rows and quadrants
 * @param {Object} maquetteData - The maquette data containing vehicle positions
 * @returns {Object} { policeVehicles: [], firetruckVehicles: [], ambulanceVehicles: [] }
 */
export const scanForEmergencyVehicles = (maquetteData) => {
  console.log("[SEQGEN] === Scanning for Emergency Vehicles ===");
  const policeVehicles = [];
  const firetruckVehicles = [];
  const ambulanceVehicles = [];

  if (!maquetteData) {
    console.log("[SEQGEN] No maquette data provided");
    return { policeVehicles, firetruckVehicles, ambulanceVehicles };
  }

  // Scan all quadrants and all rows
  for (const direction of QUADRANTS) {
    const dirSection = maquetteData[direction];
    if (!dirSection || !dirSection.vehicles) {
      console.log(`[SEQGEN] Quadrant ${direction}: No vehicles section`);
      continue;
    }

    console.log(`[SEQGEN] Quadrant ${direction}: ${dirSection.vehicles.length} rows`);

    for (let rowIndex = 0; rowIndex < dirSection.vehicles.length; rowIndex++) {
      const row = dirSection.vehicles[rowIndex];
      if (!row || !Array.isArray(row)) continue;

      // Scan ALL columns in the row, not just 0 and 1
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const vehicle = row[colIndex];
        if (!vehicle || !vehicle.name || !isSequenceVehicle(vehicle.type)) continue;

        console.log(
          `[SEQGEN]   ${direction} Row ${rowIndex} Col ${colIndex}: ${vehicle.name} (${vehicle.type}, direction: ${vehicle.direction || "none"})`
        );

        const vehicleInfo = {
          vehicle,
          direction,
          rowIndex,
          colIndex,
          vehicleId: createVehicleId(direction, rowIndex, colIndex),
        };

        // Categorize by emergency type
        if (vehicle.type === "police") {
          console.log(`[SEQGEN]     ✓ POLICE detected: ${vehicle.name}`);
          policeVehicles.push(vehicleInfo);
        } else if (vehicle.type === "firetruck") {
          console.log(`[SEQGEN]     ✓ FIRETRUCK detected: ${vehicle.name}`);
          firetruckVehicles.push(vehicleInfo);
        } else if (vehicle.type === "ambulance") {
          console.log(`[SEQGEN]     ✓ AMBULANCE detected: ${vehicle.name}`);
          ambulanceVehicles.push(vehicleInfo);
        }
      }
    }
  }

  console.log(
    `[SEQGEN] Emergency scan complete: ${policeVehicles.length} police, ${firetruckVehicles.length} firetrucks, ${ambulanceVehicles.length} ambulances`
  );
  return { policeVehicles, firetruckVehicles, ambulanceVehicles };
};
