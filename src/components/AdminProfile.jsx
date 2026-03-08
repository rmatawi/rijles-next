// src/components/AdminProfile.jsx
import { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  f7,
  useStore,
  NavLeft,
  NavTitle,
  Button,
} from "framework7-react";
import useAdminProfile from "../hooks/useAdminProfile";
import AdminAuthSection from "./AdminAuthSection";
import AdminProfileSection from "./AdminProfileSection";
import AdminStudentsSection from "./AdminStudentsSection";
import AdminPaymentsSection from "./AdminPaymentsSection";
import AdminReferralsSection from "./AdminReferralsSection";
import { isUserAdmin, isSuperAdmin } from "../js/utils";
import { useI18n } from "../i18n/i18n";
import { IonIcon } from "@ionic/react";
import { person, school, card, giftOutline, megaphone } from "ionicons/icons";
import { studentSchoolService } from "../services/studentSchoolService";
import { paymentService } from "../services/paymentService";
import { adminService } from "../services/adminService";
import NavHomeButton from "./NavHomeButton";

const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedSchoolForPayments, setSelectedSchoolForPayments] =
    useState(null);
  const authUser = useStore("authUser");
  const { t } = useI18n();
  const isAmeliaBrand = process.env.VITE_REACT_APP_TITLE === "Amelia";
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  const {
    profile,
    setProfile,
    students,
    archivedStudents,
    showArchived,
    setShowArchived,
    searchQuery,
    setSearchQuery,
    loading,
    user,
    noUser,
    allSchools,
    selectedSchoolIds,
    selectedSchoolForStudents,
    setSelectedSchoolForStudents,
    assignedSchools,
    popoverTarget,
    setPopoverTarget,
    selectedStudent,
    setSelectedStudent,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    fetchStudents,
    handleSave,
    handleMessageStudent,
    handleInviteStudent,
    handleCopyStudentAccessLink,
    handleArchiveStudent,
    handleBlockStudent,
    handleAllowStudent,
    handleDeleteStudent,
  } = useAdminProfile();
  const studentsCount = Array.isArray(students) ? students.length : 0;
  const isOwnerAdmin =
    isSuperAdmin(authUser?.email || user?.email) || isAmeliaBrand;
  const currentAdminIds = [
    authUser?.adminProfile?.id,
    authUser?.id,
    user?.id,
  ].filter(Boolean);

  // Function to resize image using HTML5 Canvas API
  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        // Adjust dimensions to fit within max bounds while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality
        canvas.toBlob(resolve, "image/jpeg", 0.8); // 80% quality
      };

      // Create a data URL from the file to avoid CSP issues with blob URLs
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Function to upload logo with client-side resize

  // Function to upload cover image with client-side resize

  // Update selectedSchoolForStudents to current school when component mounts or current school changes
  useEffect(() => {
    if (!loading && allSchools.length > 0) {
      const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      if (currentSchoolId) {
        const currentSchool = allSchools.find(
          (school) => school.id === currentSchoolId
        );
        if (currentSchool) {
          setSelectedSchoolForStudents(currentSchool);
          // Fetch students for this school
          fetchStudents(currentSchool.id);
        }
      }
    }
  }, [loading, allSchools, setSelectedSchoolForStudents, fetchStudents]);

  // Set the active tab based on URL parameter when component mounts after loading
  // Only run this effect on initial load and when loading changes
  useEffect(() => {
    if (!loading) {
      // Check URL for tab parameter after user data is loaded
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") || "profile";

      setActiveTab(tabParam);
    }
  }, [loading, authUser, user]); // Added authUser, requestStatus, and user to dependency array

  // Update selectedSchoolForPayments to current school when component mounts or current school changes
  useEffect(() => {
    if (!loading && allSchools.length > 0) {
      const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      if (currentSchoolId) {
        const currentSchool = allSchools.find(
          (school) => school.id === currentSchoolId
        );
        if (currentSchool) {
          setSelectedSchoolForPayments(currentSchool);
        }
      }
    }
  }, [loading, allSchools]);

  // Handle payment approval from URL parameters
  useEffect(() => {
    if (!loading && authUser && isUserAdmin(authUser)) {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get("page");

      if (page === "payment-approval") {
        const studentId = urlParams.get("studentId");
        const schoolId = urlParams.get("schoolId");
        const duration = parseInt(urlParams.get("duration")) || 7;
        const studentName = urlParams.get("studentName");
        const studentEmail = urlParams.get("studentEmail");
        const studentPhone = urlParams.get("studentPhone");

        if (studentId && schoolId) {
          // Show approval dialog
          setTimeout(() => {
            const dialogHtml = `
              <div class="dialog-text">
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Email:</strong> ${studentEmail}</p>
                <p><strong>Telefoon:</strong> ${studentPhone}</p>
                <p><strong>Gewenste duur:</strong> ${duration} dagen</p>
              </div>
              <div class="list no-hairlines-md">
                <ul>
                  <li class="item-content item-input">
                    <div class="item-inner">
                      <div class="item-title item-label">Bedrag (SRD)</div>
                      <div class="item-input-wrap">
                        <input type="number" id="approval-payment-amount" placeholder="Bedrag in SRD" step="0.01" min="0" style="text-align: right;">
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            `;

            f7.dialog
              .create({
                title: "Betaalverzoek Goedkeuren",
                content: dialogHtml,
                buttons: [
                  { text: "Weigeren", color: "red" },
                  {
                    text: "Goedkeuren",
                    color: "green",
                    onClick: async () => {
                      const paymentAmountInput = document.getElementById(
                        "approval-payment-amount"
                      );
                      const paymentAmount = paymentAmountInput
                        ? parseFloat(paymentAmountInput.value) || 0
                        : 0;

                      try {
                        f7.preloader.show();

                        // Get student-school relationship
                        const { data: relationshipData, error: relError } =
                          await studentSchoolService.getRelationshipByStudentAndSchool(
                            studentId,
                            schoolId
                          );

                        if (relError || !relationshipData) {
                          throw new Error(
                            "Student-school relatie niet gevonden"
                          );
                        }

                        // Calculate expiration date
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + duration);

                        // Update relationship
                        await studentSchoolService.updateRelationship(
                          relationshipData.id,
                          {
                            approved: true,
                            is_trial: false,
                            expires_at: expiresAt.toISOString(),
                            access_source: "cash_payment",
                            updated_at: new Date().toISOString(),
                          }
                        );

                        // Create payment record if amount provided
                        if (paymentAmount > 0) {
                          await paymentService.createPayment({
                            student_id: studentId,
                            school_id: schoolId,
                            student_school_id: relationshipData.id,
                            amount: paymentAmount,
                            payment_date: new Date().toISOString(),
                            payment_method: "cash",
                            duration_days: duration,
                            notes: `Toegang verlengd voor ${duration} dagen tot ${expiresAt.toLocaleDateString(
                              "nl-NL"
                            )}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          });
                        }

                        f7.preloader.hide();

                        const successMessage =
                          paymentAmount > 0
                            ? `Toegang verleend aan ${studentName} voor ${duration} dagen. Betaling van SRD ${paymentAmount.toFixed(
                                2
                              )} geregistreerd.`
                            : `Toegang verleend aan ${studentName} voor ${duration} dagen.`;

                        f7.dialog.alert(successMessage, "Goedgekeurd!");

                        // Clear URL parameters
                        window.history.replaceState(
                          {},
                          "",
                          window.location.pathname
                        );
                      } catch (error) {
                        f7.preloader.hide();
                        console.error("Error approving payment:", error);
                        f7.dialog.alert(
                          error.message || "Er is een fout opgetreden",
                          "Fout"
                        );
                      }
                    },
                  },
                ],
              })
              .open();
          }, 500);
        }
      }
    }
  }, [loading, authUser]);

  // Show auth section if no user is found
  if (noUser) {
    return (
      <Page>
        <Navbar title="Admin Profile" backLink="Back" />
        <AdminAuthSection
          handleSignIn={handleSignIn}
          handleSignUp={handleSignUp}
          noUser={noUser}
        />
      </Page>
    );
  }

  return (
    <Page>
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>Admin Profile</NavTitle>
      </Navbar>

      {/* In-Page Navigation */}
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "8px 12px",
          gap: "6px",
          backgroundColor: "var(--f7-page-bg-color)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Button
          small
          fill={activeTab === "profile"}
          outline={activeTab !== "profile"}
          onClick={() => setActiveTab("profile")}
          style={{ flexShrink: 0, fontSize: "12px", padding: "6px 10px" }}
        >
          <IonIcon icon={person} style={{ marginRight: "4px", fontSize: "14px" }} />
          Profile
        </Button>
        <Button
          small
          fill={activeTab === "students"}
          outline={activeTab !== "students"}
          onClick={() => setActiveTab("students")}
          style={{
            flexShrink: 0,
            fontSize: "12px",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <IonIcon icon={school} style={{ marginRight: "4px", fontSize: "14px" }} />
          <span>Students</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "18px",
              height: "18px",
              padding: "0 5px",
              borderRadius: "999px",
              fontSize: "11px",
              lineHeight: 1,
              fontWeight: 700,
              background: activeTab === "students" ? "rgba(255,255,255,0.22)" : "#f2e6d8",
              color: activeTab === "students" ? "#fff" : "var(--f7-text-color)",
            }}
          >
            {studentsCount}
          </span>
        </Button>
        <Button
          small
          fill={activeTab === "payments"}
          outline={activeTab !== "payments"}
          onClick={() => setActiveTab("payments")}
          style={{ flexShrink: 0, fontSize: "12px", padding: "6px 10px" }}
        >
          <IonIcon icon={card} style={{ marginRight: "4px", fontSize: "14px" }} />
          Betalingen
        </Button>
        <Button
          small
          fill={activeTab === "referrals"}
          outline={activeTab !== "referrals"}
          onClick={() => setActiveTab("referrals")}
          style={{ flexShrink: 0, fontSize: "12px", padding: "6px 10px" }}
        >
          <IonIcon icon={giftOutline} style={{ marginRight: "4px", fontSize: "14px" }} />
          Referrals
        </Button>
      </div>

      {activeTab === "profile" && (
        <div>
          <AdminProfileSection
            requestStatus={authUser?.admin_status}
            profile={profile}
            setProfile={setProfile}
            user={user}
            selectedSchoolIds={selectedSchoolIds}
            handleSave={handleSave}
            handleSignOut={handleSignOut}
            setActiveTab={setActiveTab}
          />
        </div>
      )}

      {activeTab === "students" && (
        <>
          {selectedSchoolForStudents ? (
            <AdminStudentsSection
              isAdmin={isUserAdmin(authUser)}
              requestStatus={authUser?.admin_status}
              assignedSchools={assignedSchools}
              selectedSchoolForStudents={selectedSchoolForStudents}
              setSelectedSchoolForStudents={setSelectedSchoolForStudents}
              students={students}
              archivedStudents={archivedStudents}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              fetchStudents={fetchStudents}
              popoverTarget={popoverTarget}
              setPopoverTarget={setPopoverTarget}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              handleMessageStudent={handleMessageStudent}
              handleInviteStudent={handleInviteStudent}
              handleCopyStudentAccessLink={handleCopyStudentAccessLink}
              handleArchiveStudent={handleArchiveStudent}
              handleBlockStudent={handleBlockStudent}
              handleAllowStudent={handleAllowStudent}
              handleDeleteStudent={handleDeleteStudent}
              showInstructorAssignAction={isLocalhost || isAmeliaBrand}
              isOwnerAdmin={isOwnerAdmin}
              currentAdminIds={currentAdminIds}
            />
          ) : (
            <Block style={{ textAlign: "center", paddingTop: "50px" }}>
              <p>{t("adminRequest.noSchoolSelected")}</p>
            </Block>
          )}
        </>
      )}

      {activeTab === "payments" && (
        <div>
          {selectedSchoolForPayments ? (
            <AdminPaymentsSection
              selectedSchoolForPayments={selectedSchoolForPayments}
            />
          ) : (
            <Block style={{ textAlign: "center", paddingTop: "50px" }}>
              <p>{t("adminRequest.noSchoolSelected")}</p>
            </Block>
          )}
        </div>
      )}

      {activeTab === "referrals" && (
        <div>
          <AdminReferralsSection
            selectedSchoolId={selectedSchoolForStudents?.id}
            selectedSchoolName={selectedSchoolForStudents?.name}
          />
        </div>
      )}

      {/* Tab Toolbar Removed */}
    </Page>
  );
};

export default AdminProfile;
