import React, { useEffect, useRef, useState } from "react";
import MaquetteSVG from "./MaquetteSVG";
import { useMaquetteEvents } from "../contexts/MaquetteEventContext";

const MaquetteAnimation = ({
  type = null,
  quadrant = "top",
  rotate = "0deg",
  style = {},
  vehicles = [],
  maquetteNumber = 1,
  note = "",
  onVehicleClick = null,
  indexMaquette = 0,
  trafficsign = "",
  trafficSignRotate = 0,
}) => {
  const svgContainerRef = useRef(null);
  const animationRefs = useRef({});
  const [isAnimating, setIsAnimating] = useState({});
  const activeAnimations = useRef(0); // Track active animations in this quadrant
  const safetyTimeoutRef = useRef(null); // Track safety timeout to clear when animations complete
  const { addEventListener, removeEventListener, dispatchEvent, EVENTS } =
    useMaquetteEvents();

  useEffect(() => {
    const loadAnimeJS = () => {
      return new Promise((resolve, reject) => {
        if (window.anime && typeof window.anime === "function") {
          resolve(window.anime);
        } else {
          // Remove any existing anime.js script tags to prevent duplicates
          const existingScripts = document.querySelectorAll(
            'script[src*="animejs"]'
          );
          existingScripts.forEach((script) => script.remove());

          // Clear the window.anime reference to force reload
          if (window.anime) {
            delete window.anime;
          }

          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js";
          script.onload = () => {
            if (window.anime && typeof window.anime === "function") {
              resolve(window.anime);
            } else {
              reject(new Error("anime.js failed to load properly"));
            }
          };
          script.onerror = () =>
            reject(new Error("Failed to load anime.js script"));
          document.head.appendChild(script);
        }
      });
    };

    // Listen for play-animation events
    const handlePlayAnimation = (event) => {
      // Only respond to events for this specific maquette
      if (
        event.detail.maquetteNumber === maquetteNumber &&
        event.detail.quadrant === quadrant
      ) {
        playQuadrantAnimations(event.detail.order);
      }
    };

    // Listen for reset-animation events
    const handleResetAnimation = () => {
      resetQuadrantAnimations();
    };

    addEventListener(EVENTS.PLAY_ANIMATION, handlePlayAnimation);
    addEventListener(EVENTS.RESET_ANIMATION, handleResetAnimation);

    const init = async () => {
      try {
        await loadAnimeJS();
      } catch (error) {
        console.error("Failed to load anime.js:", error);
      }
    };

    init();

    return () => {
      // Cancel all active animations
      Object.values(animationRefs.current).forEach((ref) => {
        if (ref) cancelAnimationFrame(ref);
      });
      // Clear the animationRefs to prevent stale references
      animationRefs.current = {};

      // Clear the safety timeout on component unmount
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }

      removeEventListener(EVENTS.PLAY_ANIMATION, handlePlayAnimation);
      removeEventListener(EVENTS.RESET_ANIMATION, handleResetAnimation);
    };
  }, [quadrant, maquetteNumber, addEventListener, removeEventListener, EVENTS]);

  const startAnimation = (elementId, pathElement) => {
    if (isAnimating[elementId]) return;

    const element = document.getElementById(elementId);
    if (!element || !pathElement) return;

    // Increment active animations counter
    activeAnimations.current = activeAnimations.current + 1;
    setIsAnimating((prev) => ({ ...prev, [elementId]: true }));

    const path = pathElement;
    const pathLength = path.getTotalLength();

    // Get the initial transform of the group
    const initialTransform = element.getAttribute("transform") || "";

    // Store initial transform as data attribute for reset functionality
    element.setAttribute("data-initial-transform", initialTransform);

    // Use fixed sizes for vehicles based on CSS
    const isBike = elementId.startsWith("bike-");
    const elementWidth = isBike ? 9.54 : 21.91;
    const elementHeight = 41.22;

    // Calculate center based on fixed sizes
    const centerX = elementWidth / 2;
    const centerY = elementHeight / 2;

    // Get current position of the object from the transform attribute
    let currentTranslateX = 0;
    let currentTranslateY = 0;

    // Extract translate values from the transform attribute in the SVG (e.g., "translate(317, 120)")
    const transformMatch = initialTransform.match(
      /translate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/
    );
    if (transformMatch) {
      currentTranslateX = parseFloat(transformMatch[1]) || 0;
      currentTranslateY = parseFloat(transformMatch[2]) || 0;
    }

    // Calculate current position along the path (center of the element)
    const currentX = currentTranslateX + centerX;
    const currentY = currentTranslateY + centerY;

    // Find closest point on path to current position
    let closestDistance = Infinity;
    let startPathProgress = 0;
    const samplePoints = 200; // Reduced from 500 to 200 to improve performance

    for (let i = 0; i <= samplePoints; i++) {
      const progress = i / samplePoints;
      const point = path.getPointAtLength(pathLength * progress);
      const distance = Math.sqrt(
        Math.pow(point.x - currentX, 2) + Math.pow(point.y - currentY, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        startPathProgress = progress;
      }
    }

    let startTime = null;
    const duration = 1500; // Reduced from 2500 to 1500ms to improve performance

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      // Apply ease-in function (square of progress for acceleration effect)
      const progress = Math.pow(rawProgress, 2);

      if (element) {
        // Animate from current position to the opposite end of the path
        // If starting near the beginning, go to the end, and vice versa
        let pathProgress;
        if (startPathProgress < 0.5) {
          // Starting near the beginning, animate to the end
          pathProgress = startPathProgress + (1 - startPathProgress) * progress;
        } else {
          // Starting near the end, animate to the beginning
          pathProgress = startPathProgress - startPathProgress * progress;
        }

        const point = path.getPointAtLength(pathLength * pathProgress);

        // Calculate tangent for orientation
        const delta = 0.01; // Small delta for calculating tangent
        const direction = startPathProgress < 0.5 ? -1 : 1; // Direction of movement
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

        // Apply transformation: translate to path point and rotate with 90-degree compensation
        const translateX = point.x - centerX;
        const translateY = point.y - centerY;

        // Combine translation and rotation with 90-degree compensation
        element.setAttribute(
          "transform",
          `translate(${translateX}, ${translateY}) rotate(${
            angleDegrees + 90
          }, ${centerX}, ${centerY})`
        );

        // Animation complete
        if (progress >= 1) {
          // Make the element invisible at the end of animation
          element.style.visibility = "hidden";
          element.style.opacity = "0";

          // Decrement active animations counter
          activeAnimations.current = activeAnimations.current - 1;

          // Check if all animations in this quadrant are complete
          if (activeAnimations.current <= 0) {
            // Clear the safety timeout since animations completed successfully
            if (safetyTimeoutRef.current) {
              clearTimeout(safetyTimeoutRef.current);
              safetyTimeoutRef.current = null;
            }
            // Dispatch a custom event to indicate this quadrant's animations have completed
            dispatchEvent(EVENTS.ANIMATION_COMPLETE, {
              quadrant,
              maquetteNumber,
            });
          }

          setTimeout(() => {
            setIsAnimating((prev) => ({ ...prev, [elementId]: false }));
          }, 100);

          return;
        }
      }

      animationRefs.current[elementId] = requestAnimationFrame(animate);
    };

    animationRefs.current[elementId] = requestAnimationFrame(animate);
  };

  const playQuadrantAnimations = (order) => {
    if (svgContainerRef.current) {
      const svg = svgContainerRef.current.querySelector("svg");
      if (svg) {
        if (vehicles?.length === 0) {
          // Dispatch completion event immediately if no vehicles
          dispatchEvent(EVENTS.ANIMATION_COMPLETE, {
            quadrant,
            maquetteNumber,
          });
          return;
        }

        // Get all vehicle group elements
        const groupElements = Array.from(
          svg.querySelectorAll('[id^="car-"], [id^="bike-"]')
        );

        // Parse the order string (e.g., "1+3-2-4+5-6-7")
        if (!order) {
          console.error("NO Order Specified");
          // Dispatch completion event if no order
          dispatchEvent(EVENTS.ANIMATION_COMPLETE, {
            quadrant,
            maquetteNumber,
          });
          return;
        }

        // Split by '-' to get groups that should play sequentially
        const animationGroups = order.split("-");
        let delay = 100;

        animationGroups.forEach((group, groupIndex) => {
          // Split by '+' to get items that should play simultaneously within a group
          const simultaneousItems = group.split("+");

          simultaneousItems.forEach((objName) => {
            // Find the element with the matching objName
            const elmIndex = groupElements.findIndex(
              (el) =>
                el.id.split("|")?.[1]?.toLowerCase() === objName?.toLowerCase()
            );

            if (elmIndex >= 0) {
              const element = elmIndex !== -1 ? groupElements[elmIndex] : null;
              const objId = element.id;
              const idParts = objId.split("-");
              const vehicleDirection = idParts[2]; // Direction is the 3rd part

              if (vehicleDirection.length > 0) {
                setTimeout(() => {
                  // Create index mapping
                  const indexMapping = {};
                  for (let i = 0; i <= 35; i++) {
                    indexMapping[i] = (i % 4) + 1;
                  }

                  // Determine the correct index for path selection
                  const pathIndex = indexMapping[elmIndex] || 1;

                  const pathId =
                    "path-" +
                    vehicleDirection +
                    "-" +
                    pathIndex +
                    "-" +
                    quadrant +
                    "quadrant-" +
                    maquetteNumber;
                  const pathElement = svg.querySelector(`#${pathId}`);

                  if (pathElement) {
                    startAnimation(objId, pathElement);
                  }
                }, delay);
              }
            }
          });

          // Add 1000ms delay for next group
          delay += 1000;
        });

        // Set a timeout to ensure we dispatch completion even if something goes wrong
        // This should be longer than the total animation time
        // Clear any existing timeout to prevent multiple timeouts
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
        }

        // Base animation time (1500ms) + reasonable buffer (500ms) = 2000ms max
        const safetyTimeout = 2000; // 2 seconds should be enough for animations to complete
        safetyTimeoutRef.current = setTimeout(() => {
          safetyTimeoutRef.current = null; // Clear the reference
          dispatchEvent(EVENTS.ANIMATION_COMPLETE, {
            quadrant,
            maquetteNumber,
          });
        }, safetyTimeout); // Use fixed reasonable timeout
      }
    }
  };

  const resetQuadrantAnimations = () => {
    if (svgContainerRef.current) {
      const svg = svgContainerRef.current.querySelector("svg");
      if (svg) {
        // Reset active animations counter
        activeAnimations.current = 0;

        // Clear the safety timeout when resetting
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }

        // Get all vehicle group elements
        const groupElements = Array.from(
          svg.querySelectorAll('[id^="car-"], [id^="bike-"]')
        );

        // Reset each vehicle to its initial position
        groupElements.forEach((group) => {
          const objId = group.id;

          const initialTransform = group.getAttribute("data-initial-transform");

          // Make the element visible again
          group.style.visibility = "visible";
          group.style.opacity = "1";

          if (initialTransform) {
            group.setAttribute("transform", initialTransform);
          } else {
            group.removeAttribute("transform");
          }

          // Reset animation state
          setIsAnimating((prev) => ({ ...prev, [objId]: false }));
        });
      }
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        width: "360px",
        height: "360px",
        margin: "0 auto",
        ...style,
      }}
    >
      <div
        ref={svgContainerRef}
        style={{ width: "100%", height: "100%", rotate: rotate }}
      >
        <MaquetteSVG
          maquetteNumber={maquetteNumber}
          vehicles={vehicles}
          type={type}
          quadrant={quadrant}
          note={note}
          onVehicleClick={onVehicleClick}
          indexMaquette={indexMaquette}
          trafficsign={trafficsign}
          trafficSignRotate={trafficSignRotate}
        />
      </div>
    </div>
  );
};

export default MaquetteAnimation;
