// components/SubscriptionBreakdownSheet.jsx
import React, { useState } from "react";
import {
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  PageContent,
  Block,
  BlockTitle,
  Card,
  CardContent,
  List,
  ListItem,
  Button,
  Preloader,
  f7,
  Icon,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  calendarOutline,
  cashOutline,
  giftOutline,
  timeOutline,
  checkmarkCircle,
  closeCircle,
  listOutline,
  keyOutline,
  callOutline,
} from "ionicons/icons";
import { referralService } from "../services/referralService";
import { studentSchoolService } from "../services/studentSchoolService";
import { getLayout } from "../js/utils";

/**
 * SubscriptionBreakdownSheet Component
 * Displays detailed subscription breakdown for a student:
 * - Paid days vs Earned days
 * - Total days and days remaining
 * - Access source (paid/referral/mixed/trial)
 * - Extension history audit trail
 */
const SubscriptionBreakdownSheet = () => {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [passcode, setPasscode] = useState(null);

  const loadSubscriptionData = async (studentData, schoolIdData) => {
    try {
      setLoading(true);
      setError(null);
      setStudent(studentData);
      setSchoolId(schoolIdData);

      // Get student-school relationship to fetch passcode
      const { data: relationshipData, error: relationshipError } =
        await studentSchoolService.getRelationshipByStudentAndSchool(
          studentData.id,
          schoolIdData
        );

      if (!relationshipError && relationshipData) {
        setPasscode(relationshipData.passcode);
      }

      // Get or create subscription for the student
      const { data: subData, error: subError } =
        await referralService.getOrCreateSubscription(studentData.id, schoolIdData);

      if (subError) {
        throw new Error("Failed to load subscription");
      }

      setSubscription(subData);

      // Get detailed breakdown
      const { data: breakdownData, error: breakdownError } =
        await referralService.getSubscriptionBreakdown(subData.id);

      if (breakdownError) {
        throw new Error("Failed to load subscription breakdown");
      }

      setBreakdown(breakdownData);
    } catch (err) {
      console.error("Error loading subscription data:", err);
      setError(err.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  // Expose loadSubscriptionData to parent via window (for f7.sheet.open callback)
  React.useEffect(() => {
    window.openSubscriptionSheet = (studentData, schoolIdData) => {
      loadSubscriptionData(studentData, schoolIdData);
      f7.sheet.open(".subscription-breakdown-sheet");
    };

    return () => {
      delete window.openSubscriptionSheet;
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAccessSourceLabel = (source) => {
    const labels = {
      paid: "Betaald",
      referral: "Verwijzing",
      trial: "Proefperiode",
      mixed: "Gemengd",
      none: "Geen",
    };
    return labels[source] || source;
  };

  const getAccessSourceColor = (source) => {
    const colors = {
      paid: "var(--app-primary-color)",
      referral: "#34C759",
      trial: getLayout()?.colorScheme?.[0],
      mixed: "#AF52DE",
      none: "#8E8E93",
    };
    return colors[source] || "#8E8E93";
  };

  const handleClose = () => {
    f7.sheet.close(".subscription-breakdown-sheet");
    // Reset state after animation completes
    setTimeout(() => {
      setStudent(null);
      setSchoolId(null);
      setSubscription(null);
      setBreakdown(null);
      setError(null);
      setPasscode(null);
    }, 300);
  };

  return (
    <Sheet
      className="subscription-breakdown-sheet"
      style={{ height: "70vh" }}
      swipeToClose
      backdrop
      onSheetClosed={handleClose}
    >
      <Page>
        <Navbar>
          <NavTitle>
            {student?.name ? `${student.name} - Abonnement` : "Abonnement"}
          </NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <PageContent>

          {loading && (
            <Block className="text-align-center">
              <Preloader />
              <p>Laden...</p>
            </Block>
          )}

          {error && (
            <Block strong inset>
              <Card>
                <CardContent>
                  <div style={{ textAlign: "center", color: "red" }}>
                    <IonIcon
                      icon={closeCircle}
                      style={{ fontSize: "48px", marginBottom: "8px" }}
                    />
                    <p>{error}</p>
                    <Button small onClick={() => loadSubscriptionData(student, schoolId)}>
                      Opnieuw Proberen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Block>
          )}

          {!loading && !error && breakdown && (
            <>
              {/* Student Info & Passcode */}
              {(student?.phone || passcode) && (
                <>
                  <BlockTitle>Student Gegevens</BlockTitle>
                  <List strong inset>
                    {student?.phone && (
                      <ListItem>
                        <IonIcon
                          icon={callOutline}
                          slot="media"
                          style={{ color: "var(--app-primary-color)", fontSize: "24px" }}
                        />
                        <div slot="title">Telefoonnummer</div>
                        <div
                          slot="after"
                          style={{
                            fontWeight: "bold",
                            fontSize: "16px",
                          }}
                        >
                          {student.phone}
                        </div>
                      </ListItem>
                    )}
                    {passcode && (
                      <ListItem>
                        <IonIcon
                          icon={keyOutline}
                          slot="media"
                          style={{ color: "#FF3B30", fontSize: "24px" }}
                        />
                        <div slot="title">Toegangscode</div>
                        <div
                          slot="after"
                          style={{
                            fontWeight: "bold",
                            fontSize: "18px",
                            fontFamily: "monospace",
                            color: "#FF3B30",
                            letterSpacing: "2px",
                          }}
                        >
                          {passcode}
                        </div>
                      </ListItem>
                    )}
                  </List>
                </>
              )}

              {/* Summary Stats */}
              <BlockTitle>Overzicht</BlockTitle>
              <Block strong inset>
                <Card>
                  <CardContent>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                        textAlign: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "bold",
                            color: "var(--app-primary-color)",
                          }}
                        >
                          {breakdown.paid_days || 0}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Betaalde Dagen
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "bold",
                            color: "#34C759",
                          }}
                        >
                          {breakdown.earned_days || 0}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Verdiende Dagen
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Block>

              {/* Details */}
              <BlockTitle>Details</BlockTitle>
              <List strong inset>
                <ListItem>
                  <IonIcon
                    icon={calendarOutline}
                    slot="media"
                    style={{ color: "var(--app-primary-color)", fontSize: "24px" }}
                  />
                  <div slot="title">Totaal Dagen</div>
                  <div slot="after" style={{ fontWeight: "bold" }}>
                    {breakdown.total_days || 0} dagen
                  </div>
                </ListItem>

                <ListItem>
                  <IonIcon
                    icon={timeOutline}
                    slot="media"
                    style={{ color: getLayout()?.colorScheme?.[0], fontSize: "24px" }}
                  />
                  <div slot="title">Resterende Dagen</div>
                  <div
                    slot="after"
                    style={{
                      fontWeight: "bold",
                      color: breakdown.days_remaining > 0 ? "#34C759" : "#FF3B30",
                    }}
                  >
                    {breakdown.days_remaining || 0} dagen
                  </div>
                </ListItem>

                <ListItem>
                  <IonIcon
                    icon={breakdown.is_active ? checkmarkCircle : closeCircle}
                    slot="media"
                    style={{
                      color: breakdown.is_active ? "#34C759" : "#FF3B30",
                      fontSize: "24px",
                    }}
                  />
                  <div slot="title">Status</div>
                  <div
                    slot="after"
                    style={{
                      fontWeight: "bold",
                      color: breakdown.is_active ? "#34C759" : "#FF3B30",
                    }}
                  >
                    {breakdown.is_active ? "Actief" : "Inactief"}
                  </div>
                </ListItem>

                <ListItem>
                  <div
                    slot="media"
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: getAccessSourceColor(
                        breakdown.access_source
                      ),
                    }}
                  />
                  <div slot="title">Toegangsbron</div>
                  <div slot="after" style={{ fontWeight: "bold" }}>
                    {getAccessSourceLabel(breakdown.access_source)}
                  </div>
                </ListItem>
              </List>

              {/* Dates */}
              {subscription && (
                <>
                  <BlockTitle>Datums</BlockTitle>
                  <List strong inset>
                    {subscription.start_date && (
                      <ListItem>
                        <IonIcon
                          icon={calendarOutline}
                          slot="media"
                          style={{ color: "#8E8E93", fontSize: "24px" }}
                        />
                        <div slot="title">Startdatum</div>
                        <div slot="after" style={{ fontSize: "14px" }}>
                          {formatDate(subscription.start_date)}
                        </div>
                      </ListItem>
                    )}

                    {subscription.end_date && (
                      <ListItem>
                        <IonIcon
                          icon={calendarOutline}
                          slot="media"
                          style={{ color: "#8E8E93", fontSize: "24px" }}
                        />
                        <div slot="title">Einddatum</div>
                        <div slot="after" style={{ fontSize: "14px" }}>
                          {formatDate(subscription.end_date)}
                        </div>
                      </ListItem>
                    )}

                    {subscription.last_extended_at && (
                      <ListItem>
                        <IonIcon
                          icon={timeOutline}
                          slot="media"
                          style={{ color: "#8E8E93", fontSize: "24px" }}
                        />
                        <div slot="title">Laatst Verlengd</div>
                        <div slot="after" style={{ fontSize: "14px" }}>
                          {formatDate(subscription.last_extended_at)}
                        </div>
                      </ListItem>
                    )}
                  </List>
                </>
              )}

              {/* Extension History */}
              {subscription?.extension_history &&
                subscription.extension_history.length > 0 && (
                  <>
                    <BlockTitle>Verlengingsgeschiedenis</BlockTitle>
                    <List strong inset>
                      {subscription.extension_history
                        .slice()
                        .reverse()
                        .map((entry, index) => {
                          const sourceIcon = {
                            payment: cashOutline,
                            referral: giftOutline,
                            trial: timeOutline,
                          };
                          const sourceColor = {
                            payment: "var(--app-primary-color)",
                            referral: "#34C759",
                            trial: getLayout()?.colorScheme?.[0],
                          };

                          return (
                            <ListItem key={index}>
                              <IonIcon
                                icon={sourceIcon[entry.source] || listOutline}
                                slot="media"
                                style={{
                                  color: sourceColor[entry.source] || "#8E8E93",
                                  fontSize: "24px",
                                }}
                              />
                              <div slot="title">
                                {getAccessSourceLabel(entry.source)}
                              </div>
                              <div slot="text" style={{ fontSize: "12px" }}>
                                {formatDate(entry.date)}
                              </div>
                              <div
                                slot="after"
                                style={{
                                  fontWeight: "bold",
                                  color: sourceColor[entry.source] || "#8E8E93",
                                }}
                              >
                                +{entry.days} dagen
                              </div>
                            </ListItem>
                          );
                        })}
                    </List>
                  </>
                )}

              {/* Info Card */}
              <Block strong inset style={{ marginBottom: "32px" }}>
                <Card>
                  <CardContent>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      <strong>Toelichting:</strong>
                      <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        <li>
                          <strong>Betaalde dagen:</strong> Gekocht via betalingen
                        </li>
                        <li>
                          <strong>Verdiende dagen:</strong> Verkregen via
                          verwijzingen
                        </li>
                        <li>
                          <strong>Gemengd:</strong> Combinatie van betaald en
                          verdiend
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </Block>
            </>
          )}

        </PageContent>
      </Page>
    </Sheet>
  );
};

export default SubscriptionBreakdownSheet;
