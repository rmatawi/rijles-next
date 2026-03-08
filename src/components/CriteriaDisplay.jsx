import React from 'react';
import { Block, Icon } from "framework7-react";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

/**
 * Component to render step-by-step criteria in a structured, safe way
 * @param {Object} props
 * @param {Object} props.criteriaData - Structured criteria data
 * @param {string} props.criteriaData.roadType - Type of road situation (t-j-junction, zandweg, equal-rank, admin)
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
 * Get a vehicle's actual direction from maquetteData
 */
const getVehicleDirection = (vehicleName, maquetteData) => {
  if (!maquetteData || !vehicleName) return null;

  // Search all quadrants for the vehicle
  const quadrants = ["top", "right", "bottom", "left"];
  for (const quadrant of quadrants) {
    const quadrantData = maquetteData[quadrant];
    if (!quadrantData?.vehicles) continue;

    // Search through all rows of vehicles
    for (const row of quadrantData.vehicles) {
      for (const vehicle of row) {
        if (vehicle.type === "car" && vehicle.name === vehicleName) {
          return vehicle.direction; // 'left', 'straight', or 'right'
        }
      }
    }
  }
  return null;
};

/**
 * Extract direction text from a rule with bold formatting
 */
const extractDirection = (ruleText) => {
  if (ruleText.includes("Linksaf"))
    return (
      <>
        gaat <strong>Linksaf</strong>
      </>
    );
  if (ruleText.includes("Rechtdoor"))
    return (
      <>
        gaat <strong>Rechtdoor</strong>
      </>
    );
  if (ruleText.includes("Rechtsaf"))
    return (
      <>
        gaat <strong>Rechtsaf</strong>
      </>
    );
  return "";
};

/**
 * Extract direction text from a rule as plain text (for speech)
 */
const extractDirectionPlainText = (ruleText) => {
  if (ruleText.includes("Linksaf"))
    return "gaat Linksaf";
  if (ruleText.includes("Rechtdoor"))
    return "gaat Rechtdoor";
  if (ruleText.includes("Rechtsaf"))
    return "gaat Rechtsaf";
  return "";
};

/**
 * Transform a single rule text based on vehicle names and rule content
 * Returns JSX with bold formatting for key terms
 * For single vehicles, omits the vehicle name (already in header)
 */
