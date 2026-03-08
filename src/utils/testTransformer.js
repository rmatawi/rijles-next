import { transformMaquetteData } from './maquetteDataTransformer';

// Test data from the task description
const testData = {
  editingVehicle: {
    // ... other properties not shown
    top: {
      vehicles: [
        [
          {
            type: "space"
          },
          {
            type: "car",
            direction: "straight",
            name: "1"
          }
        ],
        [
          {
            type: "car",
            direction: "straight",
            name: "3"
          }
        ],
      ]
    },
    bottom: {
      note: "",
      vehicles: [
        [
          {
            type: "space"
          },
          {
            type: "car",
            direction: "straight",
            name: "2"
          }
        ]
      ]
    },
    left: {
      note: ""
    },
    right: {
      note: ""
    }
  }
};

console.log('Original data:', JSON.stringify(testData, null, 2));

const transformedData = transformMaquetteData(testData);

console.log('Transformed data:', JSON.stringify(transformedData, null, 2));