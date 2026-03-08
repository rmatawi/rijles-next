import { useEffect, useState, useRef, useCallback } from "react";
import {
  Icon,
  f7,
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  Button,
  Block,
  CardFooter,
  List,
  ListItem,
  Segmented,
  Tabs,
  Tab,
  useStore,
} from "framework7-react";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import MaquetteComp from "./MaquetteComp";
import CriteriaDisplay from "./CriteriaDisplay";
import { useI18n } from "../i18n/i18n";
import {
  addVehicleToSequence,
  createVehicleIdFromObject,
  SEQUENCE_OPERATORS,
} from "../js/vehicleSequenceUtils";
import { shortUrlService } from "../services/shortUrlService";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";
import {
  openAdminWhatsAppContact,
} from "../services/adminContactService";
import { buildAbsolutePageUrl, buildPagePath } from "../utils/appUrl";

const MaquetteDisplay = ({
  getLayout,
  title,
  groupName,
  sequence,
  answer: initialanswer,
  importantNotes,
  maquetteId,
  maquetteNumber,
  indexMaquette,
  mode = "study",
  isBookmarked,
  toggleBookmark,
  setEditMode,
  onDataUpdate,
  maquettenData,
  pageStyles,
  createDefaultMaquetteVehicles,
  setmaquetteEditData,
  onCriteriaShow = null,
  showCardFooter = true,
}) => {
  const { t } = useI18n();
  const [answer, setanswer] = useState(initialanswer);
  const [showAnswer, setShowAnswer] = useState(mode === "study"); // Show answer by default in study mode
  const [userAnswer, setUserAnswer] = useState("");
  const [nextOperator, setNextOperator] = useState(null);
  const [showTab, setShowTab] = useState("answer");
  const [selectedVehicles, setSelectedVehicles] = useState(new Set()); // Track selected vehicles in test mode
  const [selectedVehiclesForAnimation, setSelectedVehiclesForAnimation] =
    useState(new Set()); // Track selected vehicles for animation
  const selectedVehiclesForAnimationRef = useRef(new Set()); // Ref to track selected vehicles for animation in real-time
  const selectedVehiclesRef = useRef(new Set()); // Ref to track selected vehicles in real-time
  const [rotate] = useState(0);
  const [setShortUrl] = useState(null);
  const authUser = useStore("authUser");
  const [showAnswerBlock, setShowAnswerBlock] = useState(false);

  const maquetteRef = useRef(null);

  // `isAdmin` is coarse/global. For school-scoped management, use canManageCurrentSchool.
  const { canManageCurrentSchool } = useAdminStatus();

  // Use centralized text-to-speech hook
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();

  // Use maquette events context
  const { addEventListener, removeEventListener, dispatchEvent, EVENTS } =
    useMaquetteEvents();

  // Reset showAnswer and answer when mode or initialanswer changes
  useEffect(() => {
    setShowAnswer(mode === "study");
    setUserAnswer("");
    setNextOperator(null);
    setSelectedVehicles(new Set()); // Reset selected vehicles when mode changes
    setanswer(initialanswer);
  }, [mode, initialanswer]);

  // Stop speech when tab changes or component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [showTab, stopSpeaking]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Listen for step criteria events from MaquetteComp and pass to parent
  useEffect(() => {
    const handleShowCriteria = (event) => {
      // Only respond to events for this specific maquette
      if (event.detail.maquetteNumber === maquetteNumber) {
        // Pass the criteria data up to the parent component
        if (onCriteriaShow) {
          onCriteriaShow(event.detail);
        }
      }
    };

    addEventListener(EVENTS.SHOW_STEP_CRITERIA, handleShowCriteria);

    return () => {
      removeEventListener(EVENTS.SHOW_STEP_CRITERIA, handleShowCriteria);
    };
  }, [
    maquetteNumber,
    maquettenData,
    addEventListener,
    removeEventListener,
    EVENTS,
    onCriteriaShow,
  ]);

  // Function to play an individual vehicle
  const playVehicle = (vehicle) => {
    // Dispatch event to indicate individual vehicle is playing (specific to this maquette)
    dispatchEvent(EVENTS.INDIVIDUAL_VEHICLE_PLAY, { maquetteNumber });

    // Dispatch a play-animation event for this specific vehicle and maquette
    const quadrant = getVehicleQuadrant(vehicle);
    dispatchEvent(EVENTS.PLAY_ANIMATION, {
      quadrant: quadrant,
      order: vehicle.name,
      maquetteNumber: maquetteNumber, // Include maquette number
    });
  };

  // Helper function to determine which quadrant a vehicle belongs to
  const getVehicleQuadrant = (vehicle) => {
    // We need to find which direction (top, bottom, left, right) contains this vehicle
    const currentMaquette = maquettenData?.[`maquette_${maquetteNumber}`];

    if (!currentMaquette) return "top"; // Default

    for (const direction of ["top", "bottom", "left", "right"]) {
      const dirSection = currentMaquette[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          for (const veh of row) {
            if (veh && veh.name === vehicle.name && veh.type === vehicle.type) {
              return direction;
            }
          }
        }
      }
    }

    return "top"; // Default fallback
  };

  // Function to play animation for all selected vehicles
  const playAnimationForSelectedVehicles = () => {
    // Use the ref to get the most up-to-date selected vehicles
    const currentSelected = selectedVehiclesForAnimationRef.current;

    if (currentSelected.size === 0) {
      f7.dialog.alert("Geen voertuigen geselecteerd voor animatie.", "Fout");
      return;
    }

    // Extract vehicle names from the selected vehicle IDs
    // The ID format is: vehicleName_vehicleType_direction (from createVehicleIdFromObject)
    const selectedVehicleNames = Array.from(currentSelected).map((id) => {
      const parts = id.split("_");
      if (parts.length >= 1) {
        return parts[0]; // The vehicle name is the first part
      }
      return id; // Fallback to the full ID if format doesn't match
    });

    // Convert to a sequence string format like "car1+car2+car3" (for simultaneous playback)
    const sequence = selectedVehicleNames.join("+");

    // We need to play animation for each quadrant that has selected vehicles
    // For this, we need to determine the quadrants of the selected vehicles
    const currentMaquette = maquettenData?.[`maquette_${maquetteNumber}`];
    if (!currentMaquette) return;

    // Find all quadrants that have selected vehicles
    const quadrantsWithSelectedVehicles = new Set();
    for (const direction of ["top", "bottom", "left", "right"]) {
      const dirSection = currentMaquette[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          if (Array.isArray(row)) {
            for (const veh of row) {
              if (veh && veh.name && selectedVehicleNames.includes(veh.name)) {
                quadrantsWithSelectedVehicles.add(direction);
              }
            }
          }
        }
      }
    }

    // Play animation for each quadrant that has selected vehicles
    quadrantsWithSelectedVehicles.forEach((quadrant) => {
      dispatchEvent(EVENTS.PLAY_ANIMATION, {
        quadrant: quadrant,
        order: sequence,
        maquetteNumber: maquetteNumber,
      });
    });

    // Reset both the state and the ref after starting animation
    setSelectedVehiclesForAnimation(new Set());
    selectedVehiclesForAnimationRef.current = new Set();
  };

  const handleVehicleClick = (vehicle) => {
    // For test mode, keep existing functionality
    if (mode === "test") {
      // Check if vehicle was already selected in test mode (using centralized utility)
      const vehicleId = createVehicleIdFromObject(vehicle);
      if (selectedVehicles.has(vehicleId)) {
        f7.dialog.alert(
          `${vehicle.name} is al geselecteerd. Elk voertuig kan maar één keer gekozen worden.`,
          "Al geselecteerd"
        );
        return;
      }

      // Build the answer using centralized utility
      let newAnswer;
      if (nextOperator) {
        newAnswer = addVehicleToSequence(
          userAnswer,
          vehicle.name,
          nextOperator
        );
        setNextOperator(null);
      } else {
        // First vehicle
        newAnswer = vehicle.name;
      }
      setUserAnswer(newAnswer);

      // Mark vehicle as selected
      setSelectedVehicles((prev) => new Set([...prev, vehicleId]));

      let dialog = f7.dialog.create({
        title: `Volgende actie voor ${vehicle.name}`,
        text: "Kies de volgende operator, of beëindig.",
        buttons: [
          {
            text: "➕",
            cssClass: "blue-btn",
            onClick: () => {
              setNextOperator(SEQUENCE_OPERATORS.SIMULTANEOUS);
              f7.dialog.close();
            },
          },
          {
            text: "➖",
            cssClass: "blue-btn",
            onClick: () => {
              setNextOperator(SEQUENCE_OPERATORS.SEQUENTIAL);
              f7.dialog.close();
            },
          },
          {
            text: "✔",
            cssClass: "blue-btn",
            onClick: () => {
              // Finalize, do nothing more
              setNextOperator(null);
              f7.dialog.close();
            },
          },
        ],
        on: {
          closed: function () {
            dialog.destroy();
          },
        },
      });

      dialog.open();
      return;
    }

    // For non-test mode (study mode), show dialog with Plus and Oprijden buttons
    const vehicleId = createVehicleIdFromObject(vehicle);

    // Use the state to check current selection
    const isAlreadySelected = selectedVehiclesForAnimation.has(vehicleId);

    let title = isAlreadySelected
      ? `Voertuig ${vehicle.name} is al geselecteerd`
      : `Voertuig ${vehicle.name} geselecteerd`;

    let buttons = [
      {
        text: "Plus",
        color: "blue",
        onClick: () => {
          // Add vehicle to selected set if not already there before closing dialog
          if (!isAlreadySelected) {
            // Update both state and ref
            setSelectedVehiclesForAnimation((prev) => {
              const newSet = new Set(prev);
              newSet.add(vehicleId);
              selectedVehiclesForAnimationRef.current = newSet;
              return newSet;
            });
          }
          f7.dialog.close();
          // Allow user to click another vehicle - dialog will appear again
        },
      },
      {
        text: "Oprijden",
        color: "green",
        onClick: () => {
          // For Oprijden, also add the vehicle if not already selected at the moment of clicking
          if (!isAlreadySelected) {
            // Update both state and ref
            setSelectedVehiclesForAnimation((prev) => {
              const newSet = new Set(prev);
              newSet.add(vehicleId);
              selectedVehiclesForAnimationRef.current = newSet;
              return newSet;
            });
          }

          // Play animation immediately
          playAnimationForSelectedVehicles();

          f7.dialog.close();
        },
      },
    ];

    // Only include the "Verwijder" option if the vehicle is already selected
    if (isAlreadySelected) {
      buttons[0] = {
        text: "Verwijder",
        color: "red",
        onClick: () => {
          // Remove vehicle from selected set
          setSelectedVehiclesForAnimation((prev) => {
            const newSet = new Set(prev);
            newSet.delete(vehicleId);
            // Update the ref as well
            selectedVehiclesForAnimationRef.current = newSet;
            return newSet;
          });
          f7.dialog.close();
        },
      };
    }

    // Add vehicle to selected set and ref if not already there (for this specific click)
    if (!isAlreadySelected) {
      setSelectedVehiclesForAnimation((prev) => {
        const newSet = new Set(prev);
        newSet.add(vehicleId);
        selectedVehiclesForAnimationRef.current = newSet;
        return newSet;
      });
    }

    f7.dialog
      .create({
        title: title,
        // text: `Geselecteerde voertuigen: ${currentSelectedFromRef.size}`,
        verticalButtons: true,
        buttons: buttons,
      })
      .open();
  };

  const bookmarked = isBookmarked("maquette", maquetteNumber);

  // Helper function to generate share URL for this maquette
  const getMaquetteShareUrl = async () => {
    let baseUrl = "";

    // Try to create/get short URL
    if (maquetteId) {
      try {
        const { data, error } = await shortUrlService.createShortUrl(maquetteId);
        if (data && !error) {
          baseUrl = `${window.location.origin}/?id=${data.short_id}`;
          setShortUrl(baseUrl);
        }
      } catch (err) {
        // Could not create short URL
      }
    }

    if (!baseUrl) {
      baseUrl = buildAbsolutePageUrl("single-maquette", { id: maquetteId });
    }

    return baseUrl;
  };

  // Handle HELP button click - opens WhatsApp with related admin's phone number
  const handleHelpClick = async () => {
    try {
      // Get the selected school ID using the centralized function
      const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      const studentId = localStorage.getItem("studentId");

      // Create the WhatsApp message
      const shareUrl = await getMaquetteShareUrl();
      const message = `Hallo ik heb hulp nodig met deze maquette: ${shareUrl}`;
      const result = await openAdminWhatsAppContact({
        schoolId,
        studentId,
        authUser,
        canManageCurrentSchool,
        message,
        target: "_blank",
      });

      if (!result.opened) {
        f7.dialog.alert(
          "Er is geen telefoonnummer beschikbaar voor de beheerder. Neem contact op met uw instructeur voor hulp.",
          "Geen telefoonnummer"
        );
      }
    } catch (error) {
      console.error("Error getting admin phone number:", error);
      f7.dialog.alert(
        "Er is een fout opgetreden bij het ophalen van het telefoonnummer. Probeer het later opnieuw.",
        "Fout"
      );
    }
  };

  // Handle text-to-speech for notes
  const handleSpeakNotes = () => {
    if (!importantNotes) return;

    // Use the centralized text-to-speech hook
    speak(importantNotes);
  };

  // Handle Share button click - shows action sheet with options
  const handleShareClick = () => {
    // Create action sheet with two options: Share on Social and Share recorded Video
    f7.actions
      .create({
        buttons: [
          [
            {
              text: "📣 Share on Social",
              color: "blue",
              onClick: async () => {
                // Use Web Share API for social sharing
                const shareUrl = await getMaquetteShareUrl();
                if (navigator.share) {
                  navigator
                    .share({
                      title: `Maquette ${title}`,
                      text: `Bekijk maquette ${title}`,
                      url: shareUrl,
                    })
                    .catch((error) => {
                      if (error.name !== "AbortError") {
                        f7.dialog.alert(
                          "Deelvenster gesloten. Kopieer de link handmatig indien nodig."
                        );
                      }
                    });
                } else {
                  // Fallback to dialog for browsers that don't support Web Share API
                  f7.dialog
                    .create({
                      title: "Deel deze maquette",
                      text: "Kopieer de onderstaande link om deze maquette te delen:",
                      content: `
                    <div style="margin-top: 15px;">
                      <input type="text" id="share-url-input" value="${shareUrl}"
                             style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
                             readonly onclick="this.select(); this.setSelectionRange(0, this.value.length);"/>
                    </div>
                  `,
                      buttons: [
                        {
                          text: "Cancel",
                          color: "gray",
                        },
                        {
                          text: "Kopieer",
                          color: "blue",
                          onClick: () => {
                            const inputElement =
                              document.getElementById("share-url-input");
                            if (inputElement) {
                              // Select and copy the text
                              inputElement.select();
                              inputElement.setSelectionRange(
                                0,
                                inputElement.value.length
                              );

                              try {
                                const successful = document.execCommand("copy");
                                if (successful) {
                                  f7.toast.show({
                                    text: "Link gekopieerd naar klembord!",
                                    position: "center",
                                    closeTimeout: 2000,
                                  });
                                } else {
                                  // Fallback to navigator.clipboard
                                  navigator.clipboard
                                    .writeText(shareUrl)
                                    .then(() => {
                                      f7.toast.show({
                                        text: "Link gekopieerd naar klembord!",
                                        position: "center",
                                        closeTimeout: 2000,
                                      });
                                    });
                                }
                              } catch (err) {
                                // Fallback to navigator.clipboard if document.execCommand fails
                                navigator.clipboard
                                  .writeText(shareUrl)
                                  .then(() => {
                                    f7.toast.show({
                                      text: "Link gekopieerd naar klembord!",
                                      position: "center",
                                      closeTimeout: 2000,
                                    });
                                  });
                              }
                            }
                          },
                        },
                      ],
                      on: {
                        opened: function () {
                          // Auto-select the URL text when the dialog opens
                          const inputElement =
                            document.getElementById("share-url-input");
                          if (inputElement) {
                            inputElement.select();
                            inputElement.setSelectionRange(
                              0,
                              inputElement.value.length
                            );
                          }
                        },
                      },
                    })
                    .open();
                }
              },
            },
          ],
          [
            {
              text: "🎬 Share Recorded Video",
              color: "green",
              onClick: () => {
                // Navigate to the single maquette page with the maquette ID
                f7.views.main.router.navigate(
                  buildPagePath("single-maquette", { id: maquetteId })
                );
              },
            },
          ],
          [
            {
              text: "Cancel",
              color: "red",
              bold: true,
            },
          ],
        ],
      })
      .open();
  };

  return (
    <div style={{ padding: "0 16px", marginBottom: "16px" }}>
      <div
        id={`maquette-${maquetteNumber}`}
        className="neu-card"
        style={{ padding: "16px" }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "-50px",
          }}
        >
          <h2
            className="neu-text-primary"
            style={{ marginTop: "0px", fontWeight: 700 }}
          >
            {"#" + title}
          </h2>
          <div style={{ width: "70%" }} />
          {canManageCurrentSchool && (
            <div
              className="neu-btn-circle"
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "#ff3b30",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick={() => {
                f7.dialog.confirm(
                  `Weet u zeker dat u maquette ${maquetteNumber} wilt verwijderen?`,
                  "Maquette Verwijderen",
                  () => {
                    if (onDataUpdate && typeof onDataUpdate === "function") {
                      onDataUpdate({
                        type: "deleteMaquette",
                        maquetteNumber,
                      });
                    } else {
                      console.error("onDataUpdate function not provided");
                    }
                  }
                );
              }}
            >
              <Icon f7="trash" style={{ fontSize: "18px", color: "white" }} />
            </div>
          )}
          {canManageCurrentSchool && (
            <div
              id={"btn-edit-" + maquetteNumber}
              className="neu-btn-circle"
              style={{
                width: "36px",
                height: "36px",
                marginLeft: "12px",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick={() => {
                setmaquetteEditData({
                  groupName: groupName,
                  sequence: sequence,
                  answer: answer,
                  importantNotes: importantNotes,
                  maquettenData: maquettenData,
                  maquetteNumber: maquetteNumber,
                  onDataUpdate: onDataUpdate,
                  pageStyles: pageStyles,
                  createDefaultMaquetteVehicles: createDefaultMaquetteVehicles,
                });
                f7.sheet.open("#maquette-edit-sheet");
              }}
            >
              <Icon f7="pencil" style={{ fontSize: "18px" }} />
            </div>
          )}
        </div>

        <MaquetteComp
          indexMaquette={indexMaquette}
          userAnswer={userAnswer}
          maquetteNumber={maquetteNumber}
          maquetteData={maquettenData?.[`maquette_${maquetteNumber}`]}
          roadsize={maquettenData?.[`maquette_${maquetteNumber}`]?.roadsize}
          rotate={rotate}
          setEditMode={setEditMode}
          onVehicleClick={handleVehicleClick}
          onRef={useCallback((instance) => {
            maquetteRef.current = instance;
          }, [])}
        />

        {showCardFooter && !showAnswerBlock && (
          <CardFooter style={{ marginTop: "10px" }}>
            <div />
            <Button
              large
              outline
              round
              style={{
                backgroundColor:
                  getLayout()?.colorScheme?.[1] || "var(--app-accent-green)",
                color: "white",
              }}
              onClick={() => {
                setShowAnswerBlock(true);
              }}
            >
              <b>ANTWOORD</b>
            </Button>
            <div />
          </CardFooter>
        )}

        {
          !showCardFooter &&
          <div
            style={{ marginTop: "1rem" }}
            className="neu-text-primary text-center">
            Antwoord / Notes:
            <div
              className="neu-text-primary text-center"
              style={{ fontSize: "1rem" }}
              dangerouslySetInnerHTML={{
                __html:
                  typeof answer === "string"
                    ? answer
                    : answer || "Bold text here",
              }}
            />
          </div>
        }

        {showAnswerBlock && (
          <div style={{ marginTop: "30px" }}>
            <Segmented strong style={{ marginBottom: "16px" }}>
              <Button
                active={showTab === "answer"}
                fill={showTab === "answer"}
                style={{
                  backgroundColor:
                    showTab === "answer" ? "#34c759" : "transparent",
                  color: showTab === "answer" ? "white" : "inherit",
                }}
                tabLink="#answer"
                tabLinkActive={showTab === "answer"}
                onClick={() => {
                  setShowTab("answer");
                  f7.tab.show("#answer");
                }}
              >
                <Icon f7="checkmark_circle" style={{ fontSize: "16px" }} />
                Antwoord
              </Button>
              <Button
                active={showTab === "notes"}
                fill={showTab === "notes"}
                style={{
                  backgroundColor:
                    showTab === "notes"
                      ? getLayout()?.colorScheme?.[1]
                      : "transparent",
                  color: showTab === "notes" ? "white" : "inherit",
                }}
                tabLink="#notes"
                tabLinkActive={showTab === "notes"}
                onClick={() => {
                  setShowTab("notes");
                  f7.tab.show("#notes");
                }}
              >
                <Icon
                  f7="exclamationmark_triangle"
                  style={{ fontSize: "16px" }}
                />
                Notes
              </Button>
            </Segmented>

            <Tabs animated>
              <Tab id="answer" tabActive={showTab === "answer"}>
                <div style={{ marginTop: "8px", textAlign: "center" }}>
                  <div
                    className="neu-text-primary"
                    style={{ fontSize: "1rem", fontWeight: "600" }}
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof answer === "string"
                          ? answer
                          : answer || "Bold text here",
                    }}
                  />
                </div>
              </Tab>
              <Tab id="notes" tabActive={showTab === "notes"}>
                <div
                  style={{
                    position: "relative",
                    padding: "12px",
                    backgroundColor: "var(--color-yellow-light)",
                    borderRadius: "8px",
                  }}
                >
                  {importantNotes && (
                    <div
                      className="neu-btn-circle"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "32px",
                        height: "32px",
                        backgroundColor: isSpeaking
                          ? "#ff3b30"
                          : "var(--app-primary-color)",
                        cursor: "pointer",
                        zIndex: 10,
                      }}
                      onClick={handleSpeakNotes}
                    >
                      <Icon
                        f7={isSpeaking ? "stop_fill" : "speaker_2_fill"}
                        style={{ fontSize: "16px", color: "white" }}
                      />
                    </div>
                  )}
                  <div
                    className="neu-text-primary"
                    dangerouslySetInnerHTML={{ __html: importantNotes }}
                  />

                  <CardFooter>
                    <Button
                      style={{ width: "45%" }}
                      large
                      iconF7="lightbulb"
                      iconColor="orange"
                      outline
                      borderColor="orange"
                      textColor="orange"
                      text="Afk."
                      sheetOpen={"#sheet-abbreviations"}
                    />
                    <Button
                      style={{ width: "45%" }}
                      large
                      iconF7="exclamationmark_triangle_fill"
                      iconColor="red"
                      outline
                      borderColor="red"
                      textColor="red"
                      text="Regels"
                      sheetOpen={"#sheet-traffic-rules"}
                    />
                  </CardFooter>
                </div>
              </Tab>
            </Tabs>
          </div>
        )}

        {showCardFooter && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="neu-btn-circle"
              style={{ width: "40px", height: "40px", cursor: "pointer" }}
              onClick={() => {
                const bookmarkUrl = buildPagePath("maquette", {
                  scrollTo: `maquette-${maquetteNumber}`,
                });
                toggleBookmark(
                  "maquette",
                  maquetteNumber,
                  `Maquette ${title}`,
                  bookmarkUrl
                );
              }}
            >
              <Icon
                f7={bookmarked ? "bookmark_fill" : "bookmark"}
                style={{ fontSize: "18px" }}
              />
            </div>
            <div
              className="neu-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={handleHelpClick}
            >
              <Icon f7="hand_raised" style={{ fontSize: "18px" }} />
              HELP
            </div>
            <div
              className="neu-btn-circle"
              style={{ width: "40px", height: "40px", cursor: "pointer" }}
              onClick={handleShareClick}
            >
              <Icon
                f7="arrowshape_turn_up_right"
                style={{ fontSize: "18px" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaquetteDisplay;
