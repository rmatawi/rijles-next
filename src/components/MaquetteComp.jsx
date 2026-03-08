import { useEffect, useRef, useState } from "react";
import MaquetteAnimation from "./MaquetteAnimation";
import { Button, f7 } from "framework7-react";
import {
  detectTJunction,
  determineZandwegPriority,
  isInrit,
  filterByRoadType,
  filterLeftVacant,
  filterLeftTurners,
  filterRightTurners,
  QUADRANTS,
  getVehicleDestination,
} from "../js/vehicleSequenceUtils";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";
import { getLayout } from "../js/utils";

const MaquetteComp = ({
  userAnswer,
  maquetteNumber,
  maquetteData,
  roadsize,
  onVehicleClick,
  indexMaquette,
  onRef,
}) => {
  if (!maquetteData) {
    return null;
  }

  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlayingIndividual, setIsPlayingIndividual] = useState(false); // Track individual vehicle play
  const [hasPlayedIndividual, setHasPlayedIndividual] = useState(false); // Track individual vehicle play completion
  const [showResetButton, setShowResetButton] = useState(false); // Control when to show reset button after individual play
  const [animationKey, setAnimationKey] = useState(0); // For resetting animations
  const [isStepByStep, setIsStepByStep] = useState(false); // Track if in step-by-step mode
  const [currentStep, setCurrentStep] = useState(0); // Track current step in step-by-step mode
  const [animationGroups, setAnimationGroups] = useState([]); // Store parsed animation groups
  const [autoResetDelay, setAutoResetDelay] = useState(2000); // Delay in ms before auto-reset (default 2 seconds)

  const containerRef = useRef(null);
  const { addEventListener, removeEventListener, dispatchEvent, EVENTS } =
    useMaquetteEvents();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Use requestAnimationFrame to avoid forced reflows
        requestAnimationFrame(() => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.3, // Reduced from 0.5 to trigger earlier
        rootMargin: "50px", // Add margin to trigger earlier
      }
    );

    // Listen for individual vehicle play events (specific to this maquette)
    const handleIndividualPlay = (event) => {
      // Only respond to events for this specific maquette
      if (event.detail.maquetteNumber === maquetteNumber) {
        setIsPlayingIndividual(true);
        setHasPlayedIndividual(false); // Reset the hasPlayedIndividual when starting a new play
        setShowResetButton(false); // Hide reset button during individual play
      }
    };

    // Listen for animation completion events to reset individual play state (specific to this maquette)
    const handleAnimationComplete = (event) => {
      // Only respond to events for this specific maquette
      if (event.detail.maquetteNumber === maquetteNumber) {
        setIsPlayingIndividual(false);
        setHasPlayedIndividual(true); // Set hasPlayedIndividual when animation completes
        // Show reset button after 2500ms delay
        setTimeout(() => {
          setShowResetButton(true);
        }, 2500);
      }
    };

    // Listen for reset other animations event (for other maquettes to reset when one starts)
    const handleResetOtherAnimations = (event) => {
      // Only respond to events for other maquettes (not this one)
      if (event.detail.maquetteNumber !== maquetteNumber) {
        resetAnimations(); // Reset this maquette's animations
      }
    };

    addEventListener(EVENTS.INDIVIDUAL_VEHICLE_PLAY, handleIndividualPlay);
    addEventListener(EVENTS.ANIMATION_COMPLETE, handleAnimationComplete);
    addEventListener(EVENTS.RESET_OTHER_ANIMATIONS, handleResetOtherAnimations);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      removeEventListener(EVENTS.INDIVIDUAL_VEHICLE_PLAY, handleIndividualPlay);
      removeEventListener(EVENTS.ANIMATION_COMPLETE, handleAnimationComplete);
      removeEventListener(
        EVENTS.RESET_OTHER_ANIMATIONS,
        handleResetOtherAnimations
      );
    };
  }, [maquetteNumber, addEventListener, removeEventListener, EVENTS]);

  const playAnimations = async (order) => {
    if (isPlaying) return;

    setIsPlaying(true);

    // Get all MaquetteAnimation components
    const quadrants = ["top", "right", "bottom", "left"];

    // Create a promise for each quadrant that resolves when its animation completes
    const animationPromises = quadrants.map((quadrant) => {
      return new Promise((resolve) => {
        // Create a custom event to listen for animation completion
        const completionListener = (event) => {
          if (event.detail.quadrant === quadrant) {
            removeEventListener(EVENTS.ANIMATION_COMPLETE, completionListener);
            resolve();
          }
        };

        addEventListener(EVENTS.ANIMATION_COMPLETE, completionListener);

        // Trigger animation for current quadrant
        dispatchEvent(EVENTS.PLAY_ANIMATION, {
          quadrant,
          order,
          maquetteNumber,
        });
      });
    });

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    // All animations have completed
    setIsPlaying(false);
    setHasPlayed(true);

    // Auto-reset after a delay to allow users to see the final state
    setTimeout(() => {
      resetAnimations();
    }, autoResetDelay); // Configurable delay before auto-reset
  };

  const resetAnimations = () => {
    // Increment key to force remount of all MaquetteAnimation components
    setAnimationKey((prev) => prev + 1);
    setHasPlayed(false);
    setIsPlaying(false); // Also reset main playing state
    setIsPlayingIndividual(false);
    setHasPlayedIndividual(false);
    setShowResetButton(false); // Reset the show reset button state
    setIsStepByStep(false);
    setCurrentStep(0);
    setAnimationGroups([]);
  };

  // Function to get criteria for the current step based on actual sequence generation logic
  const getCriteriaForStep = (groups, stepIndex, maquetteData) => {
    if (!maquetteData) return [];

    // Check if admin has provided custom step descriptions
    if (
      maquetteData.stepDescriptions &&
      maquetteData.stepDescriptions[stepIndex]
    ) {
      // Return the admin-provided description
      return maquetteData.stepDescriptions[stepIndex];
    }

    const currentGroup = groups[stepIndex];
    const criteria = [];

    // If we have a user answer or maquette sequence, we can get more detailed criteria
    const sequence = userAnswer?.replace(/\s+/g, "") || maquetteData?.sequence;

    // Check if it contains emergency vehicles (PS, BS, AS)
    if (
      currentGroup.toLowerCase().includes("police") ||
      currentGroup.toLowerCase().includes("firetruck") ||
      currentGroup.toLowerCase().includes("ambulance") ||
      currentGroup.toUpperCase().includes("PS") ||
      currentGroup.toUpperCase().includes("BS") ||
      currentGroup.toUpperCase().includes("AS")
    ) {
      criteria.push(
        "bevoorrrecht 🚨 Bevoorrechte Weggebruikers (PS, BS, AS): noodvoertuigen hebben absolute voorrang"
      );
    }

    // Check for T-junction rules
    const tJunction = detectTJunction(maquetteData);
    if (tJunction) {
      criteria.push(
        `junction T-kruising: inrit=${tJunction.inritQuadrant}, zijweg moet voorrang geven aan hoofdweg`
      );
    }

    // Check for zandweg priority rules
    const zandwegPriority = determineZandwegPriority(maquetteData);
    if (zandwegPriority) {
      criteria.push(
        `zandweg: Hoofdweg heeft voorrang boven zandweg (behalve in uitzonderingsgevallen)`
      );
    }

    // Determine what specific rules apply based on the sequence logic
    // For this, we need to identify vehicles in the current group and their properties

    const vehiclesInStep = currentGroup.split("+");

    // Check for road type priority (main road vs side road in T-junction)
    const roadTypeFilter = filterByRoadType(
      getVehiclesInStep(vehiclesInStep, maquetteData),
      maquetteData
    );
    if (roadTypeFilter.mainRoadVehicles.length > 0) {
      criteria.push("verkeersregel: Hoofdweg heeft voorrang boven zijweg");
    }

    // Check for LV (Left Vacant) - ONLY applies to equal-rank roads
    // LV does NOT apply when there's a T-junction, zandweg, or inrit
    // Equal-rank roads are intersections where all roads have the same priority
    const hasInrit = QUADRANTS.some((quadrant) =>
      isInrit(maquetteData, quadrant)
    );
    const isEqualRankRoad = !tJunction && !zandwegPriority && !hasInrit;

    if (isEqualRankRoad) {
      // Track vehicles that have already been processed in previous steps
      const processedVehicles = new Set();

      // Add all vehicles from previous steps to processedVehicles
      // We need to add vehicle IDs, not names, because hasLeftVacant uses vehicle IDs
      for (let i = 0; i < stepIndex; i++) {
        const previousGroup = groups[i];
        const previousVehicles = previousGroup.split("+");

        // Get vehicle IDs for all vehicles in previous groups
        const previousVehicleInfos = getVehiclesInStep(
          previousVehicles,
          maquetteData
        );
        previousVehicleInfos.forEach((vInfo) => {
          processedVehicles.add(vInfo.vehicleId);
        });
      }

      const leftVacantFilter = filterLeftVacant(
        getVehiclesInStep(vehiclesInStep, maquetteData),
        maquetteData,
        processedVehicles
      );

      if (leftVacantFilter.lvVehicles.length > 0) {
        criteria.push(
          "lv Links-vrij (LV): voertuigen met linkerzijde vrij gaan voor verkeer met links verkeer"
        );
      }
    }

    // Check for LA (Left turners)
    const leftTurnersFilter = filterLeftTurners(
      getVehiclesInStep(vehiclesInStep, maquetteData)
    );
    if (leftTurnersFilter.laVehicles.length > 0) {
      criteria.push(
        "la Linksaf (LA): linksafslaand verkeer heeft voorrang op rechtsafslaand en rechtdoor verkeer"
      );
    }

    // Check for RA (Right turners)
    const rightTurnersFilter = filterRightTurners(
      getVehiclesInStep(vehiclesInStep, maquetteData)
    );
    if (rightTurnersFilter.raVehicles.length > 0) {
      criteria.push(
        "ra Rechtsaf (RA): rechtsafslaand verkeer moet voorrang geven aan verkeer van links"
      );
    }

    // Check for straight-ahead vehicles (RD)
    const vehiclesInfo = getVehiclesInStep(vehiclesInStep, maquetteData);
    const straightVehicles = vehiclesInfo.filter(
      (vInfo) =>
        vInfo.vehicle.direction === "straight" || !vInfo.vehicle.direction
    );
    if (straightVehicles.length > 0) {
      criteria.push(
        "rd Rechtdoor (RD): rechtdoorgaand verkeer heeft voorrang op afslaand verkeer"
      );
    }

    // Check for bike lane exceptions - when both bike and car go together due to bike lane destination
    const bikeVehicles = vehiclesInfo.filter((v) => v.vehicle.type === "bike");
    const carVehicles = vehiclesInfo.filter((v) =>
      ["car", "police", "ambulance", "firetruck"].includes(v.vehicle.type)
    );

    if (bikeVehicles.length > 0 && carVehicles.length > 0) {
      // Check if all vehicles in this step are going to the same destination with bike lanes
      // For this, we need to determine the destination based on direction
      const uniqueDirections = [
        ...new Set(vehiclesInfo.map((v) => v.vehicle.direction)),
      ];

      if (uniqueDirections.length === 1) {
        // All vehicles going in the same direction - check if destination has bike lanes
        const direction = uniqueDirections[0]; // left, right, straight
        let destinationQuadrant = null;

        // Map direction to destination quadrant (relative to the origin quadrant)
        // This mapping depends on which quadrant the vehicles originate from
        for (const vInfo of vehiclesInfo) {
          const originQuadrant = vInfo.direction;

          // Determine destination quadrant based on direction and origin
          if (direction === "left") {
            // From bottom -> right, right -> top, top -> left, left -> bottom
            if (originQuadrant === "bottom") destinationQuadrant = "right";
            else if (originQuadrant === "right") destinationQuadrant = "top";
            else if (originQuadrant === "top") destinationQuadrant = "left";
            else if (originQuadrant === "left") destinationQuadrant = "bottom";
          } else if (direction === "right") {
            // From bottom -> left, right -> bottom, top -> right, left -> top
            if (originQuadrant === "bottom") destinationQuadrant = "left";
            else if (originQuadrant === "right") destinationQuadrant = "bottom";
            else if (originQuadrant === "top") destinationQuadrant = "right";
            else if (originQuadrant === "left") destinationQuadrant = "top";
          } else if (direction === "straight") {
            // From bottom -> top, right -> left, top -> bottom, left -> right
            if (originQuadrant === "bottom") destinationQuadrant = "top";
            else if (originQuadrant === "right") destinationQuadrant = "left";
            else if (originQuadrant === "top") destinationQuadrant = "bottom";
            else if (originQuadrant === "left") destinationQuadrant = "right";
          }

          // Check if destination quadrant has bike lanes
          if (
            destinationQuadrant &&
            maquetteData[destinationQuadrant]?.bikelanes
          ) {
            const bikeLaneValue = maquetteData[destinationQuadrant]?.bikelanes;
            if (
              bikeLaneValue === true ||
              bikeLaneValue === "yes" ||
              bikeLaneValue === "both" ||
              bikeLaneValue === "left" ||
              bikeLaneValue === "right" ||
              maquetteData[destinationQuadrant]?.bikeLane === true ||
              maquetteData[destinationQuadrant]?.note
                ?.toLowerCase()
                .includes("fietspad") ||
              maquetteData[destinationQuadrant]?.note
                ?.toLowerCase()
                .includes("bike lane")
            ) {
              // Add bike lane rule to criteria
              criteria.push(
                "bike-lane Both bike and car go together to destination with bike lane"
              );
              break; // Only add once
            }
          }
        }
      }
    }

    // Check for vehicles going toward an inrit
    for (const vInfo of vehiclesInfo) {
      // Use the getVehicleDestination function to determine where the vehicle is going
      const destinationQuadrant = getVehicleDestination(vInfo);
      if (destinationQuadrant) {
        const destinationNote = maquetteData[destinationQuadrant]?.note;
        // Check if the destination quadrant is an inrit
        if (
          destinationNote &&
          (destinationNote === "INRIT S" ||
            destinationNote === "INRIT B" ||
            destinationNote === "INRIT S/B")
        ) {
          // Add rule for vehicle going to inrit
          criteria.push(
            `${vInfo.vehicle.name
            } gaat naar de ${destinationNote.toLowerCase()}`
          ); //gaat naar de inrit
        }
      }
    }

    // Check for inrit situations - vehicles exiting INRIT S or INRIT B
    for (const vInfo of vehiclesInfo) {
      const originQuadrant = vInfo.direction;
      const originNote = maquetteData[originQuadrant]?.note;

      if (
        originNote &&
        (originNote === "INRIT S" ||
          originNote === "INRIT B" ||
          originNote === "INRIT S/B")
      ) {
        // Add inrit rule for this specific vehicle
        criteria.push(
          `inrit-${vInfo.vehicle.name} ${vInfo.vehicle.name} maakt inrit vrij`
        );
      }
    }

    // Add general rule if no specific criteria apply
    if (criteria.length === 0) {
      criteria.push("algemeen: Algemene verkeersregels toepassen");
    }

    return criteria;
  };

  // Helper function to get vehicle info objects for the vehicles in a specific step
  const getVehiclesInStep = (vehicleNames, maquetteData) => {
    const vehicles = [];

    for (const vehicleName of vehicleNames) {
      // Search through all quadrants and rows to find the vehicle with the given name
      for (const direction of QUADRANTS) {
        const dirSection = maquetteData[direction];
        if (!dirSection || !dirSection.vehicles) continue;

        for (
          let rowIndex = 0;
          rowIndex < dirSection.vehicles.length;
          rowIndex++
        ) {
          const row = dirSection.vehicles[rowIndex];
          if (!row || !Array.isArray(row)) continue;

          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const vehicle = row[colIndex];
            if (
              !vehicle ||
              !vehicle.name ||
              vehicle.name !== vehicleName.trim()
            )
              continue;

            // Determine if it's a sequence vehicle
            const isSequenceVehicle = [
              "car",
              "ambulance",
              "firetruck",
              "police",
              "bike",
            ].includes(vehicle.type);

            if (isSequenceVehicle) {
              vehicles.push({
                vehicle,
                direction,
                rowIndex,
                colIndex,
                vehicleId: `${direction}-${rowIndex}-${colIndex}`,
              });
            }
          }
        }
      }
    }

    return vehicles;
  };

  const playStepByStepAnimation = async (groups, stepIndex) => {
    if (stepIndex >= groups.length) {
      // All steps complete
      setIsPlaying(false);
      setHasPlayed(true);
      setIsStepByStep(false);
      // Auto-reset after a delay to allow users to see the final state
      setTimeout(() => {
        resetAnimations();
      }, autoResetDelay); // Configurable delay before auto-reset
      return;
    }

    setIsPlaying(true);
    const currentGroup = groups[stepIndex];
    const quadrants = ["top", "right", "bottom", "left"];

    // Create a promise for each quadrant that resolves when its animation completes
    const animationPromises = quadrants.map((quadrant) => {
      return new Promise((resolve) => {
        // Create a custom event to listen for animation completion
        const completionListener = (event) => {
          if (
            event.detail.quadrant === quadrant &&
            event.detail.maquetteNumber === maquetteNumber
          ) {
            removeEventListener(EVENTS.ANIMATION_COMPLETE, completionListener);
            resolve();
          }
        };

        addEventListener(EVENTS.ANIMATION_COMPLETE, completionListener);

        // Trigger animation for current quadrant with the current group
        dispatchEvent(EVENTS.PLAY_ANIMATION, {
          quadrant,
          order: currentGroup,
          maquetteNumber,
        });
      });
    });

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    // Animation for this step is complete
    setIsPlaying(false);

    // After animation completes, check if there are more steps
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < groups.length) {
      // There are more steps, update current step and show next criteria
      setCurrentStep(nextStepIndex);
      showCriteriaAndPlayStep(groups, nextStepIndex);
    } else {
      // All steps complete
      setIsStepByStep(false);
      setHasPlayed(true);
      // Auto-reset after a delay to allow users to see the final state
      setTimeout(() => {
        resetAnimations();
      }, autoResetDelay); // Configurable delay before auto-reset
    }
  };

  // Function to show criteria for the current step and then play it
  const showCriteriaAndPlayStep = (groups, stepIndex) => {
    // Check if admin has provided custom step descriptions
    if (
      maquetteData.stepDescriptions &&
      maquetteData.stepDescriptions[stepIndex]
    ) {
      // Handle admin-provided descriptions
      const adminCriteria = maquetteData.stepDescriptions[stepIndex];

      // If admin criteria is a string or array of strings, convert to structured format
      let structuredRules = [];
      if (typeof adminCriteria === "string") {
        structuredRules = [{ type: "admin", text: adminCriteria }];
      } else if (Array.isArray(adminCriteria)) {
        // If it's an array of strings, convert each to a rule object
        if (typeof adminCriteria[0] === "string") {
          structuredRules = adminCriteria.map((text) => ({
            type: "admin",
            text,
          }));
        } else {
          // If it's already an array of structured objects, use as is
          structuredRules = adminCriteria;
        }
      }

      const criteriaStructure = {
        roadType: "admin", // Use 'admin' to indicate custom admin content
        vehicleNames: groups[stepIndex], // Use the current group as vehicle names
        rules: structuredRules,
      };

      // Dispatch event to parent with the criteria data
      dispatchEvent(EVENTS.SHOW_STEP_CRITERIA, {
        criteriaStructure,
        groups,
        stepIndex,
        maquetteNumber,
        maquetteData, // Pass maquetteData so CriteriaDisplay can look up vehicle directions
        onConfirm: () => {
          // Play the current step after user confirms
          playStepByStepAnimation(groups, stepIndex);
        },
        onCancel: () => {
          // Stop the step-by-step process
          setIsStepByStep(false);
          setIsPlaying(false);
        },
      });
      return;
    }

    const criteria = getCriteriaForStep(groups, stepIndex, maquetteData);

    const currentGroup = groups[stepIndex];

    const vehicleNames = currentGroup;

    // Check if it's a T-junction situation
    const isTJunction = criteria.some((c) => c.startsWith("junction"));

    // Debug all criteria processing
    const isZandweg = criteria.some((c) => c.startsWith("zandweg"));

    // Build structured criteria data instead of HTML
    let criteriaStructure = {
      roadType: "equal-rank",
      vehicleNames,
      rules: [],
    };

    if (isTJunction) {
      criteriaStructure.roadType = "t-junction";

      // Check if vehicles in this step are on main road or side road
      const vehiclesInStep = currentGroup.split("+");
      const vehiclesInfo = getVehiclesInStep(vehiclesInStep, maquetteData);
      const isOnMainRoad = criteria.some((c) =>
        c.startsWith("verkeersregel: Hoofdweg heeft voorrang boven zijweg")
      );

      criteria.forEach((c, index) => {
        if (c === "algemeen: Algemene verkeersregels toepassen") {
          return;
        }

        if (c.startsWith("bevoorrrecht")) {
          criteriaStructure.rules.push({
            type: "emergency",
            text: "Bevoorrechte Weggebruikers (PS, BS, AS)",
            icon: "🚨",
          });
        } else if (c.startsWith("junction")) {
          if (isOnMainRoad) {
            criteriaStructure.rules.push({
              type: "priority-road",
              text: "Voorrangsweg",
            });
          } else {
            // Skip: Voorrangsweg (vehicle NOT on main road)
          }
          /*
        } else if (c.startsWith("verkeersregel")) {
          criteriaStructure.rules.push({ type: "t-junction", text: "T-kruising regels" });
        */
        } else if (c.startsWith("lv")) {
          criteriaStructure.rules.push({
            type: "left-vacant",
            text: "Links Vrij",
          });
        } else if (c.startsWith("la")) {
          criteriaStructure.rules.push({ type: "left-turn", text: "Linksaf" });
        } else if (c.startsWith("rd")) {
          criteriaStructure.rules.push({ type: "straight", text: "Rechtdoor" });
        } else if (c.startsWith("ra")) {
          criteriaStructure.rules.push({
            type: "right-turn",
            text: "Rechtsaf",
          });
        } else if (c.includes("inrit s/inrit b")) {
          // Handle inrit s/inrit b rules - preserve full text to keep identifier
          criteriaStructure.rules.push({ type: "inrit", text: c });
        } else if (c.includes("gaat naar de inrit")) {
          // Handle inrit destination rules (format: "vehicleName gaat naar de inrit [s/b/s/b]")
          // Preserve the full text to keep the inrit identifier
          criteriaStructure.rules.push({ type: "inrit", text: c });
        } else if (c.startsWith("inrit-")) {
          // Handle inrit rules (format: "inrit-vehicleName vehicleName maakt inrit [s/b/s/b] vrij")
          // Preserve the full text to keep the inrit identifier
          const parts = c.split(" ");
          const textWithoutPrefix = parts.slice(1).join(" "); // Remove "inrit-vehicleName" prefix
          criteriaStructure.rules.push({
            type: "inrit",
            text: textWithoutPrefix,
          });
        }
      });
    } else if (isZandweg) {
      criteriaStructure.roadType = "zandweg";

      // Check if vehicles in this step are on zandweg or regular road
      const vehiclesInStep = currentGroup.split("+");
      const vehiclesInfo = getVehiclesInStep(vehiclesInStep, maquetteData);

      // Check if any vehicle is on a zandweg quadrant
      const isOnZandweg = vehiclesInfo.some((vInfo) => {
        const quadrant = vInfo.direction;
        return maquetteData[quadrant]?.note === "ZANDWEG";
      });

      criteria.forEach((c, index) => {
        if (c === "algemeen: Algemene verkeersregels toepassen") {
          return;
        }

        if (c.startsWith("bevoorrrecht")) {
          criteriaStructure.rules.push({
            type: "emergency",
            text: "Bevoorrechte Weggebruikers (PS, BS, AS)",
            icon: "🚨",
          });
        } else if (c.startsWith("zandweg")) {
          if (isOnZandweg) {
            criteriaStructure.rules.push({
              type: "unpaved-yields",
              text: "Zandweg moet voorrang geven aan verharde weg",
            });
          } else {
            criteriaStructure.rules.push({
              type: "paved-priority",
              text: "Verharde weg heeft voorrang boven zandweg",
            });
          }
        } else if (c.startsWith("verkeersregel")) {
          criteriaStructure.rules.push({
            type: "priority",
            text: "Voorrang regels",
          });
        } else if (c.startsWith("lv")) {
          criteriaStructure.rules.push({
            type: "left-vacant",
            text: "Links Vrij",
          });
        } else if (c.startsWith("la")) {
          criteriaStructure.rules.push({ type: "left-turn", text: "Linksaf" });
        } else if (c.startsWith("rd")) {
          criteriaStructure.rules.push({ type: "straight", text: "Rechtdoor" });
        } else if (c.startsWith("ra")) {
          criteriaStructure.rules.push({
            type: "right-turn",
            text: "Rechtsaf",
          });
        } else if (c.includes("inrit s/inrit b")) {
          // Handle inrit s/inrit b rules - preserve full text to keep identifier
          criteriaStructure.rules.push({ type: "inrit", text: c });
        } else if (c.includes("gaat naar de inrit")) {
          // Handle inrit destination rules (format: "vehicleName gaat naar de inrit [s/b/s/b]")
          // Preserve the full text to keep the inrit identifier
          criteriaStructure.rules.push({ type: "inrit", text: c });
        } else if (c.startsWith("inrit-")) {
          // Handle inrit rules (format: "inrit-vehicleName vehicleName maakt inrit [s/b/s/b] vrij")
          // Preserve the full text to keep the inrit identifier
          const parts = c.split(" ");
          const textWithoutPrefix = parts.slice(1).join(" "); // Remove "inrit-vehicleName" prefix
          criteriaStructure.rules.push({
            type: "inrit",
            text: textWithoutPrefix,
          });
        }
      });
    } else {
      // Check if all quadrants are occupied (AVF situation)
      const quadrantsWithVehicles = ["top", "bottom", "left", "right"].filter(
        (quadrant) => {
          const section = maquetteData[quadrant];
          if (!section?.vehicles) return false;

          // Check if this quadrant has any sequence vehicles
          for (const row of section.vehicles) {
            if (!Array.isArray(row)) continue;
            for (const vehicle of row) {
              if (
                vehicle &&
                ["car", "ambulance", "firetruck", "police", "bike"].includes(
                  vehicle.type
                )
              ) {
                return true;
              }
            }
          }
          return false;
        }
      );

      const allQuadrantsOccupied = quadrantsWithVehicles.length === 4;
      const noLVorLA = !criteria.some(
        (c) => c.startsWith("lv") || c.startsWith("la")
      );

      criteria.forEach((c, index) => {
        if (c !== "algemeen: Algemene verkeersregels toepassen") {
          if (c.startsWith("bevoorrrecht")) {
            criteriaStructure.rules.push({
              type: "emergency",
              text: "Bevoorrechte Weggebruikers (PS, BS, AS)",
              icon: "🚨",
            });
          } else if (c.startsWith("lv")) {
            criteriaStructure.rules.push({
              type: "left-vacant",
              text: "Links Vrij",
            });
          } else if (c.startsWith("la")) {
            criteriaStructure.rules.push({
              type: "left-turn",
              text: "Linksaf",
            });
          } else if (c.startsWith("rd")) {
            criteriaStructure.rules.push({
              type: "straight",
              text: "Rechtdoor",
            });
          } else if (c.startsWith("ra")) {
            criteriaStructure.rules.push({
              type: "right-turn",
              text: "Rechtsaf",
            });
          } else if (c.startsWith("verkeersregel")) {
            criteriaStructure.rules.push({
              type: "priority",
              text: "Voorrang regels",
            });
          } else if (c.startsWith("junction")) {
            const parts = c.split(": ");
            criteriaStructure.rules.push({
              type: "junction",
              text: parts[1] || c,
            });
          } else if (c.startsWith("zandweg")) {
            const parts = c.split(": ");
            criteriaStructure.rules.push({
              type: "unpaved",
              text: parts[1] || c,
            });
          } else if (c.includes("inrit s/inrit b")) {
            // Handle inrit s/inrit b rules
            const vehicleName = c.split(" ")[0]; // Get the vehicle name before "inrit s/inrit b"
            criteriaStructure.rules.push({
              type: "inrit",
              text: `${vehicleName} maakt inrit vrij`,
            });
          } else if (c.includes("gaat naar de inrit")) {
            // Handle inrit destination rules (format: "vehicleName gaat naar de inrit")
            const vehicleName = c.split(" ")[0]; // Get the vehicle name before "gaat naar de inrit"
            criteriaStructure.rules.push({
              type: "inrit",
              text: `${vehicleName} gaat naar de inrit`,
            });
          } else if (c.startsWith("inrit-")) {
            // Handle inrit rules (format: "inrit-vehicleName vehicleName maakt inrit vrij")
            const parts = c.split(" ");
            const vehicleName = parts[1];
            criteriaStructure.rules.push({
              type: "inrit",
              text: `${vehicleName} maakt inrit vrij`,
            });
          } else {
            // If it's not a categorized rule, just add the description part
            const parts = c.split(": ");
            const text = parts.length > 1 ? parts[1] : c;
            criteriaStructure.rules.push({ type: "custom", text });
          }
        }
      });

      // If all quadrants occupied and no LV/LA, add AVF note
      if (allQuadrantsOccupied && noLVorLA) {
        criteriaStructure.rules.push({
          type: "avf",
          text: "AVF (Algemeen Verkeers Fatsoen) - alle kanten bezet, wenken toegestaan",
        });
      }

      if (criteriaStructure.rules.length === 0) {
        criteriaStructure.rules.push({
          type: "general",
          text: "Algemene verkeersregels",
        });
      }
    }

    // Dispatch event to parent with the criteria data
    dispatchEvent(EVENTS.SHOW_STEP_CRITERIA, {
      criteriaStructure,
      groups,
      stepIndex,
      maquetteNumber,
      maquetteData, // Pass maquetteData so CriteriaDisplay can look up vehicle directions
      onConfirm: () => {
        // Play the current step after user confirms
        playStepByStepAnimation(groups, stepIndex);
      },
      onCancel: () => {
        // Stop the step-by-step process
        setIsStepByStep(false);
        setIsPlaying(false);
      },
    });
  };

  const playStepByStep = ({ order }) => {
    // Reset any previous step-by-step state to ensure clean start
    setIsStepByStep(false);
    setCurrentStep(0);
    setAnimationGroups([]);
    setIsPlaying(false); // Ensure no animation is playing

    // Parse the order into groups for this specific maquette
    const groups = order.split("-");
    setAnimationGroups(groups);
    setIsStepByStep(true);
    setCurrentStep(0);
    // Show criteria and play first step
    showCriteriaAndPlayStep(groups, 0);
  };

  // Expose functions to parent component
  const playStepByStepFromParent = (order) => {
    const sequenceOrder =
      order || userAnswer?.replace(/\s+/g, "") || maquetteData?.sequence;
    // Reset animations for all other maquettes before starting
    dispatchEvent(EVENTS.RESET_OTHER_ANIMATIONS, { maquetteNumber });
    playStepByStep({ order: sequenceOrder });
  };

  const playNormalFromParent = (order) => {
    const sequenceOrder =
      order || userAnswer?.replace(/\s+/g, "") || maquetteData?.sequence;
    // Reset animations for all other maquettes before starting
    dispatchEvent(EVENTS.RESET_OTHER_ANIMATIONS, { maquetteNumber });
    playAnimations(sequenceOrder);
  };

  const showPlayModeDialog = () => {
    const order = userAnswer?.replace(/\s+/g, "") || maquetteData?.sequence;

    // Reset animations for all other maquettes before showing the dialog
    dispatchEvent(EVENTS.RESET_OTHER_ANIMATIONS, { maquetteNumber });

    playStepByStep({ order });

    /*
    f7.dialog
      .create({
        title: "Afspelen met uitleg?",
        buttons: [
          {
            text: "Ja",
            color: "green",
            onClick: () => {
              playStepByStep();
            },
          },
          {
            text: "Nee",
            color: "blue",
            onClick: () => {
              playAnimations(order);
            },
          },
        ],
      })
      .open();
    */
  };

  const parentKey = ["top", "bottom", "left", "right"].find(
    (key) => maquetteData[key]?.tcross === "true"
  );

  const detectBikeLane = () => {
    let bikelanes = [];
    ["top", "right", "bottom", "left"].map((side) => {
      const bl = maquetteData?.[side]?.bikelanes;
      if (bl) {
        bikelanes.push("bikelane-" + side);
      }
    });
    return bikelanes;
  };

  const detectRoadType = () => {
    let roadType = [];
    const nameMapping = {
      "INRIT S": "driveway-",
      "INRIT B": "driveway-",
      "INRIT S/B": "driveway-",
      ZANDWEG: "unpaved-",
      TCROSS: "t-junction-hide-",
    };

    // Check if any side has a note that indicates it's not a standard junction
    let isJunction = true;
    ["top", "right", "bottom", "left"].forEach((side) => {
      const note = maquetteData?.[side]?.note;
      if (note && note === "TCROSS") {
        isJunction = false;
      }
    });

    // Add "junction" only if no special road types are found
    if (isJunction) {
      roadType.push("junction");
    }

    ["top", "right", "bottom", "left"].map((side) => {
      const note = maquetteData?.[side]?.note;
      if (note) {
        roadType.push(nameMapping?.[note] + side);
      }
    });

    return roadType;
  };

  useEffect(() => {
    detectRoadType(maquetteData);
  }, [maquetteData]);

  // Expose functions to parent via callback if provided
  useEffect(() => {
    if (typeof onRef === "function") {
      onRef({
        playStepByStep: playStepByStepFromParent,
        playNormal: playNormalFromParent,
      });
    }
  }, [onRef]);

  return (
    <div ref={containerRef} className="maquette-comp sticky">
      {isVisible ? (
        <>
          {detectRoadType().map((roadType, index) => {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: "url(/roads/" + roadType + ".svg)",
                }}
              />
            );
          })}
          {detectBikeLane().map((bikelane, index) => {
            return (
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: "url(/roads/" + bikelane + ".svg)",
                }}
              />
            );
          })}
          <MaquetteAnimation
            key={`t-junction-${maquetteNumber}-${animationKey}`}
            type={parentKey ? "t-junction" : "intersection"}
          />
          <MaquetteAnimation
            indexMaquette={indexMaquette}
            key={`top-${maquetteNumber}-${animationKey}`}
            maquetteNumber={maquetteNumber}
            vehicles={maquetteData?.top?.vehicles}
            note={maquetteData?.top?.note}
            bikelanes={maquetteData?.top?.bikelanes}
            quadrant={"top"}
            rotate={"0deg"}
            onVehicleClick={onVehicleClick}
            trafficsign={maquetteData?.top?.trafficsign}
            trafficSignRotate={maquetteData?.top?.trafficSignRotate || 0}
          />
          <MaquetteAnimation
            indexMaquette={indexMaquette}
            key={`right-${maquetteNumber}-${animationKey}`}
            maquetteNumber={maquetteNumber}
            vehicles={maquetteData?.right?.vehicles}
            note={maquetteData?.right?.note}
            bikelanes={maquetteData?.right?.bikelanes}
            quadrant={"right"}
            rotate={"90deg"}
            onVehicleClick={onVehicleClick}
            trafficsign={maquetteData?.right?.trafficsign}
            trafficSignRotate={maquetteData?.right?.trafficSignRotate || 0}
          />
          <MaquetteAnimation
            indexMaquette={indexMaquette}
            key={`bottom-${maquetteNumber}-${animationKey}`}
            maquetteNumber={maquetteNumber}
            vehicles={maquetteData?.bottom?.vehicles}
            note={maquetteData?.bottom?.note}
            bikelanes={maquetteData?.bottom?.bikelanes}
            quadrant={"bottom"}
            rotate={"180deg"}
            onVehicleClick={onVehicleClick}
            trafficsign={maquetteData?.bottom?.trafficsign}
            trafficSignRotate={maquetteData?.bottom?.trafficSignRotate || 0}
          />
          <MaquetteAnimation
            indexMaquette={indexMaquette}
            key={`left-${maquetteNumber}-${animationKey}`}
            maquetteNumber={maquetteNumber}
            vehicles={maquetteData?.left?.vehicles}
            note={maquetteData?.left?.note}
            bikelanes={maquetteData?.left?.bikelanes}
            quadrant={"left"}
            rotate={"270deg"}
            onVehicleClick={onVehicleClick}
            trafficsign={maquetteData?.left?.trafficsign}
            trafficSignRotate={maquetteData?.left?.trafficSignRotate || 0}
          />
          {roadsize && <div className="maquette-road-type">{roadsize}</div>}
          {/* Tooltip hint for all maquettes */}
        </>
      ) : (
        <div className="maquette-placeholder" />
      )}

      {/* DO NOT REMOVE - OLD PLAY BUTTON STYLE */}
      {/*
      {!isPlaying &&
        !hasPlayed &&
        !isPlayingIndividual &&
        !hasPlayedIndividual && (
          <Button
            iconF7="play_fill"
            iconColor="white"
            outline
            round
            small
            iconSize={20}
            className="maquette-btn-play"
            style={{ opacity: "0.5" }}
            onClick={() => {
              showPlayModeDialog();
            }}
          />
        )}
      */}

      {(!isPlaying && hasPlayed) || (hasPlayedIndividual && showResetButton) ? (
        <Button
          iconF7="arrow_counterclockwise"
          outline
          round
          small
          iconSize={20}
          iconColor="red"
          className="maquette-btn-reset"
          onClick={resetAnimations}
        />
      ) : null}

      {!isPlaying &&
        !hasPlayed &&
        !isPlayingIndividual &&
        !hasPlayedIndividual && (
          <Button
            iconF7="play_fill"
            fill
            // text="Uitleg"
            iconSize={20}
            round
            onClick={() => {
              showPlayModeDialog();
            }}
            style={{
              position: "absolute",
              // bottom: "0px",
              // right: "0px",
              marginBottom: "80px",
              backgroundColor:
                getLayout()?.colorScheme?.[0] || "var(--app-accent-green)",
              color: "white",
              // borderRadius: "20px",
              // fontWeight: 600,
            }}
          />
        )}
    </div>
  );
};

export default MaquetteComp;
