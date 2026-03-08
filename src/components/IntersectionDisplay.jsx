import React from "react";
import "./IntersectionDisplay.css";
import { mergeStreetSettings } from "../js/utils";

// Utility function to determine road type for Suriname traffic system
const getRoadType = (roadData, intersectionData) => {
  if (!roadData || !roadData.note) return "doorgaande";

  const note = roadData.note.toUpperCase();

  // INRIT roads (entry roads that must yield)
  if (note.includes("INRIT")) {
    if (note.includes("INRIT S")) return "inrit-s";
    if (note.includes("INRIT B")) return "inrit-b";
    return "inrit";
  }

  // TCROSS (T-intersection roads)
  if (note.includes("TCROSS")) {
    return "tcross";
  }

  // Check if this is an eindigende weg (ending road)
  // A road is eindigende if it has INRIT or TCROSS across from it
  if (intersectionData) {
    const hasInritOrTcrossAcross = Object.values(intersectionData).some(
      (road) => {
        if (road && road.note) {
          const roadNote = road.note.toUpperCase();
          return roadNote.includes("INRIT") || roadNote.includes("TCROSS");
        }
        return false;
      }
    );

    if (hasInritOrTcrossAcross) {
      return "eindigende";
    }
  }

  // Doorgaande weg overrides zandweg
  if (!note.includes("ZANDWEG") && !note.includes("●")) {
    return "doorgaande";
  }

  // ZANDWEG (unpaved roads) - only if not a doorgaande weg
  if (note.includes("ZANDWEG") || note.includes("●")) {
    return "zandweg";
  }

  // Default - regular through road
  return "doorgaande";
};

// Utility function to determine destination road type based on vehicle direction and intersection
const getDestinationRoadType = (vehicle, roadData, intersectionData) => {
  if (!vehicle.direction || !intersectionData) return null;

  // Find which quadrant this road belongs to in the intersection
  let currentQuadrant = "";
  if (intersectionData.top === roadData) currentQuadrant = "top";
  else if (intersectionData.bottom === roadData) currentQuadrant = "bottom";
  else if (intersectionData.left === roadData) currentQuadrant = "left";
  else if (intersectionData.right === roadData) currentQuadrant = "right";

  if (!currentQuadrant) return null;

  // Determine destination quadrant based on current quadrant and vehicle direction
  // Account for the rotation of each road component in the intersection
  let destinationQuadrant = "";
  const direction = vehicle.direction.toLowerCase();

  switch (currentQuadrant) {
    case "top":
      // Top road is rotated 180° - directions are flipped
      if (direction === "straight") destinationQuadrant = "bottom";
      else if (direction === "left")
        destinationQuadrant = "right"; // 180° rotation: left becomes right
      else if (direction === "right") destinationQuadrant = "left"; // 180° rotation: right becomes left
      break;
    case "bottom":
      // Bottom road is not rotated (0°)
      if (direction === "straight") destinationQuadrant = "top";
      else if (direction === "left") destinationQuadrant = "left";
      else if (direction === "right") destinationQuadrant = "right";
      break;
    case "left":
      // Left road is rotated 90° clockwise
      if (direction === "straight") destinationQuadrant = "right";
      else if (direction === "left")
        destinationQuadrant = "top"; // 90° CW: left becomes top
      else if (direction === "right") destinationQuadrant = "bottom"; // 90° CW: right becomes bottom
      break;
    case "right":
      // Right road is rotated 270° clockwise (90° counter-clockwise)
      if (direction === "straight") destinationQuadrant = "left";
      else if (direction === "left")
        destinationQuadrant = "bottom"; // 270° CW: left becomes bottom
      else if (direction === "right") destinationQuadrant = "top"; // 270° CW: right becomes top
      break;
  }

  // Get destination road data
  if (destinationQuadrant && intersectionData[destinationQuadrant]) {
    const destinationRoad = intersectionData[destinationQuadrant];
    return getRoadType(destinationRoad, intersectionData);
  }

  return null;
};

