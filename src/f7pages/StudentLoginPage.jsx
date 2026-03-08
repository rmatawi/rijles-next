import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  Button,
  f7,
  List,
  ListItem,
  ListInput,
  NavLeft,
  NavTitle,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { school, checkmarkCircle, chevronDown } from "ionicons/icons";
import { schoolService } from "../services/schoolService";
import { studentService } from "../services/studentService";
import { studentSchoolService } from "../services/studentSchoolService";
import { t } from "../i18n/translate";

const StudentLoginPage = () => {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");

  // Initialize the page
  useEffect(() => {
    let isMounted = true; // For cleanup to prevent state updates on unmounted components

    const initializePage = async () => {
      try {
        // Get school ID from localStorage and fetch actual school name
        const fetchSchoolName = async () => {
        const schoolId =
          localStorage.getItem("inviteSchool") ||
          process.env.VITE_REACT_APP_DEFAULTSCHOOL;
          if (schoolId) {
            try {
              const { data, error } = await schoolService.getSchoolById(
                schoolId
              );

              if (isMounted) {
                if (error) {
                  console.error("Error fetching school name:", error);
                  // Fallback to placeholder
                  setSchoolName("Uw Rijschool");
                } else if (data) {
                  setSchoolName(data.name);
                  // Store selection in localStorage for consistency
                } else {
                  // Fallback to placeholder
                  setSchoolName("Uw Rijschool");
                }
              }
            } catch (err) {
              console.error("Error fetching school name:", err);
              if (isMounted) {
                // Fallback to placeholder
                setSchoolName("Uw Rijschool");
              }
            }
          }
        };

        await fetchSchoolName();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializePage();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePasscodeLogin = async (e) => {
    e.preventDefault(); // Prevent form default submission

    // Get school ID from localStorage (either from invite or selection)
    const schoolId =
      localStorage.getItem("inviteSchool") || process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const schoolName =
      localStorage.getItem("selectedSchoolName") || "Uw Rijschool";

    if (!schoolId) {
      f7.dialog.alert(
        "Geen rijschool geselecteerd. Selecteer een rijschool om door te gaan."
      );
      return;
    }

    if (!phone || phone.trim() === "") {
      f7.dialog.alert("Telefoonnummer is vereist om in te loggen.");
      return;
    }

    if (!passcode || passcode.trim() === "") {
      f7.dialog.alert("Toegangscode is vereist om in te loggen.");
      return;
    }

    try {
      // Find student by phone number
      const { data: existingStudent, error: fetchError } =
        await studentService.findStudentByPhone(phone);

      if (!existingStudent) {
        f7.dialog.alert(
          "Geen account gevonden met dit telefoonnummer. Registreer eerst een account."
        );
        return;
      }

      const studentId = existingStudent.id;

      // Use specialized method to check relationship with passcode
      const { data: relationshipData, error: relationshipError } =
        await studentSchoolService.getRelationshipByPasscodeStudentAndSchool(
          studentId,
          schoolId,
          passcode
        );

      if (relationshipError) {
        console.error("Error fetching relationship:", relationshipError);
        f7.dialog.alert("Er is een fout opgetreden. Probeer het opnieuw.");
        return;
      }

      if (!relationshipData) {
        f7.dialog.alert(
          "Onjuiste toegangscode of geen relatie gevonden met deze rijschool. Controleer uw gegevens en probeer opnieuw."
        );
        return;
      }

      // If user came via an invite link, link them to the admin if not already linked
      const inviteAdminId = localStorage.getItem("inviteAdminId");
      if (
        inviteAdminId &&
        (!relationshipData.granted_by_admin_id || !relationshipData.instructor_id)
      ) {
        try {
          await studentSchoolService.updateRelationship(relationshipData.id, {
            granted_by_admin_id: inviteAdminId,
            instructor_id: inviteAdminId,
          });
        } catch (updateError) {
          console.error("Error linking student to inviting admin:", updateError);
        }
      }

      // Check if 24-hour access has expired
      if (relationshipData.verification_key_expires_at) {
        const expirationDate = new Date(
          relationshipData.verification_key_expires_at
        );
        const currentDate = new Date();

        if (currentDate > expirationDate) {
          f7.dialog.alert(
            "Uw 24-uurs proeftoegang is verlopen. Neem contact op met uw instructeur om uw toegang te verlengen.",
            "Toegang Verlopen"
          );
          return;
        }
      }

      // Login successful - set up localStorage
      const studentRecord = {
        id: studentId,
        phone: phone,
        schoolId: schoolId,
        schoolName: schoolName,
        confirmedAt: new Date().toISOString(),
        passcode: relationshipData.passcode,
        loginMethod: "Phone",
        accessExpiresAt: relationshipData.verification_key_expires_at || null,
      };

      localStorage.setItem("studentRecord", JSON.stringify(studentRecord));

      const studentLocalData = {
        id: studentId,
        phone: phone,
        name: existingStudent.name || phone, // Use student name from database, fallback to phone
        schoolName,
        loginMethod: "Phone",
        confirmedAt: new Date().toISOString(),
      };
      localStorage.setItem("studentData", JSON.stringify(studentLocalData));
      localStorage.setItem("studentId", studentId);
      localStorage.setItem("studentPhone", phone);

      // Mark as trial user for 24-hour access
      localStorage.setItem("isTrial", "true");
      localStorage.setItem(
        "trialExpiresAt",
        relationshipData.verification_key_expires_at ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      );

      // Clean up invite data
      localStorage.removeItem("inviteSchoolId");
      localStorage.removeItem("inviteToken");
      localStorage.removeItem("inviteAdminId");
      localStorage.removeItem("isInvite");
      localStorage.removeItem("inviteSchool");

      f7.dialog.alert(
        `Welkom terug bij ${schoolName}!`,
        "Inloggen Gelukt",
        () => {
          // Navigate to homepage and reload to refresh student status
          f7.views.main.router.navigate("/");
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      f7.dialog.alert(
        `Inloggen mislukt: ${error.message}. Probeer het opnieuw.`
      );
    }
  };

  // Show loading indicator while initializing
  if (loading) {
    return (
      <Page name="student-login">
        <Navbar>
          <NavLeft>
            <Button iconF7="arrow_left" href="/" />
          </NavLeft>
          <NavTitle>{t("nav.studentLogin")}</NavTitle>
        </Navbar>
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div className="preloader"></div>
            <div style={{ marginLeft: "10px" }}>{t("student.loading")}</div>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page name="student-login">
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>{t("nav.studentLogin")}</NavTitle>
      </Navbar>

      <Block style={{ textAlign: "center", padding: "32px 16px" }}>
        <IonIcon
          icon={school}
          style={{
            fontSize: "64px",
            color: "var(--f7-theme-color)",
            marginBottom: "16px",
          }}
        />
        <h2>
          {t("student.welcomeTo")} {schoolName || "Uw Rijschool"}
        </h2>
        <p style={{ opacity: 0.7, color: "var(--f7-text-color-secondary)" }}>
          Voer uw toegangscode in om toegang te krijgen tot uw leeromgeving
        </p>
      </Block>

      <Block style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
        <form onSubmit={handlePasscodeLogin} style={{ width: "100%", maxWidth: "460px" }}>
          <List noHairlinesMd>
            <ListInput
              outline
              label="Telefoonnummer"
              type="tel"
              placeholder="Voer uw telefoonnummer in"
              value={phone}
              onInput={(e) => setPhone(e.target.value)}
              required
              style={{ marginBottom: "16px" }}
              inputStyle={{ textAlign: "center" }}
            />
            <ListInput
              outline
              label="Toegangscode"
              type="text"
              placeholder="Voer uw toegangscode in"
              value={passcode}
              onInput={(e) => setPasscode(e.target.value.toUpperCase())}
              required
              maxlength="6"
              textContentType="oneTimeCode"
              style={{ marginBottom: "16px" }}
              inputStyle={{ textAlign: "center" }}
            />
          </List>
          <Button
            type="submit"
            fill
            large
            color="green"
            style={{ marginBottom: "16px", width: "100%" }}
          >
            <IonIcon icon={checkmarkCircle} slot="start" />
            Inloggen
          </Button>
        </form>

      </Block>

      <Block style={{ padding: "16px", textAlign: "center" }}>
        <small
          style={{ opacity: 0.6, color: "var(--f7-text-color-secondary)" }}
        >
          U ontvangt deze uitnodiging van {schoolName || "uw rijschool"}. Neem
          contact op met uw instructeur als u vragen heeft.
        </small>
      </Block>
    </Page>
  );
};

export default StudentLoginPage;
