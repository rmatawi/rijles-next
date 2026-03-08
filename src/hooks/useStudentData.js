import { useEffect } from "react";
import store from "../js/store";
import { studentService } from "../services/studentService";
import { studentSchoolService } from "../services/studentSchoolService";

const useStudentData = (authUser, isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated || !authUser?.email) {
      return;
    }

    // Check if this user is a student and set school data accordingly
    // Look for the student record in the database based on their email
    const processStudentData = async () => {
      try {
        // First, get the student from the database using studentService
        const { data: studentData, error: studentError } =
          await studentService.findStudentByEmail(authUser.email);

        if (studentData) {
          // Store the student ID in localStorage
          localStorage.setItem("studentId", studentData.id);

          // Check for the student-school relationship using studentSchoolService
          // First get all relationships for this student
          const { data: allRelationships, error: relationshipError } =
            await studentSchoolService.getRelationshipsByStudentId(
              studentData.id
            );

          // Filter for approved and not archived relationships
          let relationshipData = null;
          if (allRelationships && Array.isArray(allRelationships)) {
            relationshipData = allRelationships.find(
              (rel) => rel.approved === true && rel.archived === false
            );
          }

          if (!relationshipError && relationshipData) {
            // Set both the student-specific and general school ID in localStorage
            // This ensures compatibility with isStudentLoggedIn() function
            // while also following the general convention
            localStorage.setItem(
              "selectedSchoolIdFromStudent",
              relationshipData.school_id
            );
            localStorage.setItem(
              "selectedSchoolId",
              relationshipData.school_id
            );

            // Set school data in localStorage
            localStorage.setItem(
              "studentData",
              JSON.stringify({
                email: authUser.email,
                schoolName: relationshipData.drv_schools.name,
                loginMethod: "Google",
                confirmedAt: new Date().toISOString(),
              })
            );

            // Also set in studentRecord
            localStorage.setItem(
              "studentRecord",
              JSON.stringify({
                email: authUser.email,
                schoolId: relationshipData.school_id,
                schoolName: relationshipData.drv_schools.name,
                confirmedAt: new Date().toISOString(),
                loginMethod: "Google",
              })
            );

            // Update the store with the school information
            store.dispatch("updateUserProfile", {
              name: authUser.name,
              email: authUser.email,
              schoolName: relationshipData.drv_schools.name,
              schoolId: relationshipData.school_id,
            });
          } else {
            console.log(
              "No approved school relationship found for student, they may need to complete onboarding"
            );
          }
        }
      } catch (studentError) {
        console.error(
          "Error checking student data during login:",
          studentError
        );
      }
    };

    processStudentData();
  }, [authUser, isAuthenticated]);
};

export default useStudentData;