// Reusable VehicleRow component
const VehicleRow = ({
  mode,
  rotate,
  vehicles,
  onVehicleClick,
  roadData,
  intersectionData,
  selectedVehicles = new Set(),
  side, // quadrant name (top, right, bottom, left)
  rowIndex, // row index in the 3x3 grid
  onDragStart, // drag start handler from parent
  onDragOver, // drag over handler from parent
  onDrop, // drop handler from parent
}) => {
  // Use the same rotation logic as the existing lane-note compensation
  const getTextRotation = (roadRotation) => {
    // Fix top road text only for now
    if (roadRotation === 180) {
      return 0; // Don't rotate the text, keep it normal
    }
    return 0; // Leave others unchanged for now
  };

  const getArrowDirection = ({ type, direction }) => {
    if (type === "space") {
      return "";
    }

    // Normalize the direction (handle typos like "stright")
    const normalizedDirection = direction && typeof direction.toLowerCase === 'function' ? direction.toLowerCase() : direction;

    switch (normalizedDirection) {
      case "left":
        return "↰";
      case "straight":
        return "↑";
      case "right":
        return "↱";
      case "back":
        return "↓";
      default:
        return "";
    }
  };

  // Get road type for this road
  const roadType = getRoadType(roadData, intersectionData);

  return (
    <div className="vehicle-row">
      {vehicles.map((vehicle, vehicleIndex) => {
        // Check if this vehicle is selected
        const vehicleId = `${vehicle.name}_${vehicle.type}_${vehicle.direction}`;
        const isSelected = selectedVehicles.has(vehicleId);


        // Get destination road type for this vehicle
        const destinationRoadType = getDestinationRoadType(
          vehicle,
          roadData,
          intersectionData
        );
        const isTurningIntoInrit =
          destinationRoadType && destinationRoadType.includes("inrit");

        // Only show space vehicles in edit mode
        if (vehicle.type === "space" && mode !== "edit") {
          return (
            <div
              key={vehicleIndex}
              className="vehicle-container empty-space"
              onDragOver={onDragOver}
              onDrop={(e) => {
                onDrop && onDrop(e, side, rowIndex, vehicleIndex)
              }}
            />
          );
        }

        const isDraggable = mode === "edit" && vehicle.type !== "space";

        return (
          <div
            key={vehicleIndex}
            className={`vehicle-container ${mode} ${
              isSelected ? "selected-vehicle" : ""
            } road-${roadType} ${
              isTurningIntoInrit ? "turning-into-inrit" : ""
            }`}
            onClick={() => {
              onVehicleClick({ ...vehicle, vehicleIndex })
            }}
            draggable={isDraggable}
            onDragStart={isDraggable ? (e) => {
              onDragStart && onDragStart(e, vehicle, side, rowIndex, vehicleIndex)
            } : undefined}
            onDragOver={onDragOver}
            onDrop={(e) => {
              onDrop && onDrop(e, side, rowIndex, vehicleIndex)
            }}
          >
            {/* Arrow indicator - color matches vehicle */}
            <div
              className={`arrow-indicator ${
                isSelected ? "selected-vehicle" : ""
              }`}
            >
              {getArrowDirection({
                type: vehicle && vehicle.type,
                direction: vehicle && vehicle.direction,
              })}
            </div>

            {/* Enhanced Vehicle rectangle */}
            <div
              className={`vehicle-rectangle ${
                vehicle.type
              } enhanced-vehicle road-${roadType} ${
                isTurningIntoInrit ? "turning-into-inrit" : ""
              } ${mode === "edit" && vehicle.type === "space" ? "edit" : ""}`}
              style={{
                transform: `rotate(${rotate}deg)`,
              }}
            >
              <span
                className="vehicle-name"
                style={{
                  transform: `rotate(${getTextRotation(rotate)}deg)`,
                  display: vehicle.type === "space" ? "none" : "inline-block",
                }}
              >
                {vehicle.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main component with JSON input
const VehicleDirectionDisplay = ({
  mode,
  rotate,
  data,
  onVehicleClick,
  onStreetClick,
  intersectionData,
  selectedVehicles = new Set(),
  side, // quadrant name
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  // Check if we have data to display

  return (
    <div className="vehicle-direction-display">
      <div className="container">
        {/* Vehicle Display Section */}
        <div className="vehicle-display-container">
          {data && data.bikelanes && (
            <div className={`vehicle-bike-lane ${data.bikelanes}`}></div>
          )}
          {data && data.trafficsign && (
            <div
              className="traffic-sign"
              onClick={() => {
                onStreetClick(data);
              }}
              style={{ cursor: "pointer" }}
            >
              <img src={data.trafficsign} style={{ width: "100%" }} />
            </div>
          )}
          <div className="lane-note">
            <div
              style={{
                position: "relative",
                top: "5px",
                transform: `rotate(${rotate == 180 ? rotate : 0}deg)`,
                cursor: "pointer",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor: "black",
                borderRadius: "5px",
                color: "black",
              }}
              onClick={() => {
                if (mode === "edit" && onStreetClick) {
                  onStreetClick(data);
                }
              }}
            >
              {data && data.note ? data.note : (mode === "edit" ? "Edit" : "")}
            </div>
          </div>
          <div className="road-container">
            {data && data.vehicles && data.vehicles.length > 0 &&
              data.vehicles
                .slice(0, 3)
                .map((row, rowIndex) => (
                  <VehicleRow
                    key={rowIndex}
                    mode={mode}
                    rotate={rotate}
                    vehicles={row.slice(0, 4)}
                    onVehicleClick={onVehicleClick}
                    roadData={data}
                    intersectionData={intersectionData}
                    selectedVehicles={selectedVehicles}
                    side={side}
                    rowIndex={rowIndex}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const IntersectionDisplay = ({
  side,
  mode,
  rotate,
  data,
  onVehicleClick,
  onStreetClick,
  intersectionData,
  selectedVehicles = new Set(),
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const defaultSettings = [
    [
      {
        id: `${side}01`,
        type: "space",
        direction: "straight",
        name: `${side}01`,
      },
      {
        id: `${side}02`,
        type: "space",
        direction: "straight",
        name: `${side}02`,
      },
      {
        id: `${side}03`,
        type: "space",
        direction: "straight",
        name: `${side}03`,
      },
      {
        id: `${side}04`,
        type: "space",
        direction: "straight",
        name: `${side}04`,
      },
    ],
    [
      {
        id: `${side}05`,
        type: "space",
        direction: "straight",
        name: `${side}05`,
      },
      {
        id: `${side}06`,
        type: "space",
        direction: "straight",
        name: `${side}06`,
      },
      {
        id: `${side}07`,
        type: "space",
        direction: "straight",
        name: `${side}07`,
      },
      {
        id: `${side}08`,
        type: "space",
        direction: "straight",
        name: `${side}08`,
      },
    ],
    [
      {
        id: `${side}09`,
        type: "space",
        direction: "straight",
        name: `${side}09`,
      },
      {
        id: `${side}10`,
        type: "space",
        direction: "straight",
        name: `${side}10`,
      },
      {
        id: `${side}11`,
        type: "space",
        direction: "straight",
        name: `${side}11`,
      },
      {
        id: `${side}12`,
        type: "space",
        direction: "straight",
        name: `${side}12`,
      },
    ],
  ];

  const convertedStreetData = mergeStreetSettings({ defaultSettings, data });

  // Handle empty data
  if ((data && data.tcross) || !data || Object.keys(data).length === 0) {
    return (
      <div className={`roadline-thin ${(data && data.bikelanes) || "hide"}`}>
        <div className="roadline-thin" />
      </div>
    );
  }

  return (
    <VehicleDirectionDisplay
      mode={mode}
      rotate={rotate}
      data={{ ...data, vehicles: convertedStreetData }}
      onVehicleClick={onVehicleClick}
      onStreetClick={onStreetClick}
      intersectionData={intersectionData}
      selectedVehicles={selectedVehicles}
      side={side}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
};

export default IntersectionDisplay;
