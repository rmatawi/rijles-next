import { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  Card,
  CardContent,
  f7,
  Icon,
  Button,
  NavLeft,
  NavTitle,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { schoolService } from "../services/schoolService";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { adminService } from "../services/adminService";
import { studentSchoolService } from "../services/studentSchoolService";
import { useI18n } from "../i18n/i18n";
import { openExternalUrl } from "../utils/externalLinks";

const StudentAccessRequest = () => {
  const { t } = useI18n();
  const [schoolName, setSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState(null);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [passcode, setPasscode] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to generate a 4-digit passcode
  const generatePasscode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPasscode(code);
    return code;
  };

  // Function to generate a unique verification key
  const generateVerificationKey = () => {
    // Generate a unique verification key (e.g., random string with timestamp)
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}${randomPart}`.toUpperCase();
  };

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    // School ID is now handled by background configuration (VITE_REACT_APP_DEFAULTSCHOOL)
    const urlSchool = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const urlPhone = urlParams.get("phone");
    const urlFirstName = urlParams.get("firstName");
    const urlLastName = urlParams.get("lastName");

    if (page === "student-access-request") {
      if (urlSchool) {
        const decodedSchoolName = decodeURIComponent(urlSchool);
        setSchoolName(decodedSchoolName);

        // Check if current user is admin of the school
        checkAdminStatus(decodedSchoolName);
      }
      if (urlPhone) {
        const decodedPhone = decodeURIComponent(urlPhone);
        setPhone(decodedPhone);
      }
      if (urlFirstName) {
        const decodedFirstName = decodeURIComponent(urlFirstName);
        setFirstName(decodedFirstName);
      }
      if (urlLastName) {
        const decodedLastName = decodeURIComponent(urlLastName);
        setLastName(decodedLastName);
      }
    }
  }, []);

  const checkAdminStatus = async (schoolName) => {
    try {
      setLoading(true);

      // Get user data from localStorage
      const userData = localStorage.getItem("userProfile");
      if (!userData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const userEmail = parsedUserData.email;

      if (!userEmail) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // First, find the school ID by name using schoolService
      const { data: schoolData, error: schoolError } =
        await schoolService.getSchoolByName(schoolName);

      if (schoolError) {
        console.error("Error fetching school:", schoolError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!schoolData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const foundSchoolId = schoolData.id;
      setSchoolId(foundSchoolId); // Store school ID in state

      // Then, check if the user is an admin for that school
      const { data: adminData, error: adminError } =
        await adminService.getAdminByEmail(userEmail);

      if (adminError) {
        console.error("Error fetching admin data:", adminError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminData || !adminData.school_ids) {
        setIsAdmin(false);
        setCurrentAdminId(null);
        setLoading(false);
        return;
      }

      // Use centralized admin service to check if user is admin for specific school
      const isAdminForSchool = adminService.isAdminForSpecificSchool(
        foundSchoolId,
        adminData
      );

      setIsAdmin(isAdminForSchool);
      setCurrentAdminId(adminData.id || null);
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      setIsAdmin(false);
      setCurrentAdminId(null);
    } finally {
      setLoading(false);
    }
  };

  /*
  -- Add verification key fields to the existing table
  ALTER TABLE public.drv_student_schools
  ADD COLUMN verification_key TEXT,
  ADD COLUMN verification_key_used BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verification_key_expires_at TIMESTAMP WITH TIME ZONE;

  -- Create an index on verification_key for faster lookups
  CREATE INDEX idx_drv_student_schools_verification_key
  ON public.drv_student_schools(verification_key);

  -- Create an index on verification_key_used to help with queries
  CREATE INDEX idx_drv_student_schools_verification_key_used
  ON public.drv_student_schools(verification_key_used);

  -- Create an index on verification_key_expires_at to help with expired key cleanup
  CREATE INDEX idx_drv_student_schools_verification_key_expires_at
  ON public.drv_student_schools(verification_key_expires_at);
  */

  // Function to approve a student's access request with unique verification link
  const approveStudentAccess = async () => {
    try {
      setMessage("Approving student access...");
      setRequestStatus("processing");

      // Check if we have a school ID
      if (!schoolId) {
        setMessage("Error: School ID not available.");
        setRequestStatus("error");
        return;
      }

      // Generate a new passcode
      const newPasscode = generatePasscode();

      // Generate a unique verification key
      const verificationKey = generateVerificationKey();

      // Find student by phone using studentService
      let { data: studentData, error: studentError } =
        await studentService.findStudentByPhone(phone);

      let studentId;
      if (studentError || !studentData) {
        // Student doesn't exist yet, so create a new student record
        const fullName = `${firstName} ${lastName}`.trim();
        const { data: newStudentData, error: createError } =
          await studentService.createStudent({
            phone: phone,
            name: fullName,
            created_at: new Date().toISOString(),
          });

        if (createError) {
          console.error("Error creating new student:", createError);
          setMessage(`Error creating student: ${createError.message}`);
          setRequestStatus("error");
          return;
        }

        studentId = newStudentData.id;
        setMessage("New student created and access approved successfully!");
      } else {
        studentId = studentData.id;
        setMessage("Student access approved successfully!");
      }

      // Calculate verification key expiration (e.g., 24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24); // 24 hours from now

      // Check if there's already a record in drv_student_schools for this student and school
      const { data: existingRecord, error: fetchError } =
        await studentSchoolService.getRelationshipByStudentAndSchool(
          studentId,
          schoolId
        );

      if (existingRecord) {
        // Update the existing record with verification key
        const { error: updateError } =
          await studentSchoolService.updateRelationship(existingRecord.id, {
            approved: true,
            passcode: newPasscode, // Use the generated passcode
            verification_key: verificationKey, // Add the verification key
            verification_key_used: false, // Mark as not used initially
            verification_key_expires_at: expirationTime.toISOString(), // Set expiration time
            granted_by_admin_id: currentAdminId,
            instructor_id: currentAdminId,
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          console.error(
            "Error updating student-school relationship:",
            updateError
          );
          setMessage(`Error approving student access: ${updateError.message}`);
          setRequestStatus("error");
          return;
        }
      } else {
        // Create a new record in drv_student_schools with approved status and verification key
        const { error: insertError } =
          await studentSchoolService.createStudentSchoolRelationship({
            student_id: studentId,
            school_id: schoolId,
            approved: true,
            passcode: newPasscode, // Use the generated passcode
            verification_key: verificationKey, // Add the verification key
            verification_key_used: false, // Mark as not used initially
            verification_key_expires_at: expirationTime.toISOString(), // Set expiration time
            granted_by_admin_id: currentAdminId,
            instructor_id: currentAdminId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            "Error inserting student-school relationship:",
            insertError
          );
          setMessage(`Error approving student access: ${insertError.message}`);
          setRequestStatus("error");
          return;
        }
      }

      // Construct a unique verification link - this should point to your verification page
      const verificationUrl = buildAbsolutePageUrl("verify-access", {
        key: verificationKey,
      });

      // Compose WhatsApp message with the verification link
      const fullName = `${firstName} ${lastName}`.trim();
      const whatsappMessage = `Hello ${fullName}, your access to ${schoolName} has been approved. Please click this link to activate your access: ${verificationUrl}`;
      const whatsappUrl = `https://wa.me/${phone.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodeURIComponent(whatsappMessage)}`;

      // Open WhatsApp with the message
      openExternalUrl(whatsappUrl);

      setRequestStatus("success");
    } catch (error) {
      console.error("Error in approveStudentAccess:", error);
      setMessage(`Error approving student access: ${error.message}`);
      setRequestStatus("error");
    }
  };

  // Function to archive a student from a school
  const archiveStudent = async () => {
    try {
      setMessage("Archiving student...");
      setRequestStatus("processing");

      // Check if we have a school ID
      if (!schoolId) {
        setMessage("Error: School ID not available.");
        setRequestStatus("error");
        return;
      }

      // Generate a new passcode
      const newPasscode = generatePasscode();

      // Find student by phone using studentService
      let { data: studentData, error: studentError } =
        await studentService.findStudentByPhone(phone);

      let studentId;
      if (studentError || !studentData) {
        // Student doesn't exist yet, so create a new student record
        const fullName = `${firstName} ${lastName}`.trim();
        const { data: newStudentData, error: createError } =
          await studentService.createStudent({
            phone: phone,
            name: fullName,
            created_at: new Date().toISOString(),
          });

        if (createError) {
          console.error("Error creating new student:", createError);
          setMessage(`Error creating student: ${createError.message}`);
          setRequestStatus("error");
          return;
        }

        studentId = newStudentData.id;
        setMessage("New student created and archived successfully!");
      } else {
        studentId = studentData.id;
        setMessage("Student archived successfully!");
      }

      // Check if there's already a record in drv_student_schools for this student and school
      const { data: existingRecord, error: fetchError } =
        await studentSchoolService.getRelationshipByStudentAndSchool(
          studentId,
          schoolId
        );

      if (existingRecord) {
        // Update the existing record
        const { error: updateError } =
          await studentSchoolService.updateRelationship(existingRecord.id, {
            archived: true,
            passcode: newPasscode, // Use the generated passcode
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          console.error(
            "Error updating student-school relationship:",
            updateError
          );
          setMessage(`Error archiving student: ${updateError.message}`);
          setRequestStatus("error");
          return;
        }
      } else {
        // Create a new record in drv_student_schools with archived status
        const { error: insertError } =
          await studentSchoolService.createStudentSchoolRelationship({
            student_id: studentId,
            school_id: schoolId,
            archived: true,
            passcode: newPasscode, // Use the generated passcode
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(
            "Error inserting student-school relationship:",
            insertError
          );
          setMessage(`Error archiving student: ${insertError.message}`);
          setRequestStatus("error");
          return;
        }
      }

      // Compose WhatsApp message with the passcode
      const fullName = `${firstName} ${lastName}`.trim();
      const whatsappMessage = `Hello ${fullName}, your access to ${schoolName} has been archived. Your passcode was: ${newPasscode}.`;
      const whatsappUrl = `https://wa.me/${phone.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodeURIComponent(whatsappMessage)}`;

      // Open WhatsApp with the message
      openExternalUrl(whatsappUrl);

      setRequestStatus("success");
    } catch (error) {
      console.error("Error in archiveStudent:", error);
      setMessage(`Error archiving student: ${error.message}`);
      setRequestStatus("error");
    }
  };

  return (
    <Page>
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>{t("studentAccess.studentAccessApproval")}</NavTitle>
      </Navbar>

      <Block style={{ margin: "16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon
                f7="person_crop_square"
                size="60"
                color="blue"
                style={{ marginBottom: "20px" }}
              />
              <h2>{t("adminRequest.studentAccessRequestsTitle")}</h2>
              <p>
                {t("school.schoolName")}:{" "}
                {schoolName || t("adminRequest.notSpecified")}
              </p>
              <p>
                {t("adminRequest.firstNameLabel")}
                {firstName || t("adminRequest.notSpecified")}
              </p>
              <p>
                {t("adminRequest.lastNameLabel")}
                {lastName || t("adminRequest.notSpecified")}
              </p>
              <p>
                {t("adminRequest.phoneLabel")}
                {phone || t("adminRequest.notSpecified")}
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <Icon
                f7="info_circle"
                size="40"
                color="blue"
                style={{ marginBottom: "10px" }}
              />
              <p style={{ fontSize: "14px", color: "var(--color-gray-text)" }}>
                This page allows administrators to approve or archive student
                access requests for their schools.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>

      {message && (
        <Block style={{ margin: "0 16px 16px" }}>
          <Card
            style={{
              backgroundColor:
                requestStatus === "success" ? "#e8f5e9" : "#ffebee",
              borderColor: requestStatus === "success" ? "#4caf50" : "#f44336",
            }}
          >
            <CardContent>
              <div
                style={{
                  color: requestStatus === "success" ? "#2e7d32" : "#c62828",
                  textAlign: "center",
                  padding: "10px",
                }}
              >
                {message}
              </div>
            </CardContent>
          </Card>
        </Block>
      )}

      {loading && (
        <Block style={{ margin: "0 16px 16px", textAlign: "center" }}>
          <Card>
            <CardContent>
              <p>{t("adminRequest.checkingAdminStatus")}</p>
            </CardContent>
          </Card>
        </Block>
      )}

      {isAdmin && !loading && (
        <Block style={{ margin: "0 16px 16px" }}>
          <Card>
            <CardContent>
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "space-around",
                  gap: "10px",
                }}
              >
                <Button
                  fill
                  onClick={approveStudentAccess}
                  style={{
                    flex: 1,
                  }}
                >
                  {t("adminRequest.approveStudent")}
                </Button>
                <Button
                  fill
                  onClick={archiveStudent}
                  style={{
                    flex: 1,
                  }}
                  color="red"
                >
                  {t("adminRequest.archiveStudent")}
                </Button>
              </div>
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "14px",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                {t("adminRequest.adminForSchoolMessage").replace(
                  "{{schoolName}}",
                  schoolName
                )}
              </p>
            </CardContent>
          </Card>
        </Block>
      )}

      {!isAdmin && !loading && schoolName && (
        <Block style={{ margin: "0 16px 16px" }}>
          <Card
            style={{
              backgroundColor: "var(--color-red-light)", // Light red background
              borderColor: "#f44336", // Red border
            }}
          >
            <CardContent>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#c62828", // Dark red text
                    padding: "10px",
                  }}
                >
                  {t("adminRequest.notAdminForSchoolMessage").replace(
                    "{{schoolName}}",
                    schoolName
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </Block>
      )}
    </Page>
  );
};

export default StudentAccessRequest;
