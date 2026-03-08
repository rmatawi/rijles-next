/**
 * Generates a maquette data structure with correctly formatted IDs
 * Each quadrant has a 3x4 grid of vehicles with IDs like "top_1", "top_2", ..., "top_12"
 * @param {number} numQuadrants - Number of quadrants (default is 4: top, right, bottom, left)
 * @param {number} rows - Number of rows in each quadrant (default is 3)
 * @param {number} cols - Number of columns in each quadrant (default is 4)
 * @returns {Object} The generated maquette data structure
 */
function generateMaquetteDataStructure(numQuadrants = 4, rows = 3, cols = 4) {
  const quadrants = ['top', 'right', 'bottom', 'left'];
  const maquetteStructure = {};

  for (let q = 0; q < Math.min(numQuadrants, quadrants.length); q++) {
    const quadrantName = quadrants[q];
    const quadrantData = { vehicles: [] };

    let positionCounter = 1;

    for (let r = 0; r < rows; r++) {
      const row = [];

      for (let c = 0; c < cols; c++) {
        // Create a vehicle object with the correct ID
        const vehicle = {
          name: `S${positionCounter}`,  // Maintaining the original name structure
          type: "space",
          direction: "straight",
          id: `${quadrantName}_${positionCounter}`  // Adding the correctly formatted ID
        };

        row.push(vehicle);
        positionCounter++;
      }

      quadrantData.vehicles.push(row);
    }

    maquetteStructure[quadrantName] = quadrantData;
  }

  return maquetteStructure;
}

/**
 * Generates a complete maquette entry with the correct vehicle IDs
 * @param {string} title - Title for the maquette
 * @param {string} groupName - Group name for the maquette
 * @param {string} roadsize - Road size (default: "S/B")
 * @param {Object} options - Additional options for the maquette
 * @returns {Object} A complete maquette entry
 */
function generateMaquetteEntry(title, groupName, roadsize = "S/B", options = {}) {
  // Default options
  const defaultOptions = {
    notes: "",
    sequence: "",
    importantNotes: "",
    answer: "",
    numQuadrants: 4,
    rows: 3,
    cols: 3
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const maquetteEntry = {
    ...generateMaquetteDataStructure(
      mergedOptions.numQuadrants, 
      mergedOptions.rows, 
      mergedOptions.cols
    ),
    title: title,
    groupName: groupName,
    roadsize: roadsize,
    notes: mergedOptions.notes,
    sequence: mergedOptions.sequence,
    importantNotes: mergedOptions.importantNotes,
    answer: mergedOptions.answer
  };

  return maquetteEntry;
}

/**
 * Updates an existing maquette data structure with correct IDs
 * @param {Object} existingMaquette - The existing maquette data
 * @returns {Object} Updated maquette data with correct IDs
 */
function updateMaquetteIds(existingMaquette) {
  const quadrants = ['top', 'right', 'bottom', 'left'];

  // Create a copy of the existing maquette to avoid mutating the original
  const updatedMaquette = { ...existingMaquette };

  for (const quadrant of quadrants) {
    if (updatedMaquette[quadrant] && updatedMaquette[quadrant].vehicles) {
      let positionCounter = 1;

      for (let r = 0; r < updatedMaquette[quadrant].vehicles.length; r++) {
        for (let c = 0; c < updatedMaquette[quadrant].vehicles[r].length; c++) {
          // Only update if the vehicle object exists
          if (updatedMaquette[quadrant].vehicles[r][c]) {
            updatedMaquette[quadrant].vehicles[r][c] = {
              ...updatedMaquette[quadrant].vehicles[r][c],
              id: `${quadrant}_${positionCounter}`
            };
            positionCounter++;
          }
        }
      }
    }
  }

  return updatedMaquette;
}

/**
 * Converts an existing maquette data structure to a 3x4 grid and adds correct IDs
 * @param {Object} existingMaquette - The existing maquette data (may be 3x3 or 3x4)
 * @returns {Object} Updated maquette data with 3x4 grid and correct IDs
 */
function convertTo3x3Grid(existingMaquette) {
  const quadrants = ['top', 'right', 'bottom', 'left'];

  // Create a copy of the existing maquette to avoid mutating the original
  const updatedMaquette = { ...existingMaquette };

  // Helper function to convert grid (replicating convertGrid functionality)
  const convertGrid = (grid, quadrantName) => {
    if (!Array.isArray(grid) || grid.length === 0) {
      return grid;
    }

    // Create a deep copy to avoid mutating the original
    const newGrid = JSON.parse(JSON.stringify(grid));

    let positionCounter = 1;

    // Process each row in the grid
    for (let r = 0; r < newGrid.length; r++) {
      if (Array.isArray(newGrid[r])) {
        // Process each cell in the row (up to 4 columns for 3x4 grid)
        for (let c = 0; c < Math.min(newGrid[r].length, 4); c++) {
          if (newGrid[r][c] && typeof newGrid[r][c] === 'object') {
            // Update the ID to follow the quadrant_position format (e.g., "top_1", "top_2", etc.)
            newGrid[r][c].id = `${quadrantName}_${positionCounter}`;
            positionCounter++;
          }
        }
        // If the row has fewer than 4 elements, add space vehicles to make it 4
        while (newGrid[r].length < 4) {
          newGrid[r].push({
            type: "space",
            direction: "straight",
            id: `${quadrantName}_${positionCounter}`,
            name: `S${positionCounter}`
          });
          positionCounter++;
        }
      }
    }

    // If there are fewer than 3 rows, add rows to make it 3x4
    while (newGrid.length < 3) {
      const newRow = [];
      for (let c = 0; c < 4; c++) {
        newRow.push({
          type: "space",
          direction: "straight",
          id: `${quadrantName}_${positionCounter}`,
          name: `S${positionCounter}`
        });
        positionCounter++;
      }
      newGrid.push(newRow);
    }

    return newGrid;
  };

  for (const quadrant of quadrants) {
    if (updatedMaquette[quadrant] && updatedMaquette[quadrant].vehicles) {
      // Use the convertGrid function to ensure proper sequential IDs for this quadrant
      updatedMaquette[quadrant].vehicles = convertGrid(updatedMaquette[quadrant].vehicles, quadrant);
    }
  }

  return updatedMaquette;
}

// Example usage:
/*
const exampleMaquette = generateMaquetteEntry(
  "1001", 
  "group-1762000105843", 
  "S/B", 
  {
    importantNotes: "Tek.1 | 1 rijdt eerst weg",
    answer: "<p>1 rijdt eerst weg. Het linkskomend verkeer heeft voorrang bij wegen van gelijke rangorde. 3 heeft 1 op zijn links → 3 verleent voorrang. 2 heeft 3 op zijn links → 2 verleent voorrang. 1 heeft geen verkeer op zijn links → 1 rijdt weg, daarna 3, daarna 2.</p>"
  }
);
console.log(JSON.stringify(exampleMaquette, null, 2));
*/

module.exports = {
  generateMaquetteDataStructure,
  generateMaquetteEntry,
  updateMaquetteIds,
  convertTo3x3Grid
};