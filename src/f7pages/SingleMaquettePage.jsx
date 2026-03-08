import { useEffect, useState, useRef } from "react";
import {
  Navbar,
  Page,
  Block,
  NavLeft,
  Sheet,
  NavRight,
  Link,
  Button,
  Card,
  CardContent,
  f7,
  NavTitle,
  Icon,
  CardFooter,
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
  useStore,
} from "framework7-react";
import { maquetteService } from "../services/maquetteService";
import { shortUrlService } from "../services/shortUrlService";
import MaquetteCanvas from "../components/MaquetteCanvas";
import Abbreviations from "../components/Abbreviations.jsx";
import TrafficRulesSheet from "../components/TrafficRulesSheet.jsx";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle } from "ionicons/icons";
import AboutSheet from "../components/AboutSheet.jsx";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { useStudentStatus } from "../contexts/StudentStatusContext.jsx";
import FreeTrialSignupPromo from "../components/FreeTrialSignupPromo";
import ReferralCard from "../components/ReferralCard";
import { createVehicleIdFromObject } from "../js/vehicleSequenceUtils";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";
import {
  openWhatsAppWithPhone,
  resolveActiveAdminContact,
} from "../services/adminContactService";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import useAppNavigation from "../hooks/useAppNavigation";

const SingleMaquettePage = () => {
  const { navigate } = useAppNavigation();
  const debugLog = () => {};
  const [showAnswer, setShowAnswer] = useState(false);
  const [maquette, setMaquette] = useState(null);
  const [maquetteId, setMaquetteId] = useState(null);
  const [maquetteNumber, setMaquetteNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drivingSchool, setDrivingSchool] = useState(null);

  // Vehicle selection state for animation
  const [selectedVehiclesForAnimation, setSelectedVehiclesForAnimation] =
    useState(new Set()); // Track selected vehicles for animation
  const selectedVehiclesRef = useRef(new Set()); // Ref to track selected vehicles in real-time

  // Admin and student status
  const adminContext = useAdminStatus();
  const studentContext = useStudentStatus();
  const isAdminStatus = adminContext.isAdmin;
  const isStudentStatus = studentContext.isStudent;
  const canManageCurrentSchool = adminContext.canManageCurrentSchool;

  // Maquette events context
  const { dispatchEvent, EVENTS } = useMaquetteEvents();

  // MaquetteCanvas recording state
  const maquetteCanvasRef = useRef(null);
  const maquetteRecorderRef = useRef(null);
  const [isMaquetteRecording, setIsMaquetteRecording] = useState(false);
  const [maquetteRecordedBlob, setMaquetteRecordedBlob] = useState(null);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [showPromoSheet, setShowPromoSheet] = useState(false);
  const audioStreamRef = useRef(null);
  const authUser = useStore("authUser");

  // Fetch traffic rules for the current school
  const fetchTrafficRules = async () => {
    try {
      // Import the traffic rules service dynamically and fetch rules from JSON
      const { trafficRulesService } = await import(
        "../services/trafficRulesService.js"
      );
      const response = await trafficRulesService.getRuleEntriesBySchoolId();

      if (response.data) {
        setRulesData(response.data);
      } else if (response.error) {
        console.error("Error fetching traffic rules:", response.error);
        // Fallback to importing the JSON directly
        import("../data/maquetteRules.json").then((module) => {
          setRulesData(module.default);
        });
      } else {
        // Fallback to importing the JSON directly
        import("../data/maquetteRules.json").then((module) => {
          setRulesData(module.default);
        });
      }
    } catch (error) {
      console.error("Error loading traffic rules:", error);
      // Fallback to importing the JSON directly
      try {
        const maquetteRules = await import("../data/maquetteRules.json");
        setRulesData(maquetteRules.default);
      } catch (fallbackError) {
        console.error("Error loading fallback traffic rules:", fallbackError);
        // Set default rules to avoid breaking the UI
        setRulesData({
          rules: [
            {
              id: "A001",
              title: "Voorrangsregels op Kruisingen",
              description: "Regels voor voorrang op kruisingen.",
              priority: "hoog",
            },
          ],
        });
      }
    }
  };

  // Get the maquette ID from URL query parameters and fetch from database
  useEffect(() => {
    const fetchMaquette = async () => {
      setLoading(true);
      setError(null);

      const urlParams = new URLSearchParams(window.location.search);
      let id = urlParams.get("id");

      if (id) {
        try {
          let actualMaquetteId = id;

          // Check if this is a short URL (8 characters, no dashes) vs UUID (36 chars with dashes)
          const isShortUrl = id.length === 8 && !id.includes("-");

          if (isShortUrl) {
            // Look up the actual maquette ID from short URL
            const { data: shortUrlData, error: shortUrlError } =
              await shortUrlService.getMaquetteIdFromShortId(id);

            if (shortUrlError || !shortUrlData) {
              console.error("Error resolving short URL:", shortUrlError);
              setError("Ongeldige of verlopen link");
              f7.dialog.alert("Ongeldige of verlopen link", "Fout");
              setLoading(false);
              return;
            }

            actualMaquetteId = shortUrlData.maquette_id;
          }

          setMaquetteId(actualMaquetteId);

          // Fetch the specific maquette by ID directly from the database
          const { data: maquetteData, error } =
            await maquetteService.getMaquetteById(actualMaquetteId);

          if (error) {
            console.error("Error fetching maquette:", error);
            setError("Maquette niet gevonden");
            f7.dialog.alert("Maquette niet gevonden", "Fout");
            setLoading(false);
            return;
          }

          if (maquetteData) {
            setMaquette(maquetteData.maquette);
            // Extract the number from the name (e.g., "maquette_1" -> "1")
            const number = maquetteData.name
              ? maquetteData.name.replace("maquette_", "")
              : "unknown";
            setMaquetteNumber(number);
          } else {
            setError("Maquette niet gevonden");
            f7.dialog.alert("Maquette niet gevonden", "Fout");
          }
        } catch (err) {
          console.error("Unexpected error fetching maquette:", err);
          setError("Fout bij laden van maquette");
          f7.dialog.alert(
            "Fout bij laden van maquette: " + err.message,
            "Fout"
          );
        }
      } else {
        setError("Geen maquette ID opgegeven");
        // f7.dialog.alert("Geen maquette ID opgegeven", "Fout");
      }

      setLoading(false);
    };

    fetchMaquette();
  }, []);

  // Load traffic rules when component mounts
  useEffect(() => {
    fetchTrafficRules();
  }, []);

  // Load driving school data when component mounts
  useEffect(() => {
    const loadDrivingSchoolData = async () => {
      try {
        // Import the school service
        const { schoolService } = await import("../services/schoolService");

        // Get school ID from environment variable
        const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

        if (schoolId) {
          // Fetch school data by ID
          const { data: school, error } = await schoolService.getSchoolById(
            schoolId
          );

          if (error) {
            console.error("Error fetching school data:", error);
            // Set default school data
            setDrivingSchool({
              name: "Rijles Suriname",
              logo: "/placeholders/placeholder-a02.jpg",
              adminPhone: "",
            });
          } else if (school) {
            const studentId = localStorage.getItem("studentId");
            const {
              admin,
              normalizedPhone,
            } = await resolveActiveAdminContact({
              schoolId: school.id,
              studentId,
              authUser,
              canManageCurrentSchool,
            });

            // Set the school data
            setDrivingSchool({
              id: school.id,
              name: school.name || "Rijles Suriname",
              logo: school.logo_url || "/placeholders/placeholder-a02.jpg",
              adminPhone: normalizedPhone,
              admin_id: admin?.id || null,
              admin_name: admin?.name || null,
              admin_email: admin?.email || null,
            });

          } else {
            // Default values if no school found
            setDrivingSchool({
              name: "Rijles Suriname",
              logo: "/placeholders/placeholder-a02.jpg",
              adminPhone: "",
            });
          }
        } else {
          // No school ID, set default values
          setDrivingSchool({
            name: "Rijles Suriname",
            logo: "/placeholders/placeholder-a02.jpg",
            adminPhone: "",
          });
        }
      } catch (error) {
        console.error("Error loading driving school data:", error);
        // Set default values on error
        setDrivingSchool({
          name: "Rijles Suriname",
          logo: "/placeholders/placeholder-a02.jpg",
          adminPhone: "",
        });
      }
    };

    loadDrivingSchoolData();
  }, [authUser, canManageCurrentSchool]);

  // Function to play an individual vehicle

  // Function to play animation for all selected vehicles
  const playAnimationForSelectedVehicles = () => {
    debugLog("playAnimationForSelectedVehicles called");
    // Use the ref to get the most up-to-date selected vehicles
    const currentSelected = selectedVehiclesRef.current;
    debugLog(
      "Current selected vehicles in ref:",
      Array.from(currentSelected)
    );

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

    debugLog("Extracted vehicle names:", selectedVehicleNames);

    // Convert to a sequence string format like "car1+car2+car3" (for simultaneous playback)
    const sequence = selectedVehicleNames.join("+");
    debugLog("Generated sequence:", sequence);

    // We need to play animation for each quadrant that has selected vehicles
    // For this, we need to determine the quadrants of the selected vehicles
    if (!maquette) return;

    // Find all quadrants that have selected vehicles
    const quadrantsWithSelectedVehicles = new Set();
    for (const direction of ["top", "bottom", "left", "right"]) {
      const dirSection = maquette[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          if (Array.isArray(row)) {
            for (const veh of row) {
              if (veh && veh.name && selectedVehicleNames.includes(veh.name)) {
                quadrantsWithSelectedVehicles.add(direction);
                debugLog(
                  "Found vehicle",
                  veh.name,
                  "in quadrant",
                  direction
                );
              }
            }
          }
        }
      }
    }

    debugLog(
      "Quadrants with selected vehicles:",
      Array.from(quadrantsWithSelectedVehicles)
    );

    // Play animation for each quadrant that has selected vehicles
    quadrantsWithSelectedVehicles.forEach((quadrant) => {
      debugLog(
        "Dispatching play-animation event for quadrant:",
        quadrant,
        "with sequence:",
        sequence
      );
      dispatchEvent(EVENTS.PLAY_ANIMATION, {
        quadrant: quadrant,
        order: sequence,
        maquetteNumber: maquetteNumber,
      });
    });

    // Reset both the state and the ref after starting animation
    setSelectedVehiclesForAnimation(new Set());
    selectedVehiclesRef.current = new Set();
    debugLog("Cleared selected vehicles after animation");
  };

  const handleVehicleClick = (vehicle) => {
    // Use the ref to check current state
    const vehicleId = createVehicleIdFromObject(vehicle);
    const currentSelectedFromRef = selectedVehiclesRef.current;
    const isAlreadySelected = currentSelectedFromRef.has(vehicleId);

    // Log for debugging
    debugLog("Vehicle clicked:", vehicle.name, "Vehicle ID:", vehicleId);
    debugLog("Is already selected:", isAlreadySelected);
    debugLog(
      "Current selected vehicles (ref):",
      Array.from(currentSelectedFromRef)
    );

    let title = isAlreadySelected
      ? `Voertuig ${vehicle.name} is al geselecteerd`
      : `Voertuig ${vehicle.name} geselecteerd`;

    let buttons = [
      {
        text: "Plus",
        color: "blue",
        onClick: () => {
          debugLog("Plus clicked");
          // Add vehicle to selected set if not already there before closing dialog
          if (!isAlreadySelected) {
            // Update both state and ref
            setSelectedVehiclesForAnimation((prev) => {
              const newSet = new Set(prev);
              newSet.add(vehicleId);
              selectedVehiclesRef.current = newSet;
              debugLog(
                "Updated selected vehicles after Plus:",
                Array.from(newSet)
              );
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
          debugLog("Oprijden clicked");

          // For Oprijden, also add the vehicle if not already selected at the moment of clicking
          if (!isAlreadySelected) {
            // Update both state and ref
            setSelectedVehiclesForAnimation((prev) => {
              const newSet = new Set(prev);
              newSet.add(vehicleId);
              selectedVehiclesRef.current = newSet;
              debugLog(
                "Added vehicle for Oprijden, total selected:",
                Array.from(newSet)
              );
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
          debugLog("Verwijder clicked for:", vehicle.name);
          // Remove vehicle from selected set
          setSelectedVehiclesForAnimation((prev) => {
            const newSet = new Set(prev);
            newSet.delete(vehicleId);
            // Update the ref as well
            selectedVehiclesRef.current = newSet;
            debugLog(
              "After removal, selected vehicles (ref):",
              Array.from(newSet)
            );
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
        selectedVehiclesRef.current = newSet;
        debugLog(
          "Added to selected vehicles (state and ref):",
          Array.from(newSet)
        );
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

  // Helper function to determine which quadrant a vehicle belongs to
  const getVehicleQuadrant = (vehicle) => {
    if (!maquette) return "top"; // Default

    for (const direction of ["top", "bottom", "left", "right"]) {
      const dirSection = maquette[direction];
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

  // MaquetteCanvas recording functions
  const startMaquetteRecording = async () => {
    // Show explanation dialog first
    f7.dialog.confirm(
      "Neem een video-uitleg op van de maquette. Klik op voertuigen om ze te laten oprijden - uw stem wordt mee opgenomen. Daarna kunt u bekijken, delen of opnieuw opnemen.",
      "Video Opname",
      async () => {
        // User confirmed, start recording
        await doStartMaquetteRecording();
      }
    );
  };

  const doStartMaquetteRecording = async () => {
    const canvasComponent = maquetteCanvasRef.current;
    if (!canvasComponent) {
      f7.toast.show({
        text: "Maquette canvas niet gevonden",
        position: "center",
        closeTimeout: 2000,
      });
      return;
    }

    try {
      // Get canvas video stream
      const canvasStream = canvasComponent.captureStream(30); // 30 FPS

      // Try to get microphone audio stream
      let combinedStream;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = audioStream;

        // Combine canvas video tracks with audio tracks
        const videoTracks = canvasStream.getVideoTracks();
        const audioTracks = audioStream.getAudioTracks();
        combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
      } catch (audioError) {
        console.warn("Microphone access denied or unavailable:", audioError);
        f7.toast.show({
          text: "Microfoon niet beschikbaar - opname zonder geluid",
          position: "center",
          closeTimeout: 2000,
        });
        combinedStream = canvasStream;
      }

      // Detect supported mimeType (iOS only supports mp4, others support webm)
      const getSupportedMimeType = () => {
        // Force mp4 on iOS using Framework7 device detection
        if (f7.device.ios) {
          return "video/mp4";
        }

        const types = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
          "video/mp4",
        ];
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            return type;
          }
        }
        return ""; // Let browser choose default
      };

      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : {};

      const recorder = new MediaRecorder(combinedStream, recorderOptions);
      const chunks = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const actualMimeType = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunks, { type: actualMimeType });
        setMaquetteRecordedBlob(blob);

        // Stop audio stream tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
      });

      recorder.start();
      maquetteRecorderRef.current = recorder;
      setIsMaquetteRecording(true);
    } catch (error) {
      console.error("Error starting maquette recording:", error);
      f7.toast.show({
        text: "Fout bij starten opname: " + error.message,
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  const stopMaquetteRecording = () => {
    if (maquetteRecorderRef.current && isMaquetteRecording) {
      maquetteRecorderRef.current.stop();
      setIsMaquetteRecording(false);

      // Stop audio stream tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      f7.toast.show({
        text: "Maquette opname gestopt",
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  const downloadMaquetteRecording = () => {
    if (!maquetteRecordedBlob) {
      f7.toast.show({
        text: "Geen opname beschikbaar",
        position: "center",
        closeTimeout: 2000,
      });
      return;
    }

    const url = URL.createObjectURL(maquetteRecordedBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.className = "external";
    a.target = "_blank";
    a.href = url;
    // Use correct file extension based on mimeType
    const extension = maquetteRecordedBlob.type.includes("mp4")
      ? "mp4"
      : "webm";
    a.download = `maquette-${maquetteNumber}-recording-${Date.now()}.${extension}`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    setMaquetteRecordedBlob(null);

    f7.toast.show({
      text: "Maquette opname gedownload!",
      position: "center",
      closeTimeout: 2000,
    });
  };

  const deleteMaquetteRecording = () => {
    if (maquetteRecordedBlob) {
      URL.revokeObjectURL(maquetteRecordedBlob);
    }
    setMaquetteRecordedBlob(null);

    f7.toast.show({
      text: "Maquette opname verwijderd",
      position: "center",
      closeTimeout: 2000,
    });
  };

  const shareMaquetteRecording = async () => {
    if (!maquetteRecordedBlob) {
      f7.toast.show({
        text: "Geen opname beschikbaar",
        position: "center",
        closeTimeout: 2000,
      });
      return;
    }

    // Create a file from the blob with correct extension
    const extension = maquetteRecordedBlob.type.includes("mp4")
      ? "mp4"
      : "webm";
    const videoFile = new File(
      [maquetteRecordedBlob],
      `maquette-${maquetteNumber}-recording-${Date.now()}.${extension}`,
      { type: maquetteRecordedBlob.type }
    );

    // Check if the Web Share API is available
    if (navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [videoFile] })) {
        try {
          await navigator.share({
            title: `Maquette ${maquetteNumber} Opname`,
            text: `Bekijk deze maquette opname van ${drivingSchool?.name || "Rijles Suriname"
              }`,
            files: [videoFile],
          });

          f7.toast.show({
            text: "Opname succesvol gedeeld!",
            position: "center",
            closeTimeout: 2000,
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error sharing:", error);
            // Fallback to download
            downloadMaquetteRecording();
          }
        }
      } else {
        // File sharing not supported, fallback to download
        downloadMaquetteRecording();
      }
    } else {
      // Web Share API not available, fallback to download
      downloadMaquetteRecording();
    }
  };

  // Download screenshot function
  const downloadScreenshot = async () => {
    const canvasComponent = maquetteCanvasRef.current;
    const canvas = canvasComponent?.getCanvas?.();

    if (!canvas) {
      f7.toast.show({
        text: "Kan screenshot niet maken",
        position: "center",
        closeTimeout: 2000,
      });
      return;
    }

    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.className = "external";
        a.target = "_blank";
        a.href = url;
        a.download = `maquette-${maquetteNumber}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        f7.toast.show({
          text: "Screenshot gedownload!",
          position: "center",
          closeTimeout: 2000,
        });
      }
    } catch (error) {
      console.error("Error downloading screenshot:", error);
      f7.toast.show({
        text: "Fout bij downloaden screenshot",
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      f7.toast.show({
        text: "Tekst gekopieerd naar klembord!",
        position: "center",
        closeTimeout: 2000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      f7.toast.show({
        text: "Kopiëren mislukt",
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  // Extract vehicles and their order from maquette
  const getVehiclesFromMaquette = () => {
    if (!maquette) return [];

    const vehicles = [];
    const directions = ["top", "bottom", "left", "right"];

    for (const direction of directions) {
      const dirSection = maquette[direction];
      if (dirSection && dirSection.vehicles) {
        for (const row of dirSection.vehicles) {
          for (const vehicle of row) {
            if (vehicle && vehicle.name) {
              vehicles.push({
                name: vehicle.name,
                type: vehicle.type || "car",
                direction: direction,
              });
            }
          }
        }
      }
    }

    return vehicles;
  };

  // Generate answer options with correct order and randomized incorrect ones
  const generateAnswerOptions = () => {
    const vehicles = getVehiclesFromMaquette();
    if (vehicles.length === 0) {
      return {
        options: [
          "A) Geen voertuigen",
          "B) Geen voertuigen",
          "C) Geen voertuigen",
        ],
        correctIndex: 0,
      };
    }

    // Get correct order from sequence (format: "F2+3-1")
    let correctOrder = "";
    debugLog({ maquetteSequence: maquette?.sequence });

    if (maquette?.sequence && typeof maquette.sequence === "string") {
      // Use the sequence as-is (format: "F2+3-1")
      correctOrder = maquette.sequence;
    } else {
      // Fallback: use vehicle names
      correctOrder = vehicles.map((v) => v.name).join("-");
    }

    // Parse the correct sequence to extract vehicle identifiers

    // Extract just the vehicle identifiers (without separators)
    const getVehicleIds = (seq) => {
      return seq.split(/[+-]/).filter(Boolean);
    };

    // Generate two random incorrect orders
    const generateRandomOrder = () => {
      const vehicleIds = getVehicleIds(correctOrder);

      // Shuffle the vehicle IDs
      const shuffled = [...vehicleIds].sort(() => Math.random() - 0.5);

      // Join with random +/- signs between vehicles
      return shuffled
        .map((id, idx) => {
          if (idx === shuffled.length - 1) return id; // Last vehicle, no separator

          // Random separator: 50% +, 50% -
          const separator = Math.random() < 0.5 ? "+" : "-";
          return `${id}${separator}`;
        })
        .join("");
    };

    const incorrectOrder1 = generateRandomOrder();
    const incorrectOrder2 = generateRandomOrder();

    // Create three options with correct one randomly placed
    const allOptions = [correctOrder, incorrectOrder1, incorrectOrder2];
    const correctIndex = Math.floor(Math.random() * 3);

    // Shuffle and place correct answer at the random index
    const shuffledOptions = [...allOptions];
    [shuffledOptions[0], shuffledOptions[correctIndex]] = [
      shuffledOptions[correctIndex],
      shuffledOptions[0],
    ];

    return {
      options: shuffledOptions.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx); // A, B, C
        return `${letter}) ${opt}`;
      }),
      correctIndex: correctIndex,
      correctLetter: String.fromCharCode(65 + correctIndex),
    };
  };

  // State for short URL
  const [shortUrl, setShortUrl] = useState(null);

  // Create short URL when sheet opens
  useEffect(() => {
    if (showPromoSheet && maquetteId && !shortUrl) {
      const createShortLink = async () => {
        const { data, error } = await shortUrlService.createShortUrl(
          maquetteId
        );
        if (data && !error) {
          const url = `${window.location.origin}/?id=${data.short_id}`;
          setShortUrl(url);
        }
      };
      createShortLink();
    }
  }, [showPromoSheet, maquetteId]);

  // Helper function to append admin_id and school to any URL
  const getAttributedUrl = (baseUrl) => {
    let url = baseUrl;
    if (isAdminStatus && authUser?.id) {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}admin_id=${authUser.id}`;

      const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL || drivingSchool?.id;
      // No longer adding school param individually as it's handled by env
    }
    return url;
  };

  // Promotional social media texts
  const getPromoTexts = () => {
    // Use short URL if available, otherwise fallback to full URL
    const baseUrl =
      shortUrl ||
      buildAbsolutePageUrl("single-maquette", { id: maquetteId });

    const shareUrl = getAttributedUrl(baseUrl);
    const answerOptions = generateAnswerOptions();

    return [
      {
        title: "Quiz Challenge",
        text: `🚗 In welke volgorde rijden deze voertuigen op?\n\nKlik op ${shareUrl} om het antwoord te zien.\n\nTag je vrienden om ze te testen! 👇\nDe winnaar krijgt 7 dagen gratis toegang! 🎁`,
      },
      {
        title: "Multiple Choice",
        text: `🚦 Vraag van de dag: Welke volgorde is correct?\n\n${answerOptions.options[0]}\n${answerOptions.options[1]}\n${answerOptions.options[2]}\n\nDenk je het antwoord te weten? Klik hier: ${shareUrl}\n\nReageer met A, B of C! De eerste juiste antwoord wint 7 dagen gratis toegang! 🏆`,
      },
      {
        title: "Test Your Knowledge",
        text: `🤔 Kun jij deze maquette oplossen?\n\nWat is de juiste oprij-volgorde?\n\n${answerOptions.options[0]}\n${answerOptions.options[1]}\n${answerOptions.options[2]}\n\nBekijk de maquette: ${shareUrl}\n\nTag 3 vrienden die dit moeten proberen! Win 7 dagen gratis toegang! 🎯`,
      },
      {
        title: "Friend Challenge",
        text: `💪 Uitdaging!\n\nIk daag je uit om deze verkeers-maquette op te lossen!\n\nDenk je slimmer te zijn? Bewijs het: ${shareUrl}\n\nDeel je antwoord en tag je vrienden! Beste antwoord wint 7 dagen gratis toegang tot de rijles app! 🚗✨`,
      },
      {
        title: "Social Contest",
        text: `🎓 Rijexamen Quiz!\n\nKan jij de juiste volgorde bepalen? 🤓\n\n${answerOptions.options[0]}\n${answerOptions.options[1]}\n${answerOptions.options[2]}\n\nTest jezelf: ${shareUrl}\n\nReageer met je antwoord! De winnaar krijgt 7 dagen premium toegang! 🏅\n\n#rijexamen #theorie #rijles`,
      },
    ];
  };

  // Function to create promotional post (download + show promo sheet)
  const createPromotionalPost = () => {
    // Show promotional sheet with download buttons
    setShowPromoSheet(true);
  };

  // Function to share on social media
  const shareOnSocial = async () => {
    // Use short URL if available, otherwise fallback to full URL
    const baseUrl =
      shortUrl ||
      buildAbsolutePageUrl("single-maquette", { id: maquetteId });

    const shareUrl = getAttributedUrl(baseUrl);
    const shareText = "Wat is de juiste oprij-volgorde?";

    // Try to get canvas screenshot
    const canvasComponent = maquetteCanvasRef.current;
    const canvas = canvasComponent?.getCanvas?.();

    if (navigator.share) {
      try {
        let shareData = {
          title: `Maquette ${maquetteNumber}`,
          text: shareText,
          url: shareUrl,
        };

        // If we have a canvas, try to include the screenshot
        if (canvas) {
          try {
            const blob = await new Promise((resolve) =>
              canvas.toBlob(resolve, "image/png")
            );

            if (blob) {
              const file = new File([blob], `maquette-${maquetteNumber}.png`, {
                type: "image/png",
              });

              // Check if browser supports sharing files
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file];
              }
            }
          } catch (screenshotError) {
            debugLog(
              "Could not capture canvas screenshot:",
              screenshotError
            );
            // Continue without screenshot
          }
        }

        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== "AbortError") {
          debugLog("Error sharing:", error);
          f7.toast.show({
            text: "Delen mislukt. Probeer opnieuw.",
            position: "center",
            closeTimeout: 2000,
          });
        }
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        f7.toast.show({
          text: "Link gekopieerd naar klembord!",
          position: "center",
          closeTimeout: 2000,
        });
      } catch (err) {
        f7.toast.show({
          text: "Delen niet ondersteund op dit apparaat",
          position: "center",
          closeTimeout: 2000,
        });
      }
    }
  };

  // Function to share maquette screenshot (admin gets options, non-admin shares directly)
  const shareMaquetteScreenshot = async () => {
    // Check if user is admin
    if (isAdminStatus) {
      // Show dialog with 2 options for admin
      f7.dialog
        .create({
          title: "Deel Opties",
          text: "Kies hoe je deze maquette wilt delen:",
          buttons: [
            {
              text: "📣 Share on Social",
              color: "blue",
              onClick: () => {
                shareOnSocial();
              },
            },
            {
              text: "📝 Create Post",
              color: "green",
              onClick: () => {
                createPromotionalPost();
              },
            },
            {
              text: "Cancel",
              color: "gray",
            },
          ],
          verticalButtons: true,
        })
        .open();
    } else {
      // Non-admin: directly share on social
      await shareOnSocial();
    }
  };

  // Video player component with proper cleanup and centered play/pause button
  const VideoPlayer = ({ blob, style }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true); // autoPlay is true
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
      if (videoRef.current && blob) {
        videoRef.current.src = URL.createObjectURL(blob);

        return () => {
          if (videoRef.current) {
            URL.revokeObjectURL(videoRef.current.src);
            videoRef.current.src = "";
          }
        };
      }
    }, [blob]);

    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    };

    return (
      <div
        style={{ position: "relative", width: "100%", height: "100%" }}
        onClick={togglePlayPause}
        onMouseEnter={() => setShowButton(true)}
        onMouseLeave={() => setShowButton(false)}
        onTouchStart={() => setShowButton(true)}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "8px",
            ...style,
          }}
          autoPlay
          playsInline
          webkit-playsinline="true"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        {/* Centered play/pause button overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: !isPlaying || showButton ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        >
          <Icon
            f7={isPlaying ? "pause_fill" : "play_fill"}
            size={32}
            color="white"
          />
        </div>
      </div>
    );
  };

  if (loading && !maquette) {
    return (
      <Page
        name="single-maquette"
        id="single-maquette-page"
        className="page-neu"
      >
        <Navbar className="neu-navbar">
          <NavLeft>
            <div
              className="neu-btn-circle"
              style={{ width: "36px", height: "36px", cursor: "pointer" }}
              onClick={() => navigate("/maquette")}
            >
              <Icon f7="arrow_left" style={{ fontSize: "20px" }} />
            </div>
          </NavLeft>
          <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
            Maquette
          </NavTitle>
        </Navbar>
        <Block strong>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p className="neu-text-secondary">Maquette wordt geladen...</p>
            <Link href="/maquette" className="neu-text-accent">
              Terug naar alle maquettes
            </Link>
          </div>
        </Block>
      </Page>
    );
  }

  if (!maquette) {
    return (
      <Page
        name="single-maquette"
        id="single-maquette-page"
        className="page-neu"
      >
        <Navbar className="neu-navbar">
          <NavLeft>
            <div
              className="neu-btn-circle"
              style={{ width: "36px", height: "36px", cursor: "pointer" }}
              onClick={() => navigate("/maquette")}
            >
              <Icon f7="arrow_left" style={{ fontSize: "20px" }} />
            </div>
          </NavLeft>
          <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
            Maquette
          </NavTitle>
        </Navbar>
        <Block strong>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p className="neu-text-secondary">Maquette niet gevonden</p>
            <Link href="/maquette" className="neu-text-accent">
              Terug naar alle maquettes
            </Link>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page name="single-maquette" id="single-maquette-page" className="page-neu">
      <Navbar className="neu-navbar">
        <NavLeft>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", cursor: "pointer" }}
            onClick={() => navigate("/maquette")}
          >
            <Icon f7="arrow_left" style={{ fontSize: "20px" }} />
          </div>
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          Maquette
        </NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            onClick={() => f7.sheet.open("#sheet-about")}
          >
            <Icon f7="info_circle" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      {/* Branding Section - School Logo and Name for Social Media Sharing */}
      <div style={{ padding: "10px 16px" }}>
        <div className="neu-card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              className="neu-avatar"
              style={{
                width: "60px",
                height: "60px",
                overflow: "hidden",
                marginRight: "15px",
              }}
            >
              <img
                src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
                alt="School Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scale(1.1)",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h3
                className="neu-text-primary"
                style={{ margin: "0", fontSize: "18px", fontWeight: 700 }}
              >
                {drivingSchool?.name || "Rijles Suriname"}
              </h3>
              {drivingSchool?.adminPhone && drivingSchool.adminPhone.trim() !== "" ? (
                <p
                  className="neu-text-accent"
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "14px",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  onClick={() => f7.actions.open("#actions-contact-school")}
                >
                  {drivingSchool.adminPhone}
                </p>
              ) : (
                <p
                  className="neu-text-secondary"
                  style={{ margin: "2px 0 0 0", fontSize: "14px" }}
                >
                  Rijles App
                </p>
              )}
            </div>
            {drivingSchool?.adminPhone && drivingSchool.adminPhone.trim() !== "" && (
              <div
                className="neu-btn"
                style={{
                  marginLeft: "10px",
                  padding: "10px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => f7.actions.open("#actions-contact-school")}
              >
                Contact
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maquette Canvas Recording */}
      <div style={{ padding: "0 16px", marginBottom: "20px" }}>
        <div
          id={`maquette-${maquetteNumber}`}
          className="neu-card"
          style={{ padding: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            {!drivingSchool?.logo && (
              <div
                style={{
                  width: "360px",
                  height: "360px",
                  backgroundColor: "white",
                  borderRadius: "20px",
                }}
              ></div>
            )}
            {drivingSchool?.logo && (
              <MaquetteCanvas
                ref={maquetteCanvasRef}
                logo={drivingSchool?.logo}
                maquetteNumber={maquetteNumber}
                maquetteData={maquette}
                roadsize={maquette?.roadsize}
                onVehicleClick={handleVehicleClick}
                width={350}
                height={350}
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ width: "40px" }} />
            {!isMaquetteRecording && !maquetteRecordedBlob && (
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "#ff3b30",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "20px",
                }}
                onClick={startMaquetteRecording}
              >
                <Icon f7="circle_fill" style={{ fontSize: "14px" }} />
                Record Video
              </div>
            )}
            {maquetteRecordedBlob && (
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "var(--app-primary-color)",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "20px",
                }}
                onClick={() => setShowPreviewSheet(true)}
              >
                <Icon f7="play_fill" style={{ fontSize: "14px" }} />
                View Video
              </div>
            )}
            {isMaquetteRecording && (
              <div
                className="neu-btn pulse-recording"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  backgroundColor: "#ff3b30",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "20px",
                }}
                onClick={stopMaquetteRecording}
              >
                <Icon f7="stop_fill" style={{ fontSize: "14px" }} />
                Stop Recording
              </div>
            )}

            <div
              className="neu-btn-circle"
              style={{ width: "40px", height: "40px", cursor: "pointer" }}
              onClick={shareMaquetteScreenshot}
            >
              <Icon
                f7="arrowshape_turn_up_right"
                style={{ fontSize: "18px" }}
              />
            </div>
          </div>

          <div className="maquette-top">
            <h2
              className="neu-text-primary"
              style={{ marginTop: "0px", fontWeight: 700 }}
            >
              {"#" + (maquetteNumber || "N/A")}
            </h2>
            <div style={{ width: "100%" }} />
          </div>

          {maquette.importantNotes && (
            <div
              className="neu-card-inset"
              style={{
                padding: "12px",
                marginBottom: "16px",
                backgroundColor: "var(--color-yellow-light)",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <Icon f7="info_circle_fill" size="16" color="blue" />
              <div>
                <div className="neu-text-primary" style={{ fontWeight: 600 }}>
                  {maquette?.title}
                </div>
                <div
                  className="neu-text-secondary"
                  dangerouslySetInnerHTML={{ __html: maquette.importantNotes }}
                />
              </div>
            </div>
          )}

          <CardFooter>
            <Button
              large
              iconF7="lightbulb"
              iconColor="orange"
              outline
              borderColor="orange"
              textColor="orange"
              text="Afk."
              sheetOpen={"#sheet-abbreviations"}
            />
            <div />
            <Button
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

          <div style={{ marginTop: "16px" }}>
            {showAnswer && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircle}
                    style={{ fontSize: "30px", color: "#34c759" }}
                  />
                  <strong className="neu-text-primary">Antwoord</strong>
                </div>
                <div
                  className="neu-text-secondary"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof maquette.sequence === "string"
                        ? maquette.sequence
                        : maquette.sequence || "Geen antwoord beschikbaar",
                  }}
                />
              </>
            )}

            {!showAnswer && (
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "10px",
                }}
                onClick={() => setShowAnswer(true)}
              >
                <Icon f7="eye_fill" style={{ fontSize: "18px" }} />
                Antwoord
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Free Trial and Referral Promotions */}
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

      <br />
      <br />
      <br />

      {/* Sheets and modals */}
      <Sheet id="sheet-abbreviations" style={{ height: "70vh" }}>
        <Abbreviations />
      </Sheet>

      <Sheet
        swipeToClose
        backdrop
        id="sheet-traffic-rules"
        style={{ height: "70vh" }}
      >
        <TrafficRulesSheet />
      </Sheet>

      {/* Preview Recording Sheet */}
      <Sheet
        opened={showPreviewSheet}
        onSheetClosed={() => setShowPreviewSheet(false)}
        swipeToClose
        backdrop
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavLeft></NavLeft>
            <NavTitle>Preview</NavTitle>
            <NavRight>
              {maquetteRecordedBlob && (
                <>
                  <div
                    className="neu-btn-circle"
                    style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                    onClick={() => {
                      setShowPreviewSheet(false);
                      deleteMaquetteRecording();
                    }}
                  >
                    <Icon f7="trash_fill" style={{ fontSize: "18px", color: "var(--f7-theme-color-red)" }} />
                  </div>
                  <div
                    className="neu-btn-circle"
                    style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                    onClick={shareMaquetteRecording}
                  >
                    <Icon f7="square_arrow_up" style={{ fontSize: "18px", color: "var(--f7-theme-color-green)" }} />
                  </div>
                </>
              )}
              <div
                className="neu-btn-circle"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                onClick={() => setShowPreviewSheet(false)}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>

          <Block
            style={{
              alignItems: "center",
              height: "calc(70vh - 60px)",
              padding: "10px",
              margin: 0,
              overflow: "hidden",
            }}
          >
            {maquetteRecordedBlob && showPreviewSheet && (
              <VideoPlayer
                blob={maquetteRecordedBlob}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            )}
          </Block>
        </Page>
      </Sheet>

      {/* Promotional Social Media Texts Sheet */}
      <Sheet
        opened={showPromoSheet}
        onSheetClosed={() => setShowPromoSheet(false)}
        swipeToClose
        backdrop
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavLeft></NavLeft>
            <NavTitle>📱 Social Media Posts</NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
                onClick={() => setShowPromoSheet(false)}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>

          <Block>
            {/* Download Screenshot Button */}
            <Block inset>
              <div
                className="neu-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: maquetteRecordedBlob ? "12px" : "20px",
                  backgroundColor: "var(--app-primary-color)",
                  color: "white",
                }}
                onClick={downloadScreenshot}
              >
                <Icon
                  f7="arrow_down_circle_fill"
                  style={{ fontSize: "20px" }}
                />
                Download Screenshot
              </div>

              {/* Download Video Button - only show if video was recorded */}
              {maquetteRecordedBlob && (
                <div
                  className="neu-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px 24px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "20px",
                    backgroundColor: "#34c759",
                    color: "white",
                  }}
                  onClick={downloadMaquetteRecording}
                >
                  <Icon
                    f7="arrow_down_circle_fill"
                    style={{ fontSize: "20px" }}
                  />
                  Download Video
                </div>
              )}
            </Block>

            <p className="neu-text-secondary" style={{ marginBottom: "16px" }}>
              Kies een tekst en kopieer om te delen op social media. 📸
            </p>

            {getPromoTexts().map((promo, index) => (
              <Card key={index} style={{ marginBottom: "16px" }}>
                <CardContent>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <h3
                      className="neu-text-primary"
                      style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}
                    >
                      {promo.title}
                    </h3>
                    <div
                      className="neu-btn-circle"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "var(--app-primary-color)",
                        cursor: "pointer",
                      }}
                      onClick={() => copyToClipboard(promo.text)}
                    >
                      <Icon
                        f7="doc_on_clipboard"
                        style={{ fontSize: "16px", color: "white" }}
                      />
                    </div>
                  </div>
                  <div
                    className="neu-text-secondary"
                    style={{
                      whiteSpace: "pre-line",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {promo.text}
                  </div>
                </CardContent>
                <CardFooter>
                  <div
                    className="neu-btn"
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "center",
                    }}
                    onClick={() => copyToClipboard(promo.text)}
                  >
                    <Icon
                      f7="doc_on_clipboard"
                      style={{ marginRight: "6px" }}
                    />
                    Kopieer Tekst
                  </div>
                </CardFooter>
              </Card>
            ))}
          </Block>
        </Page>
      </Sheet>

      <AboutSheet />

      {/* Contact School Action Sheet */}
      <Actions id="actions-contact-school" className="neu-actions">
        <ActionsGroup>
          <ActionsLabel>Neem contact op over:</ActionsLabel>
          <ActionsButton
            onClick={() => {
              if (!drivingSchool?.adminPhone) {
                f7.dialog.alert("Geen telefoonnummer gevonden voor de beheerder.");
                return;
              }
              const message =
                `Hallo ${drivingSchool?.name || ""
                },\n\nIk wil mij graag inschrijven voor rijlessen.\n\nMet vriendelijke groet`;
              openWhatsAppWithPhone({
                phone: drivingSchool.adminPhone,
                message,
              });
            }}
          >
            📝 Inschrijving
          </ActionsButton>
          <ActionsButton
            onClick={() => {
              if (!drivingSchool?.adminPhone) {
                f7.dialog.alert("Geen telefoonnummer gevonden voor de beheerder.");
                return;
              }
              const message =
                `Hallo ${drivingSchool?.name || ""
                },\n\nIk wil graag informatie over de tarieven voor rijlessen.\n\nMet vriendelijke groet`;
              openWhatsAppWithPhone({
                phone: drivingSchool.adminPhone,
                message,
              });
            }}
          >
            💰 Tarieven
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Cancel</ActionsButton>
        </ActionsGroup>
      </Actions>
    </Page>
  );
};

export default SingleMaquettePage;


