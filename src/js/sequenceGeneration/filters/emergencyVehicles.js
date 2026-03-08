/**
 * Emergency vehicle filtering
 *
 * PRIORITY 1: Filter emergency vehicles (PS/BS/AS)
 * Emergency vehicles with sirens have absolute priority
 * Exception: If they need to enter a busy driveway, driveway must clear first
 */

/**
 * Filter emergency vehicles from a list of vehicles
 * @param {Array} vehicles - Array of vehicle info objects
 * @returns {Object} { emergencyVehicles: [], others: [] }
 */
export const filterEmergencyVehicles = (vehicles) => {
  const emergencyVehicles = [];
  const others = [];

  for (const vInfo of vehicles) {
    const isEmergency =
      vInfo.vehicle.type === "police" ||
      vInfo.vehicle.type === "ambulance" ||
      vInfo.vehicle.type === "firetruck";

    if (isEmergency) {
      emergencyVehicles.push(vInfo);
    } else {
      others.push(vInfo);
    }
  }

  return { emergencyVehicles, others };
};
