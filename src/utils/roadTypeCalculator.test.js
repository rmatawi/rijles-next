import {
  calculateRoadType,
  getRoadTypeInfo,
  shouldYield,
} from "./roadTypeCalculator";

// Test cases for different road types
const testCases = [
  {
    name: "INRIT S Road",
    roadData: { note: "INRIT S" },
    expected: "inrit-s",
  },
  {
    name: "INRIT B Road",
    roadData: { note: "INRIT B" },
    expected: "inrit-b",
  },
  {
    name: "Regular INRIT Road",
    roadData: { note: "INRIT" },
    expected: "inrit",
  },
  {
    name: "Zandweg Road",
    roadData: { note: "ZANDWEG" },
    expected: "zandweg",
  },
  {
    name: "Zandweg Road with bullet",
    roadData: { note: "●" },
    expected: "zandweg",
  },
  {
    name: "TCROSS Road",
    roadData: { note: "TCROSS" },
    expected: "tcross",
  },
  {
    name: "Main Road",
    roadData: { note: "MAIN ROAD" },
    intersectionData: {
      top: { note: "MAIN ROAD" },
      right: { note: "SIDE ROAD" },
      bottom: { note: "MAIN ROAD" },
      left: { note: "SIDE ROAD" },
    },
    expected: "doorgaande",
  },
  {
    name: "Ending Road",
    roadData: { note: "ENDING ROAD" },
    intersectionData: {
      top: { note: "ENDING ROAD" },
      right: { note: "MAIN ROAD" },
      bottom: {},
    },
    expected: "eindigende",
  },
];

testCases.forEach((testCase, index) => {
  const result = calculateRoadType(
    testCase.roadData,
    testCase.intersectionData,
    testCase.vehicleDirection,
    testCase.vehicle
  );

  const passed = result === testCase.expected;
});

// Test road type information
const roadTypes = [
  "inrit",
  "inrit-s",
  "inrit-b",
  "zandweg",
  "doorgaande",
  "eindigende",
  "tcross",
  "unknown",
];
roadTypes.forEach((roadType) => {
  const info = getRoadTypeInfo(roadType);
});

// Test yielding rules
const yieldTests = [
  { roadType: "inrit", direction: "straight", shouldYield: true },
  { roadType: "inrit-s", direction: "left", shouldYield: true },
  { roadType: "inrit-b", direction: "right", shouldYield: true },
  { roadType: "zandweg", direction: "left", shouldYield: true },
  { roadType: "zandweg", direction: "right", shouldYield: true },
  { roadType: "zandweg", direction: "straight", shouldYield: false },
  { roadType: "doorgaande", direction: "left", shouldYield: false },
  { roadType: "tcross", direction: "straight", shouldYield: true },
];

yieldTests.forEach((test, index) => {
  const result = shouldYield(test.roadType, test.direction);
  const passed = result === test.shouldYield;
});
