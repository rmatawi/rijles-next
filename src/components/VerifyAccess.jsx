import { useState, useEffect } from "react";
import { Page, Navbar, Block, Card, CardContent } from "framework7-react";
import { studentSchoolService } from "../services/studentSchoolService";
import { studentService } from "../services/studentService";

const VerifyAccess = () => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your access...");
  const [verificationKey, setVerificationKey] = useState(null);

  useEffect(() => {
    // Extract the verification key from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get("key");

    if (!key) {
      setStatus("error");
      setMessage("No verification key provided. Please check your link.");
      return;
    }

    setVerificationKey(key);
    verifyAccessKey(key);
  }, []);

  const verifyAccessKey = async (key) => {
    try {
      // First, check if the verification key exists in the database and hasn't expired
      const { data: studentSchool, error } = await studentSchoolService.getRelationshipByVerificationKey(key);

      if (error) {
        console.error("Error verifying key:", error);
        setStatus("error");
        setMessage("Error verifying your access. Please try again later.");
        return;
      }

      if (!studentSchool) {
        setStatus("error");
        setMessage("Invalid or expired verification key. Please contact your administrator.");
        return;
      }

      // Check if the key has expired
      const now = new Date();
      const expiresAt = new Date(studentSchool.verification_key_expires_at);
      
      if (now > expiresAt) {
        const accessExpiresAt = studentSchool.expires_at
          ? new Date(studentSchool.expires_at)
          : null;
        const accessStillValid =
          studentSchool.approved === true &&
          studentSchool.archived !== true &&
          accessExpiresAt &&
          now <= accessExpiresAt;

        if (!accessStillValid) {
          setStatus("error");
          setMessage("This verification link has expired. Please contact your administrator for a new link.");
          return;
        }
      }

      // Get student information to store in user profile
      const { data: studentData, error: studentError } = await studentService.getStudentById(studentSchool.student_id);

      if (studentError || !studentData) {
        console.error("Error fetching student data:", studentError);
        setStatus("error");
        setMessage("Error retrieving student information. Please contact your administrator.");
        return;
      }

      // Mark the verification key as used in the database (best effort)
      if (!studentSchool.verification_key_used) {
        const updateResult = await studentSchoolService.updateRelationship(studentSchool.id, {
          verification_key_used: true,
          updated_at: new Date().toISOString(),
        });

        if (updateResult.error) {
          console.error("Error updating verification key status:", updateResult.error);
          setStatus("error");
          setMessage("Error updating your access status. Please contact your administrator.");
          return;
        }
      }

      // Prepare user profile data based on student information
      const userProfile = {
        name: studentData.name || "",
        email: studentData.email || "", // Use email if available, otherwise empty string
        phone: studentData.phone || studentData.phoneNumber || "",
        memberSince: studentData.created_at || new Date().toISOString(),
        avatar: "", // Could be set to a default avatar
      };

      // Store user profile in localStorage
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // Set the student status in localStorage
      localStorage.setItem("studentStatus", "approved");
      localStorage.setItem("studentId", studentData.id);
      localStorage.setItem("studentData", JSON.stringify(studentData));
      if (studentData.phone || studentData.phoneNumber) {
        localStorage.setItem(
          "studentPhone",
          studentData.phone || studentData.phoneNumber
        );
      }

      const studentRecord = {
        id: studentData.id,
        phone: studentData.phone || studentData.phoneNumber || "",
        name: studentData.name || "",
        email: studentData.email || "",
        schoolId: studentSchool.school_id || null,
        confirmedAt: new Date().toISOString(),
        loginMethod: "VerifyLink",
        accessExpiresAt: studentSchool.expires_at || null,
      };
      localStorage.setItem("studentRecord", JSON.stringify(studentRecord));

      // Clear trial/invite/access token flags since access is verified
      localStorage.removeItem("isTrial");
      localStorage.removeItem("trialExpiresAt");
      localStorage.removeItem("isInvite");
      localStorage.removeItem("isAccessToken");

      setStatus("success");
      setMessage("Your access has been successfully verified! You can now access the student resources.");
      
      // Optionally redirect to another page after a delay
      setTimeout(() => {
        // Redirect to home page or login page
        window.location.href = "/";
      }, 3000);
    } catch (error) {
      console.error("Error in verifyAccessKey:", error);
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <Page>
      <Navbar title="Verify Access" />
      
      <Block style={{ margin: "16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ 
                fontSize: "48px", 
                margin: "20px 0",
                color: status === "success" ? "#4CAF50" : 
                       status === "error" ? "#F44336" : "#2196F3"
              }}>
                {status === "success" ? "✓" : status === "error" ? "✕" : "⏳"}
              </div>
              <h3>
                {status === "success" ? "Success!" : 
                 status === "error" ? "Error" : "Verifying..."}
              </h3>
              <p>{message}</p>
              
              {status === "loading" && (
                <p style={{ color: "var(--color-gray-text)", fontSize: "14px" }}>
                  Please wait while we verify your access...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default VerifyAccess;
