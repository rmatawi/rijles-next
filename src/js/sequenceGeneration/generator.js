/**
 * Main vehicle sequence generation algorithm - REFACTORED
 *
 * Implements complete traffic priority rules:
 *
 * Priority order (high → low):
 * 1. Emergency vehicles (PS > BS > AS) - scanned across ALL rows first
 * 2. Road type priority:
 *    a. Zandweg priority: regular roads form main road (with T-cross exception)
 *    b. T-junction: main road > side road > inrit/driveway
 * 3. Road width (narrow vs wide - contextual)
 * 4. LV (Left Vacant) - straight-through with left clear
 * 5. LA (Left-turners) - multiple LA can go together
 * 6. RA (Right-turners) - most restricted
 * 7. Bike path exception (two LA or RA side-by-side)
 * 8. Traffic courtesy (VF/AVF) - last resort
 */

import { SEQUENCE_OPERATORS, OPPOSITE_QUADRANT_MAP } from "./constants.js";
import { getRandomQuadrantOrder, getValidVehiclesInRow, getVehicleDestination } from "./utils.js";
import { detectTJunction } from "./junctionDetection/tJunction.js";
import { determineZandwegPriority } from "./junctionDetection/zandweg.js";
import { hasBikeLane } from "./junctionDetection/bikeLanes.js";
import {
  filterByRoadType,
  filterLeftVacant,
  filterLeftTurners,
  filterRightTurners,
  checkBikeCarPriority,
  filterBikePathExceptions,
  applyTrafficCourtesy,
} from "./filters/index.js";
import { scanForEmergencyVehicles } from "./emergencyHandling/scanner.js";
import {
  getDestinationQuadrant,
  isDrivewayBusy,
  getDrivewayVehicles,
  clearDriveway,
} from "./emergencyHandling/drivewayClearing.js";
import { canGoTogether } from "../collisionDetection.js";

// ============================================================================
// UTILITY FUNCTIONS - Centralized logic
// ============================================================================

/**
 * Detect inrit properties in the maquette
 */
const detectInrit = (maquetteData) => {
  const tJunction = detectTJunction(maquetteData);
  const zandwegPriority = determineZandwegPriority(maquetteData);

  let inritQuadrant = null;
  let hasInrit = false;
  let inritType = null;

  if (tJunction?.inritQuadrant) {
    const inritData = maquetteData[tJunction.inritQuadrant];
    const inritNote = (inritData?.note || "").toUpperCase();
    hasInrit = inritNote.includes("INRIT S") || inritNote.includes("INRIT SMAL") ||
               inritNote.includes("INRIT B") || inritNote.includes("INRIT BREED");
    inritQuadrant = tJunction.inritQuadrant;
    inritType = inritNote.includes("INRIT S") || inritNote.includes("INRIT SMAL") ? "narrow" : "wide";
  } else if (zandwegPriority?.zandwegQuadrants?.length > 0) {
    inritQuadrant = zandwegPriority.zandwegQuadrants[0];
    const inritData = maquetteData[inritQuadrant];
    const inritNote = (inritData?.note || "").toUpperCase();
    hasInrit = inritNote.includes("INRIT S") || inritNote.includes("INRIT SMAL") ||
               inritNote.includes("INRIT B") || inritNote.includes("INRIT BREED");
    inritType = inritNote.includes("INRIT S") || inritNote.includes("INRIT SMAL") ? "narrow" : "wide";
  }

  return { inritQuadrant, hasInrit, inritType };
};

/**
 * Determine if a vehicle is from or going to inrit
 */
const getInritRelation = (vInfo, inritQuadrant) => {
  const destination = getVehicleDestination(vInfo);
  return {
    isFromInrit: vInfo.direction === inritQuadrant,
    isTurningIntoInrit: destination === inritQuadrant,
  };
};

/**
 * Categorize vehicle by turn direction
 */
const categorizeByrDirection = (vInfo) => {
  const turnDir = vInfo.vehicle.direction;
  return {
    isStraight: !turnDir || turnDir === "straight",
    isLeftTurn: turnDir === "left",
    isRightTurn: turnDir === "right",
  };
};

/**
 * Determine road type for a vehicle (main/side road)
 */