const transformRuleText = (rule, vehicleNames, vehicles) => {
  let inritSize = "de inrit";
  console.log({ ruletext: rule.text });

  // Check for specific inrit types in order of specificity (most specific first)
  if (rule.text.includes("inrit s/b")) {
    inritSize = "inrit S/B";
  } else if (rule.text.includes("inrit s")) {
    inritSize = "inrit S";
  } else if (rule.text.includes("inrit b")) {
    inritSize = "inrit B";
  }

  // Handle inrit rules
  if (rule.text.includes("inrit-")) {
    const vehicleName = rule.text.split(" ")[1];
    return vehicles.isMultiple ? (
      <>
        {vehicleName} maakt <strong>{inritSize} vrij</strong>
      </>
    ) : (
      <>
        maakt <strong>{inritSize} vrij</strong>
      </>
    );
  }

  if (rule.text.includes("inrit s/inrit b")) {
    const vehicleName = rule.text.split(" ")[0];
    return vehicles.isMultiple ? (
      <>
        {vehicleName} maakt <strong>{inritSize} vrij</strong>
      </>
    ) : (
      <>
        maakt <strong>{inritSize} vrij</strong>
      </>
    );
  }

  if (rule.text.includes("gaat naar de inrit")) {
    const vehicleName = rule.text.split(" ")[0];
    return vehicles.isMultiple ? (
      <>
        {vehicleName} gaat naar <strong>{inritSize}</strong>
      </>
    ) : (
      <>
        gaat naar <strong>{inritSize}</strong>
      </>
    );
  }

  // Handle special rules
  if (rule.text.includes("Links Vrij")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} hebben <strong>Links Vrij</strong>
      </>
    ) : (
      <>
        heeft <strong>Links Vrij</strong>
      </>
    );
  }

  if (rule.text.includes("Linksaf")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} gaan <strong>Linksaf</strong>
      </>
    ) : (
      <>
        gaat <strong>Linksaf</strong>
      </>
    );
  }

  if (rule.text.includes("Rechtdoor")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} gaan <strong>Rechtdoor</strong>
      </>
    ) : (
      <>
        gaat <strong>Rechtdoor</strong>
      </>
    );
  }

  if (rule.text.includes("Rechtsaf")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} gaan <strong>Rechtsaf</strong>
      </>
    ) : (
      <>
        gaat <strong>Rechtsaf</strong>
      </>
    );
  }

  // Handle bike lane rules
  if (rule.text.includes("bike-lane")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} rijden samen naar <strong>weg met fietspad</strong>
      </>
    ) : (
      <>
        rijdt naar <strong>weg met fietspad</strong>
      </>
    );
  }

  if (
    rule.text.includes("fietspad") ||
    rule.text.includes("bike lane") ||
    rule.text.includes("destination has bike lane")
  ) {
    if (vehicles.hasBike) {
      return vehicles.isMultiple ? (
        <>
          {vehicleNames} rijden naar <strong>fietspad</strong>
        </>
      ) : (
        <>
          rijdt naar <strong>fietspad</strong>
        </>
      );
    } else {
      return vehicles.isMultiple ? (
        <>
          {vehicleNames} rijden naar <strong>weg met fietspad</strong>
        </>
      ) : (
        <>
          rijdt naar <strong>weg met fietspad</strong>
        </>
      );
    }
  }

  // Handle priority road rules
  if (
    rule.text.includes("Voorrangsweg") &&
    rule.text.includes("moet voorrang geven")
  ) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} moeten <strong>voorrang geven</strong>
      </>
    ) : (
      <>
        moet <strong>voorrang geven</strong>
      </>
    );
  }

  if (rule.text.includes("Voorrangsweg")) {
    return vehicles.isMultiple ? (
      <>
        {vehicleNames} rijden op <strong>voorrangsweg</strong>
      </>
    ) : (
      <>
        rijdt op <strong>voorrangsweg</strong>
      </>
    );
  }

  // Handle generic rules
  const ruleText = rule.text.split(":").slice(1).join(":").trim();
  if (ruleText.startsWith(vehicleNames)) {
    return ruleText;
  }
  if (ruleText === "") {
    return rule.text;
  }
  // For single vehicles, omit the vehicle name (already in header)
  return vehicles.isMultiple ? `${vehicleNames} ${ruleText}` : ruleText;
};

/**
 * Transform a single rule text to plain text (for speech)
 * Returns plain text without JSX elements
 * For single vehicles, omits the vehicle name (already in header)
 */
