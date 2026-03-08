// src/components/StudentDashboard.jsx
import { useState, useEffect } from "react";
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
  NavLeft,
  NavTitle,
  ListInput,
  Toolbar,
  Link,
  Sheet,
} from "framework7-react";
import { authService } from "../services/authService";
import { studentService } from "../services/studentService";
import { schoolService } from "../services/schoolService";
import { paymentService } from "../services/paymentService";
import {
  normalizePhoneForWhatsApp,
  resolveRelatedAdminPhone,
} from "../services/adminContactService";
import { isStudentLoggedIn } from "../js/utils";
import { openExternalUrl } from "../utils/externalLinks";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import FreeTrialSignupPromo from "./FreeTrialSignupPromo";
import ReferralCard from "./ReferralCard";

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [view, setView] = useState("dashboard"); // 'dashboard', 'edit', or 'payments'
  const [payments, setPayments] = useState([]);
  const [extensionSheetOpened, setExtensionSheetOpened] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(7);

  // Fetch student data from localStorage and auth state
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get user data from auth state
        const { user } = await authService.getCurrentUser();

        // Get student data from localStorage
        const studentDataStr = localStorage.getItem("studentData");
        const studentData = studentDataStr ? JSON.parse(studentDataStr) : null;

        // Get student record from localStorage
        const studentRecordStr = localStorage.getItem("studentRecord");
        const studentRecord = studentRecordStr
          ? JSON.parse(studentRecordStr)
          : null;

        // Get student ID from localStorage
        let studentId = localStorage.getItem("studentId");

        if (!studentId && user) {
          // Try to find the student by email from the auth user using studentService
          let { data: studentFromAuth, error: authError } =
            await studentService.findStudentByEmail(user.email);

          if (authError || !studentFromAuth) {
            // If no student found by email, try to find by phone if available in user metadata
            const userPhone =
              user.phone ||
              user.user_metadata?.phone ||
              user.user_metadata?.telephone;
            if (userPhone) {
              ({ data: studentFromAuth, error: authError } =
                await studentService.findStudentByPhone(userPhone));
            }
          }

          if (!authError && studentFromAuth) {
            studentId = studentFromAuth.id;
            // Update localStorage with the found student ID
            localStorage.setItem("studentId", studentFromAuth.id);
          }
        }

        // Fetch all approved schools for this student
        if (studentId) {
          const { data: approvedSchoolsData, error: schoolsError } =
            await studentService.getApprovedSchoolsForStudent(studentId);

          if (!schoolsError && approvedSchoolsData) {
            // Each school relationship has its own expiration date
            const schoolsWithExpiration = approvedSchoolsData.map((school) => ({
              ...school,
              expires_at: school.expires_at,
            }));

            // Get the currently selected school from localStorage
            const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
            const currentSchool = schoolsWithExpiration.find(
              (s) => s.school_id === currentSchoolId,
            );

            if (currentSchool) {
              setSelectedSchool(currentSchool);
            } else if (schoolsWithExpiration.length > 0) {
              // If no school is selected yet, use the first approved school
              setSelectedSchool(schoolsWithExpiration[0]);
              localStorage.setItem(
                "selectedSchoolId",
                schoolsWithExpiration[0].school_id,
              );
            }
          }
        }

        // Fetch actual school name from database if we have a school ID
        let schoolName =
          studentData?.schoolName ||
          studentRecord?.schoolName ||
          "Uw Rijschool";
        if (studentRecord?.schoolId) {
          try {
            const { data, error } = await schoolService.getSchoolById(
              studentRecord.schoolId,
            );

            if (!error && data) {
              schoolName = data.name;
            }
          } catch (err) {
            console.error("Error fetching school name:", err);
          }
        }

        // Use the actual student record for state if available, otherwise simulate
        setTimeout(() => {
          if (studentData) {
            // Use the fetched student data from localStorage (this contains the full student record from the database)
            setStudent({
              id: studentData.id,
              name: studentData.name || user?.email?.split("@")[0] || "Student",
              email: studentData.email,
              phone: studentData.phone,
              fname: studentData.fname,
              lname: studentData.lname,
              school: schoolName,
            });
          } else if (studentRecord) {
            // Fallback to studentRecord if studentData is not available
            setStudent({
              id: studentRecord.id,
              name:
                studentRecord.name || user?.email?.split("@")[0] || "Student",
              email:
                studentRecord.email || user?.email || "student@example.com",
              phone: studentRecord.phone,
              fname: studentRecord.fname,
              lname: studentRecord.lname,
              school: schoolName,
            });
          } else {
            setStudent({
              name: user?.email ? user.email.split("@")[0] : "Student",
              email: user?.email || "student@example.com",
              school: schoolName,
            });
          }

          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error in fetchStudentData:", error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Fetch payments for the student
  useEffect(() => {
    const fetchPayments = async () => {
      const studentId = localStorage.getItem("studentId");
      const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (studentId && selectedSchoolId) {
        const { data, error } =
          await paymentService.getPaymentsByStudentAndSchool(
            studentId,
            selectedSchoolId,
          );

        if (!error && data) {
          setPayments(data);
        } else {
          console.error("Error fetching payments:", error);
        }
      }
    };

    if (!loading) {
      fetchPayments();
    }
  }, [loading]);

  // Function to handle requesting payment/extension
  const handleRequestExtension = async () => {
    const studentId = localStorage.getItem("studentId");
    const studentDataStr = localStorage.getItem("studentData");
    const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const selectedSchoolName = localStorage.getItem("selectedSchoolName");

    if (!studentId || !selectedSchoolId) {
      f7.dialog.alert(
        "Geen student- of schoolinformatie gevonden. Log alstublieft opnieuw in.",
        "Fout",
      );
      return;
    }

    let studentData = null;
    try {
      studentData = studentDataStr ? JSON.parse(studentDataStr) : null;
    } catch (error) {
      console.error("Error parsing student data:", error);
    }

    const studentName = studentData?.name || "Student";
    const studentEmail = studentData?.email || "";
    const studentPhone = studentData?.phone || "";

    try {
      const { phone: adminPhoneRaw, error: adminPhoneError } =
        await resolveRelatedAdminPhone({
          schoolId: selectedSchoolId,
          studentId,
        });

      if (adminPhoneError || !adminPhoneRaw) {
        throw new Error("Geen telefoonnummer gevonden voor de beheerder");
      }

      const adminPhone = normalizePhoneForWhatsApp(adminPhoneRaw);

      if (!adminPhone) {
        throw new Error("Geen telefoonnummer gevonden voor de beheerder");
      }

      // Create URL with parameters for admin to approve
      const domain = window.location.origin;
      const approvalUrl = buildAbsolutePageUrl(
        "payment-approval",
        {
          studentId,
          schoolId: selectedSchoolId,
          duration: selectedDuration,
          studentName,
          studentEmail,
          studentPhone,
        },
        domain,
      );

      // Create WhatsApp message
      const messageText = `Nieuw betaalverzoek van ${studentName} (${studentEmail}, ${studentPhone}) voor ${selectedSchoolName}:\n\nGewenste duur: ${selectedDuration} dagen\n\nKlik op de link om toegang te verlenen:\n${approvalUrl}`;

      const whatsappUrl = `https://wa.me/${
        adminPhone
      }?text=${encodeURIComponent(messageText)}`;

      // Open WhatsApp
      openExternalUrl(whatsappUrl);

      // Show confirmation and close sheet
      f7.dialog.alert(
        `WhatsApp bericht voorbereid voor ${selectedDuration} dagen toegang. Verzend het bericht en wacht op goedkeuring van de admin.`,
        "Verzoek Verzonden",
      );
      setExtensionSheetOpened(false);
    } catch (error) {
      console.error("Error creating payment request:", error);
      f7.dialog.alert(
        error.message ||
          "Er is een fout opgetreden bij het aanmaken van het verzoek",
        "Fout",
      );
      setExtensionSheetOpened(false);
    }
  };

  const renderContent = () => {
    if (view === "edit") {
      // Edit view for student details
      return (
        <Block style={{ margin: "8px", paddingTop: "4vh" }}>
          <Card>
            <CardContent style={{ padding: "12px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Profiel Bewerken</h3>

              <List strong dividersIos>
                <ListInput
                  outline
                  label="Voornaam"
                  type="text"
                  value={student?.fname || student?.name?.split(" ")[0] || ""}
                  onInput={(e) => {
                    setStudent({ ...student, fname: e.target.value });
                  }}
                  placeholder="Voornaam"
                />
                <ListInput
                  outline
                  label="Achternaam"
                  type="text"
                  value={
                    student?.lname ||
                    (student?.name
                      ? student?.name.split(" ").slice(1).join(" ")
                      : "")
                  }
                  onInput={(e) => {
                    setStudent({ ...student, lname: e.target.value });
                  }}
                  placeholder="Achternaam"
                />
                <ListInput
                  outline
                  label="E-mail"
                  type="email"
                  value={student?.email || ""}
                  onInput={(e) => {
                    setStudent({ ...student, email: e.target.value });
                  }}
                  placeholder="E-mailadres"
                />
                <ListInput
                  outline
                  label="Telefoon"
                  type="tel"
                  value={student?.phone || ""}
                  onInput={(e) => {
                    setStudent({ ...student, phone: e.target.value });
                  }}
                  placeholder="Telefoonnummer"
                />
              </List>

              <Button
                fill
                large
                color="blue"
                style={{ marginTop: "16px" }}
                onClick={async () => {
                  // Save the updated student information
                  if (student) {
                    try {
                      const studentId = localStorage.getItem("studentId");
                      if (studentId) {
                        const updatedStudent = {
                          fname: student.fname || "",
                          lname: student.lname || "",
                          name: student.name || "",
                          email: student.email || "",
                          phone: student.phone || "",
                        };

                        await studentService.updateStudent(
                          studentId,
                          updatedStudent,
                        );

                        // Update localStorage with the new data
                        const studentDataStr =
                          localStorage.getItem("studentData");
                        let existingStudentData = {};

                        // If there's existing student data, merge it with the updates
                        if (studentDataStr) {
                          try {
                            existingStudentData = JSON.parse(studentDataStr);
                          } catch (parseError) {
                            console.error(
                              "Error parsing existing student data:",
                              parseError,
                            );
                          }
                        }

                        const newStudentData = {
                          ...existingStudentData,
                          ...updatedStudent,
                        };

                        localStorage.setItem(
                          "studentData",
                          JSON.stringify(newStudentData),
                        );

                        // Update the component state with the new data
                        setStudent(newStudentData);

                        f7.toast.show({
                          text: "Profiel bijgewerkt",
                          position: "top",
                          closeTimeout: 2000,
                        });
                      }
                    } catch (error) {
                      console.error("Error updating student:", error);
                      f7.dialog.alert(
                        "Fout bij bijwerken profiel: " + error.message,
                      );
                    }
                  }
                }}
              >
                Opslaan
              </Button>

              <Button
                large
                style={{ marginTop: "8px" }}
                onClick={() => setView("dashboard")}
              >
                Terug naar Dashboard
              </Button>
            </CardContent>
          </Card>
        </Block>
      );
    } else if (view === "payments") {
      // Payments view
      return (
        <Block style={{ margin: "8px", paddingTop: "4vh" }}>
          <Card>
            <CardContent>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Betalingsgeschiedenis</h3>

              {payments.length === 0 ? (
                <Block style={{ textAlign: "center", padding: "16px 0" }}>
                  <Icon
                    f7="creditcard"
                    size="60"
                    color="gray"
                    style={{ marginBottom: "20px" }}
                  />
                  <p style={{ color: "gray" }}>Geen betalingen gevonden</p>
                </Block>
              ) : (
                <List
                  dividersIos
                  strongIos
                  insetIos
                  style={{ marginTop: "12px" }}
                >
                  {payments.map((payment) => {
                    const paymentDate = new Date(payment.payment_date);
                    return (
                      <ListItem key={payment.id}>
                        <div style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <div
                                style={{ fontWeight: "bold", fontSize: "18px" }}
                              >
                                SRD {payment.amount.toFixed(2)}
                              </div>
                              <div style={{ fontSize: "14px", color: "gray" }}>
                                {paymentDate.toLocaleDateString("nl-NL", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "gray",
                                  textTransform: "uppercase",
                                }}
                              >
                                {payment.payment_method || "Contant"}
                              </div>
                              {payment.duration_days && (
                                <div
                                  style={{ fontSize: "12px", color: "gray" }}
                                >
                                  {payment.duration_days} dagen
                                </div>
                              )}
                            </div>
                          </div>
                          {payment.notes && (
                            <div
                              style={{
                                fontSize: "13px",
                                color: "gray",
                                fontStyle: "italic",
                                marginTop: "4px",
                              }}
                            >
                              {payment.notes}
                            </div>
                          )}
                        </div>
                      </ListItem>
                    );
                  })}
                </List>
              )}

              {/* Summary section */}
              {payments.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                      Totaal Betaald
                    </div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "20px",
                        color: "var(--app-primary-color)",
                      }}
                    >
                      SRD{" "}
                      {payments
                        .reduce((sum, payment) => sum + payment.amount, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "gray",
                      marginTop: "8px",
                    }}
                  >
                    {payments.length} betaling
                    {payments.length !== 1 ? "en" : ""}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Block>
      );
    } else {
      // Dashboard view
      return (
        <Block style={{ margin: "8px", paddingTop: "4vh" }}>
          {/* Show when access expires if student is logged in */}
          {isStudentLoggedIn() && selectedSchool ? (
            <>
              {/* Show expiration warning if student access is expiring soon or expired */}
              {selectedSchool.expires_at &&
                (() => {
                  const expirationDate = new Date(selectedSchool.expires_at);
                  const now = new Date();
                  const daysUntilExpiration = Math.ceil(
                    (expirationDate - now) / (1000 * 60 * 60 * 24),
                  );

                  // Show different messages based on expiration status
                  if (now > expirationDate) {
                    // Access expired
                    return (
                      <Card
                        style={{
                          backgroundColor: "#ffebee",
                          border: "1px solid #f44336",
                        }}
                      >
                        <CardContent>
                          <div style={{ textAlign: "center", color: "red" }}>
                            <Icon
                              f7="exclamationmark_triangle"
                              size="32"
                              color="red"
                              style={{ marginBottom: "12px" }}
                            />
                            <h4 style={{ margin: "8px 0", fontSize: "18px" }}>
                              <strong>Uw toegang is verlopen</strong>
                            </h4>
                            <p style={{ margin: "8px 0", fontSize: "14px" }}>
                              Neem contact op met uw rijschool voor verlenging.
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                margin: "8px 0",
                                opacity: 0.8,
                              }}
                            >
                              Verlopen op:{" "}
                              {expirationDate.toLocaleDateString("nl-NL")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else if (daysUntilExpiration <= 7) {
                    // Access expires soon (within 7 days)
                    return (
                      <Card
                        style={{
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ff9800",
                        }}
                      >
                        <CardContent>
                          <div
                            style={{ textAlign: "center", color: "#856404" }}
                          >
                            <Icon
                              f7="clock"
                              size="28"
                              color="#ff9800"
                              style={{ marginBottom: "10px" }}
                            />
                            <h4 style={{ margin: "6px 0", fontSize: "16px" }}>
                              <strong>Uw toegang verloopt binnenkort</strong>
                            </h4>
                            <p style={{ margin: "6px 0", fontSize: "14px" }}>
                              Nog {daysUntilExpiration}{" "}
                              {daysUntilExpiration === 1 ? "dag" : "dagen"}{" "}
                              toegang.
                            </p>
                            <p
                              style={{
                                fontSize: "13px",
                                margin: "6px 0",
                                opacity: 0.8,
                              }}
                            >
                              Verloopt op:{" "}
                              {expirationDate.toLocaleDateString("nl-NL")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else if (daysUntilExpiration <= 30) {
                    // Access expires within 30 days
                    return (
                      <Card
                        style={{
                          backgroundColor: "#e8f5e8",
                          border: "1px solid #4caf50",
                        }}
                      >
                        <CardContent>
                          <div
                            style={{ textAlign: "center", color: "#2e7d32" }}
                          >
                            <Icon
                              f7="calendar"
                              size="24"
                              color="#4caf50"
                              style={{ marginBottom: "8px" }}
                            />
                            <h4 style={{ margin: "4px 0", fontSize: "15px" }}>
                              Toegang verloopt binnen 30 dagen
                            </h4>
                            <p
                              style={{
                                fontSize: "13px",
                                margin: "4px 0",
                                opacity: 0.8,
                              }}
                            >
                              Verloopt op:{" "}
                              {expirationDate.toLocaleDateString("nl-NL")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null; // No warning needed
                })()}

              <Card>
                <CardContent>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
                        {selectedSchool.school?.name || "Uw Rijschool"}
                      </h3>
                      <p
                        style={{ color: "gray", fontSize: "14px", margin: "0" }}
                      >
                        Welkom, {student?.name}
                      </p>
                    </div>
                    {selectedSchool.expires_at &&
                      (() => {
                        const expirationDate = new Date(
                          selectedSchool.expires_at,
                        );
                        const now = new Date();
                        const daysUntilExpiration = Math.ceil(
                          (expirationDate - now) / (1000 * 60 * 60 * 24),
                        );

                        return (
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "gray",
                                marginBottom: "4px",
                              }}
                            >
                              Toegang tot:
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: now > expirationDate ? "red" : "green",
                              }}
                            >
                              {expirationDate.toLocaleDateString("nl-NL")}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: now > expirationDate ? "red" : "gray",
                              }}
                            >
                              {now > expirationDate
                                ? "(Verlopen)"
                                : `(${daysUntilExpiration} ${daysUntilExpiration === 1 ? "dag" : "dagen"})`}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </CardContent>
              </Card>

              {/* Request Extension Button */}
              <Block>
                <Button
                  fill
                  large
                  color="green"
                  style={{ marginTop: "16px" }}
                  onClick={() => setExtensionSheetOpened(true)}
                  iconF7="arrow_clockwise"
                >
                  Verlenging Aanvragen
                </Button>
              </Block>
            </>
          ) : null}

          {/* Show free trial signup promo if not logged in */}
          {(() => {
            const shouldShowPromo = !isStudentLoggedIn();
            return shouldShowPromo ? (
              <Block>
                <FreeTrialSignupPromo description="Start vandaag met leren voor je rijexamen. Krijg direct toegang tot alle maquettes en meer." />
              </Block>
            ) : null;
          })()}

          {isStudentLoggedIn() && (
            <Block>
              <ReferralCard
                variant="purple"
                subtitle="Verwijs vrienden en verdien extra dagen toegang. Deel je code direct via WhatsApp of link."
                onClick="/referral"
              />
            </Block>
          )}
        </Block>
      );
    }
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Student Dashboard" />
        <Block>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="preloader"></div>
            <div style={{ marginLeft: "10px" }}>Laden...</div>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar
        title={
          view === "edit"
            ? "Profiel Bewerken"
            : view === "payments"
              ? "Betalingsgeschiedenis"
              : "Student Dashboard"
        }
        backLink={view !== "dashboard" ? "Dashboard" : "Back"}
        onBackClick={() => (view !== "dashboard" ? setView("dashboard") : null)}
      />

      {/* In-Page Navigation */}
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "16px",
          gap: "8px",
          backgroundColor: "var(--f7-page-bg-color)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Button
          round
          fill={view === "dashboard"}
          outline={view !== "dashboard"}
          onClick={() => setView("dashboard")}
          style={{ flexShrink: 0 }}
        >
          <Icon f7="house" style={{ marginRight: "6px" }} />
          Dashboard
        </Button>
        <Button
          round
          fill={view === "payments"}
          outline={view !== "payments"}
          onClick={() => setView("payments")}
          style={{ flexShrink: 0 }}
        >
          <Icon f7="creditcard" style={{ marginRight: "6px" }} />
          Betalingen
        </Button>
        <Button
          round
          fill={view === "edit"}
          outline={view !== "edit"}
          onClick={() => setView("edit")}
          style={{ flexShrink: 0 }}
        >
          <Icon f7="person_circle" style={{ marginRight: "6px" }} />
          Profiel
        </Button>
      </div>

      {renderContent()}

      {/* Extension Request Sheet Modal */}
      <Sheet
        opened={extensionSheetOpened}
        onSheetClosed={() => setExtensionSheetOpened(false)}
        swipeToClose
        swipeToStep
        backdrop
        style={{ height: "75vh" }}
      >
        <div style={{ height: "auto", padding: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Icon f7="arrow_clockwise" size="48" color="green" />
            <h3 style={{ margin: "16px 0 8px 0" }}>Toegang Verlengen</h3>
            <p style={{ color: "gray", fontSize: "14px" }}>
              Selecteer de gewenste verlengingsperiode
            </p>
          </div>

          <List style={{ margin: "0 -20px" }}>
            {[3, 7, 30, 90].map((duration) => (
              <ListItem
                key={duration}
                radio
                radioIcon="start"
                title={`${duration} dagen`}
                subtitle={`SRD ${duration * 10} - ${duration === 3 ? "Kort" : duration === 7 ? "Week" : duration === 30 ? "Maand" : "3 maanden"} toegang`}
                checked={selectedDuration === duration}
                onClick={() => setSelectedDuration(duration)}
              />
            ))}
          </List>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <Button
              large
              color="gray"
              onClick={() => setExtensionSheetOpened(false)}
              style={{ flex: 1 }}
            >
              Annuleren
            </Button>
            <Button
              large
              fill
              color="green"
              onClick={handleRequestExtension}
              style={{ flex: 1 }}
              iconF7="paperplane"
            >
              Verzenden
            </Button>
          </div>
        </div>
      </Sheet>
    </Page>
  );
};

export default StudentDashboard;