const determineRoadType = (vInfo, maquetteData) => {
  const tJunctionLocal = detectTJunction(maquetteData);
  const zandwegPriorityLocal = determineZandwegPriority(maquetteData);

  let isMainRoad = false;
  let isSideRoad = false;

  if (zandwegPriorityLocal) {
    isMainRoad = zandwegPriorityLocal.mainRoadQuadrants.includes(vInfo.direction);
    isSideRoad = zandwegPriorityLocal.secondaryQuadrants.includes(vInfo.direction);
  } else if (tJunctionLocal) {
    const inritQ = tJunctionLocal.inritQuadrant;
    const sideRoadQuadrant = OPPOSITE_QUADRANT_MAP[inritQ];
    const LEFT_OF_QUADRANT_MAP = {
      top: "left",
      left: "bottom",
      bottom: "right",
      right: "top",
    };
    const RIGHT_OF_QUADRANT_MAP = {
      top: "right",
      right: "bottom",
      bottom: "left",
      left: "top",
    };
    const mainRoad1 = LEFT_OF_QUADRANT_MAP[inritQ];
    const mainRoad2 = RIGHT_OF_QUADRANT_MAP[inritQ];

    isMainRoad = vInfo.direction === mainRoad1 || vInfo.direction === mainRoad2;
    isSideRoad = vInfo.direction === sideRoadQuadrant;
  }

  return { isMainRoad, isSideRoad };
};

/**
 * Add vehicles to sequence - handles single or multiple
 */
const addToSequence = (vehicles, sequenceSteps, processedVehicles, logPrefix = "[SEQGEN]") => {
  if (vehicles.length === 1) {
    console.log(`${logPrefix}     ✓ Adding: ${vehicles[0].vehicle.name}`);
    sequenceSteps.push(vehicles[0].vehicle.name);
  } else {
    const simultaneousGroup = vehicles.map((v) => v.vehicle.name).join(SEQUENCE_OPERATORS.SIMULTANEOUS);
    console.log(`${logPrefix}     ✓ Adding simultaneous: ${vehicles.map((v) => v.vehicle.name).join(" + ")}`);
    sequenceSteps.push(simultaneousGroup);
  }

  vehicles.forEach((v) => processedVehicles.add(v.vehicleId));
};

// ============================================================================
// VEHICLE COLLECTION FUNCTIONS
// ============================================================================

/**
 * Collect all vehicles from all rows across all quadrants
 */
const collectAllVehicles = (maquetteData, quadrantsOrder, processedVehicles) => {
  const allVehicles = [];

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (const direction of quadrantsOrder) {
      const vehicles = getValidVehiclesInRow(
        maquetteData[direction],
        rowIndex,
        direction,
        processedVehicles
      );
      allVehicles.push(...vehicles);
    }
  }

  return allVehicles;
};

/**
 * Categorize all vehicles for inrit processing
 */
const categorizeVehiclesForInrit = (maquetteData, quadrantsOrder, processedVehicles, inritQuadrant, inritType) => {
  const nonInritVehicles = [];
  const inritExitVehicles = [];
  const inritEntryVehicles = [];
  const mainRoadVehiclesAll = [];
  const sideRoadVehiclesAll = [];

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (const direction of quadrantsOrder) {
      const vehicles = getValidVehiclesInRow(
        maquetteData[direction],
        rowIndex,
        direction,
        processedVehicles
      );

      for (const vInfo of vehicles) {
        const { isFromInrit, isTurningIntoInrit } = getInritRelation(vInfo, inritQuadrant);

        if (isFromInrit) {
          inritExitVehicles.push(vInfo);
        } else if (inritType === "narrow") {
          if (isTurningIntoInrit) {
            inritEntryVehicles.push(vInfo);
          } else {
            nonInritVehicles.push(vInfo);
          }
        } else {
          // Wide inrit: categorize by road type
          const { isMainRoad, isSideRoad } = determineRoadType(vInfo, maquetteData);
          if (isMainRoad) {
            mainRoadVehiclesAll.push(vInfo);
          } else if (isSideRoad) {
            sideRoadVehiclesAll.push(vInfo);
          }
        }
      }
    }
  }

  return {
    nonInritVehicles,
    inritExitVehicles,
    inritEntryVehicles,
    mainRoadVehiclesAll,
    sideRoadVehiclesAll,
  };
};

/**
 * Categorize vehicles by turn direction
 */
const categorizeByTurnDirection = (vehicles) => {
  const straight = [];
  const leftTurn = [];
  const rightTurn = [];

  for (const vInfo of vehicles) {
    const { isStraight, isLeftTurn, isRightTurn } = categorizeByrDirection(vInfo);
    if (isStraight) straight.push(vInfo);
    else if (isLeftTurn) leftTurn.push(vInfo);
    else if (isRightTurn) rightTurn.push(vInfo);
  }

  return { straight, leftTurn, rightTurn };
};

// ============================================================================
// EMERGENCY VEHICLE PROCESSING
// ============================================================================

/**
 * Process all emergency vehicles with driveway clearing
 */
