import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";
import { PATH_DEFINITIONS } from "../js/pathDefinitions";

/**
 * MaquetteNonCanvas - An SVG and div-based renderer for maquettes with CSS animations.
 * This is a non-canvas alternative to MaquetteCanvas that uses SVG and CSS for rendering.
 */
const MaquetteNonCanvas = forwardRef(
  (
    {
      isPlain,
      logo,
      maquetteNumber,
      maquetteData,
      roadsize,
      onVehicleClick,
      width = 360,
      height = 360,
      drivingSchool,
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const imagesRef = useRef({});
    const pathsRef = useRef(null); // SVG element for path calculations
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Animation state
    const vehicleAnimationsRef = useRef({});

    // Play/Reset button state (use refs to avoid stale closures in animation loop)
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const isPlayingRef = useRef(false);
    const hasPlayedRef = useRef(false);

    // Maquette events context
    const { addEventListener, removeEventListener, dispatchEvent, EVENTS } =
      useMaquetteEvents();

    // Dimensions
    const CANVAS_SIZE = 360;
    const SVG_SIZE = 497;
    const SCALE = CANVAS_SIZE / SVG_SIZE;

    // Vehicle positions in SVG coordinates (from MaquetteSVG)
    const VEHICLE_POSITIONS = [
      // Row 0 (y=120)
      [
        { x: 317, y: 120, isBike: true },
        { x: 281, y: 120, isBike: false },
        { x: 254, y: 120, isBike: false },
        { x: 227, y: 120, isBike: false },
      ],
      // Row 1 (y=60)
      [
        { x: 317, y: 60, isBike: true },
        { x: 281, y: 60, isBike: false },
        { x: 254, y: 60, isBike: false },
        { x: 227, y: 60, isBike: false },
      ],
      // Row 2 (y=5)
      [
        { x: 317, y: 5, isBike: true },
        { x: 281, y: 5, isBike: false },
        { x: 254, y: 5, isBike: false },
        { x: 227, y: 5, isBike: false },
      ],
    ];

    // Vehicle sizes (150% of original)
    const BIKE_WIDTH = 9.54 * 3;
    const CAR_WIDTH = 21.91 * 1.3;
    const VEHICLE_HEIGHT = 41.22 * 1.3;

    // Quadrant rotations
    const QUADRANT_ROTATIONS = {
      top: 0,
      right: Math.PI * 0.5,
      bottom: Math.PI * 1,
      left: Math.PI * 1.5,
    };

    // Create hidden SVG element for path calculations
    useEffect(() => {
      if (pathsRef.current) return;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 497 497");
      svg.style.position = "absolute";
      svg.style.width = "0";
      svg.style.height = "0";
      svg.style.overflow = "hidden";

      // Create all paths
      Object.entries(PATH_DEFINITIONS).forEach(([direction, paths]) => {
        paths.forEach((d, index) => {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path.setAttribute("d", d);
          path.setAttribute("id", `svg-path-${direction}-${index + 1}`);
          path.setAttribute("fill", "none");
          svg.appendChild(path);
        });
      });

      document.body.appendChild(svg);
      pathsRef.current = svg;

      return () => {
        if (pathsRef.current) {
          document.body.removeChild(pathsRef.current);
          pathsRef.current = null;
        }
      };
    }, []);

    // Get path element for a direction and index
    const getPath = (direction, index) => {
      if (!pathsRef.current) return null;
      const pathIndex = Math.min(index, 3) + 1; // Now supports up to 4 paths (indices 0-3 map to path numbers 1-4)
      return pathsRef.current.querySelector(
        `#svg-path-${direction}-${pathIndex}`
      );
    };

    // Load image (with special handling for SVG files)
    const loadImage = (src) => {
      return new Promise(async (resolve) => {
        if (imagesRef.current[src]) {
          resolve(imagesRef.current[src]);
          return;
        }

        // Special handling for SVG files to ensure they render on canvas
        if (src.endsWith(".svg")) {
          try {
            const response = await fetch(src);
            const svgText = await response.text();
            const blob = new Blob([svgText], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
              imagesRef.current[src] = img;
              URL.revokeObjectURL(url); // Clean up blob URL
              resolve(img);
            };
            img.onerror = () => {
              console.warn(`Failed to load SVG: ${src}`);
              URL.revokeObjectURL(url);
              resolve(null);
            };
            img.src = url;
          } catch (error) {
            console.warn(`Failed to fetch SVG: ${src}`, error);
            resolve(null);
          }
        } else {
          // Standard image loading for non-SVG files
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            imagesRef.current[src] = img;
            resolve(img);
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            resolve(null);
          };
          img.src = src;
        }
      });
    };

    // Load all images
    const loadAllImages = async () => {
      const imagesToLoad = new Set();

      detectRoadType().forEach((roadType) => {
        if (roadType) imagesToLoad.add(`/roads/${roadType}.svg`);
      });

      detectBikeLane().forEach((bikelane) => {
        imagesToLoad.add(`/roads/${bikelane}.svg`);
      });

      const vehicleTypes = ["car", "bike", "ambulance", "firetruck", "police"];
      const directions = ["left", "right", "straight"];
      vehicleTypes.forEach((type) => {
        directions.forEach((dir) => {
          imagesToLoad.add(`/vehicles/${type}-${dir}.svg`);
        });
      });

      // Load driving school logo
      const logoSrc = logo || "/placeholders/placeholder-a02.jpg";
      imagesToLoad.add(logoSrc);

      // Load traffic signs
      ["top", "right", "bottom", "left"].forEach((side) => {
        const trafficsign = maquetteData?.[side]?.trafficsign;
        if (trafficsign) {
          imagesToLoad.add(trafficsign);
        }
      });

      await Promise.all([...imagesToLoad].map((src) => loadImage(src)));
      setImagesLoaded(true);
    };

    // Expose methods
    useImperativeHandle(ref, () => ({
      getContainer: () => containerRef.current,
      triggerAnimation: (vehicleName) => startAnimationByName(vehicleName),
      resetAnimations: () => {
        resetAllAnimations();
        setHasPlayed(false);
        hasPlayedRef.current = false;
        setIsPlaying(false);
        isPlayingRef.current = false;
      },
      playAnimations: () => playAllAnimations(),
    }));

    // Detect road types
    const detectRoadType = () => {
      if (!maquetteData) return ["junction"];

      let roadType = [];
      const nameMapping = {
        "INRIT S": "driveway-",
        "INRIT B": "driveway-",
        "INRIT S/B": "driveway-",
        ZANDWEG: "unpaved-",
        TCROSS: "t-junction-hide-",
      };

      let isJunction = true;
      ["top", "right", "bottom", "left"].forEach((side) => {
        const note = maquetteData?.[side]?.note;
        if (note && note === "TCROSS") {
          isJunction = false;
        }
      });

      if (isJunction) {
        roadType.push("junction");
      }

      ["top", "right", "bottom", "left"].forEach((side) => {
        const note = maquetteData?.[side]?.note;
        if (note && nameMapping[note]) {
          roadType.push(nameMapping[note] + side);
        }
      });

      return roadType;
    };

    // Detect bike lanes
    const detectBikeLane = () => {
      if (!maquetteData) return [];

      let bikelanes = [];
      ["top", "right", "bottom", "left"].forEach((side) => {
        const bl = maquetteData?.[side]?.bikelanes;
        if (bl) {
          bikelanes.push("bikelane-" + side);
        }
      });
      return bikelanes;
    };

    // Find closest point on path and get start progress (same logic as original)
    const findStartProgressOnPath = (
      path,
      vehicleX,
      vehicleY,
      vehWidth,
      vehHeight
    ) => {
      const pathLength = path.getTotalLength();
      const centerX = vehicleX + vehWidth / 2;
      const centerY = vehicleY + vehHeight / 2;

      let closestDistance = Infinity;
      let startPathProgress = 0;
      const samplePoints = 200;

      for (let i = 0; i <= samplePoints; i++) {
        const progress = i / samplePoints;
        const point = path.getPointAtLength(pathLength * progress);
        const distance = Math.sqrt(
          Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          startPathProgress = progress;
        }
      }

      return startPathProgress;
    };

    // Start animation by vehicle name(s) - supports multiple vehicles separated by '+' (e.g., "car1+car2+car3")
    const startAnimationByName = (vehicleName) => {
      if (!maquetteData || !vehicleName) return;

      // Split the vehicleName by '+' to handle multiple vehicle names
      const vehicleNames = vehicleName.split("+").map((name) => name.trim());

      vehicleNames.forEach((singleVehicleName) => {
        if (!singleVehicleName) return; // Skip empty names

        ["top", "right", "bottom", "left"].forEach((quadrant) => {
          const vehicles = maquetteData[quadrant]?.vehicles;
          if (!vehicles) return;

          vehicles.forEach((row, rowIndex) => {
            row?.forEach((vehicle, colIndex) => {
              if (
                vehicle?.name?.toLowerCase() === singleVehicleName.toLowerCase()
              ) {
                startVehicleAnimation(quadrant, rowIndex, colIndex, vehicle);
              }
            });
          });
        });
      });
    };

    // Start animation for a vehicle
    const startVehicleAnimation = (quadrant, rowIndex, colIndex, vehicle) => {
      const animKey = `${quadrant}-${rowIndex}-${colIndex}`;
      const pos = VEHICLE_POSITIONS[rowIndex][colIndex];
      const direction = vehicle.direction || "straight";

      // Get the path element - now all directions have 4 paths (indices 0, 1, 2, 3)
      // Use colIndex directly, but cap at 3 for safety
      const pathIndex = Math.min(colIndex, 3);
      const path = getPath(direction, pathIndex);
      if (!path) {
        console.warn(
          `No path found for direction: ${direction}, index: ${pathIndex}`
        );
        return;
      }

      const vehWidth = pos.isBike ? BIKE_WIDTH : CAR_WIDTH;
      const vehHeight = VEHICLE_HEIGHT;
      const pathLength = path.getTotalLength();

      // Find where the vehicle starts on the path (same as original)
      const startPathProgress = findStartProgressOnPath(
        path,
        pos.x,
        pos.y,
        vehWidth,
        vehHeight
      );

      vehicleAnimationsRef.current[animKey] = {
        animating: true,
        hidden: false,
        startTime: performance.now(),
        duration: 1500,
        path,
        pathLength,
        startPathProgress,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        currentAngle: 0,
        vehWidth,
        vehHeight,
      };

      // Start update loop
      updateAnimations();
    };

    // Update animations (same logic as MaquetteAnimation)
    const updateAnimations = useCallback(() => {
      const now = performance.now();
      let anyActive = false;

      Object.keys(vehicleAnimationsRef.current).forEach((key) => {
        const anim = vehicleAnimationsRef.current[key];
        if (!anim?.animating) return;

        anyActive = true;
        const elapsed = now - anim.startTime;
        const rawProgress = Math.min(elapsed / anim.duration, 1);

        // Ease-in (same as original: Math.pow(rawProgress, 2))
        const progress = Math.pow(rawProgress, 2);

        const { path, pathLength, startPathProgress, vehWidth, vehHeight } =
          anim;

        // Calculate path progress (same logic as original)
        let pathProgress;
        if (startPathProgress < 0.5) {
          // Starting near beginning, animate to end
          pathProgress = startPathProgress + (1 - startPathProgress) * progress;
        } else {
          // Starting near end, animate to beginning
          pathProgress = startPathProgress - startPathProgress * progress;
        }

        // Get point on path
        const point = path.getPointAtLength(pathLength * pathProgress);

        // Calculate tangent for rotation (same as original)
        const delta = 0.01;
        const direction = startPathProgress < 0.5 ? -1 : 1;
        const nextPoint = path.getPointAtLength(
          Math.min(
            Math.max(0, pathLength * pathProgress + delta * direction),
            pathLength
          )
        );
        const tangentX = nextPoint.x - point.x;
        const tangentY = nextPoint.y - point.y;
        const angleRadians = Math.atan2(tangentY, tangentX);
        const angleDegrees = angleRadians * (180 / Math.PI);

        // Update position (centered)
        anim.currentX = point.x - vehWidth / 2;
        anim.currentY = point.y - vehHeight / 2;
        anim.currentAngle = (angleDegrees + 90) * (Math.PI / 180); // Convert to radians with 90deg offset

        if (rawProgress >= 1) {
          anim.animating = false;
          anim.hidden = true;

          dispatchEvent(EVENTS.NONCANVAS_ANIMATION_COMPLETE, {
            maquetteNumber,
            key,
          });
        }
      });

      if (anyActive) {
        requestAnimationFrame(updateAnimations);
      }
    }, [dispatchEvent, maquetteNumber]);

    // Reset animations
    const resetAllAnimations = () => {
      vehicleAnimationsRef.current = {};
    };

    // Play all animations in sequence
    const playAllAnimations = () => {
      console.log("playAllAnimations called", {
        isPlaying: isPlayingRef.current,
        maquetteData,
      });
      if (isPlayingRef.current || !maquetteData) return;

      setIsPlaying(true);
      isPlayingRef.current = true;
      const sequence = maquetteData.sequence;
      console.log("Sequence:", sequence);
      if (!sequence) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setHasPlayed(true);
        hasPlayedRef.current = true;
        return;
      }

      // Parse sequence (e.g., "F4-5+6-F10" -> [["F4"], ["5", "6"], ["F10"]])
      // Split by '-' to get groups that should play sequentially
      // Split by '+' to get items that should play simultaneously within a group
      const animationGroups = sequence
        .replace(/\s+/g, "")
        .split("-")
        .map((group) => group.split("+"));
      let groupIndex = 0;

      const playNext = () => {
        if (groupIndex >= animationGroups.length) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setHasPlayed(true);
          hasPlayedRef.current = true;
          return;
        }

        const simultaneousVehicles = animationGroups[groupIndex];
        let completedCount = 0;

        // Play all vehicles in the current group simultaneously
        simultaneousVehicles.forEach((vehicleName) => {
          startAnimationByName(vehicleName);

          // Listen for animation complete
          const handleComplete = (event) => {
            // Only count completions for animations we started
            const animKey = event.detail.key;
            if (
              animKey &&
              Object.keys(vehicleAnimationsRef.current).some(
                (key) =>
                  key === animKey && vehicleAnimationsRef.current[key]?.hidden
              )
            ) {
              removeEventListener(
                EVENTS.NONCANVAS_ANIMATION_COMPLETE,
                handleComplete
              );
              completedCount++;

              // When all simultaneous animations complete, move to next group
              if (completedCount >= simultaneousVehicles.length) {
                groupIndex++;
                setTimeout(playNext, 100);
              }
            }
          };
          addEventListener(EVENTS.NONCANVAS_ANIMATION_COMPLETE, handleComplete);
        });
      };

      playNext();
    };

    // Reset all state
    const handleReset = () => {
      resetAllAnimations();
      setHasPlayed(false);
      hasPlayedRef.current = false;
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    // Handle button click (from overlay)
    const handleButtonClick = (e) => {
      e.stopPropagation();
      if (!isPlayingRef.current && !hasPlayedRef.current) {
        playAllAnimations();
      } else if (!isPlayingRef.current && hasPlayedRef.current) {
        handleReset();
      }
    };

    // Handle click
    const handleContainerClick = (e) => {
      // Handle vehicle click
      if (!onVehicleClick || !maquetteData) return;

      // For simplicity in this SVG version, we'll just use the container's bounding rect
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
      const clickY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);

      ["top", "right", "bottom", "left"].forEach((quadrant) => {
        const vehicles = maquetteData[quadrant]?.vehicles;
        if (!vehicles) return;

        const rotation = QUADRANT_ROTATIONS[quadrant];
        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;

        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const dx = clickX - centerX;
        const dy = clickY - centerY;
        const localX = centerX + dx * cos - dy * sin;
        const localY = centerY + dx * sin + dy * cos;

        VEHICLE_POSITIONS.forEach((row, rowIndex) => {
          row.forEach((pos, colIndex) => {
            const vehicle = vehicles[rowIndex]?.[colIndex];
            if (!vehicle || vehicle.type === "space") return;

            const animKey = `${quadrant}-${rowIndex}-${colIndex}`;
            const anim = vehicleAnimationsRef.current[animKey];
            if (anim?.hidden) return;

            const vehWidth = pos.isBike ? BIKE_WIDTH : CAR_WIDTH;
            let scaledX = pos.x * SCALE;
            const scaledY = pos.y * SCALE;
            const scaledW = vehWidth * SCALE;
            const scaledH = VEHICLE_HEIGHT * SCALE;

            // Apply same adjustment for 4th column as in drawing
            if (colIndex === 3) {
              scaledX += -25 * SCALE;
            }

            if (
              localX >= scaledX &&
              localX <= scaledX + scaledW &&
              localY >= scaledY &&
              localY <= scaledY + scaledH
            ) {
              // Call the vehicle click callback (for dialog) - don't start animation automatically
              onVehicleClick(vehicle);
            }
          });
        });
      });
    };

    // Load images
    useEffect(() => {
      if (maquetteData) {
        setImagesLoaded(false);
        loadAllImages();
      }
    }, [maquetteData]);

    // Listen for events
    useEffect(() => {
      const handlePlayAnimation = (event) => {
        if (
          event.detail.maquetteNumber === maquetteNumber &&
          event.detail.order
        ) {
          startAnimationByName(event.detail.order);
        }
      };

      const handleResetAnimation = () => {
        resetAllAnimations();
        setHasPlayed(false);
        hasPlayedRef.current = false;
        setIsPlaying(false);
        isPlayingRef.current = false;
      };

      // Show reset button after any animation completes (including individual vehicle clicks)
      const handleAnimationComplete = (event) => {
        if (event.detail.maquetteNumber === maquetteNumber) {
          // Only show reset if not in the middle of playing a sequence
          if (!isPlayingRef.current) {
            setHasPlayed(true);
            hasPlayedRef.current = true;
          }
        }
      };

      addEventListener(EVENTS.PLAY_ANIMATION, handlePlayAnimation);
      addEventListener(EVENTS.RESET_ANIMATION, handleResetAnimation);
      addEventListener(
        EVENTS.NONCANVAS_ANIMATION_COMPLETE,
        handleAnimationComplete
      );

      return () => {
        removeEventListener(EVENTS.PLAY_ANIMATION, handlePlayAnimation);
        removeEventListener(EVENTS.RESET_ANIMATION, handleResetAnimation);
        removeEventListener(
          EVENTS.NONCANVAS_ANIMATION_COMPLETE,
          handleAnimationComplete
        );
      };
    }, [maquetteNumber, addEventListener, removeEventListener, EVENTS]);

    // Update refs when state changes
    useEffect(() => {
      isPlayingRef.current = isPlaying;
      hasPlayedRef.current = hasPlayed;
    }, [isPlaying, hasPlayed]);

    // Render vehicle for a specific position
    const renderVehicle = (quadrant, rowIndex, colIndex) => {
      const vehicle =
        maquetteData?.[quadrant]?.vehicles?.[rowIndex]?.[colIndex];
      if (!vehicle || vehicle.type === "space") return null;

      const animKey = `${quadrant}-${rowIndex}-${colIndex}`;
      const anim = vehicleAnimationsRef.current[animKey];

      if (anim?.hidden) return null;

      const pos = VEHICLE_POSITIONS[rowIndex][colIndex];
      const vehicleType = vehicle.type || "car";
      const direction = vehicle.direction || "straight";
      const vehWidth = pos.isBike ? BIKE_WIDTH : CAR_WIDTH;
      const vehHeight = VEHICLE_HEIGHT;

      let drawX = pos.x;
      let drawY = pos.y;
      let drawAngle = 0;

      if (anim?.animating) {
        drawX = anim.currentX;
        drawY = anim.currentY;
        drawAngle = anim.currentAngle;
      }

      // Adjust X position for 4th column vehicles (index 3) to align with their animation paths
      if (colIndex === 3) {
        drawX += -25; // Apply similar adjustment as in MaquetteSVG
      }

      // Apply quadrant transformation to the vehicle position
      const centerX = CANVAS_SIZE / 2;
      const centerY = CANVAS_SIZE / 2;
      let transformedX = drawX;
      let transformedY = drawY;

      switch (quadrant) {
        case 'top':
          // No transformation needed for top quadrant
          break;
        case 'right':
          // Rotate 90 degrees around center (180, 180)
          // new_x = 0 * (x - 180) - 1 * (y - 180) + 180 = -(y - 180) + 180 = 180 - y + 180 = 360 - y
          // new_y = 1 * (x - 180) + 0 * (y - 180) + 180 = (x - 180) + 180 = x
          transformedX = CANVAS_SIZE - drawY;
          transformedY = drawX;
          break;
        case 'bottom':
          // Rotate 180 degrees around center (180, 180)
          // new_x = -1 * (x - 180) - 0 * (y - 180) + 180 = -(x - 180) + 180 = 180 - x + 180 = 360 - x
          // new_y = 0 * (x - 180) + (-1) * (y - 180) + 180 = -(y - 180) + 180 = 360 - y
          transformedX = CANVAS_SIZE - drawX;
          transformedY = CANVAS_SIZE - drawY;
          break;
        case 'left':
          // Rotate 270 degrees around center (180, 180)
          // new_x = 0 * (x - 180) - (-1) * (y - 180) + 180 = (y - 180) + 180 = y
          // new_y = (-1) * (x - 180) + 0 * (y - 180) + 180 = -(x - 180) + 180 = 360 - x
          transformedX = drawY;
          transformedY = CANVAS_SIZE - drawX;
          break;
      }

      const scaledX = transformedX * SCALE;
      const scaledY = transformedY * SCALE;
      const scaledW = vehWidth * SCALE;
      const scaledH = vehHeight * SCALE;

      // Calculate rotation in radians for CSS transform
      let totalRotation = drawAngle; // Start with animation rotation

      // Apply quadrant rotation to the animation angle (like in canvas)
      const quadrantRotation = QUADRANT_ROTATIONS[quadrant];
      totalRotation += quadrantRotation;

      // Convert to degrees for CSS transform
      const rotationInDegrees = totalRotation * (180 / Math.PI);

      return (
        <div
          key={`${quadrant}-${rowIndex}-${colIndex}`}
          className="maquette-vehicle"
          style={{
            position: "absolute",
            left: `${scaledX}px`,
            top: `${scaledY}px`,
            width: `${scaledW}px`,
            height: `${scaledH}px`,
            transform: `rotate(${rotationInDegrees}deg)`,
            transformOrigin: "center",
            zIndex: 10,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onVehicleClick && onVehicleClick(vehicle);
          }}
        >
          <img
            src={`/vehicles/${vehicleType}-${direction}.svg`}
            alt={`${vehicleType} ${direction}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            draggable={false}
          />
          {vehicle.name && (
            <div
              style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%) rotate(${-rotationInDegrees}deg)", // Counter-rotate the name text to keep it upright
                fontSize: `${18 * SCALE}px`,
                fontWeight: "bold",
                color: "black",
                textShadow: "1px 1px 2px white, -1px -1px 2px white",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                zIndex: 11,
              }}
            >
              {vehicle.name}
            </div>
          )}
        </div>
      );
    };

    // Render vehicles for a quadrant
    const renderQuadrantVehicles = (quadrant) => {
      const vehicles = maquetteData?.[quadrant]?.vehicles;
      const note = maquetteData?.[quadrant]?.note;
      const trafficsign = maquetteData?.[quadrant]?.trafficsign;
      const trafficSignRotate =
        maquetteData?.[quadrant]?.trafficSignRotate || 0;

      if (!vehicles) return null;

      return (
        <div
          className="quadrant-vehicles"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {/* Render note text (like "INRIT S") - positioned at SVG coords (248.5, 25) */}
          {note && note !== "TCROSS" && (
            <div
              style={{
                position: "absolute",
                left: (() => {
                  // Apply quadrant transformation to note position
                  const x = 248.5;
                  const y = 25;
                  const centerX = CANVAS_SIZE / 2;
                  const centerY = CANVAS_SIZE / 2;

                  let transformedX = x;
                  let transformedY = y;

                  switch (quadrant) {
                    case 'top':
                      break;
                    case 'right':
                      transformedX = CANVAS_SIZE - y;
                      transformedY = x;
                      break;
                    case 'bottom':
                      transformedX = CANVAS_SIZE - x;
                      transformedY = CANVAS_SIZE - y;
                      break;
                    case 'left':
                      transformedX = y;
                      transformedY = CANVAS_SIZE - x;
                      break;
                  }

                  return `${transformedX * SCALE}px`;
                })(),
                top: (() => {
                  // Apply quadrant transformation to note position
                  const x = 248.5;
                  const y = 25;
                  const centerX = CANVAS_SIZE / 2;
                  const centerY = CANVAS_SIZE / 2;

                  let transformedX = x;
                  let transformedY = y;

                  switch (quadrant) {
                    case 'top':
                      break;
                    case 'right':
                      transformedX = CANVAS_SIZE - y;
                      transformedY = x;
                      break;
                    case 'bottom':
                      transformedX = CANVAS_SIZE - x;
                      transformedY = CANVAS_SIZE - y;
                      break;
                    case 'left':
                      transformedX = y;
                      transformedY = CANVAS_SIZE - x;
                      break;
                  }

                  return `${transformedY * SCALE}px`;
                })(),
                fontSize: `${20 * SCALE}px`,
                fontWeight: "bold",
                color: "#333",
                zIndex: 5,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {note === "ZANDWEG" ? "" : note}
            </div>
          )}

          {/* Render traffic sign - positioned at SVG coords (350, 100) */}
          {trafficsign && imagesLoaded && (
            <div
              style={{
                position: "absolute",
                left: (() => {
                  // Apply quadrant transformation to traffic sign position
                  const x = 350;
                  const y = 100;
                  const centerX = CANVAS_SIZE / 2;
                  const centerY = CANVAS_SIZE / 2;

                  let transformedX = x;
                  let transformedY = y;

                  switch (quadrant) {
                    case 'top':
                      break;
                    case 'right':
                      transformedX = CANVAS_SIZE - y;
                      transformedY = x;
                      break;
                    case 'bottom':
                      transformedX = CANVAS_SIZE - x;
                      transformedY = CANVAS_SIZE - y;
                      break;
                    case 'left':
                      transformedX = y;
                      transformedY = CANVAS_SIZE - x;
                      break;
                  }

                  return `${transformedX * SCALE}px`;
                })(),
                top: (() => {
                  // Apply quadrant transformation to traffic sign position
                  const x = 350;
                  const y = 100;
                  const centerX = CANVAS_SIZE / 2;
                  const centerY = CANVAS_SIZE / 2;

                  let transformedX = x;
                  let transformedY = y;

                  switch (quadrant) {
                    case 'top':
                      break;
                    case 'right':
                      transformedX = CANVAS_SIZE - y;
                      transformedY = x;
                      break;
                    case 'bottom':
                      transformedX = CANVAS_SIZE - x;
                      transformedY = CANVAS_SIZE - y;
                      break;
                    case 'left':
                      transformedX = y;
                      transformedY = CANVAS_SIZE - x;
                      break;
                  }

                  return `${transformedY * SCALE}px`;
                })(),
                width: `${50 * SCALE}px`,
                height: `${50 * SCALE}px`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: `${10 * SCALE}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={trafficsign}
                  alt="Traffic sign"
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `rotate(${180 + trafficSignRotate}deg)`,
                    objectFit: "contain",
                  }}
                  draggable={false}
                />
              </div>
            </div>
          )}

          {VEHICLE_POSITIONS.map((row, rowIndex) =>
            row.map((pos, colIndex) =>
              renderVehicle(quadrant, rowIndex, colIndex)
            )
          )}
        </div>
      );
    };

    // Button constants for overlay positioning
    const BUTTON_SIZE = 50;
    const BUTTON_SCALE = width / CANVAS_SIZE;

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={handleContainerClick}
      >
        {/* Background roads - using images for proper rendering */}
        {imagesLoaded &&
          detectRoadType().map((roadType) => {
            if (roadType) {
              return (
                <img
                  key={`road-${roadType}`}
                  src={`/roads/${roadType}.svg`}
                  alt={`Road ${roadType}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              );
            }
            return null;
          })}

        {/* Bike lanes */}
        {imagesLoaded &&
          detectBikeLane().map((bikelane) => {
            return (
              <img
                key={`bikelane-${bikelane}`}
                src={`/roads/${bikelane}.svg`}
                alt={`Bike lane ${bikelane}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            );
          })}

        {/* Render vehicles for all quadrants */}
        {["top", "right", "bottom", "left"].map((quadrant) =>
          renderQuadrantVehicles(quadrant)
        )}

        {/* Road size label */}
        {roadsize && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#333",
              zIndex: 5,
            }}
          >
            {roadsize}
          </div>
        )}

        {/* Driving school logo */}
        {!isPlain && logo && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              border: "2px solid #eee",
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            <img
              src={logo}
              alt="Driving School Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Play/Reset button overlay */}
        {!isPlain && (
          <button
            onClick={handleButtonClick}
            style={{
              position: "absolute",
              top: `${
                (CANVAS_SIZE / 2 - 40) * BUTTON_SCALE - BUTTON_SIZE / 2
              }px`,
              left: `${(CANVAS_SIZE / 2) * BUTTON_SCALE - BUTTON_SIZE / 2}px`,
              width: `${BUTTON_SIZE}px`,
              height: `${BUTTON_SIZE}px`,
              borderRadius: "50%",
              border: `2px solid ${hasPlayed ? "#ff3b30" : "#fff"}`,
              backgroundColor: hasPlayed
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(255, 255, 255, 0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              zIndex: 30,
            }}
          >
            {!hasPlayed ? (
              // Play icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              // Reset icon
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff3b30"
                strokeWidth="2.5"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }
);

MaquetteNonCanvas.displayName = "MaquetteNonCanvas";

export default MaquetteNonCanvas;
