import { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  Card,
  CardContent,
  f7,
  Button,
  NavLeft,
  NavTitle,
  Input,
  List,
  ListItem,
  BlockTitle,
  ListInput,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { schoolService } from "../services/schoolService";
import { studentSchoolService } from "../services/studentSchoolService";
import { accessTokenService } from "../services/accessTokenService";
import useAppNavigation from "../hooks/useAppNavigation";

const StudentAccessRegistrationPage = () => {
  const { navigate } = useAppNavigation();
  const [studentData, setStudentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [schoolId, setSchoolId] = useState(null);
  const [passcode] = useState(""); // Will be generated on server

  // Function to generate a 4-digit passcode
  const generatePasscode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  useEffect(() => {
    // Check for access token in localStorage
    const accessToken = localStorage.getItem("accessToken");
    const accessSchoolId = localStorage.getItem("accessSchoolId");

    if (!accessToken || !accessSchoolId) {
      setError(
        "No access token found. Please use the access link provided by your driving school."
      );
      return;
    }

    // Get school name using the schoolId
    const loadSchoolData = async () => {
      try {
        const { data: schoolData, error } = await schoolService.getSchoolById(
          accessSchoolId
        );
        if (error) {
          console.error("Error fetching school data:", error);
          setError("Could not load school information");
          return;
        }
        if (schoolData) {
          setSchoolName(schoolData.name);
          setSchoolLogo(schoolData.logo_url);
          setSchoolId(accessSchoolId);
        }
      } catch (err) {
        console.error("Error in loadSchoolData:", err);
        setError("Could not load school information");
      }
    };

    loadSchoolData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!studentData.firstName || !studentData.lastName || !studentData.phone) {
      setError("First name, last name, and phone number are required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Generate a passcode for the student
      const passcode = generatePasscode();
      const inviteAdminId = localStorage.getItem("inviteAdminId");
      const defaultInstructorId =
        process.env.VITE_REACT_APP_DEFAULT_INSTRUCTOR || null;
      let linkedInstructorId = inviteAdminId || defaultInstructorId || null;
      let tokenExpiresAt = null;

      // Resolve admin/instructor from the access token when available.
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const { data: tokenData, error: tokenError } =
          await accessTokenService.getTokenByValue(accessToken);

        if (!tokenError && tokenData) {
          tokenExpiresAt =
            tokenData.expires_at ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          linkedInstructorId = tokenData.admin_id || linkedInstructorId;
        }
      }

      // Create a new student in the database
      const fullName =
        `${studentData.firstName} ${studentData.lastName}`.trim();
      const newStudentData = {
        name: fullName,
        phone: studentData.phone,
        email: studentData.email,
        fname: studentData.firstName,
        lname: studentData.lastName,
      };

      const { data: student, error: studentError } =
        await studentService.createStudent(newStudentData);

      if (studentError) {
        throw new Error(`Error creating student: ${studentError.message}`);
      }

      // Create the relationship between student and school with the passcode
      const relationshipData = {
        student_id: student.id,
        school_id: schoolId,
        approved: true, // Direct approval since they came via access token
        passcode: passcode,
        expires_at: tokenExpiresAt,
        granted_by_admin_id: linkedInstructorId,
        instructor_id: linkedInstructorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: relationshipError } =
        await studentSchoolService.createStudentSchoolRelationship(
          relationshipData
        );

      if (relationshipError) {
        throw new Error(
          `Error creating student-school relationship: ${relationshipError.message}`
        );
      }

      // Get the original access token's expiration and update the student-school relationship with it
      if (accessToken) {
        // Ensure relationship keeps token-based access/instructor linkage.
        const { data: relationshipData, error: relationshipError } =
          await studentSchoolService.getRelationshipByStudentAndSchool(
            student.id,
            schoolId
          );

        if (!relationshipError && relationshipData) {
          await studentSchoolService.updateRelationship(relationshipData.id, {
            expires_at: tokenExpiresAt,
            granted_by_admin_id: linkedInstructorId,
            instructor_id: linkedInstructorId,
            approved: true,
          });
        } else {
          await studentSchoolService.createStudentSchoolRelationship({
            student_id: student.id,
            school_id: schoolId,
            passcode: passcode,
            approved: true,
            archived: false,
            expires_at: tokenExpiresAt,
            granted_by_admin_id: linkedInstructorId,
            instructor_id: linkedInstructorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Mark the access token as used
        await accessTokenService.updateToken(accessToken, {
          is_used: true,
          used_at: new Date().toISOString(),
        });
      }

      // Store student data in localStorage
      localStorage.setItem("studentId", student.id);
      localStorage.setItem("studentPhone", student.phone);
      localStorage.setItem("studentData", JSON.stringify(student));
      localStorage.removeItem("accessToken"); // Remove token from localStorage after use
      localStorage.removeItem("accessSchoolId");
      localStorage.removeItem("isAccessToken");

      setMessage("Registration successful!");

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate("/", {
          reloadCurrent: true,
        });

        // Wait 500ms then reload the app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>Student Registration</NavTitle>
      </Navbar>

      <Block style={{ margin: "16px", marginTop: "80px" }}>
        <Card>
          <CardContent>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "100px",
                backgroundImage: `url(${
                  schoolLogo || "/placeholders/placeholder-a02.jpg"
                })`,
                backgroundSize: "110%",
                backgroundPosition: "center",
                border: "3px solid white",
                position: "absolute",
                top: "-60px",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            />
            <p style={{ textAlign: "center", paddingTop: "50px"  }}>
                Registratie: <strong>{schoolName}</strong>
            </p>

            {error && (
              <Block style={{ margin: "0 16px 16px" }}>
                <Card
                  style={{
                    backgroundColor: "#ffebee",
                    borderColor: "#f44336",
                  }}
                >
                  <CardContent>
                    <div
                      style={{
                        color: "#c62828",
                        textAlign: "center",
                        padding: "10px",
                      }}
                    >
                      {error}
                    </div>
                  </CardContent>
                </Card>
              </Block>
            )}

            {message && (
              <Block style={{ margin: "0 16px 16px" }}>
                <Card
                  style={{
                    backgroundColor: "#e8f5e9",
                    borderColor: "#4caf50",
                  }}
                >
                  <CardContent>
                    <div
                      style={{
                        color: "#2e7d32",
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

            <form onSubmit={handleRegister}>
              <List strong inset dividersIos>
                <ListInput
                  outline
                  type="text"
                  name="firstName"
                  label="First Name"
                  value={studentData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  required
                />
                <ListInput
                  outline
                  type="text"
                  name="lastName"
                  label="Last Name"
                  value={studentData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  required
                />
                <ListInput
                  outline
                  type="tel"
                  name="phone"
                  label="Phone Number"
                  value={studentData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
                <ListInput
                  outline
                  type="email"
                  name="email"
                  label="Email (Optional)"
                  value={studentData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </List>

              <Block style={{ padding: "20px 16px" }}>
                <Button
                  type="submit"
                  fill
                  large
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Registering..." : "Complete Registration"}
                </Button>
              </Block>
            </form>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default StudentAccessRegistrationPage;