const processEmergencyVehicles = (maquetteData, sequenceSteps, processedVehicles) => {
  console.log("[SEQGEN] \n--- PRIORITY 1: Emergency Vehicles ---");

  const { policeVehicles, firetruckVehicles, ambulanceVehicles } = scanForEmergencyVehicles(maquetteData);

  const emergencyGroups = [
    { type: "police", vehicles: policeVehicles },
    { type: "firetruck", vehicles: firetruckVehicles },
    { type: "ambulance", vehicles: ambulanceVehicles },
  ];

  for (const group of emergencyGroups) {
    console.log(`[SEQGEN] Processing ${group.vehicles.length} ${group.type} vehicle(s)...`);

    for (const emergencyVehicle of group.vehicles) {
      const destinationQuadrant = getDestinationQuadrant(
        emergencyVehicle.vehicle,
        emergencyVehicle.direction
      );

      console.log(`[SEQGEN]   Emergency vehicle ${emergencyVehicle.vehicle.name} heading to: ${destinationQuadrant || "unknown"}`);

      if (destinationQuadrant && isDrivewayBusy(maquetteData, destinationQuadrant, processedVehicles)) {
        console.log(`[SEQGEN]   ⚠️  Destination driveway at ${destinationQuadrant} is BUSY - must clear first!`);

        const drivewayVehicles = getDrivewayVehicles(maquetteData, destinationQuadrant, processedVehicles);
        clearDriveway(drivewayVehicles, sequenceSteps, processedVehicles, destinationQuadrant);

        console.log(`[SEQGEN]   ✓ Driveway cleared. Emergency vehicle can now proceed.`);
      } else {
        console.log(`[SEQGEN]   ✓ Driveway is clear (or no driveway involved)`);
      }

      console.log(`[SEQGEN]   Adding emergency vehicle to sequence: ${emergencyVehicle.vehicle.name}`);
      sequenceSteps.push(emergencyVehicle.vehicle.name);
      processedVehicles.add(emergencyVehicle.vehicleId);
    }
  }

  console.log(`[SEQGEN] Emergency vehicles complete. Sequence so far: ${sequenceSteps.join("-")}`);
};

// ============================================================================
// INRIT PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process narrow inrit - Phase 1: Non-inrit vehicles
 */
const processNarrowInritPhase1 = (nonInritVehicles, maquetteData, sequenceSteps, processedVehicles) => {
  if (nonInritVehicles.length === 0) return;

  console.log(`[SEQGEN]   Phase 1: Processing ${nonInritVehicles.length} non-inrit vehicles...`);

  while (nonInritVehicles.length > 0) {
    const { mainRoadVehicles, sideRoadVehicles, equalRoadVehicles } = filterByRoadType(nonInritVehicles, maquetteData);

    const candidates = mainRoadVehicles.length > 0 ? mainRoadVehicles
      : equalRoadVehicles.length > 0 ? equalRoadVehicles
      : sideRoadVehicles;

    if (candidates.length > 0) {
      const vehicleToProcess = candidates[0];
      console.log(`[SEQGEN]     ✓ Adding non-inrit: ${vehicleToProcess.vehicle.name}`);
      sequenceSteps.push(vehicleToProcess.vehicle.name);
      processedVehicles.add(vehicleToProcess.vehicleId);

      const index = nonInritVehicles.findIndex(v => v.vehicleId === vehicleToProcess.vehicleId);
      if (index !== -1) nonInritVehicles.splice(index, 1);
    } else {
      break;
    }
  }

  console.log(`[SEQGEN]   Sequence after Phase 1: ${sequenceSteps.join("-")}`);
};

/**
 * Process wide inrit - Phase 1: Main road vehicles
 */
const processWideInritPhase1 = (mainRoadVehiclesAll, sequenceSteps, processedVehicles, maquetteData) => {
  if (mainRoadVehiclesAll.length === 0) return;

  console.log(`[SEQGEN]   Phase 1: Processing ${mainRoadVehiclesAll.length} main road vehicles with priority rules...`);

  // Detect inrit to check which vehicles are entering it
  const { inritQuadrant } = detectInrit(maquetteData);

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    const rowVehicles = mainRoadVehiclesAll.filter(v => v.rowIndex === rowIndex);

    while (rowVehicles.length > 0) {
      const { straight: straightVehicles, leftTurn: leftTurners, rightTurn: rightTurners } =
        categorizeByTurnDirection(rowVehicles);

      let toProcess = [];
      if (straightVehicles.length > 0 || leftTurners.length > 0) {
        toProcess = [...straightVehicles, ...leftTurners];
      } else if (rightTurners.length > 0) {
        // For right-turners on main road during wide inrit:
        // Prioritize those NOT entering the inrit
        if (inritQuadrant && rightTurners.length > 1) {
          const notEnteringInrit = [];
          const enteringInrit = [];

          for (const rt of rightTurners) {
            const destination = getVehicleDestination(rt);
            if (destination === inritQuadrant) {
              enteringInrit.push(rt);
            } else {
              notEnteringInrit.push(rt);
            }
          }

          // Process non-inrit right-turners first
          if (notEnteringInrit.length > 0) {
            toProcess = [notEnteringInrit[0]];
          } else if (enteringInrit.length > 0) {
            toProcess = [enteringInrit[0]];
          }
        } else {
          // Single right-turner or no inrit check needed
          toProcess = [rightTurners[0]];
        }
      }

      if (toProcess.length > 0) {
        addToSequence(toProcess, sequenceSteps, processedVehicles, "[SEQGEN]");

        toProcess.forEach(v => {
          const idx = rowVehicles.findIndex(rv => rv.vehicleId === v.vehicleId);
          if (idx !== -1) rowVehicles.splice(idx, 1);
          const idx2 = mainRoadVehiclesAll.findIndex(rv => rv.vehicleId === v.vehicleId);
          if (idx2 !== -1) mainRoadVehiclesAll.splice(idx2, 1);
        });
      } else {
        break;
      }
    }
  }

  console.log(`[SEQGEN]   Sequence after Phase 1: ${sequenceSteps.join("-")}`);
};

