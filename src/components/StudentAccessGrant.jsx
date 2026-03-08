import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  f7,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { studentSchoolService } from "../services/studentSchoolService";
import { schoolService } from "../services/schoolService";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import store from "../js/store";
import {
  resolveActiveAdminContact,
} from "../services/adminContactService";
import { openExternalUrl } from "../utils/externalLinks";

const StudentAccessGrant = ({ f7route }) => {
  const [studentData, setStudentData] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [adminPhone, setAdminPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [params, setParams] = useState({
    studentId: "",
    studentName: "",
    studentPhone: "",
    studentEmail: "",
    schoolId: "",
    duration: 0,
  });

  useEffect(() => {
    loadDataFromUrl();
  }, []);

  const loadDataFromUrl = async () => {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get("studentId");
      const studentName = urlParams.get("studentName");
      const studentPhone = urlParams.get("studentPhone");
      const studentEmail = urlParams.get("studentEmail");
      const schoolId = urlParams.get("schoolId");
      const duration = parseInt(urlParams.get("duration") || "0");

      if (!studentId || !schoolId || !duration) {
        f7.dialog.alert(
          "Ongeldige URL parameters. Controleer de link en probeer opnieuw.",
          "Fout"
        );
        return;
      }

      setParams({
        studentId,
        studentName: decodeURIComponent(studentName || ""),
        studentPhone: decodeURIComponent(studentPhone || ""),
        studentEmail: decodeURIComponent(studentEmail || ""),
        schoolId,
        duration,
      });

      // Load student data
      const { data: student, error: studentError } =
        await studentService.getStudentById(studentId);

      if (studentError) {
        console.error("Error loading student:", studentError);
      } else if (student) {
        setStudentData(student);
      }

      // Load school data
      const { data: school, error: schoolError } =
        await schoolService.getSchoolById(schoolId);

      if (schoolError) {
        console.error("Error loading school:", schoolError);
      } else if (school) {
        setSchoolData(school);
        const { normalizedPhone } = await resolveActiveAdminContact({
          schoolId,
          studentId,
        });
        setAdminPhone(normalizedPhone || "");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      f7.dialog.alert("Fout bij laden van gegevens", "Fout");
    } finally {
      setLoading(false);
    }
  };

  const generatePasscode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateVerificationKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleGrantAccess = async () => {
    if (!params.studentId || !params.schoolId || !params.duration) {
      f7.dialog.alert("Ongeldige gegevens", "Fout");
      return;
    }

    const authUser = store.state.authUser;
    const adminId = authUser?.id;

    setGranting(true);

    try {
      // Generate passcode and verification key
      const passcode = generatePasscode();
      const verificationKey = generateVerificationKey();

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + params.duration);

      // Check if relationship already exists
      const { data: existingRelationship } =
        await studentSchoolService.getRelationshipByStudentAndSchool(
          params.studentId,
          params.schoolId
        );

      let relationship;

      if (existingRelationship) {
        // Update existing relationship
        const { data, error } = await studentSchoolService.updateRelationship(
          existingRelationship.id,
          {
            approved: true,
            passcode: passcode,
            verification_key: verificationKey,
            verification_key_expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            expires_at: expiresAt.toISOString(),
            is_trial: false,
            access_source: "admin_grant",
            granted_by_admin_id: adminId,
            instructor_id: adminId,
          }
        );

        if (error) {
          throw new Error("Fout bij updaten van toegang");
        }

        relationship = data;
      } else {
        // Create new relationship
        const { data, error } =
          await studentSchoolService.createStudentSchoolRelationship({
            student_id: params.studentId,
            school_id: params.schoolId,
            approved: true,
            passcode: passcode,
            verification_key: verificationKey,
            verification_key_expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            expires_at: expiresAt.toISOString(),
            is_trial: false,
            access_source: "admin_grant",
            granted_by_admin_id: adminId,
            instructor_id: adminId,
          });

        if (error) {
          throw new Error("Fout bij aanmaken van toegang");
        }

        relationship = data;
      }

      // Create verification URL
      const verificationUrl = buildAbsolutePageUrl("verify-access", {
        key: verificationKey,
      });

      // Send WhatsApp message to student
      const schoolName = schoolData?.name || "je rijschool";
      const whatsappMessage = `Hallo ${params.studentName}, je toegang tot ${schoolName} is goedgekeurd voor ${params.duration} dagen!

Toegangscode: ${passcode}
Klik op deze link om je toegang te activeren: ${verificationUrl}

De link is 24 uur geldig.`;

      const formattedPhone = params.studentPhone.replace(/[^0-9]/g, "");
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      // Show success message and open WhatsApp
      f7.dialog.alert(
        `Toegang voor ${params.duration} dagen is succesvol toegekend! De verificatielink wordt nu naar de student gestuurd via WhatsApp.`,
        "Success",
        () => {
          openExternalUrl(whatsappUrl);
          // Redirect to home after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      );
    } catch (error) {
      console.error("Error granting access:", error);
      f7.dialog.alert(
        error.message || "Er is een fout opgetreden bij het toekennen van toegang",
        "Fout"
      );
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Toegang Toekennen" backLink="Terug" />
        <Block className="text-align-center">
          <p>Laden...</p>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title="Toegang Toekennen" backLink="Terug" />

      <Block>
        <Card>
          <CardContent>
            <div className="text-align-center">
              <i
                className="f7-icons"
                style={{ fontSize: "64px", color: "var(--app-primary-color)" }}
              >
                person_badge_plus_fill
              </i>
              <h2>Toegangsverzoek</h2>
              <p className="text-color-gray">
                Ken {params.duration} dagen toegang toe aan deze student
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>

      <BlockTitle>Student Gegevens</BlockTitle>
      <List>
        <ListItem title="Naam" after={params.studentName} />
        <ListItem title="Telefoon" after={params.studentPhone} />
        {params.studentEmail && (
          <ListItem title="E-mail" after={params.studentEmail} />
        )}
      </List>

      {schoolData && (
        <>
          <BlockTitle>Rijschool</BlockTitle>
          <List>
            <ListItem title="Naam" after={schoolData.name} />
            {adminPhone && (
              <ListItem title="Beheerder Telefoon" after={adminPhone} />
            )}
          </List>
        </>
      )}

      <BlockTitle>Toegangsdetails</BlockTitle>
      <List>
        <ListItem title="Duur" after={`${params.duration} dagen`} />
        <ListItem
          title="Vervaldatum"
          after={new Date(
            Date.now() + params.duration * 24 * 60 * 60 * 1000
          ).toLocaleDateString("nl-NL")}
        />
      </List>

      <Block>
        <Button
          fill
          large
          color="green"
          onClick={handleGrantAccess}
          disabled={granting}
          preloader
          loading={granting}
        >
          {granting
            ? "Toegang Toekennen..."
            : `Ken ${params.duration} Dagen Toegang Toe`}
        </Button>
      </Block>

      <Block className="text-align-center">
        <p className="text-color-gray" style={{ fontSize: "14px" }}>
          Na goedkeuring wordt er een WhatsApp bericht met de toegangscode en
          verificatielink naar de student gestuurd.
        </p>
      </Block>
    </Page>
  );
};

export default StudentAccessGrant;