const transformRuleTextToPlainText = (rule, vehicleNames, vehicles) => {
  let inritSize = "de inrit";

  // Check for specific inrit types in order of specificity (most specific first)
  if (rule.text.includes("inrit s/b")) {
    inritSize = "inrit S/B";
  } else if (rule.text.includes("inrit s")) {
    inritSize = "inrit S";
  } else if (rule.text.includes("inrit b")) {
    inritSize = "inrit B";
  }

  // Handle inrit rules
  if (rule.text.includes("inrit-")) {
    const vehicleName = rule.text.split(" ")[1];
    return vehicles.isMultiple ?
      `${vehicleName} maakt ${inritSize} vrij` :
      `maakt ${inritSize} vrij`;
  }

  if (rule.text.includes("inrit s/inrit b")) {
    const vehicleName = rule.text.split(" ")[0];
    return vehicles.isMultiple ?
      `${vehicleName} maakt ${inritSize} vrij` :
      `maakt ${inritSize} vrij`;
  }

  if (rule.text.includes("gaat naar de inrit")) {
    const vehicleName = rule.text.split(" ")[0];
    return vehicles.isMultiple ?
      `${vehicleName} gaat naar ${inritSize}` :
      `gaat naar ${inritSize}`;
  }

  // Handle special rules
  if (rule.text.includes("Links Vrij")) {
    return vehicles.isMultiple ?
      `${vehicleNames} hebben Links Vrij` :
      `heeft Links Vrij`;
  }

  if (rule.text.includes("Linksaf")) {
    return vehicles.isMultiple ?
      `${vehicleNames} gaan Linksaf` :
      `gaat Linksaf`;
  }

  if (rule.text.includes("Rechtdoor")) {
    return vehicles.isMultiple ?
      `${vehicleNames} gaan Rechtdoor` :
      `gaat Rechtdoor`;
  }

  if (rule.text.includes("Rechtsaf")) {
    return vehicles.isMultiple ?
      `${vehicleNames} gaan Rechtsaf` :
      `gaat Rechtsaf`;
  }

  // Handle bike lane rules
  if (rule.text.includes("bike-lane")) {
    return vehicles.isMultiple ?
      `${vehicleNames} rijden samen naar weg met fietspad` :
      `rijdt naar weg met fietspad`;
  }

  if (
    rule.text.includes("fietspad") ||
    rule.text.includes("bike lane") ||
    rule.text.includes("destination has bike lane")
  ) {
    if (vehicles.hasBike) {
      return vehicles.isMultiple ?
        `${vehicleNames} rijden naar fietspad` :
        `rijdt naar fietspad`;
    } else {
      return vehicles.isMultiple ?
        `${vehicleNames} rijden naar weg met fietspad` :
        `rijdt naar weg met fietspad`;
    }
  }

  // Handle priority road rules
  if (
    rule.text.includes("Voorrangsweg") &&
    rule.text.includes("moet voorrang geven")
  ) {
    return vehicles.isMultiple ?
      `${vehicleNames} moeten voorrang geven` :
      `moet voorrang geven`;
  }

  if (rule.text.includes("Voorrangsweg")) {
    return vehicles.isMultiple ?
      `${vehicleNames} rijden op voorrangsweg` :
      `rijdt op voorrangsweg`;
  }

  // Handle generic rules
  const ruleText = rule.text.split(":").slice(1).join(":").trim();
  if (ruleText.startsWith(vehicleNames)) {
    return ruleText;
  }
  if (ruleText === "") {
    return rule.text;
  }
  // For single vehicles, omit the vehicle name (already in header)
  return vehicles.isMultiple ? `${vehicleNames} ${ruleText}` : ruleText;
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
  verb,
  maquetteData
) => {
  // Map direction values to rule texts
  const directionMap = {
    left: "Linksaf",
    straight: "Rechtdoor",
    right: "Rechtsaf",
  };

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
      {vehicles.list.map((vehicle, index) => {
        // Get the vehicle's actual direction from maquetteData
        const actualDirection = getVehicleDirection(vehicle, maquetteData);
        const expectedRuleText = directionMap[actualDirection];

        // Find the matching direction rule
        const matchingRule = directionRules.find((rule) =>
          rule.text.includes(expectedRuleText)
        );

        // Extract the formatted direction text
        const directionText = matchingRule ? (
          extractDirection(matchingRule.text)
        ) : (
          <>
            gaat <strong>{expectedRuleText || "?"}</strong>
          </>
        );

        return (
          <div key={`dir-${index}`} style={{ marginBottom: "4px" }}>
            - {vehicle} {directionText}
          </div>
        );
      })}
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

  // For admin rules, render the HTML content directly
  if (rules.some((rule) => rule.type === "admin")) {
    return (
      <>
        {rules.map((rule, index) => {
          // Check if the rule.text contains HTML tags
          const hasHTML = /<[^>]*>/.test(rule.text);
          if (hasHTML) {
            return (
              <div
                key={index}
                style={{ marginBottom: "4px" }}
                dangerouslySetInnerHTML={{ __html: rule.text }}
              />
            );
          } else {
            return (
              <div key={index} style={{ marginBottom: "4px" }}>
                {rule.text}
              </div>
            );
          }
        })}
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
const renderEqualRankTwoVehiclesSpecial = (
  vehicleNames,
  vehicles,
  rules,
  directionRules,
  verb
) => {
  const hasLeftVacant = rules.some((rule) => rule.text.includes("Links Vrij"));

  // Find which vehicle is turning right and which is going straight
  const rechtsafRule = directionRules.find((r) => r.text.includes("Rechtsaf"));
  const rechtdoorRule = directionRules.find((r) =>
    r.text.includes("Rechtdoor")
  );

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
          - {vehicles.list.join(" en ")} hebben <strong>Links Vrij</strong>
        </div>
      )}
      <div style={{ marginBottom: "4px" }}>
        - {rightTurner} gaat <strong>Rechtsaf</strong>
      </div>
      <div style={{ marginBottom: "4px" }}>
        - {straightGoer} gaat <strong>Rechtdoor</strong>
      </div>
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CriteriaDisplay = ({ criteriaData, maquetteData }) => {
  if (!criteriaData) return null;

  const { roadType, vehicleNames, rules } = criteriaData;

  // Use centralized text-to-speech hook
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();

  // Map road types to display titles
  const roadTypeTitles = {
    "t-junction": "T-kruising",
    zandweg: "Zandweg regels",
    "equal-rank": "Wegen van gelijke rangorde",
    admin: "custom",
  };

  const title = roadTypeTitles[roadType] || "Verkeersregels";

  // Parse vehicle information
  const vehicles = parseVehicles(vehicleNames);
  const verb = getVerb(vehicles.isMultiple);

  // Function to generate text content for speech
  const generateTextForSpeech = () => {
    let text = "";

    if (title !== "custom") {
      text += title + ". ";
    }

    // Add vehicle information and rules
    if (vehicleNames) {
      // Add vehicle names and verb
      text += `${vehicleNames} ${verb} op: `;

      // Add rules
      if (rules && rules.length > 0) {
        const { directionRules, otherRules } = categorizeRules(rules);

        // Add other rules first
        otherRules.forEach(rule => {
          const transformedRule = transformRuleTextToPlainText(rule, vehicleNames, vehicles);
          text += transformedRule + ". ";
        });

        // Add direction rules
        if (roadType === "equal-rank" && vehicles.isMultiple && vehicles.list.length === 2) {
          // Special case for equal-rank roads
          const hasLeftVacant = rules.some((rule) => rule.text.includes("Links Vrij"));
          if (hasLeftVacant) {
            text += `${vehicles.list.join(" en ")} hebben Links Vrij. `;
          }
          text += `${vehicles.list[0]} gaat Rechtsaf. ${vehicles.list[1]} gaat Rechtdoor. `;
        } else if (vehicles.isMultiple && directionRules.length > 1 && vehicles.list.length === directionRules.length) {
          // Individual directions for multiple vehicles
          vehicles.list.forEach((vehicle, index) => {
            const actualDirection = getVehicleDirection(vehicle, maquetteData);
            const directionMap = {
              left: "Linksaf",
              straight: "Rechtdoor",
              right: "Rechtsaf",
            };
            const expectedRuleText = directionMap[actualDirection];
            const matchingRule = directionRules.find((rule) =>
              rule.text.includes(expectedRuleText)
            );

            if (matchingRule) {
              const directionText = extractDirectionPlainText(matchingRule.text);
              text += `${vehicle} ${directionText}. `;
            }
          });
        } else {
          // Standard rules
          rules.forEach(rule => {
            const transformedRule = transformRuleTextToPlainText(rule, vehicleNames, vehicles);
            text += transformedRule + ". ";
          });
        }
      }
    }

    return text;
  };

  // Handle text-to-speech for criteria
  const handleSpeakCriteria = () => {
    const textToSpeak = generateTextForSpeech();
    if (textToSpeak.trim()) {
      speak(textToSpeak);
    }
  };

  // Categorize rules
  const { directionRules, otherRules } = categorizeRules(rules || []);

  /**
   * Main rendering logic - determines which rendering strategy to use
   */
  const renderVehicleDirections = () => {
    // For admin-provided content, render directly
    if (roadType === "admin") {
      return renderStandardRules(vehicleNames, vehicles, rules, verb);
    }

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
      const hasRechtsaf = directionRules.some((r) =>
        r.text.includes("Rechtsaf")
      );
      const hasRechtdoor = directionRules.some((r) =>
        r.text.includes("Rechtdoor")
      );
      const hasLinksVrij = rules.some((r) => r.text.includes("Links Vrij"));

      // Check if this matches the special pattern: one right-turn, one straight, with LV
      if (
        hasRechtsaf &&
        hasRechtdoor &&
        hasLinksVrij &&
        directionRules.length === 2
      ) {
        return renderEqualRankTwoVehiclesSpecial(
          vehicleNames,
          vehicles,
          rules,
          directionRules,
          verb
        );
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
        verb,
        maquetteData
      );
    }

    // Default: Standard rule rendering
    return renderStandardRules(vehicleNames, vehicles, rules, verb);
  };

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {title !== "custom" && (
          <h3 style={{ marginBottom: "8px", fontWeight: "bold", flex: 1 }}>{title}</h3>
        )}
        <div
          className="neu-btn-circle"
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: isSpeaking ? "#ff3b30" : "var(--app-primary-color)",
            cursor: "pointer",
            zIndex: 10,
            flexShrink: 0,
            marginLeft: "8px",
          }}
          onClick={handleSpeakCriteria}
        >
          <Icon
            f7={isSpeaking ? "stop_fill" : "speaker_2_fill"}
            style={{ fontSize: "16px", color: "white" }}
          />
        </div>
      </div>
      {renderVehicleDirections()}
    </div>
  );
};

export default CriteriaDisplay;
