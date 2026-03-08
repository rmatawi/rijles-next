import React, { useMemo, useState } from "react";

const DIAGRAMS = {
  top: "/hoeken/top.svg",
  right: "/hoeken/right.svg",
  bottom: "/hoeken/bottom.svg",
  left: "/hoeken/left.svg",
};

const hitAreas = [
  {
    id: "top",
    label: "Car at top",
    style: { top: "20%", left: "58%", transform: "translate(-50%, -50%)" },
  },
  {
    id: "right",
    label: "Car at right",
    style: { top: "58%", left: "80%", transform: "translate(-50%, -50%)" },
  },
  {
    id: "bottom",
    label: "Car at bottom",
    style: { top: "80%", left: "42%", transform: "translate(-50%, -50%)" },
  },
  {
    id: "left",
    label: "Car at left",
    style: { top: "42%", left: "20%", transform: "translate(-50%, -50%)" },
  },
];

const styles = {
  wrapper: {
    padding: "12px 16px 18px",
    display: "flex",
    justifyContent: "center",
  },
  frame: {
    position: "relative",
    width: "100%",
    maxWidth: "360px",
    aspectRatio: "1 / 1",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "pan-y",
  },
  image: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
  },
  carButton: {
    position: "absolute",
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    border: "none",
    background: "rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
  },
};

const CrossroadDiagram = () => {
  const [activeDirection, setActiveDirection] = useState(null);

  const overlaySrc = useMemo(() => {
    if (!activeDirection) return null;
    return DIAGRAMS[activeDirection] || null;
  }, [activeDirection]);

  const handlePressStart = (event, direction) => {
    // Prevent native text/image selection and focus drag behavior while pressing hotspots.
    if (event.pointerType === "mouse") {
      event.preventDefault();
    }
    setActiveDirection(direction);
  };

  const handlePressEnd = () => {
    setActiveDirection(null);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.frame}>
        <img
          src="/hoeken/all.svg"
          alt="Kruispunt overzicht"
          style={styles.image}
          draggable={false}
        />
        {overlaySrc ? (
          <img
            src={overlaySrc}
            alt=""
            style={styles.overlay}
            draggable={false}
          />
        ) : null}
        {hitAreas.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-label={area.label}
            style={{ ...styles.carButton, ...area.style }}
            onPointerDown={(event) => handlePressStart(event, area.id)}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onPointerCancel={handlePressEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default CrossroadDiagram;
