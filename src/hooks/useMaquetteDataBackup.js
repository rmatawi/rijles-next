import { useState, useEffect } from "react";
import { maquettenData as maquettenDataSrc } from "../js/maquetten.jsx";

export const useMaquetteData = () => {
  const [maquettenData, setMaquettenData] = useState(maquettenDataSrc);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to save to localStorage whenever maquettenData changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("maquettenData", JSON.stringify(maquettenData));
    }
  }, [maquettenData, isInitialized]);

  const handleDataUpdate = (updatedData, maquetteNumber) => {
    // Check if updatedData is the entire maquettenData object (for reset functionality)
    if (
      updatedData &&
      typeof updatedData === "object" &&
      updatedData[`maquette_${maquetteNumber}`]
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
        id: `space_${positionNumber}`,
        name: `S${positionNumber}`,
      };
    };

    return {
      top: {
        vehicles: [
          [createSpace(0, 0), createSpace(0, 1), createSpace(0, 2)],
          [createSpace(1, 0), createSpace(1, 1), createSpace(1, 2)],
          [createSpace(2, 0), createSpace(2, 1), createSpace(2, 2)],
        ],
      },
      bottom: {
        vehicles: [
          [createSpace(0, 0), createSpace(0, 1), createSpace(0, 2)],
          [createSpace(1, 0), createSpace(1, 1), createSpace(1, 2)],
          [createSpace(2, 0), createSpace(2, 1), createSpace(2, 2)],
        ],
      },
      left: {
        vehicles: [
          [createSpace(0, 0), createSpace(0, 1), createSpace(0, 2)],
          [createSpace(1, 0), createSpace(1, 1), createSpace(1, 2)],
          [createSpace(2, 0), createSpace(2, 1), createSpace(2, 2)],
        ],
      },
      right: {
        vehicles: [
          [createSpace(0, 0), createSpace(0, 1), createSpace(0, 2)],
          [createSpace(1, 0), createSpace(1, 1), createSpace(1, 2)],
          [createSpace(2, 0), createSpace(2, 1), createSpace(2, 2)],
        ],
      },
    };
  };

  // Helper function to get the next sequential number after insertAfterNumber
  const getNextSequentialNumber = (insertAfterNumber) => {
    // Find all existing maquettes that follow this pattern for the target number
    const targetPattern = new RegExp(`^maquette_${insertAfterNumber}_(\\d+)$`);
    const existingSequentialNumbers = Object.keys(maquettenData)
      .filter((key) => targetPattern.test(key))
      .map((key) => {
        const match = key.match(targetPattern);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a); // Sort in descending order to get the highest number first

    if (existingSequentialNumbers.length > 0) {
      // If there are existing sequential numbers, use the next one
      const highestSeqNumber = existingSequentialNumbers[0];
      const nextNumber = `${insertAfterNumber}_${String(
        highestSeqNumber + 1
      ).padStart(3, "0")}`;
      return nextNumber;
    } else {
      // If no sequential numbers exist yet, start with _001
      const nextNumber = `${insertAfterNumber}_001`;
      return nextNumber;
    }
  };

  const handleAddMaquette = (
    groupName,
    insertAfterNumber = null,
    maquetteData = {}
  ) => {
    let newNumber;

    if (insertAfterNumber === null) {
      // Add at end - find highest number across all maquettes and add gap
      const allNumbers = Object.keys(maquettenData)
        .map((key) => parseInt(key.split("_")[1]))
        .filter((num) => !isNaN(num))
        .sort((a, b) => a - b);
      newNumber =
        allNumbers.length > 0 ? allNumbers[allNumbers.length - 1] + 100 : 100;
    } else {
      // Use the new sequential numbering approach
      newNumber = getNextSequentialNumber(insertAfterNumber);
    }

    const newKey = `maquette_${newNumber}`;

    const vehicleData = createDefaultMaquetteVehicles();

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

      return updatedData;
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
    setMaquettenData((prev) => {
      const newMaquetteData = { ...prev };
      const maquetteKey = `maquette_${maquetteNumber}`;
      delete newMaquetteData[maquetteKey];
      return newMaquetteData;
    });
  };

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      try {
        const savedData = localStorage.getItem("maquettenData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Merge with default data to ensure all default maquettes exist
          const mergedData = { ...maquettenDataSrc, ...parsedData };
          setMaquettenData(mergedData);
        } else {
          // If no saved data, initialize with default data
          setMaquettenData(maquettenDataSrc);
        }
      } catch (error) {
        console.error("Failed to load maquettenData from localStorage:", error);
        setMaquettenData(maquettenDataSrc);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return {
    maquettenData,
    handleDataUpdate,
    handleAddMaquette,
    handleDeleteMaquette,
    createDefaultMaquetteVehicles,
  };
};
