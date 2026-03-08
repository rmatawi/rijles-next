import { convertGrid } from "../js/utils";

/**
 * Transform maquette data from the editing format to the required grid format
 * @param {Object} maquetteData - The original maquette data
 * @param {number} maquetteNumber - The maquette number for ID generation
 * @returns {Object} The transformed maquette data with 3x3 grid structure for each direction
 */
export function transformMaquetteData(maquetteData, maquetteNumber = 1) {
  // Check if the data is in the format { editingVehicle: { ... } }
  const hasEditingVehicleWrapper = maquetteData && maquetteData.editingVehicle;

  // If it has the editingVehicle wrapper, extract the content
  const actualMaquetteData = hasEditingVehicleWrapper
    ? maquetteData.editingVehicle
    : maquetteData;

  if (!actualMaquetteData) {
    return maquetteData;
  }

  // Transform the actual maquette data
  const transformedMaquetteData = { ...actualMaquetteData };

  // Continue with the transformation logic using transformedMaquetteData

  const directions = ["top", "bottom", "left", "right"];

  for (const direction of directions) {
    if (transformedMaquetteData[direction]) {
      // Create the 3x3 grid structure for each direction
      const gridVehicles = [];

      // First, get any existing vehicles for this direction
      const existingVehicles =
        transformedMaquetteData[direction].vehicles || [];

      // Create 3 rows with 4 columns each
      for (let row = 0; row < 3; row++) {
        const rowVehicles = [];

        for (let col = 0; col < 4; col++) {
          let vehicle = null;

          // Check if there's an existing vehicle at this position
          if (existingVehicles[row] && existingVehicles[row][col]) {
            vehicle = { ...existingVehicles[row][col] };

            // Ensure all vehicles have direction property
            vehicle.direction = vehicle.direction || "straight";

            // For space type vehicles, ensure proper name format (S{number})
            if (
              vehicle.type === "space" &&
              (!vehicle.name || !vehicle.name.startsWith("S"))
            ) {
              vehicle.name = `S${row * 4 + col + 1}`;
            }
          } else {
            // Create a space vehicle if no existing vehicle at this position
            vehicle = {
              type: "space",
              direction: "straight",
              name: `S${row * 4 + col + 1}`,
            };
          }

          rowVehicles.push(vehicle);
        }

        gridVehicles.push(rowVehicles);
      }

      // Update the direction with the new grid structure
      // Preserve other properties like note, bikelanes, etc.
      transformedMaquetteData[direction] = {
        ...transformedMaquetteData[direction],
        vehicles: gridVehicles,
      };
    } else {
      // If this direction doesn't exist, create it with default space vehicles
      const gridVehicles = [];
      for (let row = 0; row < 3; row++) {
        const rowVehicles = [];
        for (let col = 0; col < 4; col++) {
          rowVehicles.push({
            type: "space",
            direction: "straight",
            name: `S${row * 4 + col + 1}`,
          });
        }
        gridVehicles.push(rowVehicles);
      }

      transformedMaquetteData[direction] = {
        vehicles: gridVehicles,
      };
    }

    // Apply convertGrid to ensure proper IDs for this direction
    transformedMaquetteData[direction].vehicles = convertGrid(
      transformedMaquetteData[direction].vehicles,
      direction
    );
  }

  // Return in the same format as input (with or without editingVehicle wrapper)
  if (hasEditingVehicleWrapper) {
    return {
      editingVehicle: transformedMaquetteData,
    };
  } else {
    return transformedMaquetteData;
  }
}
