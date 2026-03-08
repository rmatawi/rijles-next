import React from 'react';
import { render } from '@testing-library/react';
import CriteriaDisplayNew from './CriteriaDisplay';
import CriteriaDisplayBackup from './CriteriaDisplay.backup';

/**
 * Test suite to compare backup and refactored CriteriaDisplay components
 * This ensures the refactoring maintains accuracy
 */

// Helper function to extract rendered text from component
const extractRenderedText = (component) => {
  const { container } = render(component);
  return container.textContent;
};

// Test scenarios covering various cases
const testScenarios = [
  {
    name: "Single vehicle - T-junction - Linksaf",
    data: {
      roadType: "t-junction",
      vehicleNames: "1",
      rules: [
        { text: "Linksaf", icon: "↰" }
      ]
    }
  },
  {
    name: "Single vehicle - Equal-rank - Rechtdoor with Links Vrij",
    data: {
      roadType: "equal-rank",
      vehicleNames: "2",
      rules: [
        { text: "Links Vrij", icon: "←" },
        { text: "Rechtdoor", icon: "↑" }
      ]
    }
  },
  {
    name: "Multiple vehicles (1+2) - Equal-rank - Special case",
    data: {
      roadType: "equal-rank",
      vehicleNames: "1+2",
      rules: [
        { text: "Links Vrij", icon: "←" },
        { text: "Rechtsaf", icon: "↱" },
        { text: "Rechtdoor", icon: "↑" }
      ]
    }
  },
  {
    name: "Multiple vehicles - Different directions",
    data: {
      roadType: "t-junction",
      vehicleNames: "A+B",
      rules: [
        { text: "Linksaf", icon: "↰" },
        { text: "Rechtdoor", icon: "↑" }
      ]
    }
  },
  {
    name: "Multiple vehicles - Same direction",
    data: {
      roadType: "zandweg",
      vehicleNames: "1+2",
      rules: [
        { text: "Rechtsaf", icon: "↱" }
      ]
    }
  },
  {
    name: "Multiple vehicles - Voorrangsweg",
    data: {
      roadType: "equal-rank",
      vehicleNames: "A+B",
      rules: [
        { text: "Voorrangsweg", icon: "⚠️" },
        { text: "Links Vrij", icon: "←" }
      ]
    }
  },
  {
    name: "Single vehicle - Bike lane",
    data: {
      roadType: "t-junction",
      vehicleNames: "F1",
      rules: [
        { text: "destination has bike lane", icon: "🚴" },
        { text: "Rechtdoor", icon: "↑" }
      ]
    }
  },
  {
    name: "Multiple vehicles - Bike and car",
    data: {
      roadType: "equal-rank",
      vehicleNames: "1+F1",
      rules: [
        { text: "bike-lane", icon: "🚴" },
        { text: "Links Vrij", icon: "←" }
      ]
    }
  },
  {
    name: "Single vehicle - Inrit rule",
    data: {
      roadType: "t-junction",
      vehicleNames: "3",
      rules: [
        { text: "inrit- 3 maakt inrit vrij", icon: "🚗" },
        { text: "3 gaat naar de inrit", icon: "→" }
      ]
    }
  },
  {
    name: "Multiple vehicles - Must give priority",
    data: {
      roadType: "equal-rank",
      vehicleNames: "1+2",
      rules: [
        { text: "Voorrangsweg moet voorrang geven", icon: "⚠️" },
        { text: "Rechtdoor", icon: "↑" }
      ]
    }
  },
  {
    name: "Three vehicles - Multiple directions",
    data: {
      roadType: "t-junction",
      vehicleNames: "1+2+3",
      rules: [
        { text: "Linksaf", icon: "↰" },
        { text: "Rechtdoor", icon: "↑" },
        { text: "Rechtsaf", icon: "↱" }
      ]
    }
  },
  {
    name: "No vehicle names",
    data: {
      roadType: "equal-rank",
      vehicleNames: null,
      rules: [
        { text: "Algemene verkeersregels" }
      ]
    }
  },
  {
    name: "Empty rules",
    data: {
      roadType: "t-junction",
      vehicleNames: "1",
      rules: []
    }
  }
];

// Run comparison tests
console.log("=".repeat(80));
console.log("CRITERIA DISPLAY COMPONENT COMPARISON TEST");
console.log("=".repeat(80));
console.log("\nComparing backup vs refactored implementation\n");

let passCount = 0;
let failCount = 0;
const failures = [];

testScenarios.forEach((scenario, index) => {
  console.log(`\nTest ${index + 1}: ${scenario.name}`);
  console.log("-".repeat(80));

  try {
    const backupOutput = extractRenderedText(
      <CriteriaDisplayBackup criteriaData={scenario.data} />
    );
    const newOutput = extractRenderedText(
      <CriteriaDisplayNew criteriaData={scenario.data} />
    );

    // Compare outputs
    const match = backupOutput === newOutput;

    if (match) {
      console.log("✅ PASS - Outputs match");
      passCount++;
    } else {
      console.log("❌ FAIL - Outputs differ");
      console.log("\nBackup output:");
      console.log(backupOutput);
      console.log("\nNew output:");
      console.log(newOutput);
      failCount++;
      failures.push({
        name: scenario.name,
        backup: backupOutput,
        new: newOutput
      });
    }
  } catch (error) {
    console.log("❌ ERROR - Test failed to run");
    console.log(error.message);
    failCount++;
    failures.push({
      name: scenario.name,
      error: error.message
    });
  }
});

// Summary
console.log("\n" + "=".repeat(80));
console.log("TEST SUMMARY");
console.log("=".repeat(80));
console.log(`Total tests: ${testScenarios.length}`);
console.log(`Passed: ${passCount} ✅`);
console.log(`Failed: ${failCount} ❌`);
console.log(`Success rate: ${((passCount / testScenarios.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log("\n" + "=".repeat(80));
  console.log("FAILED TESTS DETAILS");
  console.log("=".repeat(80));
  failures.forEach((failure, index) => {
    console.log(`\n${index + 1}. ${failure.name}`);
    if (failure.error) {
      console.log(`Error: ${failure.error}`);
    } else {
      console.log(`Backup: ${failure.backup}`);
      console.log(`New: ${failure.new}`);
    }
  });
}

console.log("\n" + "=".repeat(80));

export { testScenarios };
