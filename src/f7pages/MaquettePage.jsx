import {
  Navbar,
  Page,
  Toolbar,
  NavRight,
  Button,
  Sheet,
  Icon,
  f7,
  NavTitle,
  NavLeft,
  useStore,
  Fab,
} from "framework7-react";
import { useState, useEffect, useCallback } from "react";
import { useBookmarks } from "../hooks/useBookmarks";
import { getLayout, isLocalhost, isSuperAdmin } from "../js/utils";
import { useMaquetteData } from "../hooks/useMaquetteData";
import { useMaquetteGroups } from "../contexts/MaquetteGroupsContext";
import { maquetteService } from "../services/maquetteService";
import MaquetteSidePanel from "../components/MaquetteSidePanel";
import MaquetteGroupSection from "../components/MaquetteGroupSection";
import MaquetteEdit from "../components/MaquetteEdit.jsx";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { useStudentStatus } from "../contexts/StudentStatusContext.jsx";
import Abbreviations from "../components/Abbreviations.jsx";
import MaquetteIntro from "../components/MaquetteIntro.jsx";
import Manual from "../components/Manual.jsx";
import FreeTrialSignupPromo from "../components/FreeTrialSignupPromo";
import TrafficRulesSheet from "../components/TrafficRulesSheet.jsx";
import ReferralCard from "../components/ReferralCard";
import { resolveCurrentSchoolId } from "../utils/currentSchool";
import { SEO } from "../js/seoUtils";
import NavHomeButton from "../components/NavHomeButton";
import LocalAdPlaceholder from "../components/LocalAdPlaceholder";

