import React, { useMemo, useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  List,
  ListItem,
  Button,
  Icon,
  Searchbar,
  Popover,
  f7,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";
import { useI18n } from "../i18n/i18n";
import { referralService } from "../services/referralService";
import { adminService } from "../services/adminService";
import { studentSchoolService } from "../services/studentSchoolService";
import SubscriptionBreakdownSheet from "./SubscriptionBreakdownSheet";
import StudentWhatsAppHistorySheet from "./StudentWhatsAppHistorySheet";
import WhatsAppMessageSheet from "./WhatsAppMessageSheet";

const AdminStudentsSection = ({
  requestStatus,
  assignedSchools,
  selectedSchoolForStudents,
  setSelectedSchoolForStudents,
  students,
  archivedStudents,
  showArchived,
  setShowArchived,
  searchQuery,
  setSearchQuery,
  fetchStudents,
  popoverTarget,
  setPopoverTarget,
  selectedStudent,
  setSelectedStudent,
  handleMessageStudent,
  handleCopyStudentAccessLink,
  handleArchiveStudent,
  handleBlockStudent,
  handleAllowStudent,
  handleDeleteStudent,
  showInstructorAssignAction = false,
  isOwnerAdmin = false,
  currentAdminIds = [],
}) => {
  const { t } = useI18n();
  const [subscriptionData, setSubscriptionData] = useState({});
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const canManageStudent = (student) => {
    if (isOwnerAdmin) return true;
    const ownerAdminId = student?.instructor_id || student?.granted_by_admin_id || null;
    if (!ownerAdminId) return false;
    return currentAdminIds.includes(ownerAdminId);
  };

  const openStudentPopover = (student, target) => {
    if (!canManageStudent(student)) return;
    setSelectedStudent(student);
    setPopoverTarget(target);
    f7.popover.open(".student-popover", target);
  };

  const filteredStudents = useMemo(() => {
    const studentsToFilter = showArchived ? archivedStudents : students;

    if (!searchQuery) return studentsToFilter;

    const query = searchQuery.toLowerCase().trim();

    return studentsToFilter.filter(
      (student) => {
        const searchableText = `${student.name || ""} (${student.phone || ""}) ${student.email || ""}`
          .toLowerCase();
        return searchableText.includes(query);
      }
    );
  }, [students, archivedStudents, searchQuery, showArchived]);

  // Fetch subscription data for all students
  useEffect(() => {
    if (selectedSchoolForStudents && filteredStudents.length > 0) {
      loadSubscriptionData();
    }
  }, [selectedSchoolForStudents, filteredStudents]);

  const loadSubscriptionData = async () => {
    if (!selectedSchoolForStudents) return;

    setLoadingSubscriptions(true);
    const data = {};

    // Fetch subscription data for each student
    for (const student of filteredStudents) {
      try {
        const { data: subData } = await referralService.getOrCreateSubscription(
          student.id,
          selectedSchoolForStudents.id
        );

        if (subData) {
          const { data: breakdownData } =
            await referralService.getSubscriptionBreakdown(subData.id);

          if (breakdownData) {
            data[student.id] = breakdownData;
          }
        }
      } catch (error) {
        console.error(
          `Error loading subscription for student ${student.id}:`,
          error
        );
      }
    }

    setSubscriptionData(data);
    setLoadingSubscriptions(false);
  };

  const openSubscriptionSheet = (student) => {
    f7.popover.close(".student-popover");

    // Call the global function exposed by SubscriptionBreakdownSheet
    if (window.openSubscriptionSheet && selectedSchoolForStudents) {
      window.openSubscriptionSheet(student, selectedSchoolForStudents.id);
    }
  };

  const openWhatsAppSheet = (student) => {
    f7.popover.close(".student-popover");

    // Call the global function exposed by WhatsAppMessageSheet
    if (window.openWhatsAppMessageSheet) {
      window.openWhatsAppMessageSheet(student);
    }
  };

  const openInstructorAssignmentDialog = async (student) => {
    if (!student || !selectedSchoolForStudents?.id) return;
    if (!student.student_school_id) {
      f7.dialog.alert("Student-school relatie niet gevonden.");
      return;
    }

    f7.popover.close(".student-popover");
    f7.preloader.show();

    try {
      const { data: admins, error } = await adminService.getAdminsBySchoolId(
        selectedSchoolForStudents.id
      );

      if (error) {
        throw new Error(error.message || "Kon instructeurs niet laden");
      }

      const approvedAdmins = Array.isArray(admins) ? admins : [];
      if (approvedAdmins.length === 0) {
        throw new Error("Geen instructeurs gevonden voor deze rijschool");
      }

      const currentInstructorId =
        student.instructor_id || student.granted_by_admin_id || "";

      const optionsHtml = [
        `<option value="">Geen wijziging / leeg</option>`,
        ...approvedAdmins.map((admin) => {
          const label = admin.name || admin.email || admin.id;
          const selectedAttr = admin.id === currentInstructorId ? " selected" : "";
          return `<option value="${admin.id}"${selectedAttr}>${label}</option>`;
        }),
      ].join("");

      f7.preloader.hide();

      const dialogHtml = `
        <div class="dialog-text">
          <p><strong>Student:</strong> ${student.name || "Onbekend"}</p>
          <p><strong>Huidig:</strong> ${
            student.linkedInstructorName ||
            student.linkedInstructorEmail ||
            currentInstructorId ||
            "Niet toegewezen"
          }</p>
        </div>
        <div class="list no-hairlines-md">
          <ul>
            <li class="item-content item-input item-input-outline">
              <div class="item-inner">
                <div class="item-title item-label">Instructeur</div>
                <div class="item-input-wrap">
                  <select id="assign-student-instructor-select">
                    ${optionsHtml}
                  </select>
                </div>
              </div>
            </li>
          </ul>
        </div>
      `;

      f7.dialog
        .create({
          title: "Instructeur",
          content: dialogHtml,
          buttons: [
            { text: "Annuleren" },
            {
              text: "Opslaan",
              bold: true,
              onClick: async () => {
                const selectEl = document.getElementById(
                  "assign-student-instructor-select"
                );
                const selectedInstructorId = selectEl?.value || null;

                f7.preloader.show();
                try {
                  const updates = {
                    instructor_id: selectedInstructorId,
                    updated_at: new Date().toISOString(),
                  };

                  if (!student.granted_by_admin_id && selectedInstructorId) {
                    updates.granted_by_admin_id = selectedInstructorId;
                  }

                  const { error: updateError } =
                    await studentSchoolService.updateRelationship(
                      student.student_school_id,
                      updates
                    );

                  if (updateError) {
                    throw new Error(
                      updateError.message ||
                        "Kon instructeur niet opslaan"
                    );
                  }

                  await fetchStudents(selectedSchoolForStudents.id, {
                    forceRefresh: true,
                  });

                  f7.preloader.hide();
                  f7.toast.show({
                    text: selectedInstructorId
                      ? "Instructeur bijgewerkt"
                      : "Instructeur verwijderd",
                    position: "top",
                    closeTimeout: 2500,
                  });
                } catch (saveError) {
                  f7.preloader.hide();
                  console.error("Error updating student instructor:", saveError);
                  f7.dialog.alert(
                    saveError.message || "Fout bij opslaan van instructeur"
                  );
                }
              },
            },
          ],
        })
        .open();
    } catch (error) {
      f7.preloader.hide();
      console.error("Error opening instructor assignment dialog:", error);
      f7.dialog.alert(error.message || "Fout bij laden van instructeurs");
    }
  };

  const formatSubscriptionSummary = (studentId) => {
    const data = subscriptionData[studentId];
    if (!data) return null;

    const paidDays = data.paid_days || 0;
    const earnedDays = data.earned_days || 0;
    const daysRemaining = data.days_remaining || 0;

    if (paidDays === 0 && earnedDays === 0) {
      return "Geen actief abonnement";
    }

    const parts = [];
    if (paidDays > 0) parts.push(`${paidDays}d betaald`);
    if (earnedDays > 0) parts.push(`${earnedDays}d verdiend`);
    parts.push(`${daysRemaining}d over`);

    return parts.join(" • ");
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";

    const now = new Date();
    const createdDate = new Date(dateString);
    const diffMs = now - createdDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'uur' : 'uur'} geleden`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'} geleden`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weken'} geleden`;
    } else {
      return `${diffMonths} ${diffMonths === 1 ? 'maand' : 'maanden'} geleden`;
    }
  };

  const openWhatsAppHistorySheet = (student) => {
    f7.popover.close(".student-popover");

    if (window.openStudentWhatsAppHistorySheet) {
      window.openStudentWhatsAppHistorySheet(student);
    }
  };

  return (
    <>
      {!selectedSchoolForStudents ? (
        <>
          <BlockTitle style={{ margin: "16px 16px 8px" }}>
            Gekoppelde Rijscholen
          </BlockTitle>

          {assignedSchools.length === 0 ? (
            <Block style={{ margin: "16px", textAlign: "center" }}>
              <Icon
                f7="building"
                size="60"
                color="gray"
                style={{ marginBottom: "20px" }}
              />
              <p>{t("student.noSchoolsConnected")}</p>
            </Block>
          ) : (
            <List style={{ margin: "0 16px 16px" }}>
              {assignedSchools.map((school) => (
                <ListItem
                  key={school.id}
                  title={school.name}
                  link="#"
                  onClick={async () => {
                    try {
                      setSelectedSchoolForStudents(school);
                      // Store selection in localStorage
                      localStorage.setItem("selectedSchoolName", school.name);
                      await fetchStudents(school.id);
                      f7.preloader.hide();

                      // Reload the page to ensure all components have updated school data
                      setTimeout(() => {
                        window.location.reload();
                      }, 500); // Small delay to allow the toast to be seen
                    } catch (error) {
                      f7.preloader.hide();
                      f7.toast.show({
                        text: "Fout bij laden van studenten: " + error.message,
                        position: "top",
                      });
                    }
                  }}
                >
                  <Icon f7="building" slot="media" />
                </ListItem>
              ))}
            </List>
          )}
        </>
      ) : (
        <>
          <Searchbar
            style={{ margin: "16px 16px 16px" }}
            placeholder="Zoek studenten op naam, e-mail of telefoon..."
            searchContainer=".student-list"
            searchIn=".student-name"
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.target.value)}
          />

          <List style={{ margin: "0 16px" }}>
            <ListItem
              title="Gearchiveerde studenten tonen"
              checkbox
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
          </List>

          {filteredStudents.length === 0 ? (
            <Block style={{ margin: "16px", textAlign: "center" }}>
              <Icon
                f7="person_crop_circle_badge_questionmark"
                size="60"
                color="gray"
                style={{ marginBottom: "20px" }}
              />
              <p>{t("student.noStudentsFound")}</p>
            </Block>
          ) : (
            <List className="student-list" style={{ margin: "0 16px 16px" }}>
              {filteredStudents.map((student) => (
                <ListItem key={student.id} noChevron>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      opacity: canManageStudent(student) ? 1 : 0.45,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-blue-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        marginRight: "12px",
                      }}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="student-name"
                        style={{
                          fontWeight: "bold",
                          cursor: canManageStudent(student) ? "pointer" : "default",
                        }}
                        onClick={(e) => {
                          openStudentPopover(student, e.target);
                        }}
                      >
                        {student.name} ({student.phone})
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--color-gray-text)",
                        }}
                      >
                        {formatTimeAgo(student.createdAt)}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-gray-text)",
                          marginTop: "2px",
                        }}
                      >
                        {`Instructeur: ${
                          student.linkedInstructorName ||
                          student.linkedInstructorEmail ||
                          "Onbekend"
                        }`}
                      </div>
                      {formatSubscriptionSummary(student.id) && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--app-primary-color)",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <IonIcon
                            icon={calendarOutline}
                            style={{ fontSize: "14px" }}
                          />
                          {formatSubscriptionSummary(student.id)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        small
                        fill
                        color="blue"
                        disabled={!canManageStudent(student)}
                        onClick={(e) => {
                          openStudentPopover(student, e.target);
                        }}
                      >
                        <Icon f7="ellipsis_vertical" size="16" />
                      </Button>
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}

      {/* Student Popover for actions */}
      <Popover
        closeByOutsideClick
        className="student-popover"
        target={popoverTarget}
        opened={!!selectedStudent}
        onPopoverClose={() => setSelectedStudent(null)}
      >
        <List>
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) openSubscriptionSheet(selectedStudent);
            }}
          >
            <IonIcon
              icon={calendarOutline}
              style={{ fontSize: "20px", marginRight: "12px" }}
            />
            Bekijk Abonnement
          </ListItem>
          {showInstructorAssignAction && (
            <ListItem
              link="#"
              onClick={() => {
                if (selectedStudent) {
                  openInstructorAssignmentDialog(selectedStudent);
                }
              }}
            >
              <Icon f7="person_crop_circle_badge_checkmark" />
              Instructeur
            </ListItem>
          )}
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) openWhatsAppSheet(selectedStudent);
            }}
          >
            <Icon f7="chat_bubble" />
            WhatsApp
          </ListItem>
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) openWhatsAppHistorySheet(selectedStudent);
            }}
          >
            <Icon f7="clock" />
            WhatsApp Historie
          </ListItem>
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) handleCopyStudentAccessLink(selectedStudent);
            }}
          >
            <Icon f7="link" />
            Access
          </ListItem>
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) handleArchiveStudent(selectedStudent.id);
            }}
          >
            <Icon f7="archivebox_fill" />
            Archiveer
          </ListItem>
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) handleBlockStudent(selectedStudent.id);
            }}
          >
            <Icon f7="hand_raised_fill" />
            Blokkeer
          </ListItem>
          {/*
          <ListItem
            link="#"
            onClick={() => {
              if (selectedStudent) handleAllowStudent(selectedStudent.id);
            }}
          >
            <Icon f7="checkmark_circle_fill" />
            Sta toe
          </ListItem>
          */}
          <ListItem
            link="#"
            style={{ color: "red" }}
            onClick={() => {
              if (selectedStudent) handleDeleteStudent(selectedStudent.id);
            }}
          >
            <Icon f7="trash_fill" color="red" />
            Verwijder
          </ListItem>
        </List>
      </Popover>

      {/* Subscription Breakdown Sheet */}
      <SubscriptionBreakdownSheet />

      {/* WhatsApp History Sheet */}
      <StudentWhatsAppHistorySheet />

      {/* WhatsApp Message Sheet */}
      <WhatsAppMessageSheet />
    </>
  );
};

export default AdminStudentsSection;
