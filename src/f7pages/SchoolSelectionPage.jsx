// src/pages/SchoolSelectionPage.jsx
import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Icon,
  f7,
  ListInput,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { schoolService } from "../services/schoolService";
import { studentSchoolService } from "../services/studentSchoolService";
import {
  normalizePhoneForWhatsApp,
  resolveRelatedAdminPhone,
} from "../services/adminContactService";
import { t } from "../i18n/translate";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { openExternalUrl } from "../utils/externalLinks";

const SchoolSelectionPage = () => {
  const [schools, setSchools] = useState([]);
  const [schoolLoading, setSchoolLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setSchoolLoading(true);

      // Fetch all schools from drv_schools table using schoolService
      const { data, error } = await schoolService.getSchools();

      if (error) {
        throw error;
      }

      setSchools(data || []);
    } catch (error) {
      console.error("Fout bij ophalen van scholen:", error);
      f7.dialog.alert("Fout bij ophalen van scholen: " + error.message);
    } finally {
      setSchoolLoading(false);
    }
  };

  const handleRequestAccess = async (schoolData) => {
    // Use the passed schoolData, fallback to selectedSchool if not provided for backward compatibility
    const schoolToUse = schoolData;

    if (!schoolToUse.name) {
      f7.dialog.alert("Selecteer eerst een school");
      return;
    }

    // Check if the user is already linked to this school
    // First, try to get phone number from student data in localStorage
    let userPhone = null;

    // Try to get phone from studentData
    const studentDataStr = localStorage.getItem("studentData");
    if (studentDataStr) {
      try {
        const studentData = JSON.parse(studentDataStr);
        if (studentData && studentData.phone) {
          userPhone = studentData.phone;
        }
      } catch (error) {
        console.error("Error parsing studentData:", error);
      }
    }

    // If not found in studentData, try to get from the stored student record
    if (!userPhone) {
      const studentRecordStr = localStorage.getItem("studentRecord");
      if (studentRecordStr) {
        try {
          const studentRecord = JSON.parse(studentRecordStr);
          if (studentRecord && studentRecord.phone) {
            userPhone = studentRecord.phone;
          }
        } catch (error) {
          console.error("Error parsing studentRecord:", error);
        }
      }
    }

    // If still no phone found, try from pendingUserPhone
    if (!userPhone) {
      userPhone = localStorage.getItem("pendingUserPhone");
    }

    if (!userPhone) {
      // If no phone number is found, ask for it first
      const phoneDialogHtml = `
        <div style="padding: 10px 0;">
          <div class="item-input">
            <input type="tel" id="checkPhone" placeholder="Telefoonnummer" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
        </div>
      `;

      f7.dialog
        .create({
          title: "Telefoonnummer",
          content: phoneDialogHtml,
          buttons: [
            {
              text: "Cancel",
              color: "light",
            },
            {
              text: "Controleer",
              color: "blue",
              onClick: async () => {
                const phone = document.getElementById("checkPhone").value;

                if (phone && phone.trim() !== "") {
                  localStorage.setItem("pendingUserPhone", phone);
                  await checkSchoolLinkage(phone, schoolToUse);
                } else {
                  f7.dialog.alert(
                    "Telefoonnummer is vereist om verder te gaan."
                  );
                }
              },
            },
          ],
        })
        .open();
    } else {
      await checkSchoolLinkage(userPhone, schoolToUse);
    }
  };

  // Function to check if user is already linked to the school
  const checkSchoolLinkage = async (phone, schoolData) => {
    try {
      // Check if there's a relationship between this phone number and the selected school using studentService
      const { data: student, error: studentError } =
        await studentService.findStudentByPhone(phone);

      if (studentError || !student) {
        // Student doesn't exist, proceed with normal request process
        await requestNewAccess(schoolData);
        return;
      }

      // Check if there's a relationship between this student and the selected school using studentSchoolService
      const { data: schoolRelationship, error: relationshipError } =
        await studentSchoolService.getRelationshipByStudentAndSchool(
          student.id,
          schoolData.id
        );

      if (relationshipError || !schoolRelationship) {
        // No relationship found, proceed with normal request process
        await requestNewAccess(schoolData);
        return;
      }

      // Student is already linked to the school
      if (schoolRelationship.archived) {
        f7.dialog.alert(
          "Uw toegang tot deze school is gearchiveerd. Neem contact op met de school."
        );
        return;
      }

      if (schoolRelationship.approved) {
        // Student is approved, show login dialog with phone and passcode
        showLoginDialog(phone, schoolRelationship.passcode, schoolData);
      } else {
        f7.dialog.alert(
          "Uw toegang tot deze school is nog in behandeling. Wacht op goedkeuring."
        );
      }
    } catch (error) {
      console.error("Error checking school linkage:", error);
      f7.dialog.alert(
        "Fout bij controleren van schoolkoppeling: " + error.message
      );
      // In case of error, proceed with normal request process
      await requestNewAccess(schoolData);
    }
  };

  // Function to show login dialog with phone and passcode
  const showLoginDialog = async (phone, passcode, schoolData) => {
    const dialogHtml = `
      <div style="padding: 10px 0;">
        <div class="item-input" style="margin-bottom: 15px;">
          <input type="tel" id="loginPhone" value="${phone}" placeholder="Telefoonnummer" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" readonly>
        </div>
        <div class="item-input">
          <input type="text" id="loginPasscode" placeholder="Toegangscode" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
      </div>
    `;

    f7.dialog
      .create({
        title: `Login bij ${schoolData.name}`,
        content: dialogHtml,
        buttons: [
          {
            text: "Cancel",
            color: "light",
          },
          {
            text: "Inloggen",
            color: "blue",
            onClick: async () => {
              const enteredPasscode =
                document.getElementById("loginPasscode").value;

              if (enteredPasscode && enteredPasscode.trim() !== "") {
                // First, find the student by phone number using studentService
                const { data: student, error: studentError } =
                  await studentService.findStudentByPhone(phone);

                if (studentError || !student) {
                  f7.dialog.alert(
                    "Geen student gevonden met dit telefoonnummer."
                  );
                  return;
                }

                // Verify the passcode matches
                if (enteredPasscode === passcode) {
                  // Correct passcode, set the student and school in localStorage
                  localStorage.setItem("studentId", student.id);
                  localStorage.setItem("studentData", JSON.stringify(student));
                  localStorage.setItem(
                    "selectedSchoolId",
                    schoolData.id
                  );

                  // Show success message and direct to student dashboard
                  f7.dialog.alert(
                    "Succesvol ingelogd! U wordt nu doorgestuurd naar het student dashboard.",
                    "Succes!",
                    () => {
                      // Navigate to student dashboard
                      window.location.href = "/student-dashboard";
                    }
                  );
                } else {
                  f7.dialog.alert(
                    "Onjuiste toegangscode. Probeer het opnieuw."
                  );
                }
              } else {
                f7.dialog.alert("Toegangscode is vereist om verder te gaan.");
              }
            },
          },
        ],
      })
      .open();
  };

  // Function to request new access (original functionality)
  const requestNewAccess = async (schoolData) => {
    // First, fetch the related admin phone for the selected school
    let adminPhone = null;
    try {
      const { phone, error } = await resolveRelatedAdminPhone({
        schoolId: schoolData.id,
        studentId: localStorage.getItem("studentId"),
      });
      adminPhone = normalizePhoneForWhatsApp(phone);
      if (error || !adminPhone) throw error || new Error("Geen telefoonnummer");
    } catch (error) {
      console.error("Fout bij ophalen van admin:", error);
      f7.dialog.alert("Fout bij ophalen van admininformatie: " + error.message);
      return;
    }

    // Check if admin has a phone number
    if (!adminPhone) {
      f7.dialog.alert("Geen admin telefoonnummer gevonden voor deze school.");
      return;
    }

    // Create an input dialog to collect first name, last name, and phone number
    // We'll need to use a custom dialog with multiple inputs since f7.dialog.prompt only supports one input
    const dialogHtml = `
      <div style="padding: 10px 0;">
        <div class="item-input" style="margin-bottom: 15px;">
          <input type="text" id="firstName" placeholder="Voornaam" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div class="item-input" style="margin-bottom: 15px;">
          <input type="text" id="lastName" placeholder="Achternaam" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div class="item-input">
          <input type="tel" id="phone" placeholder="Telefoonnummer" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
      </div>
    `;

    f7.dialog
      .create({
        title: "Student Informatie",
        content: dialogHtml,
        buttons: [
          {
            text: "Cancel",
            color: "light",
          },
          {
            text: "Verzenden",
            color: "blue",
            onClick: async () => {
              const firstName = document.getElementById("firstName").value;
              const lastName = document.getElementById("lastName").value;
              const phone = document.getElementById("phone").value;

              if (
                firstName &&
                firstName.trim() !== "" &&
                lastName &&
                lastName.trim() !== "" &&
                phone &&
                phone.trim() !== ""
                ) {
                try {
                  const studentId = localStorage.getItem("studentId");
                  const { phone: resolvedPhone } = await resolveRelatedAdminPhone({
                    schoolId: schoolData.id,
                    studentId,
                  });
                  const adminPhone = normalizePhoneForWhatsApp(resolvedPhone);

                  if (!adminPhone) {
                    throw new Error("Geen telefoonnummer gevonden voor de beheerder van deze rijschool.");
                  }

                  // Create WhatsApp message with student request including first and last name
                  const domain = window.location.origin;
                  const requestUrl = buildAbsolutePageUrl(
                    "student-access-request",
                    { firstName, lastName, phone },
                    domain
                  );
                  const messageText = `Nieuw student toegangsverzoek van ${firstName} ${lastName}, telefoon ${phone} voor school ${schoolData.name}: ${requestUrl}`;
                  const whatsappUrl = `https://wa.me/${
                    adminPhone
                  }?text=${encodeURIComponent(messageText)}`;

                  // Open WhatsApp to send the request
                  openExternalUrl(whatsappUrl);

                  // Show confirmation message
                  f7.dialog.alert(
                    "WhatsApp bericht voorbereid! Verzend het bericht om toegang aan te vragen."
                  );
                } catch (error) {
                  console.error(
                    "Fout bij aanmaken van WhatsApp verzoek:",
                    error
                  );
                  f7.dialog.alert(
                    "Fout bij aanmaken van WhatsApp verzoek: " + error.message
                  );
                }
              } else {
                f7.dialog.alert(
                  "Voornaam, achternaam en telefoonnummer zijn vereist om verder te gaan."
                );
              }
            },
          },
        ],
      })
      .open();
  };

  return (
    <Page>
      <Navbar title={t("nav.selecteerSchool")} backLink={t("common.back")} />

      <Block style={{ margin: "16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon
                f7="building_2"
                size="60"
                color="blue"
                style={{ marginBottom: "20px" }}
              />
              <h2>{t("school.selectSchool")}</h2>
              <p>{t("school.chooseFromList")}</p>
            </div>

            {schoolLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div className="preloader"></div>
                <p>Scholen laden...</p>
              </div>
            ) : schools.length === 0 ? (
              <p>Geen scholen beschikbaar op dit moment.</p>
            ) : (
              <List>
                {schools.map((school) => (
                  <ListItem
                    key={school.id}
                    title={school.name}
                    link="#"
                    onClick={async () => {
                      // Set the selected school with necessary information for state consistency
                      const schoolData = {
                        name: school.name,
                        admin_id: school.admin_id,
                        id: school.id,
                      };

                      // Pass the school data directly to handleRequestAccess to avoid state update delay
                      await handleRequestAccess(schoolData);
                    }}
                  />
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Block>

      <Block style={{ margin: "0 16px 16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center" }}>
              <Icon
                f7="info_circle"
                size="40"
                color="blue"
                style={{ marginBottom: "10px" }}
              />
              <p style={{ fontSize: "14px", color: "#666" }}>
                Na het indienen van uw aanvraag zal de schoolbeheerder deze
                beoordelen en uw aanvraag goedkeuren of afwijzen. U wordt via
                WhatsApp op de hoogte gesteld van de beslissing.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default SchoolSelectionPage;
