import { Block } from "framework7-react";

/**
 * Component to render step-by-step criteria in a structured, safe way
 * @param {Object} props
 * @param {Object} props.criteriaData - Structured criteria data
 * @param {string} props.criteriaData.roadType - Type of road situation (t-junction, zandweg, equal-rank)
 * @param {string[]} props.criteriaData.vehicleNames - Names of vehicles in this step
 * @param {Array} props.criteriaData.rules - Array of rule objects with type and text
 */

// ============================================================================
// UTILITY FUNCTIONS - Centralized logic for processing vehicles and rules
// ============================================================================

/**
 * Parse vehicle names and determine properties
 */
const parseVehicles = (vehicleNames) => {
  if (!vehicleNames) return { list: [], isMultiple: false, hasPlus: false };

  const hasPlus = vehicleNames.includes("+");
  const list = hasPlus ? vehicleNames.split("+") : [vehicleNames];
  const isMultiple = hasPlus;
  const hasBike = list.some(
    (name) =>
      name.toLowerCase().includes("f") || name.toLowerCase().includes("bike")
  );

  return { list, isMultiple, hasPlus, hasBike };
};

/**
 * Determine the correct verb form based on vehicle count
 */
const getVerb = (isMultiple) => (isMultiple ? "rijden" : "rijdt");

/**
 * Categorize rules into direction rules and other rules
 */
const categorizeRules = (rules) => {
  const directionRules = [];
  const otherRules = [];

  rules.forEach((rule) => {
    if (
      rule.text.includes("Linksaf") ||
      rule.text.includes("Rechtdoor") ||
      rule.text.includes("Rechtsaf")
    ) {
      directionRules.push(rule);
    } else {
      otherRules.push(rule);
    }
  });

  return { directionRules, otherRules };
};

/**
 * Extract direction text from a rule
 */
const extractDirection = (ruleText) => {
  if (ruleText.includes("Linksaf")) return "gaat Linksaf";
  if (ruleText.includes("Rechtdoor")) return "gaat Rechtdoor";
  if (ruleText.includes("Rechtsaf")) return "gaat Rechtsaf";
  return "";
};

/**
 * Transform a single rule text based on vehicle names and rule content
 */
const transformRuleText = (rule, vehicleNames, vehicles) => {
  let transformedText = rule.text;

  // Handle inrit rules
  if (rule.text.includes("inrit-")) {
    const vehicleName = rule.text.split(" ")[1];
    return `${vehicleName} maakt inrit vrij`;
  }

  if (rule.text.includes("inrit s/inrit b")) {
    const vehicleName = rule.text.split(" ")[0];
    return `${vehicleName} maakt inrit vrij`;
  }

  if (rule.text.includes("gaat naar de inrit")) {
    const vehicleName = rule.text.split(" ")[0];
    return `${vehicleName} gaat naar de inrit`;
  }

  // Handle special rules
  if (rule.text.includes("Links Vrij")) {
    return vehicles.isMultiple
      ? `${vehicleNames} hebben Links Vrij`
      : `${vehicleNames} heeft Links Vrij`;
  }

  if (rule.text.includes("Linksaf")) {
    return vehicles.isMultiple
      ? `${vehicleNames} gaan Linksaf`
      : `${vehicleNames} gaat Linksaf`;
  }

  if (rule.text.includes("Rechtdoor")) {
    return vehicles.isMultiple
      ? `${vehicleNames} gaan Rechtdoor`
      : `${vehicleNames} gaat Rechtdoor`;
  }

  if (rule.text.includes("Rechtsaf")) {
    return vehicles.isMultiple
      ? `${vehicleNames} gaan Rechtsaf`
      : `${vehicleNames} gaat Rechtsaf`;
  }

  // Handle bike lane rules
  if (rule.text.includes("bike-lane")) {
    return vehicles.isMultiple
      ? `${vehicleNames} rijden samen naar weg met fietspad`
      : `${vehicleNames} rijdt naar weg met fietspad`;
  }

  if (
    rule.text.includes("fietspad") ||
    rule.text.includes("bike lane") ||
    rule.text.includes("destination has bike lane")
  ) {
    if (vehicles.hasBike) {
      return vehicles.isMultiple
        ? `${vehicleNames} rijden naar fietspad`
        : `${vehicleNames} rijdt naar fietspad`;
    } else {
      return vehicles.isMultiple
        ? `${vehicleNames} rijden naar weg met fietspad`
        : `${vehicleNames} rijdt naar weg met fietspad`;
    }
  }

  // Handle priority road rules
  if (
    rule.text.includes("Voorrangsweg") &&
    rule.text.includes("moet voorrang geven")
  ) {
    return vehicles.isMultiple
      ? `${vehicleNames} moeten voorrang geven`
      : `${vehicleNames} moet voorrang geven`;
  }

  if (rule.text.includes("Voorrangsweg")) {
    return vehicles.isMultiple
      ? `${vehicleNames} rijden op Voorrangsweg`
      : `${vehicleNames} rijdt op Voorrangsweg`;
  }

  // Handle generic rules
  const ruleText = rule.text.split(":").slice(1).join(":").trim();
  if (ruleText.startsWith(vehicleNames)) {
    return ruleText;
  }
  if (ruleText === "") {
    return rule.text;
  }
  return `${vehicleNames} ${ruleText}`;
};

/**
 * Render a single rule with optional icon
 */
const renderRule = (rule, index, keyPrefix = "") => (
  <div key={`${keyPrefix}${index}`} style={{ marginBottom: "4px" }}>
    - {rule.icon && <span>{rule.icon} </span>}
    {rule.transformedText || rule.text}
  </div>
);

// ============================================================================
// RENDERING LOGIC - Different rendering strategies based on scenario
// ============================================================================

