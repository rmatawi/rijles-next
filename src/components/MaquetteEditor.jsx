import React, { useEffect, useState } from "react";
import IntersectionDisplay from "./IntersectionDisplay";
import "./IntersectionDisplay.css";

const MaquetteEditor = ({
  mode,
  rotate,
  roadsize,
  data,
  onVehicleClick,
  onStreetClick,
  onRoadSizeClick,
  selectedVehicles = new Set(),
  onVehiclesUpdate, // New prop to handle vehicle position updates
}) => {
  // Define the road size options and cycling order
  const roadSizeOptions = ["S", "B", "S/B"];
  const currentOptionIndex = roadSizeOptions.indexOf(roadsize) !== -1 ? roadSizeOptions.indexOf(roadsize) : -1;

  const getNextRoadSize = () => {
    if (currentOptionIndex === -1) return roadSizeOptions[0]; // Default to first option if current value not in list
    return roadSizeOptions[(currentOptionIndex + 1) % roadSizeOptions.length];
  };

  // Extract data for each side, defaulting to empty objects if not present
  const editData = data || {};
  const topData = editData?.top || {};
  const rightData = editData?.right || {};
  const bottomData = editData?.bottom || {};
  const leftData = editData?.left || {};
  const adjust = "50px";

  // Handle drag and drop between quadrants
  const handleDragStart = (e, vehicle, fromQuadrant, rowIndex, colIndex) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      vehicle,
      fromQuadrant,
      rowIndex,
      colIndex
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = (e, toQuadrant, rowIndex, colIndex) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));

    if (!onVehiclesUpdate) return;

    // Call the update function with drag information
    onVehiclesUpdate(dragData, { toQuadrant, rowIndex, colIndex });
  };

  return (
    <div
      className="intersection-display"
      style={{
        transform: `rotate(${rotate}deg)`,
        userSelect: "none",
      }}
    >
      <div className="intersection-container">
        {/* Top street (rotated 180 degrees) */}
        <div
          className="street-top"
          style={{
            position: "absolute",
            top: adjust,
            left: "50%",
            transform: "translate(-50%, -50%) rotate(180deg)",
          }}
        >
          <IntersectionDisplay
            side={"top"}
            mode={mode}
            rotate={180 - rotate}
            data={topData}
            intersectionData={editData}
            onVehicleClick={onVehicleClick}
            onStreetClick={(streetData) =>
              onStreetClick && onStreetClick("top", streetData)
            }
            selectedVehicles={selectedVehicles}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>

        {/* Bottom street (no rotation) */}
        <div
          className="street-bottom"
          style={{
            position: "absolute",
            bottom: adjust,
            left: "50%",
            transform: "translate(-50%, 50%)",
          }}
        >
          <IntersectionDisplay
            side={"bottom"}
            mode={mode}
            rotate={0 - rotate}
            data={bottomData}
            intersectionData={editData}
            onVehicleClick={onVehicleClick}
            onStreetClick={(streetData) =>
              onStreetClick && onStreetClick("bottom", streetData)
            }
            selectedVehicles={selectedVehicles}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>

        {/* Left street (rotated 90 degrees) */}
        <div
          className="street-left"
          style={{
            position: "absolute",
            top: "50%",
            left: adjust,
            transform: "translate(-50%, -50%) rotate(90deg)",
          }}
        >
          <IntersectionDisplay
            side={"left"}
            mode={mode}
            rotate={270 - rotate}
            data={leftData}
            intersectionData={editData}
            onVehicleClick={onVehicleClick}
            onStreetClick={(streetData) =>
              onStreetClick && onStreetClick("left", streetData)
            }
            selectedVehicles={selectedVehicles}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>

        {/* Right street (rotated 270 degrees) */}
        <div
          className="street-right"
          style={{
            position: "absolute",
            top: "50%",
            right: adjust,
            transform: "translate(50%, -50%) rotate(270deg)",
          }}
        >
          <IntersectionDisplay
            side={"right"}
            mode={mode}
            rotate={90 - rotate}
            data={rightData}
            intersectionData={editData}
            onVehicleClick={onVehicleClick}
            onStreetClick={(streetData) =>
              onStreetClick && onStreetClick("right", streetData)
            }
            selectedVehicles={selectedVehicles}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
        <div
          className="road-type"
          style={{
            transform: `rotate(${0 - rotate}deg)`,
            cursor: mode === "edit" ? "pointer" : "default",
            backgroundColor:
              mode === "edit" ? "rgba(26, 115, 232, 0.1)" : "transparent",
            borderRadius: mode === "edit" ? "4px" : "0",
            padding: mode === "edit" ? "4px 8px" : "0",
            border: mode === "edit" ? "1px dashed var(--app-primary-color)" : "none",
          }}
          onClick={() => {
            if (mode === "edit" && onRoadSizeClick) {
              onRoadSizeClick(); // Keep the existing functionality for backward compatibility
            }
          }}
        >
          {roadsize || (mode === "edit" ? "Bewerken" : "")}
        </div>
      </div>
    </div>
  );
};

export default MaquetteEditor;