/**
 * Process inrit exit vehicles (Phase 2 for narrow, Phase 3 for wide)
 */
const processInritExit = (inritExitVehicles, sequenceSteps, processedVehicles, phaseNum) => {
  if (inritExitVehicles.length === 0) return;

  console.log(`[SEQGEN]   Phase ${phaseNum}: Clearing inrit - processing ${inritExitVehicles.length} exit vehicle(s)...`);

  for (const vInfo of inritExitVehicles) {
    console.log(`[SEQGEN]     ✓ Adding inrit exit: ${vInfo.vehicle.name}`);
    sequenceSteps.push(vInfo.vehicle.name);
    processedVehicles.add(vInfo.vehicleId);
  }

  console.log(`[SEQGEN]   Sequence after Phase ${phaseNum}: ${sequenceSteps.join("-")}`);
};

/**
 * Process wide inrit - Phase 2: Side road vehicles
 */
const processWideInritPhase2 = (sideRoadVehiclesAll, sequenceSteps, processedVehicles) => {
  if (sideRoadVehiclesAll.length === 0) return;

  console.log(`[SEQGEN]   Phase 2: Processing ${sideRoadVehiclesAll.length} side road vehicles...`);

  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    const rowVehicles = sideRoadVehiclesAll.filter(v => v.rowIndex === rowIndex);

    while (rowVehicles.length > 0) {
      const vehicleToProcess = rowVehicles[0];
      console.log(`[SEQGEN]     ✓ Adding side road: ${vehicleToProcess.vehicle.name}`);
      sequenceSteps.push(vehicleToProcess.vehicle.name);
      processedVehicles.add(vehicleToProcess.vehicleId);

      rowVehicles.splice(0, 1);
      const idx = sideRoadVehiclesAll.findIndex(v => v.vehicleId === vehicleToProcess.vehicleId);
      if (idx !== -1) sideRoadVehiclesAll.splice(idx, 1);
    }
  }

  console.log(`[SEQGEN]   Sequence after Phase 2: ${sequenceSteps.join("-")}`);
};

/**
 * Process narrow inrit - Phase 3: Vehicles entering inrit
 */
const processNarrowInritPhase3 = (inritEntryVehicles, maquetteData, sequenceSteps, processedVehicles) => {
  if (inritEntryVehicles.length === 0) return;

  console.log(`[SEQGEN]   Phase 3: Processing ${inritEntryVehicles.length} vehicle(s) entering inrit...`);
  console.log(`[SEQGEN]   Ordering: Main road (LEFT > RIGHT) > Side road (STRAIGHT > LEFT > RIGHT)`);

  const { mainRoadVehicles, sideRoadVehicles } = filterByRoadType(inritEntryVehicles, maquetteData);

  const mainRoadByTurn = categorizeByTurnDirection(mainRoadVehicles);
  const sideRoadByTurn = categorizeByTurnDirection(sideRoadVehicles);

  const orderedVehicles = [
    ...mainRoadByTurn.leftTurn,
    ...mainRoadByTurn.rightTurn,
    ...mainRoadByTurn.straight,
    ...sideRoadByTurn.straight,
    ...sideRoadByTurn.leftTurn,
    ...sideRoadByTurn.rightTurn,
  ];

  console.log(`[SEQGEN]   Main road LEFT: ${mainRoadByTurn.leftTurn.length}, Main road RIGHT: ${mainRoadByTurn.rightTurn.length}`);
  console.log(`[SEQGEN]   Side road STRAIGHT: ${sideRoadByTurn.straight.length}, Side road LEFT: ${sideRoadByTurn.leftTurn.length}, Side road RIGHT: ${sideRoadByTurn.rightTurn.length}`);

  for (const vInfo of orderedVehicles) {
    console.log(`[SEQGEN]     ✓ Adding inrit entry: ${vInfo.vehicle.name}`);
    sequenceSteps.push(vInfo.vehicle.name);
    processedVehicles.add(vInfo.vehicleId);
  }

  console.log(`[SEQGEN]   Sequence after Phase 3: ${sequenceSteps.join("-")}`);
};

