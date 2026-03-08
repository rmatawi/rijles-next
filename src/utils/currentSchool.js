export const resolveCurrentSchoolId = () => {
  const envSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
  if (envSchoolId) {
    return envSchoolId;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("selectedSchoolId") ||
    localStorage.getItem("selectedSchoolIdFromStudent") ||
    null
  );
};