const MaquettePage = () => {
  const debugLog = () => {};
  const authUser = useStore("authUser");
  const isRayerApp = process.env.VITE_REACT_APP_TITLE === "Rayer";
  const [mode, setMode] = useState("study"); // "study" or "test"
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({});
  const [chapterIndex, setChapterIndex] = useState(0);
  const [activeSection, setActiveSection] = useState();
  const [showContinuous, setShowContinuous] = useState(false); // Toggle for continuous display
  const [manualNavTitle, setManualNavTitle] = useState({
    title: "",
    subtitle: "",
  });
  const handleManualActiveSectionChange = useCallback((title, subtitle) => {
    const nextTitle = title || "";
    const nextSubtitle = subtitle || "";

    setManualNavTitle((previous) => {
      if (
        previous.title === nextTitle &&
        previous.subtitle === nextSubtitle
      ) {
        return previous;
      }

      return {
        title: nextTitle,
        subtitle: nextSubtitle,
      };
    });
  }, []);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const {
    maquettenData,
    handleDataUpdate,
    handleAddMaquette,
    markAsModified,
    getLocallyDeletedMaquettes,
    getModifiedMaquettes,
    resetSyncStatus,
    createDefaultMaquetteVehicles,
    isInitialized,
  } = useMaquetteData();
  const { maquetteGroups } = useMaquetteGroups();
  const adminContext = useAdminStatus();
  const studentContext = useStudentStatus();
  const isAdminStatus = adminContext.isAdmin;
  const canManageCurrentSchool = adminContext.canManageCurrentSchool;
  const isStudentStatus = studentContext.isStudent;
  const [maquetteEditData, setmaquetteEditData] = useState({
    groupName: null,
    sequence: null,
    answer: null,
    importantNotes: null,
    maquetteNumber: null,
    onDataUpdate: null,
    pageStyles: null,
    maquettenData: null,
    createDefaultMaquetteVehicles: null,
  });

  useEffect(() => {
    const items = getNavigationItems();
    const currentItem = items.find((item, index) => index === 0);

    if (currentItem) {
      setActiveSection(currentItem.id);
      // Find the actual group object from maquetteGroups based on the active section
      const group = maquetteGroups.find((group) => group.id === currentItem.id);
      setCurrentGroup(group || {});
    }
  }, [maquetteGroups]); // Add maquetteGroups as dependency since we're using it in this effect

  // Handle URL scrolling and bookmark navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToId = urlParams.get("scrollTo");
    const maquetteId = urlParams.get("id"); // Handle direct maquette ID parameter

    // If there's a direct maquette ID parameter but no page parameter (which would go to single-maquette page),
    // this might happen for backward compatibility or direct links - handle appropriately
    if (maquetteId && !scrollToId) {
      // Find the maquette by ID and determine its number for scrolling
      const maquetteEntry = Object.values(maquettenData || {}).find(
        (item) => item.id === maquetteId,
      );

      if (maquetteEntry) {
        // Extract the maquette number from the key
        const maquetteKey = Object.keys(maquettenData).find(
          (key) => maquettenData[key].id === maquetteId,
        );

        if (maquetteKey) {
          const maquetteNumber = maquetteKey.replace("maquette_", "");
          const scrollToElementId = `maquette-${maquetteNumber}`;

          // Find which group this maquette belongs to
          if (maquetteEntry.groupName) {
            // Activate the correct group section
            setActiveSection(maquetteEntry.groupName);
          }

          // Scroll to the element using requestAnimationFrame to avoid forced reflows
          if (typeof window !== "undefined") {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const element = document.getElementById(scrollToElementId);
                if (element) {
                  // Use immediate scroll to avoid triggering layout thrashing
                  element.scrollIntoView({ behavior: "auto", block: "center" });
                }
              }, 100); // Reduced delay
            });
          }
        }
      }
    } else if (scrollToId) {
      // Check if this is a maquette bookmark
      if (scrollToId.startsWith("maquette-")) {
        const maquetteNumber = scrollToId.replace("maquette-", "");

        // Find which group this maquette belongs to
        const maquetteKey = `maquette_${maquetteNumber}`;
        const maquetteData = maquettenData[maquetteKey];

        if (maquetteData && maquetteData.groupName) {
          // Activate the correct group section
          setActiveSection(maquetteData.groupName);
        }
      }

      // Scroll to the element using requestAnimationFrame to avoid forced reflows
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const element = document.getElementById(scrollToId);
            if (element) {
              // Use immediate scroll to avoid triggering layout thrashing
              element.scrollIntoView({ behavior: "auto", block: "center" });
            }
          }, 100); // Reduced delay
        });
      }
    }
  }, [maquettenData]);

  // State to track if we've logged the status once
  const [hasLoggedStatus, setHasLoggedStatus] = useState(false);
  // State to track if admin sync has already been performed to prevent multiple calls
  const [adminSyncCompleted, setAdminSyncCompleted] = useState(false);

  // Automatically sync with database when page loads and user is admin
  useEffect(() => {
    debugLog("MaquettePage: useEffect triggered - ADMIN SYNC", {
      isAdminStatus,
      isStudentStatus,
      isInitialized,
      hasLoggedStatus,
      adminSyncCompleted,
    });

    // Only log once when the status is first determined
    if (!hasLoggedStatus) {
      debugLog({ isAdminStatus, isStudentStatus });
      setHasLoggedStatus(true);
    }

    if (
      (isAdminStatus || isStudentStatus) &&
      isInitialized &&
      !adminSyncCompleted
    ) {
      const autoSync = async () => {
        debugLog("MaquettePage: Starting auto sync operation");
        try {
          // Check if there are any unsaved changes before syncing from database
          const modifiedMaquettes = getModifiedMaquettes();
          const locallyDeletedMaquettes = getLocallyDeletedMaquettes();

          debugLog("MaquettePage: Check sync status", {
            modifiedMaquettesCount: modifiedMaquettes.length,
            locallyDeletedMaquettesCount: locallyDeletedMaquettes.length,
          });

          if (
            modifiedMaquettes.length > 0 ||
            locallyDeletedMaquettes.length > 0
          ) {
            console.warn(
              "There are unsaved changes. Skipping automatic sync from database.",
            );
            return;
          }

          const schoolId = getSchoolId();
          if (!schoolId) {
            console.warn("No school ID found for sync");
            return;
          }

          debugLog(
            "MaquettePage: About to make API call for schoolId:",
            schoolId,
          );
          const { data: dbMaquettes, error: maquetteError } =
            await maquetteService.getMaquettesBySchoolId(schoolId);

          if (maquetteError) {
            console.error(
              `Error getting maquettes for school ${schoolId}:`,
              maquetteError,
            );
            return;
          }

          debugLog(
            "MaquettePage: API call successful, received",
            dbMaquettes.length,
            "maquettes",
          );

          // Transform the database data to match the expected format
          const transformedData = {};
          for (const record of dbMaquettes) {
            transformedData[record.name] = {
              ...record.maquette,
              id: record.id, // Add the database ID to the maquette object
            };
          }

          // Only update if the data has actually changed to prevent loop
          const currentMaquettenData = localStorage.getItem("maquettenData");
          const currentData = currentMaquettenData
            ? JSON.parse(currentMaquettenData)
            : {};

          // Check if the data is actually different before updating
          const isDataDifferent =
            JSON.stringify(currentData) !== JSON.stringify(transformedData);

          if (isDataDifferent) {
            debugLog(
              "MaquettePage: Data has changed, updating local state with new data",
            );
            // Update both local storage and component state with fresh data
            localStorage.setItem(
              "maquettenData",
              JSON.stringify(transformedData),
            );

            // Use the handleDataUpdate function with the entire data object to replace the state
            // This will replace all maquettenData with the fresh data from the database
            handleDataUpdate(transformedData, null);

            // Also reset sync status as we just loaded fresh data
            resetSyncStatus();
            debugLog("MaquettePage: Auto sync completed successfully");
          } else {
            debugLog(
              "MaquettePage: Data is the same, skipping update to prevent loop",
            );
          }

          // Mark sync as completed to prevent multiple executions
          setAdminSyncCompleted(true);
        } catch (error) {
          console.error("Error during automatic sync on page load:", error);
        }
      };

      // Add a small delay to ensure other initialization is complete
      const timer = setTimeout(autoSync, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isAdminStatus,
    isStudentStatus,
    isInitialized,
    adminSyncCompleted,
    getModifiedMaquettes,
    getLocallyDeletedMaquettes,
    hasLoggedStatus, // Add this to the dependency array
    setHasLoggedStatus,
  ]); // Only run when admin status is determined and data is initialized

  // State to track if we've logged the status once for the non-admin case
  const [hasLoggedNonAdminStatus, setHasLoggedNonAdminStatus] = useState(false);
  // State to track if non-admin sync has already been performed to prevent multiple calls
  const [nonAdminSyncCompleted, setNonAdminSyncCompleted] = useState(false);

  // Automatically sync with database to get first 5 records when user is neither admin nor student
  useEffect(() => {
    // Only log once when the status is first determined for non-admin users
    if (!hasLoggedNonAdminStatus && !isAdminStatus && !isStudentStatus) {
      debugLog({ isAdminStatus, isStudentStatus });
      setHasLoggedNonAdminStatus(true);
    }

    if (
      !isAdminStatus &&
      !isStudentStatus &&
      isInitialized &&
      !nonAdminSyncCompleted
    ) {
      const fetchFirstFive = async () => {
        try {
          // Check if there are any unsaved changes before syncing from database
          const modifiedMaquettes = getModifiedMaquettes();
          const locallyDeletedMaquettes = getLocallyDeletedMaquettes();

          if (
            modifiedMaquettes.length > 0 ||
            locallyDeletedMaquettes.length > 0
          ) {
            console.warn(
              "There are unsaved changes. Skipping automatic sync from database.",
            );
            return;
          }

          const { data: dbMaquettes, error: maquetteError } =
            await maquetteService.getFirstFiveMaquettes();

          if (maquetteError) {
            console.error("Error getting first 5 maquettes:", maquetteError);
            return;
          }

          // Transform the database data to match the expected format
          const transformedData = {};
          for (const record of dbMaquettes) {
            transformedData[record.name] = {
              ...record.maquette,
              id: record.id, // Add the database ID to the maquette object
            };
          }

          // Only update if the data has actually changed to prevent loop
          const currentMaquettenData = localStorage.getItem("maquettenData");
          const currentData = currentMaquettenData
            ? JSON.parse(currentMaquettenData)
            : {};

          // Check if the data is actually different before updating
          const isDataDifferent =
            JSON.stringify(currentData) !== JSON.stringify(transformedData);

          if (isDataDifferent) {
            // Update both local storage and component state with fresh data
            localStorage.setItem(
              "maquettenData",
              JSON.stringify(transformedData),
            );

            // Use the handleDataUpdate function with the entire data object to replace the state
            // This will replace all maquettenData with the fresh data from the database
            handleDataUpdate(transformedData, null);

            // Also reset sync status as we just loaded fresh data
            resetSyncStatus();
          }

          // Mark sync as completed to prevent multiple executions
          setNonAdminSyncCompleted(true);
        } catch (error) {
          console.error(
            "Error during automatic sync of first 5 records on page load:",
            error,
          );
        }
      };

      // Add a small delay to ensure other initialization is complete
      const timer = setTimeout(fetchFirstFive, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isAdminStatus,
    isStudentStatus,
    isInitialized,
    nonAdminSyncCompleted,
    getModifiedMaquettes,
    getLocallyDeletedMaquettes,
    hasLoggedNonAdminStatus, // Add this to the dependency array
    setHasLoggedNonAdminStatus,
  ]); // Only run when neither admin nor student status and data is initialized

  // Function to get school ID
  const getSchoolId = () => {
    return resolveCurrentSchoolId();
  };

  // Push edited data to database
  const pushToDatabase = async () => {
    debugLog("MaquettePage: pushToDatabase function called");
    if (!canManageCurrentSchool) {
      f7.toast.show({
        text: "Je hebt geen beheertoegang voor de huidige rijschool.",
      });
      return;
    }

    if (isStudentStatus) {
      f7.toast.show({ text: "Student accounts cannot sync to the database." });
      return;
    }
    // Show preloader before starting the sync operation
    f7.preloader.show();

    try {
      const schoolId = getSchoolId();
      if (!schoolId) {
        f7.toast.show({ text: "No school selected for sync" });
        f7.preloader.hide();
        return;
      }

      debugLog(
        "MaquettePage: Getting all maquettes from database to compare with local state",
      );
      // Get all maquettes from the database to compare with local state
      const { data: allDbMaquettes, error: maquetteError } =
        await maquetteService.getMaquettesBySchoolId(schoolId);

      if (maquetteError) {
        console.error(
          `Error getting maquettes for school ${schoolId}:`,
          maquetteError,
        );
        throw new Error(maquetteError.message);
      }

      const dbMaquettesMap = new Map(allDbMaquettes.map((m) => [m.name, m]));

      // Handle deletions first
      const locallyDeletedMaquettes = getLocallyDeletedMaquettes();
      for (const maquetteKey of locallyDeletedMaquettes) {
        const dbMaquette = dbMaquettesMap.get(maquetteKey);
        if (dbMaquette) {
          debugLog(
            `MaquettePage: Deleting maquette ${maquetteKey} from database`,
          );
          // Delete from database
          await maquetteService.deleteMaquette(dbMaquette.id);
        } else {
          debugLog(
            `Maquette ${maquetteKey} not found in database, skipping deletion`,
          );
        }
      }

      // Get only the modified maquettes to sync
      const modifiedMaquettes = getModifiedMaquettes();

      // Process additions and updates - only for modified maquettes
      let hasChanges = false;

      // Process local maquettes (additions and updates) - only process modified ones
      for (const key of modifiedMaquettes) {
        const maquette = maquettenData[key];
        if (!maquette) continue; // Skip if maquette doesn't exist in current data

        // Create a clean maquette object without the id field if it exists
        const cleanMaquette = { ...maquette };
        delete cleanMaquette.id; // Remove the id since it's stored in the database record, not in the JSON

        const existingDbMaquette = dbMaquettesMap.get(key);

        if (existingDbMaquette) {
          debugLog(
            `MaquettePage: Updating existing maquette ${key} in database`,
          );
          // Update existing maquette record in database
          const updateResult = await maquetteService.updateMaquette(
            existingDbMaquette.id,
            {
              maquette: cleanMaquette,
              updated_at: new Date().toISOString(),
            },
          );
          if (updateResult.error) {
            throw new Error(updateResult.error.message);
          }
        } else {
          debugLog(`MaquettePage: Creating new maquette ${key} in database`);
          // Insert new maquette record directly linked to the school
          const insertResult = await maquetteService.createMaquette({
            driving_school_id: schoolId, // Associate directly with the school
            name: key,
            maquette: cleanMaquette,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertResult.error) {
            console.error(
              `Error inserting maquette ${key}:`,
              insertResult.error,
            );
            throw new Error(insertResult.error.message);
          }
        }

        hasChanges = true;
      }

      // If no changes were made, notify user
      if (!hasChanges && locallyDeletedMaquettes.length === 0) {
        f7.toast.show({ text: "No changes to sync" });
        f7.preloader.hide();
        return;
      }

      debugLog("MaquettePage: Refreshing local data after sync");
      // Refresh the local data after sync
      const { data: finalDbMaquettes, error: finalError } =
        await maquetteService.getMaquettesBySchoolId(schoolId);

      if (finalError) {
        throw new Error(finalError.message);
      }

      // Transform the data back to the original format
      const transformedData = {};
      for (const record of finalDbMaquettes) {
        transformedData[record.name] = {
          ...record.maquette,
          id: record.id, // Add the database ID to the maquette object
        };
      }

      // Update both local storage and component state
      localStorage.setItem("maquettenData", JSON.stringify(transformedData));

      // Update React state with fresh database data
      handleDataUpdate(transformedData, null);

      // Reset sync status after successful sync
      resetSyncStatus();

      f7.toast.show({ text: "Changes successfully synced to database" });

      // Hide preloader after successful completion
      f7.preloader.hide();
      debugLog("MaquettePage: pushToDatabase completed successfully");
    } catch (error) {
      console.error("Error syncing to database:", error);
      // Hide preloader in case of error too
      f7.preloader.hide();
      f7.toast.show({
        text: "Error syncing changes to database: " + error.message,
      });
    }
  };

  // Refresh data from database
  const refreshFromDatabase = async () => {
    debugLog("MaquettePage: refreshFromDatabase function called");
    f7.preloader.show();

    try {
      // Check if there are any unsaved changes before refreshing
      const modifiedMaquettes = getModifiedMaquettes();
      const locallyDeletedMaquettes = getLocallyDeletedMaquettes();

      if (modifiedMaquettes.length > 0 || locallyDeletedMaquettes.length > 0) {
        f7.preloader.hide();
        f7.dialog.confirm(
          "Je hebt niet-opgeslagen wijzigingen. Als je nu vernieuwt, gaan deze wijzigingen verloren. Wil je doorgaan?",
          "Niet-opgeslagen Wijzigingen",
          async () => {
            // User confirmed - proceed with refresh
            await performRefresh();
          },
          () => {
            // User cancelled
            debugLog("User cancelled refresh due to unsaved changes");
          },
        );
      } else {
        // No unsaved changes, proceed directly
        await performRefresh();
      }
    } catch (error) {
      console.error("Error refreshing from database:", error);
      f7.preloader.hide();
      f7.toast.show({
        text: "Error vernieuwen van database: " + error.message,
        position: "center",
      });
    }
  };

  // Helper function to perform the actual refresh
  const performRefresh = async () => {
    try {
      let dbMaquettes;
      let maquetteError;

      // Check if user has full access (admin or student)
      if (isAdminStatus || isStudentStatus) {
        const schoolId = getSchoolId();
        if (!schoolId) {
          f7.toast.show({
            text: "Geen school geselecteerd",
            position: "center",
          });
          f7.preloader.hide();
          return;
        }

        debugLog(
          "MaquettePage: Fetching all data from database for schoolId:",
          schoolId,
        );

        // Fetch all maquettes for admin/student users
        const result = await maquetteService.getMaquettesBySchoolId(schoolId);
        dbMaquettes = result.data;
        maquetteError = result.error;
      } else {
        debugLog(
          "MaquettePage: Fetching first 5 maquettes from database (limited access)",
        );

        // Fetch only first 5 maquettes for users without full access
        const result = await maquetteService.getFirstFiveMaquettes();
        dbMaquettes = result.data;
        maquetteError = result.error;
      }

      if (maquetteError) {
        throw new Error(maquetteError.message);
      }

      debugLog(
        "MaquettePage: Received",
        dbMaquettes.length,
        "maquettes from database",
      );

      // Transform the database data
      const transformedData = {};
      for (const record of dbMaquettes) {
        transformedData[record.name] = {
          ...record.maquette,
          id: record.id,
        };
      }

      // Update localStorage
      localStorage.setItem("maquettenData", JSON.stringify(transformedData));

      // Update React state
      handleDataUpdate(transformedData, null);

      // Reset sync status
      resetSyncStatus();

      f7.preloader.hide();
      f7.toast.show({
        text: "Data succesvol vernieuwd van database",
        position: "center",
      });
      debugLog("MaquettePage: refreshFromDatabase completed successfully");
    } catch (error) {
      f7.preloader.hide();
      throw error;
    }
  };

  // Handle sync button click with confirmation
  const handleSyncClick = () => {
    f7.dialog
      .create({
        title: "Sync naar Database",
        text: "Bent u zeker dat u de aanpassingen wilt opslaan?",
        buttons: [
          {
            text: "Nee",
            onClick: () => {
              refreshFromDatabase();
            },
          },
          {
            text: "Ja",
            bold: true,
            onClick: () => {
              pushToDatabase();
            },
          },
        ],
      })
      .open();
  };

  // Effect to track maquette additions
  useEffect(() => {}, [maquettenData]);

  // Enhanced handleDataUpdate that marks as modified
  const enhancedHandleDataUpdate = (updatedData, maquetteNumber) => {
    const maquetteKey = `maquette_${maquetteNumber}`;

    // Only mark as modified if this is not a deletion
    if (
      !(
        updatedData &&
        typeof updatedData === "object" &&
        updatedData.type === "deleteMaquette"
      )
    ) {
      markAsModified(maquetteKey);
    }

    handleDataUpdate(updatedData, maquetteNumber);
  };

  // Enhanced handleAddMaquette that marks as modified and enables edit mode
  const enhancedHandleAddMaquette = async (
    groupName,
    insertAfterNumber = null,
    maquetteData = {},
  ) => {
    try {
      const result = await handleAddMaquette(
        groupName,
        insertAfterNumber,
        maquetteData,
      );

      // Enable edit mode after 500ms
      setTimeout(() => {
        setEditMode(true);
      }, 500);

      if (result) {
        return result;
      }
    } catch (error) {
      console.error("HandleAddMaquette failed:", error);
    }

    // The new maquette will be marked as modified when it's first added
    // We'll mark it after it's created in the useEffect below
  };

  // Function to get the current group object by section ID

  // Get navigation items array
  const getNavigationItems = () => {
    const items = [
      ...maquetteGroups.map((group) => ({
        id: group.id,
        title: group.title,
        icon: group.icon,
      })),
    ];

    return items;
  };

  // Get current index in navigation
  const getCurrentNavigationIndex = () => {
    const items = getNavigationItems();
    const currentActiveSection =
      activeSection || (items.length > 0 ? items[0].id : 1);
    return items.findIndex((item) => item.id === currentActiveSection);
  };

  // Navigate to previous section
  const goToPreviousSection = () => {
    const items = getNavigationItems();
    const currentIndex = getCurrentNavigationIndex() || 0;
    const currentItem = items[currentIndex - 1];
    const group = maquetteGroups.find((group) => group.id === currentItem.id);
    if (currentIndex > 0) {
      setChapterIndex(currentIndex - 1);
      setActiveSection(currentItem.id);
      setCurrentGroup(group);
    }
  };

  // Navigate to next section
  const goToNextSection = () => {
    const items = getNavigationItems();
    const currentIndex = getCurrentNavigationIndex() || 0;
    const currentItem = items[currentIndex + 1];
    const group = maquetteGroups.find((group) => group.id === currentItem.id);
    if (currentIndex < items.length - 1) {
      setChapterIndex(currentIndex + 1);
      setActiveSection(currentItem.id);
      setCurrentGroup(group);
    }
  };

  // Get current section title
  const getCurrentSectionTitle = () => {
    const items = getNavigationItems();
    const currentActiveSection =
      activeSection || (items.length > 0 ? items[0].id : "");
    const currentItem = items.find((item) => item.id === currentActiveSection);
    if (currentItem?.title === "Handleiding" && manualNavTitle.title) {
      return manualNavTitle.title;
    }
    return currentItem ? currentItem.title : "Unknown";
  };

  const getCurrentSectionSubtitle = () => {
    const items = getNavigationItems();
    const currentActiveSection =
      activeSection || (items.length > 0 ? items[0].id : "");
    const currentItem = items.find((item) => item.id === currentActiveSection);
    if (currentItem?.title === "Handleiding") {
      return manualNavTitle.subtitle || "";
    }
    return "";
  };

  // Check if we can go to previous/next
  const canGoPrevious = getCurrentNavigationIndex() > 0;
  const canGoNext =
    getCurrentNavigationIndex() < getNavigationItems().length - 1;
  const adInterval = 3;

  const renderMaquetteGroupWithAds = (group, filteredMaquetteData) => {
    const entries = Object.entries(filteredMaquetteData || {});

    if (entries.length <= adInterval) {
      return (
        <MaquetteGroupSection
          key={group.id}
          getLayout={getLayout}
          group={group}
          maquettenData={filteredMaquetteData}
          mode={mode}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          editMode={editMode}
          onDataUpdate={enhancedHandleDataUpdate}
          onAddMaquette={enhancedHandleAddMaquette}
          setEditMode={setEditMode}
          maquetteGroups={maquetteGroups}
          createDefaultMaquetteVehicles={createDefaultMaquetteVehicles}
          setmaquetteEditData={setmaquetteEditData}
        />
      );
    }

    const chunks = [];
    for (let i = 0; i < entries.length; i += adInterval) {
      chunks.push(Object.fromEntries(entries.slice(i, i + adInterval)));
    }

    return chunks.map((chunkData, chunkIndex) => (
      <div key={`${group.id}-chunk-${chunkIndex}`}>
        <MaquetteGroupSection
          getLayout={getLayout}
          group={group}
          maquettenData={chunkData}
          mode={mode}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          editMode={editMode}
          onDataUpdate={enhancedHandleDataUpdate}
          onAddMaquette={enhancedHandleAddMaquette}
          setEditMode={setEditMode}
          maquetteGroups={maquetteGroups}
          createDefaultMaquetteVehicles={createDefaultMaquetteVehicles}
          setmaquetteEditData={setmaquetteEditData}
        />
        {chunkIndex < chunks.length - 1 && (
          <LocalAdPlaceholder
            adSlot="maquette"
            headline="Lokale advertentie"
            description="Advertentieplek na elke 3 maquettes."
            ctaLabel="Bekijk adverteerpakketten"
            style={{ marginTop: "8px", marginBottom: "14px" }}
          />
        )}
      </div>
    ));
  };

  return (
    <Page name="maquette" id="maquette-page" className="page-neu">
      <SEO page="maquette" />
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <span>{getCurrentSectionTitle()}</span>
            {getCurrentSectionSubtitle() && (
              <span
                style={{
                  paddingTop: "3px",
                  paddingLeft: "10px",
                  fontSize: "0.9rem",
                  opacity: 0.72,
                  fontWeight: 500,
                }}
              >
                {getCurrentSectionSubtitle()}
              </span>
            )}
          </div>
        </NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", cursor: "pointer" }}
            onClick={() => {
              f7.sheet.open("#maquette-chapters-sheet");
            }}
          >
            <Icon f7="bars" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      <Fab
        position="right-bottom"
        slot="fixed"
        className="fab-round"
        onClick={() => {
          const topAnchor = document.getElementById("maquette-top-anchor");
          if (topAnchor) {
            topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        <Icon f7="chevron_up" />
      </Fab>

      <div>
        <MaquetteSidePanel
          canManageCurrentSchool={canManageCurrentSchool}
          onNavigate={(sectionId) => {
            setActiveSection(sectionId);
            // Find the group that matches the selected section ID
            const group = maquetteGroups.find(
              (group) => group.id === sectionId,
            );
            if (group) {
              // Find the navigation items to get the correct index
              const items = getNavigationItems();
              const targetIndex = items.findIndex(
                (item) => item.id === sectionId,
              );
              if (targetIndex !== -1) {
                setChapterIndex(targetIndex);
                setCurrentGroup(group);
              }
            }
          }}
          onPushToDatabase={pushToDatabase}
        />

        {/* Maquettes based on active section */}
        <div>
          <div
            id="maquette-top-anchor"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              overflow: "hidden",
            }}
          />

          {showContinuous
            ? // Display all maquettes continuously, grouped by their actual groups
              maquetteGroups.map((group) => {
                // Filter maquettenData to only include elements where element.groupName matches the group
                let filteredMaquettenData = {};
                if (maquettenData) {
                  // For non-logged-in users, show ALL maquettes under the first group
                  if (
                    !isAdminStatus &&
                    !isStudentStatus &&
                    group === maquetteGroups[0]
                  ) {
                    filteredMaquettenData = maquettenData;
                  } else if (!isAdminStatus && !isStudentStatus) {
                    // For subsequent groups in continuous view, show nothing for non-logged-in users
                    filteredMaquettenData = {};
                  } else {
                    // For logged-in users, filter by group as usual
                    Object.keys(maquettenData).forEach((key) => {
                      const maquette = maquettenData[key];
                      if (maquette.groupName === group.id) {
                        filteredMaquettenData[key] = maquette;
                      }
                    });
                  }
                }

                return (
                  <div key={group.name}>
                    <h1>{group.name}</h1>
                    <Manual
                      setmaquetteEditData={setmaquetteEditData}
                      onActiveSectionChange={handleManualActiveSectionChange}
                    />
                    {renderMaquetteGroupWithAds(group, filteredMaquettenData)}
                  </div>
                );
              })
            : // Display only the active section/group
              activeSection &&
              (() => {
                // For non-logged-in users (non-admin, non-student), show ALL maquettes without filtering by group
                // This ensures they see the first 5 maquettes fetched from the database
                let filteredMaquettenData = {};

                if (currentGroup && maquettenData) {
                  // If user is not admin and not student, show ALL maquettes without group filtering
                  if (!isAdminStatus && !isStudentStatus) {
                    filteredMaquettenData = maquettenData;
                  } else {
                    // For logged-in users (admin or student), filter by group as usual
                    // Loop through each maquette in maquettenData
                    Object.keys(maquettenData).forEach((key) => {
                      const maquette = maquettenData[key];

                      // Check if the maquette's groupName matches the currentGroup's id or title
                      if (maquette.groupName === currentGroup.id) {
                        filteredMaquettenData[key] = maquette;
                      }
                    });
                  }
                }

                return (
                  <div key={currentGroup.id}>
                    {currentGroup.title === "Basics" && !isRayerApp && (
                      <Manual
                        setmaquetteEditData={setmaquetteEditData}
                        onActiveSectionChange={handleManualActiveSectionChange}
                      />
                    )}
                    {currentGroup.title === "Handleiding" && isRayerApp && (
                      <Manual
                        setmaquetteEditData={setmaquetteEditData}
                        onActiveSectionChange={handleManualActiveSectionChange}
                      />
                    )}
                    {currentGroup.title !== "Handleiding" &&
                      currentGroup.title !== "Basics" && (
                      renderMaquetteGroupWithAds(
                        currentGroup,
                        filteredMaquettenData,
                      )
                    )}
                  </div>
                );
              })()}
        </div>

        {(() => {
          const shouldShowPromoSection = !isAdminStatus;

          return shouldShowPromoSection ? (
            <div style={{ padding: "0 16px", marginBottom: "16px" }}>
              {/* Check if user has trial access (isTrial flag exists) */}
              {(() => {
                if (!isStudentStatus) {
                  // Show free trial signup promotion for visitors
                  return (
                    <FreeTrialSignupPromo description="Start vandaag met leren voor je rijexamen. Krijg direct toegang tot al ons lesmateriaal." />
                  );
                } else {
                  // Show share & earn promotion for all students
                  return (
                    <ReferralCard
                      variant="pink"
                      subtitle="Deel deze app met vrienden en krijg extra dagen gratis toegang! Voor elke vriend die zich aanmeldt, krijg jij meer leertijd."
                      onClick="/referral"
                      style={{ textAlign: "center" }}
                    />
                  );
                }
              })()}
            </div>
          ) : null;
        })()}

        {/* Next Chapter Button - hide when in continuous display mode */}
        {!showContinuous && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            {canGoPrevious && (
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  goToPreviousSection();
                  setTimeout(() => {
                    requestAnimationFrame(() => {
                      const topElement = document.getElementById(
                        "maquette-top-anchor",
                      );
                      if (topElement) {
                        topElement.scrollIntoView({
                          behavior: "auto",
                          block: "start",
                        });
                      }
                    });
                  }, 500);
                }}
              >
                <Icon f7="chevron_left" style={{ fontSize: "16px" }} />
                Vorige
              </div>
            )}
            {canGoNext && (
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  goToNextSection();
                  setTimeout(() => {
                    requestAnimationFrame(() => {
                      const topElement = document.getElementById(
                        "maquette-top-anchor",
                      );
                      if (topElement) {
                        topElement.scrollIntoView({
                          behavior: "auto",
                          block: "start",
                        });
                      }
                    });
                  }, 500);
                }}
              >
                Volgende
                <Icon f7="chevron_right" style={{ fontSize: "16px" }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Toolbar - moved outside the scaling div */}
      <Toolbar bottom className="neu-toolbar">
        <div
          className="neu-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
          }}
          onClick={refreshFromDatabase}
        >
          <Icon f7="arrow_clockwise" style={{ fontSize: "16px" }} />
          Vernieuw van Database
        </div>
        {isSuperAdmin(authUser?.email) && (
          <div
            className="neu-btn"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            onClick={handleSyncClick}
          >
            <Icon f7="icloud_upload" style={{ fontSize: "16px" }} />
            Sync naar Database
          </div>
        )}
      </Toolbar>

      {/* Traffic Rules Sheet */}
      <Sheet
        swipeToClose
        backdrop
        id="sheet-traffic-rules"
        style={{ height: "70vh" }}
      >
        <TrafficRulesSheet />
      </Sheet>

      <Sheet id="sheet-abbreviations" style={{ height: "70vh" }}>
        <Abbreviations />
      </Sheet>

      <Sheet id="maquette-edit-sheet" style={{ height: "100vh" }}>
        <MaquetteEdit
          groupName={maquetteEditData?.groupName}
          sequence={maquetteEditData?.sequence}
          answer={maquetteEditData?.answer}
          importantNotes={maquetteEditData?.importantNotes}
          maquetteNumber={maquetteEditData?.maquetteNumber}
          onDataUpdate={maquetteEditData?.onDataUpdate}
          pageStyles={maquetteEditData?.pageStyles}
          maquettenData={maquetteEditData?.maquettenData}
          createDefaultMaquetteVehicles={
            maquetteEditData?.createDefaultMaquetteVehicles
          }
        />
      </Sheet>
    </Page>
  );
};

export default MaquettePage;


