import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  List,
  ListInput,
  Button,
  Link,
  f7,
  LoginScreenTitle,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { studentSchoolService } from "../services/studentSchoolService";
import { schoolService } from "../services/schoolService";
import { SEO } from "../js/seoUtils";

const FreeTrialSignup = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasReferralContext =
    !!urlParams.get("ref") || !!localStorage.getItem("referralCode");
  const trialDays = hasReferralContext ? 7 : 1;
  const trialLabel = hasReferralContext ? "7 dagen" : "24 uur";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [schoolName, setSchoolName] = useState("Rijles Suriname");

  // Load school data
  useEffect(() => {
    const loadSchoolData = async () => {
      const schoolId =
        process.env.VITE_REACT_APP_DEFAULTSCHOOL ||
        process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (schoolId) {
        const { data: school, error } = await schoolService.getSchoolById(
          schoolId
        );
        if (!error && school) {
          if (school?.name) {
            setSchoolName(school.name);
          }
        }
      }
    };

    loadSchoolData();
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Voornaam is verplicht";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Achternaam is verplicht";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefoonnummer is verplicht";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Voer een geldig telefoonnummer in";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Voer een geldig e-mailadres in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate 4-digit passcode
  const generatePasscode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      f7.dialog.alert(
        "Vul alle verplichte velden correct in",
        "Validatie Fout"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get school ID from localStorage or environment variable
      const schoolId =
        process.env.VITE_REACT_APP_DEFAULTSCHOOL ||
        process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (!schoolId) {
        throw new Error("Geen rijschool geselecteerd");
      }

      // Concatenate full name from first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`;

      // Check if student already exists by phone
      const { data: existingStudent } = await studentService.findStudentByPhone(
        formData.phone
      );

      let studentData = existingStudent;

      // If student doesn't exist, create new one
      if (!existingStudent) {
        const { data: newStudent, error: createError } =
          await studentService.createStudent({
            name: fullName,
            phone: formData.phone,
            email: formData.email,
          });

        if (createError || !newStudent) {
          throw new Error("Fout bij het aanmaken van account");
        }

        studentData = newStudent;
      }

      // Generate passcode
      const passcode = generatePasscode();

      // Referral signups get an extended trial window.
      const trialStartsAt = new Date();
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDays);

      // Create student-school relationship with trial settings
      const inviteAdminId = localStorage.getItem("inviteAdminId");
      const defaultInstructorId =
        process.env.VITE_REACT_APP_DEFAULT_INSTRUCTOR || null;
      const linkedInstructorId =
        inviteAdminId || defaultInstructorId || null;

      const { data: relationship, error: relationshipError } =
        await studentSchoolService.createStudentSchoolRelationship({
          student_id: studentData.id,
          school_id: schoolId,
          passcode: passcode,
          approved: true, // Auto-approved for trial
          archived: false,
          is_trial: true,
          trial_started_at: trialStartsAt.toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          access_source: "trial",
          granted_by_admin_id: linkedInstructorId,
          instructor_id: linkedInstructorId,
        });

      if (relationshipError || !relationship) {
        throw new Error("Fout bij het activeren van proefperiode");
      }

      // Store authentication data in localStorage
      localStorage.setItem("studentId", studentData.id);
      localStorage.setItem("studentPasscode", passcode);
      // Store trial status to differentiate from paying students
      localStorage.setItem("isTrial", "true");
      localStorage.setItem("trialExpiresAt", trialExpiresAt.toISOString());
      // Store full student data for display purposes
      localStorage.setItem(
        "studentData",
        JSON.stringify({
          id: studentData.id,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
        })
      );

      // Show success message
      f7.dialog.alert(
        `Je ${trialLabel} gratis proefperiode is geactiveerd! Je toegangscode is: ${passcode}. Bewaar deze code goed.`,
        "Welkom!",
        () => {
          // Reload the page to trigger user type detection
          window.location.href = "/";
        }
      );
    } catch (error) {
      console.error("Error during trial signup:", error);
      f7.dialog.alert(
        error.message ||
          "Er is een fout opgetreden. Probeer het later opnieuw.",
        "Fout"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page noToolbar className="free-trial-signup-page">
      <SEO page="free-trial-signup" />
      <Navbar backLink="Terug" />
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <LoginScreenTitle>{schoolName}</LoginScreenTitle>

        <Block>
          <p className="text-color-gray">
            Start vandaag met je rijlessen! Meld je aan voor een gratis proef{hasReferralContext ? "periode" : "dag"}
            en krijg direct toegang tot al ons lesmateriaal.
          </p>
        </Block>

        <List noHairlinesMd>
          <ListInput
            outline
            label="Voornaam"
            type="text"
            placeholder="Voer je voornaam in"
            value={formData.firstName}
            onInput={(e) => handleInputChange("firstName", e.target.value)}
            clearButton
            errorMessage={errors.firstName}
            errorMessageForce={!!errors.firstName}
            required
            inputStyle={{ textAlign: "center" }}
          />

          <ListInput
            outline
            label="Achternaam"
            type="text"
            placeholder="Voer je achternaam in"
            value={formData.lastName}
            onInput={(e) => handleInputChange("lastName", e.target.value)}
            clearButton
            errorMessage={errors.lastName}
            errorMessageForce={!!errors.lastName}
            required
            inputStyle={{ textAlign: "center" }}
          />

          <ListInput
            outline
            label="Telefoonnummer"
            type="tel"
            placeholder="+597 123-4567"
            value={formData.phone}
            onInput={(e) => handleInputChange("phone", e.target.value)}
            clearButton
            errorMessage={errors.phone}
            errorMessageForce={!!errors.phone}
            required
            inputStyle={{ textAlign: "center" }}
          />

          <ListInput
            outline
            label="E-mailadres"
            type="email"
            placeholder="jouw@email.com"
            value={formData.email}
            onInput={(e) => handleInputChange("email", e.target.value)}
            clearButton
            errorMessage={errors.email}
            errorMessageForce={!!errors.email}
            required
            inputStyle={{ textAlign: "center" }}
          />
        </List>

        <Block>
          <Button
            fill
            large
            onClick={handleSubmit}
            disabled={isSubmitting}
            preloader
            loading={isSubmitting}
          >
            {isSubmitting
              ? "Bezig met aanmelden..."
              : hasReferralContext
                ? "Start 7 Dagen Gratis"
                : "Start Gratis Proefdag"}
          </Button>

          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <Link href="/student-login">
              Ik heb al een toegangscode
            </Link>
          </div>
        </Block>

        <Block className="text-align-center">
          <p className="text-color-gray" style={{ fontSize: "14px" }}>
            {hasReferralContext
              ? "Na registratie via referral krijg je 7 dagen gratis toegang; daarna stopt de toegang automatisch."
              : "Na registratie heb je 24 uur gratis toegang; daarna stopt de toegang automatisch."}
          </p>
        </Block>
      </div>
    </Page>
  );
};

export default FreeTrialSignup;