/**
 * Process inrit clearing based on type
 */
const processInritClearing = (maquetteData, quadrantsOrder, sequenceSteps, processedVehicles) => {
  console.log("\n[SEQGEN] --- PRIORITY 1B: Narrow Inrit Global Clearing ---");

  const { inritQuadrant, hasInrit, inritType } = detectInrit(maquetteData);

  if (!hasInrit || !inritQuadrant) {
    console.log(`[SEQGEN] No inrit detected - skipping global clearing phase`);
    return;
  }

  console.log(`[SEQGEN] ${inritType === "narrow" ? "Narrow" : "Wide"} inrit detected at ${inritQuadrant}`);
  if (inritType === "narrow") {
    console.log(`[SEQGEN] Rule: 1) Non-inrit vehicles, 2) Clear inrit, 3) Vehicles entering inrit`);
  } else {
    console.log(`[SEQGEN] Rule: 1) Main road (incl. entering), 2) Side road (incl. entering), 3) Clear inrit`);
  }

  const categorized = categorizeVehiclesForInrit(maquetteData, quadrantsOrder, processedVehicles, inritQuadrant, inritType);

  if (inritType === "narrow") {
    console.log(`[SEQGEN]   Non-inrit vehicles: ${categorized.nonInritVehicles.length}`);
    console.log(`[SEQGEN]   Inrit exit vehicles: ${categorized.inritExitVehicles.length}`);
    console.log(`[SEQGEN]   Inrit entry vehicles: ${categorized.inritEntryVehicles.length}`);

    processNarrowInritPhase1(categorized.nonInritVehicles, maquetteData, sequenceSteps, processedVehicles);
    processInritExit(categorized.inritExitVehicles, sequenceSteps, processedVehicles, 2);
    processNarrowInritPhase3(categorized.inritEntryVehicles, maquetteData, sequenceSteps, processedVehicles);
  } else {
    console.log(`[SEQGEN]   Main road vehicles: ${categorized.mainRoadVehiclesAll.length}`);
    console.log(`[SEQGEN]   Side road vehicles: ${categorized.sideRoadVehiclesAll.length}`);
    console.log(`[SEQGEN]   Inrit exit vehicles: ${categorized.inritExitVehicles.length}`);

    processWideInritPhase1(categorized.mainRoadVehiclesAll, sequenceSteps, processedVehicles, maquetteData);
    processWideInritPhase2(categorized.sideRoadVehiclesAll, sequenceSteps, processedVehicles);
    processInritExit(categorized.inritExitVehicles, sequenceSteps, processedVehicles, 3);
  }

  console.log(`[SEQGEN] ${inritType === "narrow" ? "Narrow" : "Wide"} inrit clearing complete. Sequence so far: ${sequenceSteps.join("-")}`);
};

// ============================================================================
// ROW PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process T-junction main road vehicles
 */
const processTJunctionMainRoad = (candidateVehicles, deferredVehicles) => {
  console.log("[SEQGEN]     Special T-junction main road handling");

  const { straight: straightVehicles, leftTurn: turningVehicles } = categorizeByTurnDirection(candidateVehicles);
  const allTurning = [...turningVehicles];

  console.log(`[SEQGEN]       Straight: ${straightVehicles.length}, Turning: ${allTurning.length}`);

  if (straightVehicles.length > 0) {
    console.log(`[SEQGEN]       → Main road straight vehicles going together: ${straightVehicles.map(v => v.vehicle.name).join(", ")}`);
    return {
      processedThisStep: straightVehicles,
      remainingAfterStep: [...allTurning, ...deferredVehicles],
    };
  } else {
    console.log("[SEQGEN]       → No straight vehicles, applying normal priorities to turning vehicles");
    return null;
  }
};

/**
 * Process Zandweg main road vehicles
 */
const processZandwegMainRoad = (candidateVehicles, deferredVehicles, hasZandwegPriority) => {
  if (!hasZandwegPriority) return null;

  console.log("[SEQGEN]     Special Zandweg main road handling");

  const { straight: straightVehicles, leftTurn: leftTurnVehicles, rightTurn: rightTurnVehicles } =
    categorizeByTurnDirection(candidateVehicles);

  console.log(`[SEQGEN]       Straight: ${straightVehicles.length}, Left turn: ${leftTurnVehicles.length}, Right turn: ${rightTurnVehicles.length}`);

  if (straightVehicles.length > 0 || leftTurnVehicles.length > 0) {
    const goingTogether = [...straightVehicles, ...leftTurnVehicles];
    console.log(`[SEQGEN]       → Main road straight/left vehicles going together: ${goingTogether.map(v => v.vehicle.name).join(", ")}`);
    return {
      processedThisStep: goingTogether,
      remainingAfterStep: [...rightTurnVehicles, ...deferredVehicles],
    };
  } else {
    console.log("[SEQGEN]       → Only right-turn vehicles, applying normal priorities");
    return null;
  }
};

