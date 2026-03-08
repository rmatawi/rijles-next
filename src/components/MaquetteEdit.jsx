/*
TODO: bug in fietspaden assignment
*/

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Button,
  Icon,
  TextEditor,
  Sheet,
  NavRight,
  List,
  ListInput,
  f7,
  Block,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  ListItem,
  BlockTitle,
  Toggle,
} from "framework7-react";
import MaquetteEditor from "./MaquetteEditor";
import { useMaquetteGroups } from "../contexts/MaquetteGroupsContext";
import { useI18n } from "../i18n/i18n";
import {
  generateVehicleSequence as generateSequence,
  tokenizeSequence,
  tokensToSequence,
  isOperator,
  toggleOperator,
  insertVehicleAtIndex,
  SEQUENCE_OPERATORS,
} from "../js/vehicleSequenceUtils";
import { updateVehiclePosition, convertTo3x3Grid } from "../js/utils";

const MaquetteEdit = ({
  isPlain,
  groupName,
  sequence,
  answer,
  importantNotes,
  maquetteNumber,
  onDataUpdate,
  maquettenData,
  createDefaultMaquetteVehicles,
}) => {
  const { t } = useI18n();
  const [renderCount, setRenderCount] = useState(0); // Track render count for debugging
  const [draftValues, setDraftValues] = useState({}); // Store temporary values while editing

  // Initialize current maquette data - if empty, use default vehicle structure
  const getInitialMaquetteData = () => {
    const maquetteKey = `maquette_${maquetteNumber}`;
    const existingData = maquettenData?.[maquetteKey] || {};
    const hasVehicleStructure =
      existingData.top ||
      existingData.bottom ||
      existingData.left ||
      existingData.right;

    let result;
    if (!hasVehicleStructure && createDefaultMaquetteVehicles) {
      const vehicleData = createDefaultMaquetteVehicles();
      result = {
        ...existingData,
        title: existingData.title || maquetteNumber?.toString() || "",
        roadsize: existingData.roadsize || "S/B",
        groupName: existingData.groupName || groupName || "",
        ...vehicleData,
      };
    } else {
      result = existingData;
    }

    // Apply 3x4 grid conversion to ensure proper IDs and structure
    return convertTo3x3Grid(result);
  };

  const [currentMaquetteData, setCurrentMaquetteData] = useState(
    getInitialMaquetteData
  ); // Maintain local state of current maquette data
  const [changedElements, setChangedElements] = useState(new Set()); // Track which elements have been changed
  const [deletedElements, setDeletedElements] = useState(new Set()); // Track which elements have been marked for deletion

  const [rotate] = useState(0);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    type: "car",
    name: "",
    direction: "straight",
  });

  // Traffic Sign Configuration
  const trafficSigns = [
    {
      path: "/borden/model_11.svg",
      alt: "Verboden voor motorrijtuigen",
      label: "Motorrijtuigen",
    },
    {
      path: "/borden/model_12.svg",
      alt: "Stop en verleen voorrang",
      label: "Stop/voorrang",
    },
    {
      path: "/borden/model_12d.svg",
      alt: "Stop en verleen voorrang",
      label: "Stop/voorrang",
    },
    {
      path: "/borden/model_12a.svg",
      alt: "Voorrang bij kruising/splitsing",
      label: "Voorrang",
    },
    {
      path: "/borden/model_13.svg",
      alt: "Verboden in beide richtingen",
      label: "Beide richtingen",
    },
    {
      path: "/borden/model_14.svg",
      alt: "Verboden in één richting",
      label: "Één richting",
    },
    {
      path: "/borden/model_24.svg",
      alt: "Eenrichtingsweg",
      label: "Eenrichting",
    },
    {
      path: "/borden/model_25.svg",
      alt: "Linksaf verboden",
      label: "Links verboden",
    },
    {
      path: "/borden/model_26.svg",
      alt: "Rechtsaf verboden",
      label: "Rechts verboden",
    },
    {
      path: "/borden/model_45.svg",
      alt: "Voorrangsweg",
      label: "Voorrangsweg",
    },
    {
      path: "/borden/model_46.svg",
      alt: "Einde voorrangsweg",
      label: "Einde voorrang",
    },
    {
      path: "/borden/model_50.svg",
      alt: "Algemeen gevaarteken",
      label: "Gevaarteken",
    },
    {
      path: "/borden/model_52.svg",
      alt: "Gevaarlijk kruispunt",
      label: "Gevaar kruispunt",
    },
  ];
  const [bikePrefix, setBikePrefix] = useState("F"); // Track selected bike prefix: F, BF, or MF
  const [editingStreet, setEditingStreet] = useState(null);
  const [streetFormData, setStreetFormData] = useState({
    note: "",
    bikelanes: "",
    trafficsign: "",
    trafficSignRotate: 0,
  });
  const [roadSizeFormData, setRoadSizeFormData] = useState({
    roadsize: "S/B",
  });
  const [vehicleOrderMode, setVehicleOrderMode] = useState(false); // Track if in vehicle order mode
  const [orderSequence, setOrderSequence] = useState(""); // Track current order sequence
  const [nextOrderOperator, setNextOrderOperator] = useState(null); // Track next operator for sequence
  const [selectedOrderVehicles, setSelectedOrderVehicles] = useState(new Set()); // Track selected vehicles for order
  const [insertAfterIndex, setInsertAfterIndex] = useState(null); // Track position to insert new vehicle in sequence
  const [sequenceActionMode, setSequenceActionMode] = useState(null); // 'add' or 'replace' - track what action to take when vehicle is clicked

  // State for vehicle selection sheet
  const [vehicleSelectionData, setVehicleSelectionData] = useState({
    tokens: [],
    index: null,
    token: null,
    vehicleNames: [],
  });

  // Get maquette groups for the dropdown
  const { maquetteGroups } = useMaquetteGroups();

  useEffect(() => {
    setDraftValues((prev) => ({
      ...prev,
      sequence: orderSequence,
    }));
  }, [orderSequence]);

  // Track when maquetteGroups context value changes
  const prevMaquetteGroupsRef = useRef();
  useEffect(() => {
    prevMaquetteGroupsRef.current = maquetteGroups;
  }, [maquetteGroups]);

  // Track if we have unsaved local changes
  const hasUnsavedChanges = useRef(false);

  // Log when the component re-renders
  useEffect(() => {
    const newRenderCount = renderCount + 1;
    setRenderCount(newRenderCount);
  }, []); // Empty dependency array so it only runs once on mount

  // Helper function to convert HTML/JSX content to editable text
  const getEditableText = (content) => {
    if (typeof content === "string") {
      return content;
    }

    // If it's JSX/HTML, try to extract text content
    if (React.isValidElement(content)) {
      // For JSX elements, we'll need to serialize them back to a readable format
      // This is a simplified approach - you might want to use a more sophisticated HTML serializer
      const extractTextFromElement = (element) => {
        if (typeof element === "string") return element;
        if (typeof element === "number") return element.toString();
        if (!element) return "";

        if (React.isValidElement(element)) {
          const { children } = element.props || {};
          if (children) {
            if (Array.isArray(children)) {
              return children.map(extractTextFromElement).join("");
            }
            return extractTextFromElement(children);
          }
        }

        return "";
      };

      return extractTextFromElement(content);
    }

    // Fallback for other types
    return content ? content.toString() : "";
  };

  // Function to save all draft values at once
  const saveAllEdits = () => {
    if (isPlain) {
      f7.sheet.close("#maquette-edit-sheet");
      return;
    }
    console.log("SAVE_ALL_EDITS: Starting save operation");
    console.log(
      "SAVE_ALL_EDITS: Current maquette data before save:",
      JSON.parse(JSON.stringify(currentMaquetteData))
    );
    console.log(
      "SAVE_ALL_EDITS: Draft values:",
      JSON.parse(JSON.stringify(draftValues))
    );

    // Update local state to apply draft values
    if (Object.keys(draftValues).length > 0) {
      setCurrentMaquetteData((prevData) => {
        const updatedMaquetteData = { ...prevData };
        const updates = {};

        if (
          draftValues.groupName !== undefined &&
          draftValues.groupName !== groupName
        ) {
          updates.groupName = draftValues.groupName;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "groupName"]));
        }

        if (
          draftValues.title !== undefined &&
          draftValues.title !== (currentMaquetteData?.title || "")
        ) {
          updates.title = draftValues.title;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "title"]));
        }

        if (
          draftValues.importantNotes !== undefined &&
          draftValues.importantNotes !== importantNotes
        ) {
          updates.importantNotes = draftValues.importantNotes;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "importantNotes"]));
        }

        if (
          draftValues.answer !== undefined &&
          draftValues.answer !== getEditableText(answer)
        ) {
          updates.answer = draftValues.answer;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "answer"]));
        }

        // Check if we have a sequence in draft values, otherwise use orderSequence if in vehicle order mode
        let finalSequenceValue = draftValues.sequence;

        if (
          vehicleOrderMode &&
          orderSequence !== (draftValues?.sequence || sequence)
        ) {
          finalSequenceValue = orderSequence;
        }

        if (
          finalSequenceValue !== undefined &&
          finalSequenceValue !== sequence
        ) {
          updates.sequence = finalSequenceValue;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "sequence"]));
        }

        // Handle step descriptions
        const stepDescriptions = {};
        const seqValue = finalSequenceValue || sequence || "";
        const groups = seqValue ? seqValue.split('-') : [];

        let hasStepDescriptions = false;
        for (let i = 0; i < groups.length; i++) {
          const stepKey = `stepDescription_${i}`;
          if (draftValues[stepKey] !== undefined) {
            // For TextEditor content, check if it's not just empty HTML tags
            const trimmedValue = draftValues[stepKey].replace(/<[^>]*>/g, '').trim();
            if (trimmedValue !== '') {
              stepDescriptions[i] = [draftValues[stepKey]]; // Store as array for consistency
              hasStepDescriptions = true;
            }
          } else if (currentMaquetteData?.stepDescriptions?.[i]) {
            // Preserve existing step descriptions if not modified
            stepDescriptions[i] = currentMaquetteData.stepDescriptions[i];
            hasStepDescriptions = true;
          }
        }

        if (hasStepDescriptions) {
          updates.stepDescriptions = stepDescriptions;
          // Track that this field was changed
          setChangedElements((prev) => new Set([...prev, "stepDescriptions"]));
        } else if (currentMaquetteData?.stepDescriptions) {
          // If no new step descriptions but old ones exist, remove them
          updates.stepDescriptions = undefined;
        }

        // Add current vehicle positions to updates (from currentMaquetteData)
        // This ensures vehicle position changes made via drag-and-drop are included
        const { top, right, bottom, left, roadsize, ...otherProps } =
          currentMaquetteData || {};
        if (top) updates.top = top;
        if (right) updates.right = right;
        if (bottom) updates.bottom = bottom;
        if (left) updates.left = left;
        if (roadsize) updates.roadsize = roadsize;

        // Apply all updates to the current maquette
        Object.assign(updatedMaquetteData, updates);

        console.log(
          "SAVE_ALL_EDITS: Updates object (with vehicle positions):",
          JSON.parse(JSON.stringify(updates))
        );
        console.log(
          "SAVE_ALL_EDITS: Updated maquette data:",
          JSON.parse(JSON.stringify(updatedMaquetteData))
        );

        // Apply 3x4 grid conversion to ensure proper IDs and structure
        const convertedMaquetteData = convertTo3x3Grid(updatedMaquetteData);
        return convertedMaquetteData; // Return the updated local data
      });
    }

    // Use callback pattern to ensure we always have the latest state for parent
    if (Object.keys(draftValues).length > 0 && onDataUpdate) {
      onDataUpdate((prevMaquettenData) => {
        console.log("SAVE_ALL_EDITS: Parent data update started");
        console.log(
          "SAVE_ALL_EDITS: Parent data before:",
          JSON.parse(JSON.stringify(prevMaquettenData))
        );

        const updatedMaquetteData = { ...prevMaquettenData };
        const currentMaquette =
          updatedMaquetteData[`maquette_${maquetteNumber}`];

        if (currentMaquette) {
          const updates = {};

          if (
            draftValues.groupName !== undefined &&
            draftValues.groupName !== groupName
          ) {
            updates.groupName = draftValues.groupName;
          }

          if (
            draftValues.title !== undefined &&
            draftValues.title !== (currentMaquetteData?.title || "")
          ) {
            updates.title = draftValues.title;
          }

          if (
            draftValues.importantNotes !== undefined &&
            draftValues.importantNotes !== importantNotes
          ) {
            updates.importantNotes = draftValues.importantNotes;
          }

          if (
            draftValues.answer !== undefined &&
            draftValues.answer !== getEditableText(answer)
          ) {
            updates.answer = draftValues.answer;
          }

          // Check if we have a sequence in draft values, otherwise use orderSequence if in vehicle order mode
          let finalSequenceValue = draftValues.sequence;

          if (
            vehicleOrderMode &&
            orderSequence !== (draftValues?.sequence || sequence)
          ) {
            finalSequenceValue = orderSequence;
            setDraftValues((prev) => ({
              ...prev,
              sequence: orderSequence,
            }));
          }

          if (
            finalSequenceValue !== undefined &&
            finalSequenceValue !== sequence
          ) {
            updates.sequence = finalSequenceValue;
          }

          // Handle step descriptions
          const stepDescriptions = {};
          const seqValue = finalSequenceValue || sequence || "";
          const groups = seqValue ? seqValue.split('-') : [];

          let hasStepDescriptions = false;
          for (let i = 0; i < groups.length; i++) {
            const stepKey = `stepDescription_${i}`;
            if (draftValues[stepKey] !== undefined) {
              // For TextEditor content, check if it's not just empty HTML tags
              const trimmedValue = draftValues[stepKey].replace(/<[^>]*>/g, '').trim();
              if (trimmedValue !== '') {
                stepDescriptions[i] = [draftValues[stepKey]]; // Store as array for consistency
                hasStepDescriptions = true;
              }
            } else if (currentMaquette?.stepDescriptions?.[i]) {
              // Preserve existing step descriptions if not modified
              stepDescriptions[i] = currentMaquette.stepDescriptions[i];
              hasStepDescriptions = true;
            }
          }

          if (hasStepDescriptions) {
            updates.stepDescriptions = stepDescriptions;
          } else if (currentMaquette?.stepDescriptions) {
            // If no new step descriptions but old ones exist, remove them
            updates.stepDescriptions = undefined;
          }

          // Add current vehicle positions to updates (from currentMaquetteData)
          // This ensures vehicle position changes made via drag-and-drop are included
          const { top, right, bottom, left, roadsize, ...otherProps } =
            currentMaquetteData || {};
          if (top) updates.top = top;
          if (right) updates.right = right;
          if (bottom) updates.bottom = bottom;
          if (left) updates.left = left;
          if (roadsize) updates.roadsize = roadsize;

          // Apply all updates to the current maquette
          Object.assign(currentMaquette, updates);

          console.log(
            "SAVE_ALL_EDITS: Updates applied to current maquette:",
            JSON.parse(JSON.stringify(updates))
          );
          console.log(
            "SAVE_ALL_EDITS: Current maquette after update:",
            JSON.parse(JSON.stringify(currentMaquette))
          );
        }

        console.log(
          "SAVE_ALL_EDITS: Updated parent data:",
          JSON.parse(JSON.stringify(updatedMaquetteData))
        );
        return updatedMaquetteData; // Return the updated data
      });
    }

    // Clear draft values after saving
    setDraftValues({});

    console.log("SAVE_ALL_EDITS: Cleared draft values:", draftValues);

    // Reset the unsaved changes flag since we've saved
    hasUnsavedChanges.current = false;

    // Also exit vehicle order mode and reset related states
    setVehicleOrderMode(false);
    setSelectedOrderVehicles(new Set());
    setNextOrderOperator(null);

    setTimeout(() => {
      f7.sheet.close();
    }, 500);
  };

  // Update local state when maquetteNumber or maquettenData prop changes
  useEffect(() => {
    // Only update from props if we don't have unsaved local changes
    if (!hasUnsavedChanges.current) {
      const maquetteKey = `maquette_${maquetteNumber}`;
      let newMaquetteData = maquettenData?.[maquetteKey] || {};

      // If the maquette data is empty or missing vehicle structure, initialize with defaults
      // This handles newly created maquettes where the data hasn't propagated yet
      const hasVehicleStructure =
        newMaquetteData.top ||
        newMaquetteData.bottom ||
        newMaquetteData.left ||
        newMaquetteData.right;

      if (!hasVehicleStructure && createDefaultMaquetteVehicles) {
        const vehicleData = createDefaultMaquetteVehicles();
        newMaquetteData = {
          ...newMaquetteData,
          title: newMaquetteData.title || maquetteNumber?.toString() || "",
          roadsize: newMaquetteData.roadsize || "S/B",
          groupName: newMaquetteData.groupName || groupName || "",
          ...vehicleData,
        };
      }

      // Apply 3x4 grid conversion to ensure proper IDs and structure
      const convertedMaquetteData = convertTo3x3Grid(newMaquetteData);
      setCurrentMaquetteData(convertedMaquetteData);

      // Set order sequence to the sequence from props when switching maquettes
      // This preserves the sequence when opening/closing the edit modal
      setOrderSequence(sequence || "");
      setSelectedOrderVehicles(new Set());
      setNextOrderOperator(null);
    }
  }, [
    maquetteNumber,
    maquettenData,
    createDefaultMaquetteVehicles,
    groupName,
    sequence,
  ]);

  // Initialize draft values since editMode is always true
  useEffect(() => {
    const initialDraftValues = {
      title: currentMaquetteData?.title || "",
      groupName: groupName || "",
      importantNotes: importantNotes || "",
      answer: getEditableText(answer) || "",
      sequence: sequence || "",
    };

    // Add existing step descriptions to draft values
    if (currentMaquetteData?.stepDescriptions) {
      const seqValue = sequence || "";
      const groups = seqValue ? seqValue.split('-') : [];

      for (let i = 0; i < groups.length; i++) {
        if (currentMaquetteData.stepDescriptions[i]) {
          initialDraftValues[`stepDescription_${i}`] =
            Array.isArray(currentMaquetteData.stepDescriptions[i])
              ? currentMaquetteData.stepDescriptions[i][0] // Get first element if it's an array
              : currentMaquetteData.stepDescriptions[i];
        }
      }
    }

    setDraftValues(initialDraftValues);
  }, [currentMaquetteData?.title, currentMaquetteData?.stepDescriptions, groupName, importantNotes, answer, sequence]);

  // Helper function to create default vehicle layout for a single direction
  // The direction parameter is used to create IDs like "top_1", "bottom_2", etc.
  const createDefaultDirectionVehicles = (directionName = "top") => {
    const createSpace = (rowIndex, colIndex) => {
      const positionNumber = rowIndex * 3 + colIndex + 1; // 3 columns per row
      return {
        type: "space",
        direction: "straight",
        id: `${directionName}_${positionNumber}`,
        name: `S${positionNumber}`,
      };
    };

    return [
      [
        createSpace(0, 0), // First element in row 0 - always space
        createSpace(0, 1),
        createSpace(0, 2),
      ],
      [
        createSpace(1, 0), // First element in row 1 - always space
        createSpace(1, 1),
        createSpace(1, 2),
      ],
      [
        createSpace(2, 0), // First element in row 2 - always space
        createSpace(2, 1),
        createSpace(2, 2),
      ],
    ];
  };

  // Helper function to enforce first column rules for vehicle types
  // NOTE: First column restriction has been removed - all vehicle types are now allowed
  const enforceFirstColumnRules = (vehicle, type, name, direction) => {
    // No longer enforcing bike-only rule for first column
    return { type, name, direction };
  };

  // Helper function to update vehicle data
  const updateVehicleData = (newType, newText, newDirection) => {
    if (!editingVehicle) {
      return;
    }

    // Enforce first column rules
    const {
      type: finalType,
      name: finalName,
      direction: finalDirection,
    } = enforceFirstColumnRules(editingVehicle, newType, newText, newDirection);

    // Mark that we have unsaved changes
    hasUnsavedChanges.current = true;

    // Update local state to immediately reflect changes in UI
    setCurrentMaquetteData((prevData) => {
      const updatedMaquetteData = { ...prevData };

      // Try to find and update the vehicle using the same logic as parent update
      const result = findAndUpdateVehicleInData(
        updatedMaquetteData,
        editingVehicle,
        finalType,
        finalName,
        finalDirection
      );

      if (result.updated) {
        // Track the changed element
        const vehicleId =
          editingVehicle.id ||
          `${editingVehicle.direction}_${editingVehicle.position || editingVehicle.vehicleIndex
          }`;
        setChangedElements((prev) => new Set([...prev, vehicleId]));

        // If this is a deletion (space type), add to deleted elements
        if (finalType === "space") {
          setDeletedElements((prev) => new Set([...prev, vehicleId]));
        }

        // Apply 3x4 grid conversion to ensure proper IDs and structure
        const convertedMaquetteData = convertTo3x3Grid(result.updatedData);
        return convertedMaquetteData; // Return updated data if successful
      }

      // Apply 3x4 grid conversion to ensure proper IDs and structure
      const convertedPrevData = convertTo3x3Grid(prevData);
      return convertedPrevData; // Return previous data if update failed
    });

    // Use callback pattern to ensure we always have the latest state for parent
    if (onDataUpdate) {
      onDataUpdate((prevMaquettenData) => {
        const updatedMaquetteData = { ...prevMaquettenData };
        const currentMaquette =
          updatedMaquetteData[`maquette_${maquetteNumber}`];

        if (currentMaquette) {
          // Try to find and update the vehicle in the parent data
          const result = findAndUpdateVehicleInData(
            currentMaquette,
            editingVehicle,
            finalType,
            finalName,
            finalDirection
          );

          if (result.updated) {
            // Track the changed element at the parent level too
            const vehicleId =
              editingVehicle.id ||
              `${editingVehicle.direction}_${editingVehicle.position || editingVehicle.vehicleIndex
              }`;

            // Notify parent about the change for tracking
            if (typeof onDataUpdate === "function" && currentMaquette.id) {
              // If the maquette has an ID, it means it was previously synced to database
              // We should track this change for sync purposes
            }

            return updatedMaquetteData; // Return the updated data
          } else {
            return prevMaquettenData;
          }
        }

        // If we couldn't update, return the previous data unchanged
        return prevMaquettenData;
      });
    }
  };

  // Helper function to find and update a vehicle in the data structure
  const findAndUpdateVehicleInData = (
    maquetteData,
    editingVehicle,
    newType,
    newText,
    newDirection
  ) => {
    let direction = null;
    let positionNumber = null;

    // FIRST: Try to match by exact ID if available - this is the most precise method
    if (editingVehicle.id) {
      // Try to extract direction and position from the ID directly
      // Handle formats like "top_1", "bottom_2", etc.
      const idPatternMatch = /^([a-z]+)_(\d+)$/.exec(editingVehicle.id);
      if (idPatternMatch) {
        direction = idPatternMatch[1]; // e.g., "top", "bottom", "left", "right"
        positionNumber = parseInt(idPatternMatch[2], 10); // e.g., 1, 2, 3, etc.
      } else {
        // Try other ID formats as fallback
        // Try to match "direction-Snumber" format first
        const hyphenPatternMatch = /^(.+)-S(\d+)$/.exec(editingVehicle.id);
        if (hyphenPatternMatch) {
          direction = hyphenPatternMatch[1]; // e.g., "bottom"
          positionNumber = parseInt(hyphenPatternMatch[2], 10); // e.g., 1 from "S01"
        } else {
          // Try to match "directionnumber" format (e.g., "bottom01")
          const noHyphenPatternMatch = /^([a-zA-Z]+)(\d+)$/.exec(
            editingVehicle.id
          );
          if (noHyphenPatternMatch) {
            direction = noHyphenPatternMatch[1]; // e.g., "bottom"
            positionNumber = parseInt(noHyphenPatternMatch[2], 10); // e.g., 1 from "01"
          }
        }
      }
    }

    // SECOND: If not found by exact ID, try to match by vehicleIndex and other properties
    if (!direction && editingVehicle.vehicleIndex !== undefined) {
      // If we have a vehicleIndex, we need to determine which direction and position this corresponds to
      // We'll find the vehicle in the data based on its original properties
      const directions = ["top", "bottom", "left", "right"];
      let found = false;

      for (const dir of directions) {
        const dirSection = maquetteData[dir];

        if (dirSection && dirSection.vehicles) {
          for (
            let rowIndex = 0;
            rowIndex < dirSection.vehicles.length;
            rowIndex++
          ) {
            const row = dirSection.vehicles[rowIndex];

            for (let colIndex = 0; colIndex < row.length; colIndex++) {
              const vehicle = row[colIndex];

              // Match by vehicleIndex if available, otherwise match by type and name if they exist
              if (
                vehicle.vehicleIndex === editingVehicle.vehicleIndex ||
                (editingVehicle.type === vehicle.type &&
                  editingVehicle.name === vehicle.name &&
                  editingVehicle.direction === vehicle.direction)
              ) {
                direction = dir;
                positionNumber = rowIndex * 4 + colIndex + 1;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }
    }

    if (direction && positionNumber) {
      // Calculate row and column from the position number (1-indexed)
      // With 3x4 grid: positions 1-4 are in row 0, 5-8 in row 1, 9-12 in row 2
      let rowIndex = Math.floor((positionNumber - 1) / 4);
      let colIndex = (positionNumber - 1) % 4;

      let dirSection = maquetteData[direction];

      // If the direction section exists but doesn't have vehicles, initialize it
      if (dirSection && !dirSection.vehicles) {
        dirSection.vehicles = createDefaultDirectionVehicles(direction);
      }

      if (
        dirSection &&
        dirSection.vehicles &&
        dirSection.vehicles[rowIndex] &&
        dirSection.vehicles[rowIndex][colIndex]
      ) {
        // Get the original vehicle first
        const originalVehicle = dirSection.vehicles[rowIndex][colIndex];

        // Update the vehicle with the new values
        const updatedVehicle = {
          type: newType,
        };

        // Only add name and direction if not a space vehicle
        if (newType !== "space") {
          updatedVehicle.name = newText;
          updatedVehicle.direction = newDirection;
        } else {
          // For space vehicles, restore proper ID and name based on position (Row/Col system)
          const positionNumber = rowIndex * 4 + colIndex + 1; // 4 columns per row for 3x4 grid
          updatedVehicle.id = `space_${positionNumber}`;
          updatedVehicle.name = `S${positionNumber}`;
          updatedVehicle.direction = "straight";
        }

        // Preserve the id if it's part of the original data, otherwise create a new one
        if (originalVehicle.id) {
          updatedVehicle.id = originalVehicle.id;
        } else {
          updatedVehicle.id = `${direction}${positionNumber < 10 ? "0" : ""
            }${positionNumber}`;
        }

        // Preserve the vehicleIndex if it existed
        if (originalVehicle.vehicleIndex !== undefined) {
          updatedVehicle.vehicleIndex = originalVehicle.vehicleIndex;
        }

        dirSection.vehicles[rowIndex][colIndex] = updatedVehicle;

        return { updated: true, updatedData: maquetteData }; // Return the updated local data
      } else {
        // Check if we can create/initialize the vehicle at this position
        if (dirSection && dirSection.vehicles) {
          // Make sure the row exists
          while (dirSection.vehicles.length <= rowIndex) {
            const basePosition = dirSection.vehicles.length * 4 + 1; // 4 columns per row for 3x4 grid
            dirSection.vehicles.push([
              {
                type: "space",
                direction: "straight",
                id: `space_${basePosition}`,
                name: `S${basePosition}`,
              }, // First element
              {
                type: "space",
                direction: "straight",
                id: `space_${basePosition + 1}`,
                name: `S${basePosition + 1}`,
              },
              {
                type: "space",
                direction: "straight",
                id: `space_${basePosition + 2}`,
                name: `S${basePosition + 2}`,
              },
              {
                type: "space",
                direction: "straight",
                id: `space_${basePosition + 3}`,
                name: `S${basePosition + 3}`,
              },
            ]);
          }

          // Make sure the column exists
          while (dirSection.vehicles[rowIndex].length <= colIndex) {
            const positionNumber =
              rowIndex * 4 + dirSection.vehicles[rowIndex].length + 1; // 4 columns per row for 3x4 grid
            // First element in row must be space
            const type =
              dirSection.vehicles[rowIndex].length === 0 ? "space" : "space";
            dirSection.vehicles[rowIndex].push({
              type: type,
              direction: "straight",
              id: `space_${positionNumber}`,
              name: `S${positionNumber}`,
            });
          }

          // Now create the vehicle at the target position
          const positionNumber = rowIndex * 4 + colIndex + 1; // 4 columns per row for 3x4 grid
          const updatedVehicle = {
            type: newType,
          };

          // Only add name and direction if not a space vehicle
          if (newType !== "space") {
            updatedVehicle.name = newText;
            updatedVehicle.direction = newDirection;
          } else {
            // For space vehicles, restore proper ID and name based on position
            updatedVehicle.id = `space_${positionNumber}`;
            updatedVehicle.name = `S${positionNumber}`;
            updatedVehicle.direction = "straight";
          }

          updatedVehicle.id = `${direction}${positionNumber < 10 ? "0" : ""
            }${positionNumber}`;

          dirSection.vehicles[rowIndex][colIndex] = updatedVehicle;

          return { updated: true, updatedData: maquetteData }; // Return the updated local data
        }
      }
    }

    // If we couldn't match by exact ID or vehicleIndex, fall back to finding by position in specific direction
    if (editingVehicle.direction && editingVehicle.position) {
      // If editingVehicle has direction and position properties, use them directly
      direction = editingVehicle.direction;
      const position = editingVehicle.position; // 1-indexed position in the row

      let rowIndex = Math.floor((position - 1) / 4);
      let colIndex = (position - 1) % 4;

      let dirSection = maquetteData[direction];

      if (dirSection && dirSection.vehicles) {
        // Make sure the row and column exist
        while (dirSection.vehicles.length <= rowIndex) {
          const basePosition = dirSection.vehicles.length * 4 + 1; // 4 columns per row for 3x4 grid
          dirSection.vehicles.push([
            {
              type: "space",
              direction: "straight",
              id: `space_${basePosition}`,
              name: `S${basePosition}`,
            },
            {
              type: "space",
              direction: "straight",
              id: `space_${basePosition + 1}`,
              name: `S${basePosition + 1}`,
            },
            {
              type: "space",
              direction: "straight",
              id: `space_${basePosition + 2}`,
              name: `S${basePosition + 2}`,
            },
            {
              type: "space",
              direction: "straight",
              id: `space_${basePosition + 3}`,
              name: `S${basePosition + 3}`,
            },
          ]);
        }

        while (dirSection.vehicles[rowIndex].length <= colIndex) {
          const posNum =
            rowIndex * 4 + dirSection.vehicles[rowIndex].length + 1; // 4 columns per row for 3x4 grid
          dirSection.vehicles[rowIndex].push({
            type: "space",
            direction: "straight",
            id: `space_${posNum}`,
            name: `S${posNum}`,
          });
        }

        // Update the vehicle at this exact position
        const originalVehicle = dirSection.vehicles[rowIndex][colIndex];

        const updatedVehicle = { type: newType };

        if (newType !== "space") {
          updatedVehicle.name = newText;
          updatedVehicle.direction = newDirection;
        } else {
          // For space vehicles, restore proper ID and name based on position
          const positionNumber = rowIndex * 4 + colIndex + 1; // 4 columns per row for 3x4 grid
          updatedVehicle.id = `space_${positionNumber}`;
          updatedVehicle.name = `S${positionNumber}`;
          updatedVehicle.direction = "straight";
        }

        if (originalVehicle.id) {
          updatedVehicle.id = originalVehicle.id;
        } else {
          updatedVehicle.id = `${direction}${rowIndex * 4 + colIndex + 1 < 10 ? "0" : ""
            }${rowIndex * 4 + colIndex + 1}`;
        }

        if (originalVehicle.vehicleIndex !== undefined) {
          updatedVehicle.vehicleIndex = originalVehicle.vehicleIndex;
        }

        dirSection.vehicles[rowIndex][colIndex] = updatedVehicle;

        return { updated: true, updatedData: maquetteData };
      }
    }

    // If we couldn't update, return that update failed
    return { updated: false, updatedData: maquetteData };
  };

  // Helper function to extract all vehicle names from the current maquette data
  const getAllVehicleNames = () => {
    if (!currentMaquetteData) return [];

    const directions = ["top", "bottom", "left", "right"];
    const vehicleNames = [];

    for (const direction of directions) {
      const dirSection = currentMaquetteData[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          if (Array.isArray(row)) {
            for (const vehicle of row) {
              if (vehicle && vehicle.type !== "space" && vehicle.name) {
                // Only add unique vehicle names
                if (!vehicleNames.includes(vehicle.name)) {
                  vehicleNames.push(vehicle.name);
                }
              }
            }
          }
        }
      }
    }

    return vehicleNames;
  };

  // Helper function to update street data
  const updateStreetData = (newNote, newBikelanes, newtrafficsign, trafficSignRotate = 0) => {
    if (!editingStreet) {
      return;
    }

    // Mark that we have unsaved changes
    hasUnsavedChanges.current = true;

    // Update local state to immediately reflect changes in UI
    setCurrentMaquetteData((prevData) => {
      const updatedMaquetteData = { ...prevData };
      const result = updateStreetInData(
        updatedMaquetteData,
        editingStreet.direction,
        newNote,
        newBikelanes,
        newtrafficsign,
        trafficSignRotate
      );

      if (result.updated) {
        // Track the changed street element
        const streetId = `street_${editingStreet.direction}`;
        setChangedElements((prev) => new Set([...prev, streetId]));

        // If all values are empty/default, consider it deleted
        if (
          (!newNote || newNote === "") &&
          (!newBikelanes || newBikelanes === "") &&
          (!newtrafficsign || newtrafficsign === "")
        ) {
          setDeletedElements((prev) => new Set([...prev, streetId]));
        }

        // Apply 3x4 grid conversion to ensure proper IDs and structure
        const convertedMaquetteData = convertTo3x3Grid(result.updatedData);
        return convertedMaquetteData; // Return updated data if successful
      }

      // Apply 3x4 grid conversion to ensure proper IDs and structure
      const convertedPrevData = convertTo3x3Grid(prevData);
      return convertedPrevData; // Return previous data if update failed
    });

    if (onDataUpdate) {
      onDataUpdate((prevMaquettenData) => {
        const updatedMaquetteData = { ...prevMaquettenData };
        const currentMaquette =
          updatedMaquetteData[`maquette_${maquetteNumber}`];

        if (currentMaquette) {
          // Only create deep copy when isPlain is true to ensure React detects changes in MaquetteBuilder
          const maquetteCopy = isPlain
            ? {
              ...currentMaquette,
              top: currentMaquette.top
                ? { ...currentMaquette.top }
                : currentMaquette.top,
              bottom: currentMaquette.bottom
                ? { ...currentMaquette.bottom }
                : currentMaquette.bottom,
              left: currentMaquette.left
                ? { ...currentMaquette.left }
                : currentMaquette.left,
              right: currentMaquette.right
                ? { ...currentMaquette.right }
                : currentMaquette.right,
            }
            : currentMaquette;

          const result = updateStreetInData(
            maquetteCopy,
            editingStreet.direction,
            newNote,
            newBikelanes,
            newtrafficsign,
            trafficSignRotate
          );

          if (result.updated) {
            // Assign the updated copy back when isPlain is true to ensure new reference
            if (isPlain) {
              updatedMaquetteData[`maquette_${maquetteNumber}`] =
                result.updatedData;
            }
            return updatedMaquetteData; // Return the updated data
          } else {
            return prevMaquettenData;
          }
        }

        // If we couldn't update, return the previous data unchanged
        return prevMaquettenData;
      });
    }
  };

  // Helper function to update street data in the data structure
  const updateStreetInData = (
    maquetteData,
    direction,
    newNote,
    newBikelanes,
    newtrafficsign,
    trafficSignRotate = 0
  ) => {
    if (maquetteData && maquetteData[direction]) {
      if (
        newNote === "" &&
        (!newBikelanes || newBikelanes === "") &&
        (!newtrafficsign || newtrafficsign === "")
      ) {
        // Clear the note, bikelanes, and trafficsign and ensure it's a normal road
        maquetteData[direction] = {
          note: "",
          vehicles: maquetteData[direction].vehicles || [],
          trafficSignRotate: trafficSignRotate, // Keep trafficSignRotate even when clearing other values
        };
      } else {
        // Set the note and/or bikelanes and/or trafficsign and keep existing vehicles
        const updatedStreetData = {
          ...maquetteData[direction],
          note: newNote,
          trafficSignRotate: trafficSignRotate, // Preserve trafficSignRotate value
        };

        // Only set bikelanes if it has a value, otherwise remove it
        if (newBikelanes && newBikelanes !== "") {
          updatedStreetData.bikelanes = newBikelanes;
        } else {
          delete updatedStreetData.bikelanes;
        }

        // Only set trafficsign if it has a value, otherwise remove it
        if (newtrafficsign && newtrafficsign !== "") {
          updatedStreetData.trafficsign = newtrafficsign;
        } else {
          delete updatedStreetData.trafficsign;
        }

        updatedStreetData.note = newNote;

        maquetteData[direction] = updatedStreetData;
      }

      return { updated: true, updatedData: maquetteData }; // Return the updated local data
    }

    // If we couldn't update, return that update failed
    return { updated: false, updatedData: maquetteData };
  };

  const handleStreetClick = (direction, streetData) => {
    setEditingStreet({ direction, streetData });
    setStreetFormData({
      note: streetData?.note || "",
      bikelanes: streetData?.bikelanes || "",
      trafficsign: streetData?.trafficsign || "",
      trafficSignRotate: streetData?.trafficSignRotate || 0,
    });
    f7.sheet.open("#sheet-editquadrant");
  };

  // Helper function to update road size data
  const updateRoadSizeData = (newRoadSize) => {
    // Mark that we have unsaved changes
    hasUnsavedChanges.current = true;

    // Update local state to immediately reflect changes in UI
    setCurrentMaquetteData((prevData) => {
      const updatedMaquetteData = { ...prevData };
      updatedMaquetteData.roadsize = newRoadSize;

      // Track the changed road size element
      setChangedElements((prev) => new Set([...prev, "roadsize"]));

      // Apply 3x4 grid conversion to ensure proper IDs and structure
      const convertedMaquetteData = convertTo3x3Grid(updatedMaquetteData);
      return convertedMaquetteData; // Return the updated local data
    });

    if (onDataUpdate) {
      onDataUpdate((prevMaquettenData) => {
        const updatedMaquetteData = { ...prevMaquettenData };
        const currentMaquette =
          updatedMaquetteData[`maquette_${maquetteNumber}`];

        if (currentMaquette) {
          // Only create a new object when isPlain is true to ensure React detects changes in MaquetteBuilder
          if (isPlain) {
            updatedMaquetteData[`maquette_${maquetteNumber}`] = {
              ...currentMaquette,
              roadsize: newRoadSize,
            };
          } else {
            currentMaquette.roadsize = newRoadSize;
          }

          return updatedMaquetteData; // Return the updated data
        }

        // If we couldn't update, return the previous data unchanged
        return prevMaquettenData;
      });
    }
  };

  const handleRoadSizeClick = () => {
    const currentRoadSize =
      maquettenData?.[`maquette_${maquetteNumber}`]?.roadsize || "S/B";

    // Define the road size options and cycling order
    const roadSizeOptions = ["S", "B", "S/B"];
    const currentOptionIndex =
      roadSizeOptions.indexOf(currentRoadSize) !== -1
        ? roadSizeOptions.indexOf(currentRoadSize)
        : -1;
    const nextRoadSize =
      currentOptionIndex === -1
        ? roadSizeOptions[0]
        : roadSizeOptions[(currentOptionIndex + 1) % roadSizeOptions.length];

    // Update the road size directly
    updateRoadSizeData(nextRoadSize);
  };

  const handleResetMaquette = () => {
    f7.dialog.confirm(
      "Weet je zeker dat je deze maquette wilt resetten? Alle voertuigen en straat instellingen worden gewist.",
      "Maquette Resetten",
      () => {
        // Mark that we have unsaved changes
        hasUnsavedChanges.current = true;

        // Update local state to immediately reflect changes in UI
        setCurrentMaquetteData((prevData) => {
          // Create a completely fresh maquette with default empty space layout
          const vehicleData = createDefaultMaquetteVehicles();

          const defaultMaquetteData = {
            title: prevData.title,
            roadsize: "S/B",
            sequence: "",
            stepDescriptions: {}, // Reset step descriptions
            groupName: prevData.groupName,
            answer: prevData.answer || "",
            importantNotes: prevData.importantNotes || "",
            notes: prevData.notes || "",
            ...vehicleData,
          };

          // Track that the entire maquette was reset (all elements changed)
          setChangedElements((prev) => new Set(["all"]));
          setDeletedElements((prev) => new Set([])); // Clear deleted elements since we're resetting

          // Apply 3x4 grid conversion to ensure proper IDs and structure
          const convertedMaquetteData = convertTo3x3Grid(defaultMaquetteData);
          return convertedMaquetteData; // Return the updated local data
        });

        if (onDataUpdate) {
          onDataUpdate((prevMaquettenData) => {
            // Use the same logic as adding a new maquette - create completely fresh data
            const updatedMaquetteData = { ...prevMaquettenData };
            const currentMaquette =
              updatedMaquetteData[`maquette_${maquetteNumber}`];

            if (currentMaquette) {
              // Create a completely fresh maquette with default empty space layout
              const vehicleData = createDefaultMaquetteVehicles();

              const defaultMaquetteData = {
                title: currentMaquette.title,
                roadsize: "S/B",
                sequence: "",
                stepDescriptions: {}, // Reset step descriptions
                groupName: currentMaquette.groupName,
                answer: currentMaquette.answer || "",
                importantNotes: currentMaquette.importantNotes || "",
                notes: currentMaquette.notes || "",
                ...vehicleData,
              };

              // Replace the entire maquette with fresh default data
              updatedMaquetteData[`maquette_${maquetteNumber}`] =
                defaultMaquetteData;

              return updatedMaquetteData; // Return the updated data
            }

            // If we couldn't update, return the previous data unchanged
            return prevMaquettenData;
          });
        }

        setTimeout(() => {
          f7.sheet.close();
        }, 500);
      }
    );
  };

  const handleVehicleClick = (vehicle) => {
    // Check if in insert mode (inserting after a specific position)
    if (vehicleOrderMode && insertAfterIndex !== null) {
      handleVehicleInsert(vehicle.name);
      return;
    }

    // Check if in vehicle order mode (adding to end)
    if (vehicleOrderMode) {
      // Check if vehicle was already selected for sequence
      const vehicleId = `${vehicle.name}_${vehicle.type}_${vehicle.direction}`;
      if (selectedOrderVehicles.has(vehicleId)) {
        f7.dialog.confirm(
          `${vehicle.name} is al geselecteerd voor Animatie Volgorde. Wilt u de huidige volgorde resetten?`,
          "Al geselecteerd voor Animatie Volgorde",
          () => {
            // User confirmed - reset the sequence and proceed
            setOrderSequence("");
            setSelectedOrderVehicles(new Set());

            // Now add the current vehicle
            let newSequence = vehicle.name;
            setOrderSequence(newSequence);
            setSelectedOrderVehicles(new Set([vehicleId]));

            let sequenceDialog = f7.dialog.create({
              title: `Animatie Volgorde`,
              text: "Gevolgd door (-) of Samen met (+):",
              buttons: [
                {
                  text: "+",
                  cssClass: "blue-btn text-large",
                  onClick: () => {
                    setNextOrderOperator("+");
                    f7.dialog.close();
                  },
                },
                {
                  text: "-",
                  cssClass: "blue-btn text-large",
                  onClick: () => {
                    setNextOrderOperator("-");
                    f7.dialog.close();
                  },
                },
                {
                  text: "✔",
                  cssClass: "blue-btn text-large",
                  onClick: () => {
                    setNextOrderOperator(null);
                    setVehicleOrderMode(false);
                    f7.dialog.close();
                  },
                },
              ],
              on: {
                closed: function () {
                  sequenceDialog.destroy();
                },
              },
            });

            sequenceDialog.open();
          },
          () => {
            // User cancelled - do nothing
            f7.dialog.close();
          }
        );
        return;
      }

      console.log("[OLD FLOW] This should NOT be triggered anymore!");
      console.log("[OLD FLOW] orderSequence:", orderSequence);
      console.log("[OLD FLOW] nextOrderOperator:", nextOrderOperator);
      console.log("[OLD FLOW] vehicle.name:", vehicle.name);

      let newSequence = orderSequence;
      if (nextOrderOperator) {
        newSequence = `${orderSequence}${nextOrderOperator}${vehicle.name}`;
        setNextOrderOperator(null);
      } else {
        // First vehicle
        newSequence = vehicle.name;
      }
      console.log("[OLD FLOW] newSequence:", newSequence);
      setOrderSequence(newSequence);

      // Mark vehicle as selected for sequence
      setSelectedOrderVehicles((prev) => new Set([...prev, vehicleId]));

      let sequenceDialog = f7.dialog.create({
        title: `Animatie Volgorde`,
        text: "Gevolgd door (-) of Samen met (+):",
        buttons: [
          {
            text: "+",
            cssClass: "blue-btn text-large",
            onClick: () => {
              setNextOrderOperator("+");
              f7.dialog.close();
            },
          },
          {
            text: "-",
            cssClass: "blue-btn text-large",
            onClick: () => {
              setNextOrderOperator("-");
              f7.dialog.close();
            },
          },
          {
            text: "✔",
            cssClass: "blue-btn text-large",
            onClick: () => {
              setVehicleOrderMode(false);
              f7.dialog.close();
            },
          },
        ],
        on: {
          closed: function () {
            sequenceDialog.destroy();
          },
        },
      });

      sequenceDialog.open();
      return;
    }

    // EditMode functionality
    setEditingVehicle(vehicle);

    // When a space vehicle is clicked, default to car with next available number
    const isSpaceVehicle = vehicle.type === "space";

    // Calculate the next number for vehicles if needed
    let nextVehicleNumber = "";
    if (isSpaceVehicle || (vehicle.type !== "space" && !vehicle.name)) {
      // Default to car for all positions
      nextVehicleNumber = getNextCarNumber();
    }

    // Default type is car for space vehicles, otherwise keep the vehicle type
    const initialType = isSpaceVehicle ? "car" : vehicle.type || "car";

    setVehicleFormData({
      type: initialType,
      name: isSpaceVehicle
        ? nextVehicleNumber
        : vehicle.type !== "space" && !vehicle.name
          ? nextVehicleNumber
          : vehicle.name || "",
      direction: isSpaceVehicle ? "straight" : vehicle.direction || "straight",
    });

    // Set the bike prefix based on existing vehicle name if it's a bike
    if (vehicle.type === "bike" && vehicle.name) {
      if (vehicle.name.startsWith("BF")) {
        setBikePrefix("BF");
      } else if (vehicle.name.startsWith("MF")) {
        setBikePrefix("MF");
      } else {
        setBikePrefix("F");
      }
    }

    f7.sheet.open("#sheet-editstreet");
  };

  if (!maquetteNumber) {
    return (
      <Page>
        <Navbar>
          <NavLeft back backLink />
          <NavTitle>{t("errors.pageNotFound") || "Page Not Found"}</NavTitle>
        </Navbar>
        <Block inset>
          <Card>
            <Button lerge fill href="/home" iconF7="house" text="Home" />
          </Card>
        </Block>
      </Page>
    );
  }

  // Function to get the highest numbered vehicle in the maquette to determine the next number
  const getNextCarNumber = (vehicleType = "car", prefix = "F") => {
    if (!currentMaquetteData) {
      return vehicleType === "bike" ? `${prefix}1` : "1";
    }

    const directions = ["top", "bottom", "left", "right"];
    let highestNumber = 0;

    for (const direction of directions) {
      const dirSection = currentMaquetteData[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          if (Array.isArray(row)) {
            for (const vehicle of row) {
              if (vehicle && vehicle.type === vehicleType) {
                // For bikes, extract the number from prefixed names (F, BF, or MF)
                if (vehicleType === "bike" && vehicle.name) {
                  // Check for all possible prefixes
                  let numStr = null;
                  if (vehicle.name.startsWith("BF")) {
                    numStr = vehicle.name.substring(2); // Remove 'BF' prefix
                  } else if (vehicle.name.startsWith("MF")) {
                    numStr = vehicle.name.substring(2); // Remove 'MF' prefix
                  } else if (vehicle.name.startsWith("F")) {
                    numStr = vehicle.name.substring(1); // Remove 'F' prefix
                  }

                  if (numStr) {
                    const num = parseInt(numStr, 10);
                    if (!isNaN(num) && num > highestNumber) {
                      highestNumber = num;
                    }
                  }
                } else if (vehicleType !== "bike") {
                  // For non-bikes, increment counter
                  highestNumber++;
                }
              }
            }
          }
        }
      }
    }

    const nextNumber = highestNumber + 1;
    return vehicleType === "bike"
      ? `${prefix}${nextNumber}`
      : nextNumber.toString();
  };

  // Helper function to initialize maquette data with default vehicles
  const initializeMaquetteData = (prevData) => {
    const updatedMaquetteData = { ...prevData };
    const directions = ["top", "bottom", "left", "right"];

    // Initialize all directions with default space vehicles if they don't exist
    directions.forEach((direction) => {
      if (
        !updatedMaquetteData[direction] ||
        !updatedMaquetteData[direction].vehicles
      ) {
        updatedMaquetteData[direction] = {
          ...updatedMaquetteData[direction],
          vehicles: createDefaultDirectionVehicles(direction),
        };
      }
    });

    return updatedMaquetteData;
  };

  // Helper function to place vehicles randomly in each direction
  const placeVehiclesInDirection = (
    dirSection,
    direction,
    nextCarNumber,
    nextBikeNumber,
    maxVehiclesPerQuadrant = 3
  ) => {
    let currentNextCarNumber = nextCarNumber;
    let currentNextBikeNumber = nextBikeNumber;

    // Clear existing vehicles first (keep only spaces)
    for (let rowIndex = 0; rowIndex < dirSection.vehicles.length; rowIndex++) {
      for (
        let colIndex = 0;
        colIndex < dirSection.vehicles[rowIndex].length;
        colIndex++
      ) {
        // Clear all positions to spaces
        dirSection.vehicles[rowIndex][colIndex] = {
          type: "space",
          direction: "straight",
          id: `space_${rowIndex * 3 + colIndex + 1}`, // 3 columns per row as per requirements
          name: `S${rowIndex * 3 + colIndex + 1}`,
        };
      }
    }

    // Randomly decide how many vehicles to place (between 0 and maxVehiclesPerQuadrant)
    const maxVehicles = Math.min(maxVehiclesPerQuadrant, 9); // cap at 9 (3x3 grid)
    const numVehicles = Math.floor(Math.random() * (maxVehicles + 1)); // 0 to maxVehicles

    // Collect all available positions (all columns now, including first column)
    const availablePositions = [];
    for (let rowIndex = 0; rowIndex < dirSection.vehicles.length; rowIndex++) {
      for (
        let colIndex = 0;
        colIndex < dirSection.vehicles[rowIndex].length;
        colIndex++
      ) {
        availablePositions.push({ rowIndex, colIndex });
      }
    }

    // Shuffle available positions
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [
        availablePositions[j],
        availablePositions[i],
      ];
    }

    // Place vehicles randomly (mix of cars and bikes)
    for (let i = 0; i < numVehicles && i < availablePositions.length; i++) {
      const { rowIndex, colIndex } = availablePositions[i];
      const positionNumber = rowIndex * 3 + colIndex + 1;

      // Randomly decide vehicle type (80% cars, 20% bikes)
      const isBike = Math.random() < 0.2;
      const vehicleType = isBike ? "bike" : "car";

      // Randomly choose direction (left, straight, right)
      const vehicleDirections = ["left", "straight", "right"];
      const randomDirection =
        vehicleDirections[Math.floor(Math.random() * vehicleDirections.length)];

      if (isBike) {
        dirSection.vehicles[rowIndex][colIndex] = {
          type: "bike",
          name: `F${currentNextBikeNumber}`,
          direction: randomDirection,
          id: `${direction}${positionNumber < 10 ? "0" : ""}${positionNumber}`,
        };
        currentNextBikeNumber++;
      } else {
        dirSection.vehicles[rowIndex][colIndex] = {
          type: "car",
          name: `${currentNextCarNumber}`,
          direction: randomDirection,
          id: `${direction}${positionNumber < 10 ? "0" : ""}${positionNumber}`,
        };
        currentNextCarNumber++;
      }
    }

    return { currentNextCarNumber, currentNextBikeNumber };
  };

  // Helper function to generate vehicles based on selected number
  const handleGenerateVehicles = (maxVehiclesNum) => {
    // Validate the input
    if (isNaN(maxVehiclesNum) || maxVehiclesNum < 0 || maxVehiclesNum > 10) {
      f7.dialog.alert(
        "Please enter a valid number between 0 and 10",
        "Invalid Input"
      );
      return;
    }

    // Generate random placement of cars and bikes per quadrant
    // Cars only appear in the 2nd column (positions 2, 6, 10) - random range based on user input up to 3 due to position constraint
    // Bikes only appear in the 1st column (positions 1, 5, 9)
    // Each vehicle has its own unique number
    hasUnsavedChanges.current = true;

    // Update local state to immediately reflect changes in UI
    setCurrentMaquetteData((prevData) => {
      // Initialize the maquette data
      const updatedMaquetteData = initializeMaquetteData(prevData);

      // Keep track of used vehicle numbers across all directions
      let nextCarNumber = 1;
      let nextBikeNumber = 1;

      // For each direction, randomly place 0 to maxVehiclesNum cars and 0-1 bike
      const directions = ["top", "bottom", "left", "right"];
      directions.forEach((direction) => {
        const dirSection = updatedMaquetteData[direction];
        if (dirSection && dirSection.vehicles) {
          const result = placeVehiclesInDirection(
            dirSection,
            direction,
            nextCarNumber,
            nextBikeNumber,
            maxVehiclesNum
          );
          nextCarNumber = result.currentNextCarNumber;
          nextBikeNumber = result.currentNextBikeNumber;
        }
      });

      // Now call parent with the generated data
      if (onDataUpdate) {
        onDataUpdate((prevMaquettenData) => {
          const updatedMaquetteDataCopy = { ...prevMaquettenData };
          updatedMaquetteDataCopy[`maquette_${maquetteNumber}`] = {
            ...updatedMaquetteData,
          };
          return updatedMaquetteDataCopy; // Return the updated data with generated vehicles
        });
      }

      // Generate and set the sequence for all vehicles
      generateVehicleSequence(updatedMaquetteData);

      // Apply 3x4 grid conversion to ensure proper IDs and structure
      const convertedMaquetteData = convertTo3x3Grid(updatedMaquetteData);
      return convertedMaquetteData; // Return the updated local data
    });
  };

  // Helper function to copy the current sequence to clipboard
  const copySequenceToClipboard = async () => {
    const currentSequence =
      orderSequence || draftValues?.sequence || sequence || "";
    try {
      await navigator.clipboard.writeText(currentSequence);
      f7.toast
        .create({
          text: "Sequence gekopieerd naar klembord!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    } catch (err) {
      console.error("Failed to copy sequence: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = currentSequence;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      f7.toast
        .create({
          text: "Sequence gekopieerd naar klembord!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    }
  };

  // Helper function to generate the sequence for all vehicles
  // Uses centralized utility from vehicleSequenceUtils.js
  const generateVehicleSequence = (updatedMaquetteData) => {
    const autoSequence = generateSequence(updatedMaquetteData);

    if (autoSequence) {
      setOrderSequence(autoSequence);

      // Also update draft values to persist the sequence
      setDraftValues((prev) => ({
        ...prev,
        sequence: autoSequence,
      }));
    }
  };

  // Handler for clicking on a sequence token button
  const handleSequenceTokenClick = (index, token) => {
    const tokens = tokenizeSequence(
      orderSequence || draftValues?.sequence || sequence || ""
    );

    if (isOperator(token)) {
      // Toggle between + and -
      const newTokens = [...tokens];
      newTokens[index] = toggleOperator(token);
      const newSequence = tokensToSequence(newTokens);
      setOrderSequence(newSequence);
      setDraftValues((prev) => ({
        ...prev,
        sequence: newSequence,
      }));
    } else {
      // Vehicle button clicked - prepare data for vehicle selection sheet
      const vehicleNames = getAllVehicleNames();

      // Set the vehicle selection data and open the sheet
      setVehicleSelectionData({
        tokens,
        index,
        token,
        vehicleNames,
      });
      f7.sheet.open(".vehicle-selection-sheet");
    }
  };

  // Handler for when a vehicle is clicked while in sequence edit mode
  const handleVehicleInsert = (vehicleName) => {
    if (insertAfterIndex !== null) {
      const currentSeq =
        orderSequence || draftValues?.sequence || sequence || "";
      const tokens = tokenizeSequence(currentSeq);
      let newTokens;

      console.log("[handleVehicleInsert] Current sequence:", currentSeq);
      console.log("[handleVehicleInsert] Tokens:", tokens);
      console.log("[handleVehicleInsert] insertAfterIndex:", insertAfterIndex);
      console.log(
        "[handleVehicleInsert] sequenceActionMode:",
        sequenceActionMode
      );
      console.log("[handleVehicleInsert] vehicleName:", vehicleName);

      if (sequenceActionMode === "replace") {
        // Replace the vehicle at the index
        newTokens = [...tokens];
        newTokens[insertAfterIndex] = vehicleName;
      } else {
        // Add after the index (default behavior)
        newTokens = insertVehicleAtIndex(
          tokens,
          insertAfterIndex,
          vehicleName,
          SEQUENCE_OPERATORS.SEQUENTIAL
        );
      }

      console.log("[handleVehicleInsert] newTokens:", newTokens);

      const newSequence = tokensToSequence(newTokens);

      console.log("[handleVehicleInsert] newSequence:", newSequence);

      setOrderSequence(newSequence);
      setDraftValues((prev) => ({
        ...prev,
        sequence: newSequence,
      }));
      setInsertAfterIndex(null);
      setSequenceActionMode(null);
      setVehicleOrderMode(false);
    }
  };

  // Handler for vehicle position updates via drag and drop
  const handleVehiclePositionUpdate = (dragData, dropLocation) => {
    // Update the maquette data structure with the new vehicle position
    hasUnsavedChanges.current = true;

    setCurrentMaquetteData((prevData) => {
      try {
        // Use the utility function to update vehicle positions
        const updatedData = updateVehiclePosition(
          prevData,
          dragData,
          dropLocation
        );

        // Apply 3x4 grid conversion to ensure proper IDs and structure after the update
        const convertedData = convertTo3x3Grid(updatedData);

        return convertedData;
      } catch (error) {
        console.error("Error updating vehicle position:", error);
        return prevData; // Return previous data if update fails
      }
    });

    // Update draft values to ensure changes are saved with saveAllEdits
    setDraftValues((prev) => {
      try {
        console.log(
          "DRAG_DROP: Updating draft values from:",
          JSON.parse(JSON.stringify(prev))
        );
        // Instead of replacing the entire structure, just update the vehicle positions in the draft
        // We need to update the maquette data with new vehicle positions and then merge with existing draft
        const updatedMaquetteWithNewVehicles = updateVehiclePosition(
          { ...currentMaquetteData },
          dragData,
          dropLocation
        );

        // Merge the updated vehicle positions with existing draft values
        const updatedDraft = {
          ...prev, // Keep existing draft values
          ...updatedMaquetteWithNewVehicles, // Add the updated maquette data (with new vehicle positions)
        };

        console.log(
          "DRAG_DROP: Updated draft values to:",
          JSON.parse(JSON.stringify(updatedDraft))
        );
        return updatedDraft;
      } catch (error) {
        console.error("Error updating draft values:", error);
        return prev; // Return previous data if update fails
      }
    });

    // Also update draft values if onDataUpdate is available
    if (onDataUpdate) {
      onDataUpdate((prevMaquettenData) => {
        try {
          console.log(
            "DRAG_DROP: Updating parent data from:",
            JSON.parse(JSON.stringify(prevMaquettenData))
          );
          // Check if prevMaquettenData is an array before trying to map
          if (Array.isArray(prevMaquettenData)) {
            // Find the current maquette in the list and update it
            const updatedList = prevMaquettenData.map((maquette) => {
              if (maquette.id === currentMaquetteData?.id) {
                // Use the utility function to update vehicle positions
                const updatedMaquette = {
                  ...maquette,
                  ...updateVehiclePosition(maquette, dragData, dropLocation),
                };
                console.log(
                  "DRAG_DROP: Updated maquette in array:",
                  JSON.parse(JSON.stringify(updatedMaquette))
                );
                return updatedMaquette;
              }
              return maquette;
            });
            console.log(
              "DRAG_DROP: Updated parent array:",
              JSON.parse(JSON.stringify(updatedList))
            );
            return updatedList;
          } else {
            // Handle object structure (like { maquette_001: {...} } when isPlain is true)
            // Check if this looks like a maquette wrapper object or the maquette itself
            const hasMaquetteKey = Object.keys(prevMaquettenData).some((key) =>
              key.startsWith("maquette_")
            );

            if (hasMaquetteKey && isPlain) {
              // This is a wrapper object like { maquette_001: {...} }
              // We need to update the specific maquette and create new references
              const updatedWrapper = { ...prevMaquettenData };
              const maquetteKey = `maquette_${maquetteNumber}`;
              const currentMaquette = updatedWrapper[maquetteKey];

              if (currentMaquette) {
                // Create a deep copy of currentMaquette to ensure React detects changes
                const maquetteCopy = {
                  ...currentMaquette,
                  top: currentMaquette.top
                    ? { ...currentMaquette.top }
                    : currentMaquette.top,
                  bottom: currentMaquette.bottom
                    ? { ...currentMaquette.bottom }
                    : currentMaquette.bottom,
                  left: currentMaquette.left
                    ? { ...currentMaquette.left }
                    : currentMaquette.left,
                  right: currentMaquette.right
                    ? { ...currentMaquette.right }
                    : currentMaquette.right,
                };

                // Apply the vehicle position update to the copy
                const updatedMaquette = updateVehiclePosition(
                  maquetteCopy,
                  dragData,
                  dropLocation
                );

                // Assign back to ensure new reference
                updatedWrapper[maquetteKey] = updatedMaquette;

                console.log(
                  "DRAG_DROP: Updated parent wrapper object:",
                  JSON.parse(JSON.stringify(updatedWrapper))
                );
                return updatedWrapper;
              }
            } else {
              // This is the maquette object itself (original behavior)
              const updatedObject = {
                ...prevMaquettenData,
                ...updateVehiclePosition(
                  prevMaquettenData,
                  dragData,
                  dropLocation
                ),
              };
              console.log(
                "DRAG_DROP: Updated parent object:",
                JSON.parse(JSON.stringify(updatedObject))
              );
              return updatedObject;
            }
          }
        } catch (error) {
          console.error("Error updating vehicle position in list:", error);
          return prevMaquettenData; // Return previous data if update fails
        }
      });
    }

    console.log("DRAG_DROP: Drag operation completed");
  };

  // Render sequence as clickable buttons
  const renderSequenceButtons = () => {
    const currentSequence =
      orderSequence || draftValues?.sequence || sequence || "";
    const tokens = tokenizeSequence(currentSequence);

    if (tokens.length === 0) {
      return (
        <span
          style={{
            color: "var(--f7-input-placeholder-color)",
            fontStyle: "italic",
          }}
        >
          Geen volgorde ingesteld
        </span>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          alignItems: "center",
        }}
      >
        {tokens.map((token, index) => {
          const isOp = isOperator(token);
          const isInsertTarget = insertAfterIndex === index;

          return (
            <Button
              key={index}
              small
              round
              fill={!isOp}
              outline={isOp}
              color={isOp ? "gray" : isInsertTarget ? "green" : "blue"}
              style={{
                minWidth: isOp ? "32px" : "40px",
                padding: isOp ? "0 8px" : "0 12px",
                fontWeight: isOp ? "bold" : "normal",
                fontSize: isOp ? "16px" : "14px",
                border: isInsertTarget
                  ? "2px solid var(--f7-theme-color)"
                  : undefined,
              }}
              onClick={() => handleSequenceTokenClick(index, token)}
            >
              {token}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <Page>
      <Navbar>
        <NavTitle>Edit Maquette {maquetteNumber}</NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle sheet-close"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
          >
            <Icon f7="xmark" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      {!isPlain && (
        <Block style={{ marginBottom: "10px" }}>
          <List mediaList inset>
            <ListInput
              outline
              label={"Enter Group Name"}
              type="select"
              value={draftValues?.groupName || groupName || ""}
              onChange={(e) => {
                setDraftValues((prev) => ({
                  ...prev,
                  groupName: e.target.value,
                }));
              }}
            >
              <option value="">Select a group</option>
              {maquetteGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title || group.id}
                </option>
              ))}
              {/* Add new group functionality */}
              <Button
                slot="content-end"
                small
                iconF7="plus"
                onClick={() => {
                  f7.sheet.open(".sheet-managecategories");
                }}
              />
            </ListInput>
            <ListInput
              outline
              label="Titel"
              type="text"
              value={draftValues?.title || currentMaquetteData?.title || ""}
              onInput={(e) => {
                setDraftValues((prev) => ({
                  ...prev,
                  title: e.target.value,
                }));
              }}
            />
          </List>
        </Block>
      )}

      {isPlain && (
        <>
          <br />
          <br />
          <br />
        </>
      )}

      <div style={{ position: "relative" }}>
        <MaquetteEditor
          mode="edit"
          rotate={rotate}
          roadsize={currentMaquetteData?.roadsize}
          data={{
            ...currentMaquetteData,
          }}
          onVehicleClick={handleVehicleClick}
          onStreetClick={handleStreetClick}
          onRoadSizeClick={handleRoadSizeClick}
          onVehiclesUpdate={handleVehiclePositionUpdate}
        />
        <Button
          className="btn-maquette-edit top-left"
          small
          fill
          bgColor="blue"
          textColor="white"
          text="Generate"
          onClick={() => {
            // Show custom modal with buttons for number selection
            const dialog = f7.dialog.create({
              title: "Number of Vehicles",
              text: 'Max vehicles per quadrant:<div id="number-buttons-container" style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;"><button id="btn-number-1" class="button button-fill" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; min-width: auto;">1</button><button id="btn-number-2" class="button button-fill" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; min-width: auto;">2</button><button id="btn-number-3" class="button button-fill" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; min-width: auto;">3</button><button id="btn-number-4" class="button button-fill" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; min-width: auto;">4</button><button id="btn-number-5" class="button button-fill" style="width: 40px; height: 40px; border-radius: 50%; padding: 0; min-width: auto;">5</button></div>',
              buttons: [
                {
                  text: "Cancel",
                  color: "red",
                },
              ],
              on: {
                opened: function () {
                  // Add click listeners to number buttons after dialog is opened
                  document
                    .getElementById("btn-number-1")
                    ?.addEventListener("click", () => {
                      dialog.close();
                      handleGenerateVehicles(1);
                    });
                  document
                    .getElementById("btn-number-2")
                    ?.addEventListener("click", () => {
                      dialog.close();
                      handleGenerateVehicles(2);
                    });
                  document
                    .getElementById("btn-number-3")
                    ?.addEventListener("click", () => {
                      dialog.close();
                      handleGenerateVehicles(3);
                    });
                  document
                    .getElementById("btn-number-4")
                    ?.addEventListener("click", () => {
                      dialog.close();
                      handleGenerateVehicles(4);
                    });
                  document
                    .getElementById("btn-number-5")
                    ?.addEventListener("click", () => {
                      dialog.close();
                      handleGenerateVehicles(5);
                    });
                },
              },
            });

            dialog.open();
          }}
        />
        <Button
          className="btn-maquette-edit top-right"
          small
          fill
          bgColor="blue"
          textColor="white"
          text="Rotate"
          onClick={() => {
            // Mark that we have unsaved changes
            hasUnsavedChanges.current = true;

            // Update local state to immediately reflect changes in UI
            setCurrentMaquetteData((prevData) => {
              // Store the original values with deep copy to avoid reference issues
              const originalTop = prevData.top
                ? JSON.parse(JSON.stringify(prevData.top))
                : null;
              const originalRight = prevData.right
                ? JSON.parse(JSON.stringify(prevData.right))
                : null;
              const originalBottom = prevData.bottom
                ? JSON.parse(JSON.stringify(prevData.bottom))
                : null;
              const originalLeft = prevData.left
                ? JSON.parse(JSON.stringify(prevData.left))
                : null;

              // Perform the rotation: top → right, right → bottom, bottom → left, left → top
              const updatedMaquetteData = { ...prevData };
              updatedMaquetteData.right = originalTop;
              updatedMaquetteData.bottom = originalRight;
              updatedMaquetteData.left = originalBottom;
              updatedMaquetteData.top = originalLeft;

              // Now call parent with the already-rotated data
              if (onDataUpdate) {
                onDataUpdate((prevMaquettenData) => {
                  const updatedMaquetteDataCopy = { ...prevMaquettenData };
                  updatedMaquetteDataCopy[`maquette_${maquetteNumber}`] = {
                    ...updatedMaquetteData,
                  };
                  return updatedMaquetteDataCopy; // Return the updated data with rotated maquette
                });
              }

              // Apply 3x4 grid conversion to ensure proper IDs and structure
              const convertedMaquetteData = convertTo3x3Grid(updatedMaquetteData);
              return convertedMaquetteData; // Return the updated local data
            });
          }}
        />
        <Button
          className="btn-maquette-edit bottom-left"
          small
          bgColor="red"
          textColor="white"
          onClick={handleResetMaquette}
          text="Reset"
        />
      </div>

      {!isPlain && (
        <Block>
          <BlockTitle></BlockTitle>
          <BlockTitle>
            {t("maquette.oprijVolgorde") || "OpRij-Volgorde"}
          </BlockTitle>

          {/* Sequence display as clickable buttons */}
          <div
            style={{
              backgroundColor: "var(--f7-list-bg-color)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>{renderSequenceButtons()}</div>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              {!vehicleOrderMode ? (
                <>
                  <Button
                    small
                    outline
                    text="Calculate"
                    onClick={() => {
                      generateVehicleSequence(currentMaquetteData);
                    }}
                  />
                  <Button
                    small
                    outline
                    text="Copy"
                    onClick={() => {
                      copySequenceToClipboard();
                    }}
                  />
                </>
              ) : (
                <>
                  <Button
                    small
                    fill
                    color="green"
                    text="Klaar"
                    onClick={() => {
                      setVehicleOrderMode(false);
                      setInsertAfterIndex(null);
                      setSequenceActionMode(null);
                    }}
                  />
                  <Button
                    small
                    outline
                    color="red"
                    text="Cancel"
                    onClick={() => {
                      setVehicleOrderMode(false);
                      setInsertAfterIndex(null);
                      setSequenceActionMode(null);
                    }}
                  />
                  {insertAfterIndex !== null && sequenceActionMode && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--f7-theme-color)",
                        alignSelf: "center",
                      }}
                    >
                      {sequenceActionMode === "replace"
                        ? "Vervangen"
                        : "Toevoegen na"}{" "}
                      positie {insertAfterIndex + 1}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Step Descriptions Editor */}
          <BlockTitle>Aangepaste Stap-Uitleg</BlockTitle>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "0.9em", color: "var(--f7-text-color-secondary)" }}>
              Voeg aangepaste uitleg toe voor elke stap in de "Stap voor stap" animatie:
            </p>
            {(() => {
              const seqValue = orderSequence || draftValues?.sequence || sequence || "";
              const groups = seqValue ? seqValue.split('-') : [];

              return groups.map((group, index) => (
                <div key={index} style={{ marginBottom: "16px" }}>
                  <div style={{
                    fontSize: "0.9em",
                    fontWeight: "bold",
                    marginBottom: "4px",
                    color: "var(--f7-theme-color)"
                  }}>
                    Stap {index + 1}: {group}
                  </div>
                  <TextEditor
                    placeholder={`Voeg aangepaste uitleg toe voor stap ${index + 1}...`}
                    value={draftValues?.[`stepDescription_${index}`] ||
                      (currentMaquetteData?.stepDescriptions &&
                        currentMaquetteData.stepDescriptions[index] !== undefined
                        ? (Array.isArray(currentMaquetteData.stepDescriptions[index])
                          ? currentMaquetteData.stepDescriptions[index][0]
                          : currentMaquetteData.stepDescriptions[index])
                        : "") ||
                      ""}
                    onTextEditorChange={(value) => {
                      setDraftValues((prev) => ({
                        ...prev,
                        [`stepDescription_${index}`]: value,
                      }));
                    }}
                    buttons={[["bold", "italic"], ["unorderedList", "orderedList"]]}
                    style={{
                      fontSize: "1em",
                      minHeight: "80px",
                    }}
                  />
                </div>
              ));
            })()}
          </div>

          <BlockTitle>{t("maquette.rules") || "Regels"}</BlockTitle>
          <TextEditor
            label={t("maquette.rules") || "Regels"}
            placeholder={
              t("maquette.importantRulesTips") || "Belangrijke Regels & Tips"
            }
            value={draftValues?.importantNotes || importantNotes || ""}
            onTextEditorChange={(value) => {
              setDraftValues((prev) => ({
                ...prev,
                importantNotes: value,
              }));
            }}
            buttons={[["bold"], ["orderedList", "unorderedList"]]}
            style={{
              fontSize: "1em",
              marginTop: "15px",
              minHeight: "80px",
            }}
          />
          <BlockTitle>{t("maquette.solution")}</BlockTitle>
          <TextEditor
            placeholder={
              t("maquette.enterSolutionText") || "Enter solution text"
            }
            value={draftValues?.answer || getEditableText(answer) || ""}
            onTextEditorChange={(value) => {
              setDraftValues((prev) => ({
                ...prev,
                answer: value,
              }));
            }}
            buttons={[["bold"], ["orderedList", "unorderedList"]]}
            style={{
              fontSize: "1.1em",
              marginBottom: "10px",
              minHeight: "100px",
            }}
          />
        </Block>
      )}

      <Block inset>
        <Button onClick={saveAllEdits} text="OK" fill iconF7="checkmark" />
      </Block>

      {/* Vehicle Edit Sheet */}
      <Sheet
        id="sheet-editstreet"
        onSheetClosed={() => {
          setEditingVehicle(null);
          setBikePrefix("F"); // Reset to default prefix
        }}
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavTitle>
              {(editingVehicle && t("maquette.editVehicle")) ||
                (editingVehicle && "Bewerk Voertuig")}
            </NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle sheet-close"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>

          <List noHairlinesMd>
            {/* All vehicle types are now allowed in all columns */}
            <ListItem>
              <div
                style={{ width: "100%" }}
                className="grid grid-cols-5 grid-gap"
              >
                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.type == "bike"}
                  onClick={() => {
                    let newName = vehicleFormData.name;
                    // Get the next available bike number with selected prefix
                    newName = getNextCarNumber("bike", bikePrefix);
                    setVehicleFormData((prev) => ({
                      ...prev,
                      type: "bike",
                      name: newName,
                    }));
                  }}
                  text="Bike"
                />
                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.type == "car"}
                  onClick={() => {
                    // Calculate new name based on the new type if the current name is empty
                    let newName = vehicleFormData.name;

                    // Get the next available car number
                    newName = getNextCarNumber("car");

                    setVehicleFormData((prev) => ({
                      ...prev,
                      type: "car",
                      name: newName,
                    }));
                  }}
                  text="Car"
                />

                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.type == "ambulance"}
                  onClick={() => {
                    let newName = vehicleFormData.name;
                    // Get the next available car number
                    newName = getNextCarNumber("ambulance");
                    setVehicleFormData((prev) => ({
                      ...prev,
                      type: "ambulance",
                      name: newName,
                    }));
                  }}
                  text="AS"
                />

                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.type == "firetruck"}
                  onClick={() => {
                    let newName = vehicleFormData.name;
                    // Get the next available car number
                    newName = getNextCarNumber("firetruck");
                    setVehicleFormData((prev) => ({
                      ...prev,
                      type: "firetruck",
                      name: newName,
                    }));
                  }}
                  text="BS"
                />

                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.type == "police"}
                  onClick={() => {
                    let newName = vehicleFormData.name;
                    // Get the next available car number
                    newName = getNextCarNumber("police");
                    setVehicleFormData((prev) => ({
                      ...prev,
                      type: "police",
                      name: newName,
                    }));
                  }}
                  text="PS"
                />
              </div>
            </ListItem>
            {/* Bike prefix selection - show when bike is selected */}
            {vehicleFormData.type === "bike" && (
              <ListItem>
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    className="grid grid-cols-3 grid-gap"
                    style={{ gap: "8px" }}
                  >
                    <Button
                      style={{ width: "100%" }}
                      fill={bikePrefix === "F"}
                      outline={bikePrefix !== "F"}
                      onClick={() => {
                        setBikePrefix("F");
                        // Update the name with new prefix
                        const currentNumber =
                          vehicleFormData.name.replace(/[^0-9]/g, "") || "1";
                        setVehicleFormData((prev) => ({
                          ...prev,
                          name: `F${currentNumber}`,
                        }));
                      }}
                      text="F"
                    />
                    <Button
                      style={{ width: "100%" }}
                      fill={bikePrefix === "BF"}
                      outline={bikePrefix !== "BF"}
                      onClick={() => {
                        setBikePrefix("BF");
                        // Update the name with new prefix
                        const currentNumber =
                          vehicleFormData.name.replace(/[^0-9]/g, "") || "1";
                        setVehicleFormData((prev) => ({
                          ...prev,
                          name: `BF${currentNumber}`,
                        }));
                      }}
                      text="BF"
                    />
                    <Button
                      style={{ width: "100%" }}
                      fill={bikePrefix === "MF"}
                      outline={bikePrefix !== "MF"}
                      onClick={() => {
                        setBikePrefix("MF");
                        // Update the name with new prefix
                        const currentNumber =
                          vehicleFormData.name.replace(/[^0-9]/g, "") || "1";
                        setVehicleFormData((prev) => ({
                          ...prev,
                          name: `MF${currentNumber}`,
                        }));
                      }}
                      text="MF"
                    />
                  </div>
                </div>
              </ListItem>
            )}
            <ListItem style={{ width: "100%" }}>
              <div style={{ width: "100%", marginTop: "10px" }}>
                <div
                  className="grid grid-cols-4 grid-gap"
                  style={{ gap: "5px" }}
                >
                  {Array.from({ length: 16 }, (_, i) => {
                    let number = i + 1;
                    let displayNumber;

                    if (vehicleFormData.type === "bike") {
                      displayNumber = `${bikePrefix}${number}`;
                    } else if (vehicleFormData.type === "ambulance") {
                      displayNumber = `AS${number}`;
                    } else if (vehicleFormData.type === "firetruck") {
                      displayNumber = `BS${number}`;
                    } else if (vehicleFormData.type === "police") {
                      displayNumber = `PS${number}`;
                    } else {
                      displayNumber = `${number}`;
                    }

                    return (
                      <Button
                        small
                        key={number}
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          minHeight: "30px",
                        }}
                        outline={vehicleFormData.name === displayNumber}
                        onClick={() => {
                          setVehicleFormData((prev) => ({
                            ...prev,
                            name: displayNumber,
                          }));
                        }}
                        text={displayNumber}
                      />
                    );
                  })}
                </div>
              </div>
            </ListItem>
            <ListItem outline>
              <div
                style={{ width: "100%" }}
                className="grid grid-cols-3 grid-gap"
              >
                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.direction == "left"}
                  iconF7="arrow_left"
                  onClick={() => {
                    setVehicleFormData((prev) => ({
                      ...prev,
                      direction: "left",
                    }));
                  }}
                />
                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.direction == "straight"}
                  iconF7="arrow_up"
                  onClick={() => {
                    setVehicleFormData((prev) => ({
                      ...prev,
                      direction: "straight",
                    }));
                  }}
                />
                <Button
                  style={{ width: "100%" }}
                  outline={vehicleFormData.direction == "right"}
                  iconF7="arrow_right"
                  onClick={() => {
                    setVehicleFormData((prev) => ({
                      ...prev,
                      direction: "right",
                    }));
                  }}
                />
              </div>
            </ListItem>
          </List>
          <div style={{ padding: "20px", display: "flex", gap: "10px" }}>
            <Button
              iconColor="red"
              iconF7="trash"
              style={{ flex: 1 }}
              onClick={() => {
                const newType = "space";
                updateVehicleData(newType, "", "straight");

                // If the maquette already exists in the database (has an ID), and
                // we're deleting the vehicle, we should consider removing it from the DB immediately
                // However, since Supabase doesn't have individual vehicle records, we'll just mark it as deleted
                // The actual removal from DB will happen when pushing to the database

                f7.sheet.close("#sheet-editstreet");
              }}
            />

            <Button
              fill
              color="blue"
              style={{ flex: 1 }}
              iconF7="checkmark"
              onClick={() => {
                const newType = vehicleFormData.type;
                const newText =
                  vehicleFormData.type === "space" ? "" : vehicleFormData.name;
                const newDirection =
                  vehicleFormData.type === "space"
                    ? "straight"
                    : vehicleFormData.direction;

                updateVehicleData(newType, newText, newDirection);
                f7.sheet.close("#sheet-editstreet");
              }}
            />
          </div>
        </Page>
      </Sheet>

      {/* Street Edit Sheet */}
      <Sheet
        id="sheet-editquadrant"
        onSheetClosed={() => {
          setEditingStreet(null);
        }}
        swipeToClose
        backdrop
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavTitle>
              {t("maquette.editStreet")} ({editingStreet?.direction || ""})
            </NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                onClick={() => {
                  updateStreetData(
                    streetFormData.note,
                    streetFormData.bikelanes,
                    streetFormData.trafficsign,
                    streetFormData.trafficSignRotate
                  );
                  f7.sheet.close("#sheet-editquadrant");
                }}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>

          <List noHairlinesMd>
            <ListInput
              outline
              label="Type Straat"
              type="select"
              value={streetFormData.note}
              onInput={(e) =>
                setStreetFormData((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
            >
              <option value="">Normale weg</option>
              <option value="INRIT S">Inrit S</option>
              <option value="INRIT B">Inrit B</option>
              <option value="INRIT S/B">Inrit S/B</option>
              <option value="ZANDWEG">Zandweg</option>
              <option value="TCROSS">T-Kruising</option>
            </ListInput>

            <ListItem
              title="Fietspaden"
              after={
                <Toggle
                  checked={streetFormData.bikelanes === "both"}
                  onChange={(e) =>
                    setStreetFormData((prev) => ({
                      ...prev,
                      bikelanes: e.target.checked ? "both" : "",
                    }))
                  }
                />
              }
            />

            <ListItem
              title="90 Degrees (TrafficSign)"
              after={
                <Toggle
                  checked={streetFormData.trafficSignRotate === -90}
                  onChange={(e) =>
                    setStreetFormData((prev) => ({
                      ...prev,
                      trafficSignRotate: e.target.checked ? -90 : 0,
                    }))
                  }
                />
              }
            />

            <BlockTitle>Verkeersborden</BlockTitle>
            <Block>
              <div
                className="traffic-sign-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                  gap: "10px",
                  padding: "10px 0",
                }}
              >
                {/* No sign option */}
                <div
                  className={`traffic-sign-item ${streetFormData.trafficsign === "" ? "selected" : ""
                    }`}
                  onClick={() =>
                    setStreetFormData((prev) => ({ ...prev, trafficsign: "" }))
                  }
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    border:
                      streetFormData.trafficsign === ""
                        ? "2px solid #007aff"
                        : "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor:
                      streetFormData.trafficsign === "" ? "#e3f2fd" : "#f9f9f9",
                  }}
                >
                  <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                    Geen
                  </div>
                </div>

                {/* Traffic Sign Selection Grid - Using object mapping */}
                {trafficSigns.map((sign, index) => (
                  <div
                    key={index}
                    className={`traffic-sign-item ${streetFormData.trafficsign === sign.path ? "selected" : ""
                      }`}
                    onClick={() =>
                      setStreetFormData((prev) => ({
                        ...prev,
                        trafficsign: sign.path,
                      }))
                    }
                    style={{
                      textAlign: "center",
                      padding: "8px",
                      border:
                        streetFormData.trafficsign === sign.path
                          ? "2px solid #007aff"
                          : "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor:
                        streetFormData.trafficsign === sign.path
                          ? "#e3f2fd"
                          : "#f9f9f9",
                    }}
                  >
                    <img
                      src={sign.path}
                      alt={sign.alt}
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "contain",
                      }}
                    />
                    {/* <div style={{ fontSize: "10px", marginTop: "4px" }}>{sign.label}</div> */}
                  </div>
                ))}
              </div>
            </Block>
          </List>

          <div style={{ padding: "20px", display: "flex", gap: "10px" }}>
            <Button
              fill
              color="blue"
              style={{ flex: 1 }}
              onClick={() => {
                updateStreetData(
                  streetFormData.note,
                  streetFormData.bikelanes,
                  streetFormData.trafficsign,
                  streetFormData.trafficSignRotate
                );
                f7.sheet.close("#sheet-editquadrant");
              }}
            >
              <Icon f7="checkmark" style={{ marginRight: "8px" }} />
            </Button>
          </div>
        </Page>
      </Sheet>

      {/* Vehicle Selection Sheet */}
      <Sheet className="vehicle-selection-sheet" style={{ height: "50vh" }}>
        <Page>
          <Navbar>
            <NavTitle>
              Selecteer nieuw voertuig (huidig: "{vehicleSelectionData.token}")
            </NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle sheet-close"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>
          <Block
            inset
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
              gap: "8px",
              maxHeight: "300px",
              overflowY: "auto",
              padding: "8px 0",
            }}
          >
            {vehicleSelectionData.vehicleNames.map((vehicleName, idx) => (
              <Button
                key={idx}
                fill
                style={{
                  minWidth: "70px",
                  padding: "8px 4px",
                  margin: "2px",
                  fontSize: "12px",
                }}
                onClick={() => {
                  // Replace the clicked token with the selected vehicle name
                  const newTokens = [...vehicleSelectionData.tokens];
                  newTokens[vehicleSelectionData.index] = vehicleName;
                  const newSequence = tokensToSequence(newTokens);
                  setOrderSequence(newSequence);
                  setDraftValues((prev) => ({
                    ...prev,
                    sequence: newSequence,
                  }));
                  f7.sheet.close(".vehicle-selection-sheet");
                }}
              >
                {vehicleName}
              </Button>
            ))}
          </Block>
          <Block style={{ paddingTop: 0 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                fill
                color="red"
                style={{ flex: 1 }}
                onClick={() => {
                  // Remove the vehicle and its adjacent operator
                  const newTokens = [...vehicleSelectionData.tokens];
                  if (
                    vehicleSelectionData.index === 0 &&
                    newTokens.length > 1
                  ) {
                    // First vehicle - remove it and the following operator
                    newTokens.splice(0, 2);
                  } else if (vehicleSelectionData.index > 0) {
                    // Not first - remove the preceding operator and the vehicle
                    newTokens.splice(vehicleSelectionData.index - 1, 2);
                  } else {
                    // Only one vehicle - just remove it
                    newTokens.splice(vehicleSelectionData.index, 1);
                  }
                  const newSequence = tokensToSequence(newTokens);
                  setOrderSequence(newSequence);
                  setDraftValues((prev) => ({
                    ...prev,
                    sequence: newSequence,
                  }));
                  f7.sheet.close(".vehicle-selection-sheet");
                }}
              >
                Verwijderen
              </Button>
              <Button
                fill
                color="gray"
                style={{ flex: 1 }}
                onClick={() => {
                  f7.sheet.close(".vehicle-selection-sheet");
                }}
              >
                Annuleren
              </Button>
            </div>
          </Block>
        </Page>
      </Sheet>
    </Page>
  );
};

export default MaquetteEdit;
