import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Card,
  CardContent,
  f7,
} from "framework7-react";
import { studentService } from "../services/studentService";
import { schoolService } from "../services/schoolService";
import { getLayout } from "../js/utils";
import {
  resolveActiveAdminContact,
  openWhatsAppWithPhone,
} from "../services/adminContactService";
import { buildAbsolutePageUrl } from "../utils/appUrl";

const TrialExpired = () => {
  const [studentData, setStudentData] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (!studentId || !schoolId) {
        f7.dialog.alert("Gebruikersgegevens niet gevonden", "Fout", () => {
          window.location.href = "/";
        });
        return;
      }

      // Load student data
      const { data: student, error: studentError } =
        await studentService.getStudentById(studentId);

      if (studentError || !student) {
        throw new Error("Kon studentgegevens niet laden");
      }

      // Load school data
      const { data: school, error: schoolError } =
        await schoolService.getSchoolById(schoolId);

      if (schoolError || !school) {
        throw new Error("Kon rijschoolgegevens niet laden");
      }

      setStudentData(student);
      setSchoolData(school);
    } catch (error) {
      console.error("Error loading user data:", error);
      f7.dialog.alert(
        "Fout bij laden van gegevens. Probeer het later opnieuw.",
        "Fout"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = (days) => {
    if (!studentData || !schoolData) {
      f7.dialog.alert("Gebruikersgegevens niet beschikbaar", "Fout");
      return;
    }

    const prepareAndSendRequest = async () => {
      f7.preloader.show();
      try {
        const { normalizedPhone, error } = await resolveActiveAdminContact({
          schoolId: schoolData.id,
          studentId: studentData.id,
        });

        if (error || !normalizedPhone) {
          throw new Error("Geen telefoonnummer gevonden voor de beheerder");
        }

        // Construct the access grant URL with all parameters
        const grantAccessUrl = buildAbsolutePageUrl("student-access-grant", {
          studentId: studentData.id,
          studentName: studentData.name,
          studentPhone: studentData.phone,
          studentEmail: studentData.email || "",
          schoolId: schoolData.id,
          duration: days,
        });

        // Compose WhatsApp message to admin
        const message = `Beste ${schoolData.name},

Ik wil graag ${days} dagen toegang aanvragen tot het lesmateriaal.

Mijn gegevens:
- Naam: ${studentData.name}
- Telefoon: ${studentData.phone}
- E-mail: ${studentData.email || "Niet opgegeven"}

Klik op onderstaande link om mijn toegang te activeren:
${grantAccessUrl}`;

        f7.preloader.hide();
        openWhatsAppWithPhone({
          phone: normalizedPhone,
          message,
        });

        // Show confirmation
        f7.dialog.alert(
          `Je verzoek wordt naar ${schoolData.name} gestuurd via WhatsApp. De rijschool zal je toegang activeren zodra ze je bericht hebben ontvangen.`,
          "Verzoek Verstuurd"
        );
      } catch (error) {
        f7.preloader.hide();
        console.error("Error preparing WhatsApp request:", error);
        f7.dialog.alert(
          "Geen telefoonnummer gevonden voor de beheerder.",
          "Geen Contactgegevens"
        );
      }
    };

    prepareAndSendRequest();
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Proefperiode Verlopen" backLink="Terug" />
        <Block className="text-align-center">
          <p>Laden...</p>
        </Block>
      </Page>
    );
  }

  return (
    <div>
      <Block>
        <Card>
          <CardContent>
            <div className="text-align-center">
              <i
                className="f7-icons"
                style={{ fontSize: "64px", color: getLayout()?.colorScheme?.[0] }}
              >
                clock_fill
              </i>
              <h2>Je Proefperiode is Verlopen</h2>
              <p className="text-color-gray">
                Bedankt voor het proberen van onze app! Je gratis proefdag is nu
                afgelopen.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>

      <BlockTitle>Wil je verder gaan?</BlockTitle>

      <Block>
        <p className="text-color-gray">
          Kies hoeveel dagen toegang je wilt aanvragen. Je verzoek wordt direct
          naar de rijschool gestuurd via WhatsApp.
        </p>
      </Block>

      <Block>
        <Button
          fill
          large
          color="teal"
          onClick={() => handleRequestAccess(3)}
          style={{ marginBottom: "12px" }}
        >
          <i className="f7-icons" style={{ marginRight: "8px" }}>
            calendar
          </i>
          Vraag 3 Dagen Toegang Aan
        </Button>

        <Button
          fill
          large
          color="green"
          onClick={() => handleRequestAccess(7)}
          style={{ marginBottom: "12px" }}
        >
          <i className="f7-icons" style={{ marginRight: "8px" }}>
            calendar
          </i>
          Vraag 7 Dagen Toegang Aan
        </Button>

        <Button
          fill
          large
          color="blue"
          onClick={() => handleRequestAccess(30)}
          style={{ marginBottom: "12px" }}
        >
          <i className="f7-icons" style={{ marginRight: "8px" }}>
            calendar
          </i>
          Vraag 30 Dagen Toegang Aan
        </Button>

        <Button
          fill
          large
          color="orange"
          onClick={() => handleRequestAccess(90)}
        >
          <i className="f7-icons" style={{ marginRight: "8px" }}>
            calendar_badge_plus
          </i>
          Vraag 90 Dagen Toegang Aan
        </Button>
      </Block>

      <Block className="text-align-center">
        <p className="text-color-gray" style={{ fontSize: "14px" }}>
          Na het versturen van je verzoek zal de rijschool contact met je
          opnemen om de betaling te regelen en je toegang te activeren.
        </p>
      </Block>
    </div>
  );
};

export default TrialExpired;