/**
 * Process LV and LA vehicles together
 */
const processLVAndLA = (candidateVehicles, maquetteData, processedVehicles, deferredVehicles) => {
  console.log("[SEQGEN]     Applying PRIORITY 4/5: LV (Left Vacant) and LA (Left-turners) filter");

  const { lvVehicles, others: afterLV } = filterLeftVacant(candidateVehicles, maquetteData, processedVehicles);
  const { laVehicles, others: afterLA } = filterLeftTurners(afterLV);

  console.log(`[SEQGEN]       LV vehicles: ${lvVehicles.length}, LA vehicles: ${laVehicles.length}`);

  if (lvVehicles.length === 0 && laVehicles.length === 0) {
    return null;
  }

  // Process LV vehicles
  let lvToProcess = [];
  if (lvVehicles.length > 0) {
    const simultaneousLV = checkSimultaneousLV(lvVehicles, maquetteData);

    if (simultaneousLV.length > 0) {
      const bikeCarResult = checkBikeCarPriority(simultaneousLV[0], simultaneousLV[1], maquetteData);
      if (bikeCarResult.priority !== "equal") {
        console.log(`[SEQGEN]       → Bike+car priority overrides simultaneous LV: ${bikeCarResult.reason}`);
        lvToProcess = [bikeCarResult.priority === "v1" ? simultaneousLV[0] : simultaneousLV[1]];
      } else {
        lvToProcess = simultaneousLV;
      }
    } else {
      lvToProcess = [lvVehicles[0]];
    }
  }

  // Process LA vehicles
  const laToProcess = processLAVehicles(laVehicles, lvToProcess);

  // Combine LV + LA
  const allToProcess = [...lvToProcess, ...laToProcess];
  if (allToProcess.length > 0) {
    return {
      processedThisStep: allToProcess,
      remainingAfterStep: [
        ...lvVehicles.filter(v => !lvToProcess.includes(v)),
        ...laVehicles.filter(v => !laToProcess.includes(v)),
        ...afterLA,
        ...deferredVehicles,
      ],
    };
  }

  return null;
};

/**
 * Check if LV vehicles can go simultaneously
 */
const checkSimultaneousLV = (lvVehicles, maquetteData) => {
  if (lvVehicles.length < 2) return [];

  // Check for bike lane group
  const groupedByRowAndTurn = {};
  for (const vInfo of lvVehicles) {
    const key = `${vInfo.direction}-${vInfo.rowIndex}-${vInfo.vehicle.direction || 'straight'}`;
    if (!groupedByRowAndTurn[key]) groupedByRowAndTurn[key] = [];
    groupedByRowAndTurn[key].push(vInfo);
  }

  for (const key in groupedByRowAndTurn) {
    const group = groupedByRowAndTurn[key];
    if (group.length >= 2) {
      const hasBike = group.some(v => v.vehicle.type === "bike");
      const hasCar = group.some(v => v.vehicle.type === "car");

      if (hasBike && hasCar) {
        const destination = getVehicleDestination(group[0]);
        if (destination && hasBikeLane(maquetteData, destination)) {
          console.log(`[BIKELANE] Same-row, same-direction bike+car group going to ${destination} (has bike lane) → all go together`);
          return group;
        }
      }
    }
  }

  // Standard collision detection
  const v1 = lvVehicles[0];
  const v2 = lvVehicles[1];
  const result = canGoTogether(v1, v2);

  if (result.canGoTogether) {
    console.log(`[SEQGEN]       → LV vehicles can go together: ${v1.vehicle.name} + ${v2.vehicle.name} (${result.reason})`);
    return [v1, v2];
  } else if (result.priority !== "equal") {
    console.log(`[SEQGEN]       → Priority detected: ${result.reason}`);
    if (result.priority === "v2") {
      console.log(`[SEQGEN]       → Reordering: ${v2.vehicle.name} goes before ${v1.vehicle.name}`);
      lvVehicles[0] = v2;
      lvVehicles[1] = v1;
    }
  } else {
    console.log(`[SEQGEN]       → Vehicles cannot go together: ${result.reason}`);
  }

  return [];
};

/**
 * Process LA (left-turn) vehicles
 */