/**
 * Render individual vehicle directions when each vehicle has a different direction
 */
const renderIndividualDirections = (
  vehicleNames,
  vehicles,
  directionRules,
  otherRules,
  verb
) => {
  const directionsList = directionRules.map((rule) =>
    extractDirection(rule.text)
  );

  // Transform other rules
  const transformedOtherRules = otherRules.map((rule) => ({
    ...rule,
    transformedText: transformRuleText(rule, vehicleNames, vehicles),
  }));

  return (
    <>
      <div style={{ marginBottom: "8px" }}>
        <strong>{vehicleNames}</strong> {verb} op:
      </div>
      {/* Display other non-direction rules first */}
      {transformedOtherRules.map((rule, index) =>
        renderRule(rule, index, "other-")
      )}
      {/* Display individual vehicle directions */}
      {vehicles.list.map((vehicle, index) => (
        <div key={`dir-${index}`} style={{ marginBottom: "4px" }}>
          - {vehicle} {directionsList[index]}
        </div>
      ))}
    </>
  );
};

/**
 * Render standard rules (all vehicles follow same rules or mixed rules)
 */
const renderStandardRules = (vehicleNames, vehicles, rules, verb) => {
  if (!rules || rules.length === 0) {
    return (
      <>
        <div style={{ marginBottom: "4px" }}>
          - {vehicleNames} {vehicles.isMultiple ? "rijden" : "rijdt"}
        </div>
      </>
    );
  }

  const transformedRules = rules.map((rule) => ({
    ...rule,
    transformedText: transformRuleText(rule, vehicleNames, vehicles),
  }));

  return (
    <>
      <div style={{ marginBottom: "8px" }}>
        <strong>{vehicleNames}</strong> {verb} op:
      </div>
      {transformedRules.map((rule, index) => renderRule(rule, index))}
    </>
  );
};

/**
 * Special case: Equal-rank roads with two vehicles - one turning right, one going straight
 */
const renderEqualRankTwoVehiclesSpecial = (vehicleNames, vehicles, rules, directionRules, verb) => {
  const hasLeftVacant = rules.some((rule) => rule.text.includes("Links Vrij"));

  // Find which vehicle is turning right and which is going straight
  const rechtsafRule = directionRules.find(r => r.text.includes("Rechtsaf"));
  const rechtdoorRule = directionRules.find(r => r.text.includes("Rechtdoor"));

  // Default to first vehicle turns right, second goes straight
  // (This maintains backwards compatibility with the original "1+2" case)
  const rightTurner = vehicles.list[0];
  const straightGoer = vehicles.list[1];

  return (
    <>
      <div style={{ marginBottom: "8px" }}>
        <strong>{vehicleNames}</strong> {verb} op:
      </div>
      {hasLeftVacant && (
        <div style={{ marginBottom: "4px" }}>
          - {vehicles.list.join(" en ")} hebben Links Vrij
        </div>
      )}
      <div style={{ marginBottom: "4px" }}>
        - {rightTurner} gaat Rechtsaf
      </div>
      <div style={{ marginBottom: "4px" }}>
        - {straightGoer} gaat Rechtdoor
      </div>
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CriteriaDisplay = ({ criteriaData }) => {
  if (!criteriaData) return null;

  const { roadType, vehicleNames, rules } = criteriaData;

  // Map road types to display titles
  const roadTypeTitles = {
    "t-junction": "T-kruising",
    zandweg: "Zandweg regels",
    "equal-rank": "Wegen van gelijke rangorde",
  };

  const title = roadTypeTitles[roadType] || "Verkeersregels";

  // Parse vehicle information
  const vehicles = parseVehicles(vehicleNames);
  const verb = getVerb(vehicles.isMultiple);

  // Categorize rules
  const { directionRules, otherRules } = categorizeRules(rules || []);

  /**
   * Main rendering logic - determines which rendering strategy to use
   */
  const renderVehicleDirections = () => {
    // No vehicle names - show generic rules
    if (!vehicleNames) {
      return renderStandardRules("", vehicles, rules, verb);
    }

    // Special case: Equal-rank roads with two vehicles - one right turn, one straight
    // This applies when we have exactly 2 vehicles with Rechtsaf + Rechtdoor directions
    if (
      roadType === "equal-rank" &&
      vehicles.isMultiple &&
      vehicles.list.length === 2
    ) {
      const hasRechtsaf = directionRules.some(r => r.text.includes("Rechtsaf"));
      const hasRechtdoor = directionRules.some(r => r.text.includes("Rechtdoor"));
      const hasLinksVrij = rules.some(r => r.text.includes("Links Vrij"));

      // Check if this matches the special pattern: one right-turn, one straight, with LV
      if (hasRechtsaf && hasRechtdoor && hasLinksVrij && directionRules.length === 2) {
        return renderEqualRankTwoVehiclesSpecial(vehicleNames, vehicles, rules, directionRules, verb);
      }
    }

    // Multiple vehicles with multiple different directions
    // This applies to all road types when we have matching vehicles and directions
    if (
      vehicles.isMultiple &&
      directionRules.length > 1 &&
      vehicles.list.length === directionRules.length
    ) {
      return renderIndividualDirections(
        vehicleNames,
        vehicles,
        directionRules,
        otherRules,
        verb
      );
    }

    // Default: Standard rule rendering
    return renderStandardRules(vehicleNames, vehicles, rules, verb);
  };

  return (
    <div style={{ textAlign: "left" }}>
      <div
        style={{ marginBottom: "8px", fontWeight: "bold", fontSize: "16px" }}
      >
        {title}
      </div>
      {renderVehicleDirections()}
    </div>
  );
};

export default CriteriaDisplay;
