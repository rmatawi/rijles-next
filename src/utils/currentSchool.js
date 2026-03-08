export const resolveCurrentSchoolId = () => {
  const envSchoolId =
    process.env.VITE_REACT_APP_DEFAULTSCHOOL ||
    process.env.NEXT_PUBLIC_DEFAULTSCHOOL;
  if (envSchoolId) {
    return String(envSchoolId).replace(/^["']|["']$/g, "");
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