const processLAVehicles = (laVehicles, lvToProcess) => {
  if (laVehicles.length === 0) return [];

  const laToProcess = [];

  if (lvToProcess.length > 0) {
    console.log(`[SEQGEN]       → Checking if LA can go with LV...`);
    for (const laVehicle of laVehicles) {
      let canGoWithLV = true;
      for (const lvVehicle of lvToProcess) {
        const result = canGoTogether(lvVehicle, laVehicle);
        if (!result.canGoTogether) {
          canGoWithLV = false;
          console.log(`[SEQGEN]       → LA ${laVehicle.vehicle.name} cannot go with LV ${lvVehicle.vehicle.name}: ${result.reason}`);
          break;
        }
      }
      if (canGoWithLV) {
        console.log(`[SEQGEN]       → LA ${laVehicle.vehicle.name} can go together with LV`);
        laToProcess.push(laVehicle);
      }
    }
  } else {
    console.log(`[SEQGEN]       → No LV, processing LA vehicles`);
    const { bikePathPairs } = filterBikePathExceptions(laVehicles, {});

    if (bikePathPairs.length > 0) {
      laToProcess.push(...bikePathPairs);
    } else if (laVehicles.length >= 2) {
      // Multiple LA can go together
      const simultaneousLA = [laVehicles[0]];
      for (let i = 1; i < laVehicles.length; i++) {
        const candidate = laVehicles[i];
        let canGoWithGroup = true;

        for (const groupVehicle of simultaneousLA) {
          if (groupVehicle.direction === candidate.direction) {
            const result = canGoTogether(groupVehicle, candidate);
            if (!result.canGoTogether) {
              canGoWithGroup = false;
              break;
            }
          }
        }

        if (canGoWithGroup) simultaneousLA.push(candidate);
      }

      laToProcess.push(...simultaneousLA);
      if (simultaneousLA.length > 1) {
        console.log(`[SEQGEN]       → Multiple LA going together: ${simultaneousLA.map(v => v.vehicle.name).join(" + ")}`);
      }
    } else {
      laToProcess.push(laVehicles[0]);
    }
  }

  return laToProcess;
};

/**
 * Process RA (right-turn) vehicles
 */
const processRAVehicles = (candidateVehicles, maquetteData, deferredVehicles) => {
  console.log("[SEQGEN]     Applying PRIORITY 6: RA (Right-turners) filter");
  const { raVehicles, others: afterRA } = filterRightTurners(candidateVehicles);

  if (raVehicles.length === 0) {
    const courtesyVehicles = applyTrafficCourtesy(afterRA);
    if (courtesyVehicles.length > 0) {
      return {
        processedThisStep: [courtesyVehicles[0]],
        remainingAfterStep: [...courtesyVehicles.slice(1), ...deferredVehicles],
      };
    }
    return null;
  }

  const { bikePathPairs, bikePriority, others: afterBikePath } = filterBikePathExceptions(raVehicles, maquetteData);

  if (bikePathPairs.length > 0) {
    return {
      processedThisStep: bikePathPairs,
      remainingAfterStep: [...afterBikePath, ...afterRA, ...deferredVehicles],
    };
  } else if (bikePriority.length > 0) {
    const { first, second } = bikePriority[0];
    console.log(`[SEQGEN]     ✓ Adding with priority: ${first.vehicle.name} first, then ${second.vehicle.name}`);
    return {
      processedThisStep: [first],
      remainingAfterStep: [second, ...afterBikePath, ...afterRA, ...deferredVehicles],
    };
  } else {
    return {
      processedThisStep: [raVehicles[0]],
      remainingAfterStep: [...raVehicles.slice(1), ...afterRA, ...deferredVehicles],
    };
  }
};

/**
 * Process vehicles in a single row
 */
const processRow = (rowIndex, maquetteData, quadrantsOrder, processedVehicles, sequenceSteps) => {
  console.log(`\n[SEQGEN] --- Processing Row ${rowIndex} ---`);

  let allVehiclesInRow = [];
  for (const direction of quadrantsOrder) {
    const vehicles = getValidVehiclesInRow(maquetteData[direction], rowIndex, direction, processedVehicles);
    console.log(`[SEQGEN]   Quadrant ${direction}: ${vehicles.length} unprocessed vehicles`);
    for (const vInfo of vehicles) {
      console.log(`[SEQGEN]     - ${vInfo.vehicle.name} (${vInfo.vehicle.type}, direction: ${vInfo.vehicle.direction || "none"})`);
    }
    allVehiclesInRow.push(...vehicles);
  }

  console.log(`[SEQGEN]   Total unprocessed vehicles in row ${rowIndex}: ${allVehiclesInRow.length}`);

  let stepCount = 0;
  while (allVehiclesInRow.length > 0) {
    stepCount++;
    console.log(`[SEQGEN]   Step ${stepCount}: Processing ${allVehiclesInRow.length} remaining vehicles...`);

    const result = processRowStep(allVehiclesInRow, maquetteData, processedVehicles);

    if (!result || result.processedThisStep.length === 0) {
      console.log("[SEQGEN]     WARNING: No vehicles processed in this step, breaking loop");
      break;
    }

    addToSequence(result.processedThisStep, sequenceSteps, processedVehicles);
    console.log(`[SEQGEN]     Sequence now: ${sequenceSteps.join("-")}`);

    allVehiclesInRow = result.remainingAfterStep;
  }
};

/**
 * Process a single step within a row
 */
