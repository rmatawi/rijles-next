// Student Profile Page for editing student information
import { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Button,
  Icon,
  List,
  ListInput,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
} from "framework7-react";
import { schoolService } from "../services/schoolService";
import { studentSchoolService } from "../services/studentSchoolService";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { studentService } from "../services";
import { t } from "../i18n/translate";
import ReferralCard from "../components/ReferralCard";

const ProfilePage = () => {
  const [student, setStudent] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [studentPasscode, setStudentPasscode] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [originalStudent, setOriginalStudent] = useState({});
  // Access store values using f7 framework's store access
  const authUserFromStore = f7?.store?.state?.authUser || {};
  const userFromStore = f7?.store?.state?.user || {};

  // Provide fallback values for authUser and currentUser if they are null/undefined
  const authUserSafe = authUserFromStore || {};
  const currentUserSafe = userFromStore || {};

  // Check if student is logged in with phone/passcode
  const studentId = localStorage.getItem("studentId");
  const selectedSchoolId =
    localStorage.getItem("selectedSchoolId") ||
    process.env.VITE_REACT_APP_DEFAULTSCHOOL;
  const isPhonePasscodeStudent = studentId && selectedSchoolId;

  // Check admin status using f7 params instead of direct store check
  const { isAdmin: isAdminResult } = useAdminStatus();

  // Load student data
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        let studentData = null;

        if (isAdminResult) {
          // For admin users, try to fetch admin data using authUser email
          if (authUserSafe?.email) {
            try {
              const { data: emailStudentData, error: emailStudentError } =
                await studentService.findStudentByEmail(authUserSafe.email);

              if (emailStudentData) {
                studentData = emailStudentData;
              }
            } catch (emailError) {
              console.error("Error finding admin by email:", emailError);
            }
          }

          // If no student data found with email, check if there's any data in currentUser
          if (!studentData && currentUserSafe) {
            studentData = {
              name:
                currentUserSafe.name ||
                currentUserSafe.full_name ||
                authUserSafe?.name ||
                "",
              email: currentUserSafe.email || authUserSafe?.email || "",
              phone: currentUserSafe.phone || authUserSafe?.phone || "",
              address: currentUserSafe.address || "",
              emergency_contact_name:
                currentUserSafe.emergency_contact_name || "",
              emergency_contact_phone:
                currentUserSafe.emergency_contact_phone || "",
            };
          }
        } else if (isPhonePasscodeStudent) {
          // For phone/passcode logged-in students, try to find by studentId first
          if (studentId) {
            // Try to get student by ID first
            const { data: idStudentData, error: idStudentError } =
              await studentService.getStudentById(studentId);

            if (!idStudentError && idStudentData) {
              studentData = idStudentData;
            }
          }

          // If not found by ID, try to find by phone from localStorage studentData
          if (!studentData) {
            try {
              const studentDataStr = localStorage.getItem("studentData");
              if (studentDataStr) {
                const parsedStudentData = JSON.parse(studentDataStr);
                if (parsedStudentData && parsedStudentData.phone) {
                  const { data: phoneStudentData, error: phoneStudentError } =
                    await studentService.findStudentByPhone(
                      parsedStudentData.phone
                    );

                  if (!phoneStudentError && phoneStudentData) {
                    studentData = phoneStudentData;
                  }
                }
              }
            } catch (parseError) {
              console.error(
                "Error parsing studentData from localStorage:",
                parseError
              );
            }
          }

          // If still not found, try to find by authUser phone if available
          if (!studentData && authUserSafe?.phone) {
            const { data: phoneStudentData, error: phoneStudentError } =
              await studentService.findStudentByPhone(authUserSafe.phone);

            if (!phoneStudentError && phoneStudentData) {
              studentData = phoneStudentData;
            }
          }
        } else if (!isAdminResult && currentUserSafe?.email) {
          // For non-admin users, fetch student data by email using studentService
          const { data: emailStudentData, error: emailStudentError } =
            await studentService.findStudentByEmail(currentUserSafe.email);

          if (emailStudentError) {
            throw new Error(emailStudentError.message);
          }

          if (emailStudentData) {
            studentData = emailStudentData;

            // Ensure school information is consistent
            const studentSchoolId = emailStudentData.driving_school_id;
            const storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

            // If the student's school doesn't match localStorage, update localStorage
            if (studentSchoolId && studentSchoolId !== storedSchoolId) {
              const { data: schoolData, error: schoolError } =
                await schoolService.getSchoolById(studentSchoolId);

              if (!schoolError && schoolData) {
                localStorage.setItem("selectedSchoolName", schoolData.name);
              }
            }
          }
        }

        // Update state with fetched data if available
        if (studentData) {
          setStudent({
            name: studentData.name || "",
            email: studentData.email || "",
            phone: studentData.phone || "",
            address: studentData.address || "",
            emergency_contact_name: studentData.emergency_contact_name || "",
            emergency_contact_phone: studentData.emergency_contact_phone || "",
          });
          setOriginalStudent({ ...studentData });
        } else {
          // If no student data is found, try to get it from localStorage studentData
          try {
            const studentDataStr = localStorage.getItem("studentData");
            if (studentDataStr) {
              const parsedStudentData = JSON.parse(studentDataStr);
              if (parsedStudentData) {
                setStudent({
                  name:
                    parsedStudentData.name || parsedStudentData.full_name || "",
                  email: parsedStudentData.email || "",
                  phone: parsedStudentData.phone || authUserSafe?.phone || "",
                  address: parsedStudentData.address || "",
                  emergency_contact_name:
                    parsedStudentData.emergency_contact_name || "",
                  emergency_contact_phone:
                    parsedStudentData.emergency_contact_phone || "",
                });
                setOriginalStudent({ ...parsedStudentData });
              }
            }
          } catch (parseError) {
            console.error(
              "Error parsing studentData from localStorage:",
              parseError
            );
          }
        }

        // Load passcode for student profile view (read-only)
        if (!isAdminResult) {
          let localPasscode = localStorage.getItem("studentPasscode") || "";
          let storedStudentRecord = null;

          try {
            const studentRecordStr = localStorage.getItem("studentRecord");
            if (studentRecordStr) {
              storedStudentRecord = JSON.parse(studentRecordStr);
              if (!localPasscode && storedStudentRecord?.passcode) {
                localPasscode = storedStudentRecord.passcode;
              }
            }
          } catch (parseError) {
            console.error("Error parsing studentRecord:", parseError);
          }

          if (localPasscode) {
            setStudentPasscode(localPasscode);
          }

          const resolvedStudentId =
            studentId || studentData?.id || storedStudentRecord?.id || null;
          const resolvedSchoolId =
            selectedSchoolId ||
            storedStudentRecord?.schoolId ||
            process.env.VITE_REACT_APP_DEFAULTSCHOOL ||
            null;

          if (resolvedStudentId && resolvedSchoolId) {
            const { data: relationshipData, error: relationshipError } =
              await studentSchoolService.getRelationshipByStudentAndSchool(
                resolvedStudentId,
                resolvedSchoolId
              );

            if (!relationshipError && relationshipData?.passcode) {
              setStudentPasscode(relationshipData.passcode);
            }
          }
        }
      } catch (error) {
        console.error("Error loading student data:", error);
        f7.toast.show({
          text: "Error loading student data: " + error.message,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [
    isAdminResult,
    isPhonePasscodeStudent,
    studentId,
    authUserSafe?.phone,
    authUserSafe?.email,
    currentUserSafe?.name,
    currentUserSafe?.full_name,
    authUserSafe?.name,
    currentUserSafe?.email,
    authUserSafe?.id,
  ]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setStudent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save profile
  const saveProfile = async () => {
    try {
      // Validate required fields
      if (!student.name.trim()) {
        throw new Error("Name is required");
      }

      const updateData = {
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        emergency_contact_name: student.emergency_contact_name,
        emergency_contact_phone: student.emergency_contact_phone,
        updated_at: new Date().toISOString(),
      };

      // Update student in the database
      let updateResult = null;

      // For admin users, we may need to handle profile updates differently
      if (isAdminResult) {
        // For admins, try to update using their email as identifier since they may not have a traditional student ID
        try {
          // Try to find the student record by email first
          const { data: emailStudentData, error: emailStudentError } =
            await studentService.findStudentByEmail(student.email);

          if (!emailStudentError && emailStudentData && emailStudentData.id) {
            // Update existing student record found by email
            const { error } = await studentService.updateStudent(
              emailStudentData.id,
              updateData
            );
            if (error) {
              throw new Error(error.message);
            }
            updateResult = { success: true };
            // Update the originalStudent state to reflect the saved ID
            setOriginalStudent({ ...originalStudent, id: emailStudentData.id });
          } else {
            // For now, try to use the authUser id if available
            if (authUserSafe?.id) {
              try {
                const { error } = await studentService.updateStudent(
                  authUserSafe.id,
                  updateData
                );
                if (!error) {
                  updateResult = { success: true };
                  setOriginalStudent({
                    ...originalStudent,
                    id: authUserSafe.id,
                  });
                } else {
                  throw new Error(error.message);
                }
              } catch (updateError) {
                // Try phone next
                if (student.phone) {
                  const { data: phoneStudentData, error: phoneStudentError } =
                    await studentService.findStudentByPhone(student.phone);

                  if (
                    !phoneStudentError &&
                    phoneStudentData &&
                    phoneStudentData.id
                  ) {
                    const { error } = await studentService.updateStudent(
                      phoneStudentData.id,
                      updateData
                    );
                    if (error) {
                      throw new Error(error.message);
                    }
                    updateResult = { success: true };
                    setOriginalStudent({
                      ...originalStudent,
                      id: phoneStudentData.id,
                    });
                  }
                }
              }
            }
          }
        } catch (adminUpdateError) {
          console.error("Error updating admin profile:", adminUpdateError);
          // If admin-specific update fails, fall back to original logic
        }
      }

      // If updateResult is still null, use the original logic
      if (!updateResult) {
        if (originalStudent.id) {
          // Update existing student record
          const { error } = await studentService.updateStudent(
            originalStudent.id,
            updateData
          );
          if (error) {
            throw new Error(error.message);
          }
          updateResult = { success: true };
        } else {
          // For phone/passcode logged-in students without originalStudent.id,
          // we need to find the student first by phone or other means
          if (isPhonePasscodeStudent) {
            let targetStudentId = null;

            // Try to find student by phone number if available
            if (student.phone) {
              const { data: phoneStudentData, error: phoneStudentError } =
                await studentService.findStudentByPhone(student.phone);

              if (
                !phoneStudentError &&
                phoneStudentData &&
                phoneStudentData.id
              ) {
                targetStudentId = phoneStudentData.id;
              }
            }

            // If still no ID, try with authUser phone
            if (!targetStudentId && authUserSafe?.phone) {
              const { data: authPhoneStudentData, error: authPhoneError } =
                await studentService.findStudentByPhone(authUserSafe.phone);

              if (
                !authPhoneError &&
                authPhoneStudentData &&
                authPhoneStudentData.id
              ) {
                targetStudentId = authPhoneStudentData.id;
              }
            }

            if (targetStudentId) {
              const { error } = await studentService.updateStudent(
                targetStudentId,
                updateData
              );
              if (error) {
                throw new Error(error.message);
              }
              updateResult = { success: true };
            } else {
              // If still no ID, try to create a new student record
              // But only if this is a phone/passcode logged-in student with studentId
              if (studentId) {
                // Update the record using the studentId from localStorage
                const { error } = await studentService.updateStudent(
                  studentId,
                  updateData
                );
                if (error) {
                  throw new Error(error.message);
                }
                updateResult = { success: true };
              } else {
                throw new Error(
                  "Student ID not found and could not be determined"
                );
              }
            }
          } else {
            throw new Error("Student ID not found");
          }
        }
      }

      if (updateResult) {
        f7.toast.show({
          text: "Profile updated successfully!",
          position: "top",
        });

        // Update the store with the new user data to ensure consistency across the app
        f7.store.dispatch("updateUserProfile", {
          name: student.name,
          email: student.email,
        });

        // Also update localStorage studentData if it exists
        try {
          const existingStudentDataStr = localStorage.getItem("studentData");
          let existingStudentData = {};
          if (existingStudentDataStr) {
            existingStudentData = JSON.parse(existingStudentDataStr);
          }

          const updatedStudentData = {
            ...existingStudentData,
            ...student,
            updated_at: new Date().toISOString(),
          };

          localStorage.setItem(
            "studentData",
            JSON.stringify(updatedStudentData)
          );
        } catch (storageError) {
          console.error(
            "Error updating localStorage studentData:",
            storageError
          );
        }
      }

      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      f7.toast.show({
        text: "Error saving profile: " + error.message,
        position: "top",
      });
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setStudent({ ...originalStudent });
    setEditMode(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Student Profile" backLink="Back" />
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div className="preloader"></div>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page name="profile">
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>{t("profile.personalInfo")}</NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", cursor: "pointer" }}
            onClick={saveProfile}
          >
            <Icon f7="checkmark" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      {/* Referral Program Link - Only show for students */}
      {!isAdminResult && isPhonePasscodeStudent && (
        <>
          <BlockTitle>Programma's</BlockTitle>
          <Block>
            <div style={{ padding: "0 16px", marginBottom: "16px" }}>
              <ReferralCard
                variant="purple"
                onClick="/referral"
              />
            </div>
          </Block>
        </>
      )}

      <BlockTitle>{t("profile.personalInfo")}</BlockTitle>
      <Block>
        <List inset>
          <ListInput
            outline
            label={t("profile.fullName")}
            type="text"
            placeholder={t("profile.fullName")}
            value={student.name}
            onInput={(e) => handleInputChange("name", e.target.value)}
            disabled={!editMode}
            required
          >
            <Icon
              f7="person"
              size="24"
              className="text-color-blue"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("profile.email")}
            type="email"
            placeholder={t("profile.email")}
            value={student.email}
            onInput={(e) => handleInputChange("email", e.target.value)}
            disabled={!editMode}
          >
            <Icon
              f7="envelope"
              size="24"
              className="text-color-orange"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("profile.phone")}
            type="tel"
            placeholder={t("profile.phone")}
            value={student.phone}
            onInput={(e) => handleInputChange("phone", e.target.value)}
            disabled={!editMode}
          >
            <Icon
              f7="phone"
              size="24"
              className="text-color-green"
              slot="media"
            />
          </ListInput>

          {!isAdminResult && (
            <ListInput
              outline
              label="Toegangscode"
              type="text"
              placeholder="Geen toegangscode"
              value={studentPasscode || ""}
              disabled
            >
              <Icon
                f7="lock"
                size="24"
                className="text-color-orange"
                slot="media"
              />
            </ListInput>
          )}

          <ListInput
            outline
            label={t("profile.dateOfBirth")}
            type="date"
            placeholder={t("profile.dateOfBirth")}
            value={formatDate(student.birth_date)}
            onInput={(e) => handleInputChange("birth_date", e.target.value)}
            disabled={!editMode}
          >
            <Icon
              f7="calendar"
              size="24"
              className="text-color-purple"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("profile.address")}
            type="text"
            placeholder={t("profile.address")}
            value={student.address}
            onInput={(e) => handleInputChange("address", e.target.value)}
            disabled={!editMode}
          >
            <Icon
              f7="location"
              size="24"
              className="text-color-red"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("profile.city")}
            type="text"
            placeholder={t("profile.city")}
            value={student.city}
            onInput={(e) => handleInputChange("city", e.target.value)}
            disabled={!editMode}
          >
            <Icon
              f7="building_2"
              size="24"
              className="text-color-gray"
              slot="media"
            />
          </ListInput>

        </List>
      </Block>
    </Page>
  );
};

export default ProfilePage;
