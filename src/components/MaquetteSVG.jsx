import { f7 } from "framework7-react";
import { PATH_DEFINITIONS } from "../js/pathDefinitions";

// VehicleDisplay component to render a single vehicle in the maquette
const VehicleDisplay = ({
  row,
  index,
  vehicles,
  quadrant,
  maquetteNumber,
  onVehicleClick,
  textAngleValue,
  transformX,
  transformY,
  typePrefix,
  rectX,
}) => {
  const show = () => {
    if (!vehicles?.[row]?.[index]) return "none";
    if (vehicles?.[row]?.[index]?.type == "space") return "none";
  };

  const vehicleType = () => {
    return vehicles?.[row]?.[index]?.type;
  };

  const name = () => {
    return vehicles?.[row]?.[index]?.name;
  };

  const direction = () => {
    return vehicles?.[row]?.[index]?.direction || "";
  };

  const xValue = () => {
    if (f7.device.ios && textAngleValue == 0) return rectX;
    if (f7.device.ios && textAngleValue == 90) return rectX;
    if (f7.device.ios && textAngleValue == 180) return rectX;
    if (f7.device.ios && textAngleValue == 270) return rectX;

    if (!f7.device.ios && textAngleValue == 0) return rectX;
    if (!f7.device.ios && textAngleValue == 90) return rectX;
    if (!f7.device.ios && textAngleValue == 180) return rectX;
    if (!f7.device.ios && textAngleValue == 270) return rectX;
  };

  const yValue = () => {
    if (f7.device.ios && textAngleValue == 0) return rectX;
    if (f7.device.ios && textAngleValue == 90) return rectX;
    if (f7.device.ios && textAngleValue == 180) return rectX;
    if (f7.device.ios && textAngleValue == 270) return rectX;

    if (!f7.device.ios && textAngleValue == 0) return rectX;
    if (!f7.device.ios && textAngleValue == 90) return rectX;
    if (!f7.device.ios && textAngleValue == 180) return rectX;
    if (!f7.device.ios && textAngleValue == 270) return rectX;
  };

  const adjustSlot4 = {
    "car-3": -25,
    "car-6": -25,
    "car-9": -25,
  };

  return (
    <g
      transform={`translate(${
        transformX + (adjustSlot4?.[typePrefix] || 0)
      }, ${transformY})`}
      id={
        typePrefix +
        "-" +
        direction() +
        "-" +
        quadrant +
        "quadrant-" +
        maquetteNumber +
        (name() ? "|" + name() : "")
      }
      style={{
        display: show(),
        cursor: onVehicleClick ? "pointer" : "default",
      }}
      className={typePrefix + "-" + direction()}
      onClick={() =>
        onVehicleClick &&
        vehicles?.[row]?.[index] &&
        onVehicleClick(vehicles[row][index])
      }
    >
      <image
        className={"maquette-vehicle-image " + vehicleType()}
        href={"/vehicles/" + vehicleType() + "-" + direction() + ".svg"}
      />
      <text
        className={"maquette-text rotate-" + textAngleValue}
        x={xValue()}
        y={yValue()}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name()}
      </text>
    </g>
  );
};

const MaquetteSVG = ({
  maquetteNumber = 1,
  vehicles = [],
  quadrant = "top",
  note = "",
  trafficsign = "",
  trafficSignRotate = 0,
  onVehicleClick = null,
  indexMaquette = 0,
}) => {
  const textAngle = () => {
    if (quadrant === "top") return 0;
    if (quadrant === "right") return 270;
    if (quadrant === "bottom") return 180;
    if (quadrant === "left") return 90;
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 497 497">
      {/* Right turn animation paths */}
      {PATH_DEFINITIONS.right.map((pathData, index) => (
        <path
          key={`path-right-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          id={`path-right-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          className="maquette-path"
          d={pathData}
        />
      ))}

      {/* Left turn animation paths */}
      {PATH_DEFINITIONS.left.map((pathData, index) => (
        <path
          key={`path-left-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          id={`path-left-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          className="maquette-path"
          d={pathData}
        />
      ))}

      {/* Straight animation paths */}
      {PATH_DEFINITIONS.straight.map((pathData, index) => (
        <path
          key={`path-straight-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          id={`path-straight-${index + 1}-${quadrant}quadrant-${maquetteNumber}`}
          className="maquette-path"
          d={pathData}
        />
      ))}

      {/* Row 1 */}
      <VehicleDisplay
        row={0}
        index={0}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={317}
        transformY={120}
        typePrefix={"bike-1"}
        rectX={4.77}
        rectY={42.22}
      />
      <VehicleDisplay
        row={0}
        index={1}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={281}
        transformY={120}
        typePrefix={"car-1"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={0}
        index={2}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={254}
        transformY={120}
        typePrefix={"car-2"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={0}
        index={3}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={227}
        transformY={120}
        typePrefix={"car-3"}
        rectX={10.955}
        rectY={42.22}
      />

      {/* Row 2 */}
      <VehicleDisplay
        row={1}
        index={0}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={317}
        transformY={60}
        typePrefix={"bike-2"}
        rectX={4.77}
        rectY={42.22}
      />
      <VehicleDisplay
        row={1}
        index={1}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={281}
        transformY={60}
        typePrefix={"car-4"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={1}
        index={2}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={254}
        transformY={60}
        typePrefix={"car-5"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={1}
        index={3}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={227}
        transformY={60}
        typePrefix={"car-6"}
        rectX={10.955}
        rectY={42.22}
      />

      {/* Row 3 */}
      <VehicleDisplay
        row={2}
        index={0}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={317}
        transformY={5}
        typePrefix={"bike-3"}
        rectX={4.77}
        rectY={42.22}
      />
      <VehicleDisplay
        row={2}
        index={1}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={281}
        transformY={5}
        typePrefix={"car-7"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={2}
        index={2}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={254}
        transformY={5}
        typePrefix={"car-8"}
        rectX={10.955}
        rectY={42.22}
      />
      <VehicleDisplay
        row={2}
        index={3}
        vehicles={vehicles}
        quadrant={quadrant}
        maquetteNumber={maquetteNumber}
        onVehicleClick={onVehicleClick}
        indexMaquette={indexMaquette}
        textAngleValue={textAngle()}
        transformX={227}
        transformY={5}
        typePrefix={"car-9"}
        rectX={10.955}
        rectY={42.22}
      />

      {/* Road type */}
      <g>
        <text className="maquette-note" x="248.5" y="25" textAnchor="middle">
          {["ZANDWEG", "TCROSS"].includes(note) ? "" : note}
        </text>
      </g>

      {/* Traffic Sign */}
      <g>
        {/* White background behind the image */}
        {trafficsign && (
          <rect
            x="350"
            y="100"
            width="50"
            height="50"
            rx="10"
            ry="10"
            fill="white"
          />
        )}

        {/* Image clipped to the rounded shape */}
        {trafficsign && (
          <image
            href={trafficsign}
            className="maquette-note"
            x="350"
            y="100"
            width="50"
            height="50"
            transform={`rotate(180 375 125) rotate(${trafficSignRotate} 375 125)`} // 180 degrees + additional rotation (-90 degrees for 90 degrees clockwise when checkbox is checked)
          />
        )}
      </g>
    </svg>
  );
};

export default MaquetteSVG;
