import AmeliaManual from "./manual/amelia/Manual.jsx";
import RayerManual from "./manual/rayer/Manual.jsx";

const MANUAL_COMPONENTS = {
  amelia: AmeliaManual,
  rayer: RayerManual,
};

const Manual = (props) => {
  const activeTitle = process.env.VITE_REACT_APP_TITLE?.toLowerCase();
  const ManualComponent = MANUAL_COMPONENTS[activeTitle] || RayerManual;

  return <ManualComponent {...props} />;
};

export default Manual;
