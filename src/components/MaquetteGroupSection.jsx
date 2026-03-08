import { Button, useStore, f7, Sheet } from "framework7-react";
import { useState } from "react";
import MaquetteDisplay from "./MaquetteDisplay";
import { getMaquettesForGroup } from "../js/maquetten.jsx";
import { pageStyles } from "../styles/maquetteStyles";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { useDemoStatus } from "../contexts/DemoStatusContext";
import StepByStepInfoPage from "../f7pages/StepByStepInfoPage.jsx";

const MaquetteGroupSection = ({
  getLayout,
  group,
  maquettenData,
  mode,
  isBookmarked,
  toggleBookmark,
  editMode,
  onDataUpdate,
  setEditMode,
  onAddMaquette,
  maquetteGroups,
  createDefaultMaquetteVehicles,
  setmaquetteEditData,
}) => {
  const { isDemo } = useDemoStatus();
  const authUser = useStore("authUser");
  const [criteriaData, setCriteriaData] = useState(null); // Store criteria data for the sheet

  // `isAdmin` is coarse/global. For school-scoped management, use canManageCurrentSchool.
  const { isAdmin: isAdminStatus, canManageCurrentSchool } = useAdminStatus();

  // Function to handle showing criteria from child components
  const handleCriteriaShow = (criteriaDetail) => {
    setCriteriaData(criteriaDetail);
    // Open the sheet after setting the data
    setTimeout(() => {
      f7.sheet.open(".sheet-step-criteria");
    }, 0);
  };

  // Helper function to check if a maquette has real vehicles (not spaces)
  const checkHasVehicles = (maquette) => {
    if (!maquette) return false;

    const sides = ["top", "bottom", "left", "right"];
    for (const side of sides) {
      const sideData = maquette[side];
      if (sideData && sideData.vehicles) {
        for (const row of sideData.vehicles) {
          if (Array.isArray(row)) {
            for (const vehicle of row) {
              if (vehicle && vehicle.type && vehicle.type !== "space") {
                return true; // Found a non-space vehicle
              }
            }
          }
        }
      }
    }
    return false; // No non-space vehicles found
  };

  // Handle adding a new maquette with all the associated logic
  const handleAddMaquette = async (maquetteNumber, groupId) => {
    const newMaquetteResult = await onAddMaquette(groupId, maquetteNumber);

    if (newMaquetteResult) {
      setTimeout(() => {
        const editButton = document.querySelector(
          `#btn-edit-${newMaquetteResult?.newNumber}`
        );

        if (editButton) {
          editButton.click();
          // Scroll to the newly added maquette
          setTimeout(() => {
            // Find the container element for the newly added maquette
            // MaquetteDisplay has a Card with ID `maquette-${maquetteNumber}`
            const maquetteContainer = document.getElementById(
              `maquette-${newMaquetteResult?.newNumber}`
            );
            if (maquetteContainer) {
              maquetteContainer.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 150); // Slight delay to let the UI update after edit button click
        }
      }, 100); // Small delay to ensure the DOM is updated
    }

    // Log the newly added maquette data for verification
    setTimeout(() => {
      // Find the newly added maquette - it would have the sequential naming like maquette_1_001
      // For sequential additions, we need to look for the pattern
      const allMaquetteNumbers = Object.keys(maquettenData).map((key) => key);

      // Sort to find the most recently added one (sequential ones would be at the end)
      // We'll pick one that most closely matches the insertion pattern
      if (allMaquetteNumbers.length > 0) {
        // Sort keys to find the last added one (which might be a sequential addition)
        const sortedKeys = allMaquetteNumbers.sort();
        const latestMaquetteKey = sortedKeys[sortedKeys.length - 1];
        const latestMaquette = maquettenData[latestMaquetteKey];

        if (latestMaquette && latestMaquette.groupName === groupId) {
          // Check if this maquette has any non-space vehicles
          const hasVehicles = checkHasVehicles(latestMaquette);

          // Log detailed vehicle information
        }
      }
    }, 600); // Slightly after the 500ms edit mode timeout
  };

  // For non-logged-in users, convert maquettenData directly to the format expected by the map function
  // instead of using getMaquettesForGroup which filters by groupName
  let maquettesForGroup;

  // Check if user is logged in (admin or student)
  // For students, check if authUser has an id property
  const isStudent = authUser && authUser.id;
  const isLoggedIn = isAdminStatus || isStudent;

  if (!isLoggedIn && maquettenData) {
    // Non-logged-in user: convert all maquettes to the expected format without filtering
    maquettesForGroup = Object.keys(maquettenData).map((key) => ({
      key,
      maquette: maquettenData[key],
      maquetteNumber: key.replace("maquette_", ""),
    })).sort((a, b) => a.maquetteNumber.localeCompare(b.maquetteNumber));
  } else {
    // Logged-in user: use normal group filtering
    maquettesForGroup = getMaquettesForGroup(group.id, maquettenData, maquetteGroups);
  }

  return (
    <div key={group.id} id={group.id}>
      {/* Maquettes */}
      {maquettesForGroup.map(
        ({ key, maquette, maquetteNumber }, index) => {
          // Determine if this is a demo version based on selected school ID and student ID
          const displayNumber = index + 1; // Use 1-based index for display

          if (isDemo && index > 2) {
            return null;
          }

          return (
            <div key={key}>
              <MaquetteDisplay
                getLayout={getLayout}
                title={displayNumber.toString()}
                subtitle={maquette?.title}
                groupName={maquette?.groupName}
                sequence={maquette?.sequence}
                answer={maquette?.answer}
                importantNotes={maquette?.importantNotes}
                maquetteId={maquette?.id}
                maquetteNumber={maquetteNumber}
                indexMaquette={index}
                mode={mode}
                isBookmarked={isBookmarked}
                toggleBookmark={toggleBookmark}
                setEditMode={setEditMode}
                editMode={editMode}
                onDataUpdate={(updatedData) =>
                  onDataUpdate(updatedData, maquetteNumber)
                }
                maquettenData={maquettenData}
                pageStyles={pageStyles}
                createDefaultMaquetteVehicles={createDefaultMaquetteVehicles}
                setmaquetteEditData={setmaquetteEditData}
                onCriteriaShow={handleCriteriaShow}
              />
              {canManageCurrentSchool && (
                <div style={{ textAlign: "center", margin: "10px 0" }}>
                  <Button
                    large
                    iconF7="plus_circle_fill"
                    color="blue"
                    onClick={async () =>
                      handleAddMaquette(maquetteNumber, group.id)
                    }
                    text="CREATE MAQUETTE"
                  />
                </div>
              )}
            </div>
          );
        }
      )}
      {getMaquettesForGroup(group.id, maquettenData, maquetteGroups).length ==
        0 && (
        <div style={{ textAlign: "center", margin: "10px 0" }}>
          {canManageCurrentSchool && (
            <Button
              large
              iconF7="plus_circle_fill"
              color="blue"
              onClick={async () => handleAddMaquette("1", group.id)}
              text="CREATE MAQUETTE"
            />
          )}
        </div>
      )}

      {/* Step-by-step criteria explanation sheet */}
      <Sheet
        className="sheet-step-criteria"
        style={{ height: "40vh" }}
        onSheetClosed={() => setCriteriaData(null)} // Clear criteria data when sheet closes
      >
        <StepByStepInfoPage
          criteriaData={criteriaData || null}
        />
      </Sheet>

    </div>
  );
};

export default MaquetteGroupSection;