const processRowStep = (allVehiclesInRow, maquetteData, processedVehicles) => {
  console.log("[SEQGEN]     Applying PRIORITY 2: Road type filter (zandweg + T-junction)");

  const { mainRoadVehicles, sideRoadVehicles, inritVehicles, turningIntoInritVehicles, equalRoadVehicles } =
    filterByRoadType(allVehiclesInRow, maquetteData);

  console.log(`[SEQGEN]       Main road: ${mainRoadVehicles.length}, Equal: ${equalRoadVehicles.length}, Side road: ${sideRoadVehicles.length}, Inrit: ${inritVehicles.length}, Turning into inrit: ${turningIntoInritVehicles.length}`);

  const candidateVehicles =
    mainRoadVehicles.length > 0 ? mainRoadVehicles
    : equalRoadVehicles.length > 0 ? equalRoadVehicles
    : sideRoadVehicles.length > 0 ? sideRoadVehicles
    : inritVehicles.length > 0 ? inritVehicles
    : turningIntoInritVehicles;

  const deferredVehicles =
    mainRoadVehicles.length > 0 ? [...equalRoadVehicles, ...sideRoadVehicles, ...inritVehicles, ...turningIntoInritVehicles]
    : equalRoadVehicles.length > 0 ? [...sideRoadVehicles, ...inritVehicles, ...turningIntoInritVehicles]
    : sideRoadVehicles.length > 0 ? [...inritVehicles, ...turningIntoInritVehicles]
    : inritVehicles.length > 0 ? turningIntoInritVehicles
    : [];

  console.log(`[SEQGEN]       Candidates: ${candidateVehicles.length}, Deferred: ${deferredVehicles.length}`);

  // Special handling for T-junction main road
  const tJunction = detectTJunction(maquetteData);
  if (tJunction && mainRoadVehicles.length > 0 && candidateVehicles === mainRoadVehicles) {
    const result = processTJunctionMainRoad(candidateVehicles, deferredVehicles);
    if (result) return result;
  }

  // Special handling for Zandweg main road
  if (!tJunction && mainRoadVehicles.length > 0 && candidateVehicles === mainRoadVehicles) {
    const hasZandwegPriority = inritVehicles.length > 0 || sideRoadVehicles.length > 0;
    const result = processZandwegMainRoad(candidateVehicles, deferredVehicles, hasZandwegPriority);
    if (result) return result;
  }

  // Equal-rank road processing (LV/LA apply)
  const isEqualRankRoad = candidateVehicles === equalRoadVehicles;
  if (isEqualRankRoad) {
    const lvLaResult = processLVAndLA(candidateVehicles, maquetteData, processedVehicles, deferredVehicles);
    if (lvLaResult) return lvLaResult;

    // RA processing
    const raResult = processRAVehicles(candidateVehicles, maquetteData, deferredVehicles);
    if (raResult) return raResult;
  } else {
    // Non-equal-rank road
    console.log("[SEQGEN]     Non-equal-rank road: processing candidates without LV/LA filter");
    if (candidateVehicles.length > 0) {
      return {
        processedThisStep: [candidateVehicles[0]],
        remainingAfterStep: [...candidateVehicles.slice(1), ...deferredVehicles],
      };
    }
  }

  return null;
};

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate a vehicle sequence based on maquette data
 * @param {Object} maquetteData - The maquette data containing vehicle positions
 * @returns {string} Generated sequence string
 */
export const generateVehicleSequence = (maquetteData) => {
  console.log("[SEQGEN] ========================================");
  console.log("[SEQGEN] Starting Vehicle Sequence Generation");
  console.log("[SEQGEN] ========================================");

  if (!maquetteData) {
    console.log("[SEQGEN] ERROR: No maquette data provided");
    return "";
  }

  console.log("[SEQGEN] Raw Maquette Data:");
  console.log(JSON.stringify(maquetteData, null, 2));

  const quadrantsOrder = getRandomQuadrantOrder();
  console.log(`[SEQGEN] Random quadrant order: ${quadrantsOrder.join(" → ")}`);

  const sequenceSteps = [];
  const processedVehicles = new Set();

  // PRIORITY 1: Emergency vehicles
  processEmergencyVehicles(maquetteData, sequenceSteps, processedVehicles);

  // PRIORITY 1B: Inrit clearing
  processInritClearing(maquetteData, quadrantsOrder, sequenceSteps, processedVehicles);

  // Process each row
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    processRow(rowIndex, maquetteData, quadrantsOrder, processedVehicles, sequenceSteps);
  }

  const finalSequence = sequenceSteps.join(SEQUENCE_OPERATORS.SEQUENTIAL);
  console.log("\n[SEQGEN] ========================================");
  console.log(`[SEQGEN] FINAL SEQUENCE: ${finalSequence}`);
  console.log("[SEQGEN] ========================================\n");

  return finalSequence;
};
