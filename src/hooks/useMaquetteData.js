import { useState, useEffect, useCallback } from "react";
import { maquettenData as maquettenDataSrc } from "../js/maquetten.jsx";
import { transformMaquetteData } from "../utils/maquetteDataTransformer.js";
import { convertTo3x3Grid, convertMaquettesTo3x3Grid } from "../js/utils";

export const useMaquetteData = () => {
  const [maquettenData, setMaquettenData] = useState({});
  const [syncStatus, setSyncStatus] = useState({}); // Track sync status for each maquette: 'synced', 'modified', 'new', 'deleted'
  const [locallyDeleted, setLocallyDeleted] = useState(new Set()); // Track locally deleted items
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to save to localStorage whenever maquettenData, syncStatus, or locallyDeleted changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("maquettenData", JSON.stringify(maquettenData));
      localStorage.setItem("maquettenSyncStatus", JSON.stringify(syncStatus));
      localStorage.setItem("maquettenLocallyDeleted", JSON.stringify(Array.from(locallyDeleted)));
    }
  }, [maquettenData, syncStatus, locallyDeleted, isInitialized]);

  // Function to mark a maquette as modified
  const markAsModified = (maquetteKey) => {
    setSyncStatus((prev) => ({
      ...prev,
      [maquetteKey]: "modified",
    }));
  };

  // Function to mark a maquette as new
  const markAsNew = (maquetteKey) => {
    setSyncStatus((prev) => ({
      ...prev,
      [maquetteKey]: "new",
    }));
  };

  // Function to mark a maquette as deleted
  const markAsDeleted = (maquetteKey) => {
    setLocallyDeleted((prev) => new Set(prev).add(maquetteKey));
    setSyncStatus((prev) => ({
      ...prev,
      [maquetteKey]: "deleted",
    }));
  };

  // Function to mark a maquette as synced
  const markAsSynced = (maquetteKey) => {
    setSyncStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[maquetteKey];
      return newStatus;
    });
  };

  // Function to get all modified maquettes
  const getModifiedMaquettes = useCallback(() => {
    const modified = [];
    for (const [key, status] of Object.entries(syncStatus)) {
      if (status === "modified" || status === "new") {
        modified.push(key);
      }
    }
    return modified;
  }, [syncStatus]);

  // Function to get all locally deleted maquettes
  const getLocallyDeletedMaquettes = useCallback(() => {
    return Array.from(locallyDeleted);
  }, [locallyDeleted]);

  // Function to reset sync status (after successful sync)
  const resetSyncStatus = () => {
    setSyncStatus({});
    setLocallyDeleted(new Set());
  };

  const handleDataUpdate = (updatedData, maquetteNumber) => {
    const maquetteKey = `maquette_${maquetteNumber}`;

    // Check if updatedData is a function (functional update pattern)
    if (typeof updatedData === "function") {
      setMaquettenData((prevData) => {
        // Call the function with the previous data to get the updated data
        const result = updatedData(prevData);
        // Mark as modified after update
        markAsModified(maquetteKey);
        return result;
      });
    }
    // Check if updatedData is the entire maquettenData object (for reset functionality)
    else if (
      updatedData &&
      typeof updatedData === "object" &&
      updatedData[`maquette_${maquetteNumber}`]
    ) {
      setMaquettenData(updatedData);
    }
    // Special case: when maquetteNumber is null and updatedData is an object, it's a full data replacement
    else if (
      updatedData &&
      typeof updatedData === "object" &&
      maquetteNumber === null
    ) {
      setMaquettenData(updatedData);
    } else if (
      updatedData &&
      typeof updatedData === "object" &&
      updatedData.type === "deleteMaquette"
    ) {
      // Handle deletion of a maquette
      setMaquettenData((prevData) => {
        const newMaquetteData = { ...prevData };
        const maquetteKey = `maquette_${maquetteNumber}`;
        delete newMaquetteData[maquetteKey];
        // Mark as deleted
        markAsDeleted(maquetteKey);
        return newMaquetteData;
      });
    } else {
      // Normal partial update
      setMaquettenData((prevData) => {
        const newMaquetteData = {
          ...prevData,
          [`maquette_${maquetteNumber}`]: {
            ...prevData[`maquette_${maquetteNumber}`],
            ...updatedData,
          },
        };
        // Mark as modified
        markAsModified(maquetteKey);
        return newMaquetteData;
      });
    }
  };

  const createDefaultMaquetteVehicles = () => {
    // Create space vehicles with proper ID and name based on row/column position (3 columns per row)
    const createSpace = (rowIndex, colIndex, direction) => {
      const positionNumber = rowIndex * 3 + colIndex + 1; // 3 columns per row as per requirements
      return {
        type: "space",
        direction: "straight",
        id: `${direction}_${positionNumber}`,
        name: `S${positionNumber}`,
      };
    };

    return {
      top: {
        vehicles: [
          [createSpace(0, 0, 'top'), createSpace(0, 1, 'top'), createSpace(0, 2, 'top')],
          [createSpace(1, 0, 'top'), createSpace(1, 1, 'top'), createSpace(1, 2, 'top')],
          [createSpace(2, 0, 'top'), createSpace(2, 1, 'top'), createSpace(2, 2, 'top')],
        ],
      },
      bottom: {
        vehicles: [
          [createSpace(0, 0, 'bottom'), createSpace(0, 1, 'bottom'), createSpace(0, 2, 'bottom')],
          [createSpace(1, 0, 'bottom'), createSpace(1, 1, 'bottom'), createSpace(1, 2, 'bottom')],
          [createSpace(2, 0, 'bottom'), createSpace(2, 1, 'bottom'), createSpace(2, 2, 'bottom')],
        ],
      },
      left: {
        vehicles: [
          [createSpace(0, 0, 'left'), createSpace(0, 1, 'left'), createSpace(0, 2, 'left')],
          [createSpace(1, 0, 'left'), createSpace(1, 1, 'left'), createSpace(1, 2, 'left')],
          [createSpace(2, 0, 'left'), createSpace(2, 1, 'left'), createSpace(2, 2, 'left')],
        ],
      },
      right: {
        vehicles: [
          [createSpace(0, 0, 'right'), createSpace(0, 1, 'right'), createSpace(0, 2, 'right')],
          [createSpace(1, 0, 'right'), createSpace(1, 1, 'right'), createSpace(1, 2, 'right')],
          [createSpace(2, 0, 'right'), createSpace(2, 1, 'right'), createSpace(2, 2, 'right')],
        ],
      },
    };
  };

  // Function to create empty maquette vehicles (no vehicles, all spaces)
  const createEmptyMaquetteVehicles = () => {
    // Create space vehicles with proper ID and name based on row/column position (3 columns per row)
    // The direction parameter is used to create IDs like "top_1", "bottom_2", etc.
    const createEmptySpace = (rowIndex, colIndex, direction) => {
      const positionNumber = rowIndex * 3 + colIndex + 1; // 3 columns per row as per requirements
      return {
        type: "space",
        direction: "straight",
        id: `${direction}_${positionNumber}`,
        name: `S${positionNumber}`,
      };
    };

    return {
      top: {
        vehicles: [
          [
            createEmptySpace(0, 0, 'top'),
            createEmptySpace(0, 1, 'top'),
            createEmptySpace(0, 2, 'top'),
          ],
          [
            createEmptySpace(1, 0, 'top'),
            createEmptySpace(1, 1, 'top'),
            createEmptySpace(1, 2, 'top'),
          ],
          [
            createEmptySpace(2, 0, 'top'),
            createEmptySpace(2, 1, 'top'),
            createEmptySpace(2, 2, 'top'),
          ],
        ],
      },
      bottom: {
        vehicles: [
          [
            createEmptySpace(0, 0, 'bottom'),
            createEmptySpace(0, 1, 'bottom'),
            createEmptySpace(0, 2, 'bottom'),
          ],
          [
            createEmptySpace(1, 0, 'bottom'),
            createEmptySpace(1, 1, 'bottom'),
            createEmptySpace(1, 2, 'bottom'),
          ],
          [
            createEmptySpace(2, 0, 'bottom'),
            createEmptySpace(2, 1, 'bottom'),
            createEmptySpace(2, 2, 'bottom'),
          ],
        ],
      },
      left: {
        vehicles: [
          [
            createEmptySpace(0, 0, 'left'),
            createEmptySpace(0, 1, 'left'),
            createEmptySpace(0, 2, 'left'),
          ],
          [
            createEmptySpace(1, 0, 'left'),
            createEmptySpace(1, 1, 'left'),
            createEmptySpace(1, 2, 'left'),
          ],
          [
            createEmptySpace(2, 0, 'left'),
            createEmptySpace(2, 1, 'left'),
            createEmptySpace(2, 2, 'left'),
          ],
        ],
      },
      right: {
        vehicles: [
          [
            createEmptySpace(0, 0, 'right'),
            createEmptySpace(0, 1, 'right'),
            createEmptySpace(0, 2, 'right'),
          ],
          [
            createEmptySpace(1, 0, 'right'),
            createEmptySpace(1, 1, 'right'),
            createEmptySpace(1, 2, 'right'),
          ],
          [
            createEmptySpace(2, 0, 'right'),
            createEmptySpace(2, 1, 'right'),
            createEmptySpace(2, 2, 'right'),
          ],
        ],
      },
    };
  };

  // Helper function to get a number to insert after a given number
  // This implements a sequential numbering system where:
  // - If insertAfterNumber is the last item in the list, increment by 1 (e.g., 010 to 011)
  // - If insertAfterNumber is between existing records, append a digit (e.g., 005 to 0051, then 00511 if needed)
  const getNextSequentialNumber = (insertAfterNumber) => {
    // Get all maquette numbers and sort them alphabetically to determine position
    const allNumbers = Object.keys(maquettenData)
      .map((key) => key.replace("maquette_", ""))
      .sort();

    // Find the position of the insertAfterNumber in the sorted list
    const insertAfterIndex = allNumbers.indexOf(insertAfterNumber);

    if (insertAfterIndex === -1) {
      // If insertAfterNumber doesn't exist in the data, create increment of the highest number
      if (allNumbers.length > 0) {
        const highestNumber = allNumbers[allNumbers.length - 1];
        const nextNumber = (parseInt(highestNumber) + 1)
          .toString()
          .padStart(highestNumber.length, "0");
        return nextNumber;
      } else {
        // No existing records, return default
        return "001";
      }
    }

    if (insertAfterIndex === allNumbers.length - 1) {
      // If insertAfterNumber is the last item in the list, increment by 1
      const nextNumber = (parseInt(insertAfterNumber) + 1)
        .toString()
        .padStart(insertAfterNumber.length, "0");
      return nextNumber;
    } else {
      // If insertAfterNumber is between existing records, generate a number that fits between it and the next number
      const nextNumberInList = allNumbers[insertAfterIndex + 1];

      // Calculate a number that would come alphabetically between insertAfterNumber and nextNumberInList
      // For example, if we have "005" and "006", we might generate "0051"
      // If we have "005" and "0051", we might generate "00501"

      // We'll append digits to create a value alphabetically between the two
      // The simplest approach is to append '1' to create the next sequential value
      const nextNumber = insertAfterNumber + "1";

      return nextNumber;
    }
  };

  // Helper function to generate a new number when adding at end
  const generateNewNumber = () => {
    const allNumbers = Object.keys(maquettenData)
      .map((key) => parseInt(key.split("_")[1]))
      .filter((num) => !isNaN(num))
      .sort((a, b) => a - b);
    return allNumbers.length > 0
      ? allNumbers[allNumbers.length - 1] + 100
      : 100;
  };

  const handleAddMaquette = (
    groupName,
    insertAfterNumber = null,
    maquetteData = {}
  ) => {
    return new Promise((resolve) => {
      let newNumber;

      if (insertAfterNumber === null) {
        // Add at end - find highest number across all maquettes and add gap
        newNumber = generateNewNumber();
      } else {
        // Use the new sequential numbering approach
        newNumber = getNextSequentialNumber(insertAfterNumber);
      }

      const newKey = `maquette_${newNumber}`;

      const vehicleData = createEmptyMaquetteVehicles(); // Use empty vehicles for new maquettes

      const defaultMaquetteData = {
        title: newNumber.toString(),
        roadsize: "S/B",
        groupName: groupName,
        answer: "",
        importantNotes: "",
        notes: "",
        ...vehicleData,
        ...maquetteData,
      };

      setMaquettenData((prev) => {
        const updatedData = {
          ...prev,
          [newKey]: defaultMaquetteData,
        };

        // Mark as new
        markAsNew(newKey);

        // Resolve the promise with information about the new maquette
        resolve({
          newKey: newKey,
          newNumber: newNumber,
          groupName: groupName,
          updatedData: updatedData,
        });

        return updatedData;
      });
    });
  };

  // Helper function to renumber a section to make space for insertion
  const renumberForInsert = (startNum, endNum) => {
    // Find all numbers between startNum and endNum
    const numbersBetween = Object.keys(maquettenData)
      .map((key) => parseInt(key.split("_")[1]))
      .filter((num) => !isNaN(num) && num > startNum && num <= endNum)
      .sort((a, b) => a - b);

    // Adjust the numbers in this range to make space
    // For example, if we have [100, 200] and need to insert between them,
    // we might renumber to [100, 150] giving us space at 125 for the new item
    if (numbersBetween.length === 1) {
      // If there's only one number (the end number), try to find a value between start and end
      const mid = Math.floor((startNum + endNum) / 2);
      if (mid > startNum && mid < endNum) {
        return mid;
      } else {
        // If no integer exists between start and end (like 1 and 2), add a decimal-based approach
        // by using a number that's between them but with higher precision
        // We'll use a value that would be between them if we had more range
        // For close numbers like 1 and 2, add a small increment beyond startNum
        return startNum + 10; // Use a larger increment to avoid conflicts
      }
    } else {
      // If there are multiple numbers in the range, try to find a gap
      for (let i = 0; i < numbersBetween.length - 1; i++) {
        const current = numbersBetween[i];
        const next = numbersBetween[i + 1];
        const mid = Math.floor((current + next) / 2);

        if (mid > current && mid < next) {
          return mid;
        }
      }

      // If no gaps found in the existing numbers, return a value that will fit between
      // the start number and the first number in the range
      if (numbersBetween.length > 0) {
        const firstInBetween = numbersBetween[0];
        const mid = Math.floor((startNum + firstInBetween) / 2);
        if (mid > startNum && mid < firstInBetween) {
          return mid;
        } else {
          // Use a value that's between startNum and firstInBetween, but if there's no integer between them,
          // use a calculated value that avoids conflict
          return (
            startNum + Math.max(10, Math.floor((firstInBetween - startNum) / 2))
          );
        }
      }

      // If no gaps found, expand the range and shift numbers
      // This is a fallback to avoid conflicts - use a value closer to start but not equal to it
      const fallback =
        startNum + Math.max(10, Math.floor((endNum - startNum) / 2));
      if (fallback > startNum && fallback < endNum) {
        return fallback;
      }

      // Ultimate fallback: just add a significant increment to start number to avoid overlap
      return startNum + 100;
    }
  };

  const handleDeleteMaquette = (maquetteNumber) => {
    const maquetteKey = `maquette_${maquetteNumber}`;
    setMaquettenData((prev) => {
      const newMaquetteData = { ...prev };
      delete newMaquetteData[maquetteKey];
      return newMaquetteData;
    });
    // Mark as deleted
    markAsDeleted(maquetteKey);
  };

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    const maquetteDataFormatted = (maquettenDataSrc) => {
      const maquettenDataFormatted = {};
      for (const [key, value] of Object.entries(maquettenDataSrc)) {
        maquettenDataFormatted[key] = transformMaquetteData(value);
      }
      return maquettenDataFormatted;
    };
    if (!isInitialized) {
      try {
        const savedData = localStorage.getItem("maquettenData");
        const savedSyncStatus = localStorage.getItem("maquettenSyncStatus");
        const savedLocallyDeleted = localStorage.getItem("maquettenLocallyDeleted");
        
        if (savedData) {
          let parsedData = JSON.parse(savedData);
          
          // Convert each maquette in the parsed data to 3x3 grid format
          const convertedParsedData = {};
          for (const [key, value] of Object.entries(parsedData)) {
            if (value && typeof value === 'object') {
              convertedParsedData[key] = convertTo3x3Grid(value);
            } else {
              convertedParsedData[key] = value;
            }
          }
          
          // Merge with default data to ensure all default maquettes exist
          const mergedData = { ...maquettenDataSrc, ...convertedParsedData };
          setMaquettenData(maquetteDataFormatted(mergedData));
        } else {
          // If no saved data, initialize with default data
          setMaquettenData(maquetteDataFormatted(maquettenDataSrc));
        }
        
        // Load sync status if available
        if (savedSyncStatus) {
          const parsedSyncStatus = JSON.parse(savedSyncStatus);
          setSyncStatus(parsedSyncStatus);
        }
        
        // Load locally deleted items if available
        if (savedLocallyDeleted) {
          const parsedLocallyDeleted = JSON.parse(savedLocallyDeleted);
          setLocallyDeleted(new Set(parsedLocallyDeleted));
        }
      } catch (error) {
        console.error("Failed to load maquettenData from localStorage:", error);
        setMaquettenData(maquetteDataFormatted(maquettenDataSrc));
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return {
    maquettenData,
    syncStatus,
    locallyDeleted,
    handleDataUpdate,
    handleAddMaquette,
    handleDeleteMaquette,
    markAsModified,
    markAsNew,
    markAsDeleted,
    markAsSynced,
    getModifiedMaquettes,
    getLocallyDeletedMaquettes,
    resetSyncStatus,
    createDefaultMaquetteVehicles,
    isInitialized,
  };
};
