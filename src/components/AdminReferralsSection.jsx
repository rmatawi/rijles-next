// src/components/AdminReferralsSection.jsx
import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  Button,
  Icon,
  Preloader,
  Chip,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  peopleOutline,
  trophyOutline,
  giftOutline,
  checkmarkCircle,
  timeOutline,
  statsChartOutline,
  personOutline,
  copyOutline,
} from "ionicons/icons";
import { referralService } from "../services/referralService";
import { getLayout } from "../js/utils";

const AdminReferralsSection = ({ selectedSchoolId, selectedSchoolName }) => {
  const [loading, setLoading] = useState(true);
  const [schoolStats, setSchoolStats] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (selectedSchoolId) {
      loadReferralData();
    }
  }, [selectedSchoolId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Load school-wide stats
      const statsResult = await referralService.getSchoolReferralStats(
        selectedSchoolId
      );
      if (statsResult.data) {
        setSchoolStats(statsResult.data);
      }

      // Load student-level stats
      const studentStatsResult =
        await referralService.getSchoolStudentReferralStats(selectedSchoolId);
      if (studentStatsResult.data) {
        setStudentStats(studentStatsResult.data);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code, studentName) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!selectedSchoolId) {
    return (
      <Block className="text-align-center" style={{ marginTop: "50px" }}>
        <IonIcon
          icon={peopleOutline}
          style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
        />
        <h3>Selecteer een Rijschool</h3>
        <p style={{ color: "#666" }}>
          Kies een rijschool om referral statistieken te bekijken
        </p>
      </Block>
    );
  }

  if (loading) {
    return (
      <Block className="text-align-center" style={{ marginTop: "50px" }}>
        <Preloader />
        <p>Referral gegevens laden...</p>
      </Block>
    );
  }

  const displayedStudents = showAllStudents
    ? studentStats
    : studentStats.slice(0, 10);

  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* School Name Header */}
      <BlockTitle large style={{ marginTop: "16px" }}>
        {selectedSchoolName || "School"} - Referrals
      </BlockTitle>

      {/* School-Wide Statistics */}
      <BlockTitle>Overzicht Statistieken</BlockTitle>
      <Block strong inset style={{ margin: "8px 16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <Card style={{ margin: 0 }}>
              <CardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon
                  icon={peopleOutline}
                  style={{ fontSize: "32px", color: "var(--app-primary-color)" }}
                />
                <h1 style={{ margin: "8px 0 4px" }}>
                  {schoolStats?.totalReferrals || 0}
                </h1>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  Totaal Referrals
                </p>
              </CardContent>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card style={{ margin: 0 }}>
              <CardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon
                  icon={checkmarkCircle}
                  style={{ fontSize: "32px", color: "#4cd964" }}
                />
                <h1 style={{ margin: "8px 0 4px" }}>
                  {schoolStats?.completedReferrals || 0}
                </h1>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  Voltooid
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <div style={{ flex: 1 }}>
            <Card style={{ margin: 0 }}>
              <CardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon
                  icon={timeOutline}
                  style={{ fontSize: "32px", color: getLayout()?.colorScheme?.[0] }}
                />
                <h1 style={{ margin: "8px 0 4px" }}>
                  {schoolStats?.pendingReferrals || 0}
                </h1>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  In Behandeling
                </p>
              </CardContent>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card style={{ margin: 0 }}>
              <CardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon
                  icon={personOutline}
                  style={{ fontSize: "32px", color: "#5856d6" }}
                />
                <h1 style={{ margin: "8px 0 4px" }}>
                  {schoolStats?.uniqueReferrers || 0}
                </h1>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  Actieve Referrers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card style={{ marginTop: "8px" }}>
          <CardContent style={{ textAlign: "center", padding: "16px" }}>
            <IonIcon
              icon={statsChartOutline}
              style={{ fontSize: "32px", color: "#34c759" }}
            />
            <h1 style={{ margin: "8px 0 4px" }}>
              {schoolStats?.conversionRate || 0}%
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
              Conversie Ratio
            </p>
          </CardContent>
        </Card>
      </Block>

      {/* Top Referrers Leaderboard */}
      <BlockTitle>
        <IonIcon icon={trophyOutline} style={{ marginRight: "8px" }} />
        Top Referrers
      </BlockTitle>
      {studentStats.length === 0 ? (
        <Block strong inset style={{ margin: "8px 16px" }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <IonIcon
              icon={peopleOutline}
              style={{ fontSize: "48px", color: "#ccc", marginBottom: "12px" }}
            />
            <p style={{ color: "#666", margin: 0 }}>
              Nog geen referrals voor deze school
            </p>
          </div>
        </Block>
      ) : (
        <>
          <List
            mediaList
            strong
            inset
            style={{ margin: "8px 16px 16px", fontSize: "14px" }}
          >
            {displayedStudents.map((student, index) => (
              <ListItem
                key={student.studentId}
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {index < 3 && (
                      <span
                        style={{
                          fontSize: "20px",
                          marginRight: "8px",
                        }}
                      >
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    )}
                    <span>{student.name}</span>
                  </div>
                }
                subtitle={student.email}
                after={
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "var(--app-primary-color)",
                      }}
                    >
                      {student.completedReferrals}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      voltooid
                    </div>
                  </div>
                }
              >
                <div slot="text" style={{ marginTop: "8px" }}>
                  <Chip
                    text={`${student.totalReferrals} totaal`}
                    mediaBgColor="blue"
                    style={{ marginRight: "4px" }}
                  >
                    <IonIcon icon={peopleOutline} slot="media" />
                  </Chip>
                  {student.pendingReferrals > 0 && (
                    <Chip
                      text={`${student.pendingReferrals} pending`}
                      mediaBgColor="orange"
                      style={{ marginRight: "4px" }}
                    >
                      <IonIcon icon={timeOutline} slot="media" />
                    </Chip>
                  )}
                  {student.referralCode && (
                    <Chip
                      text={
                        copiedCode === student.referralCode
                          ? "Gekopieerd!"
                          : student.referralCode
                      }
                      mediaBgColor={
                        copiedCode === student.referralCode ? "green" : "gray"
                      }
                      style={{ marginRight: "4px", cursor: "pointer" }}
                      onClick={() =>
                        copyToClipboard(student.referralCode, student.name)
                      }
                    >
                      <IonIcon
                        icon={
                          copiedCode === student.referralCode
                            ? checkmarkCircle
                            : copyOutline
                        }
                        slot="media"
                      />
                    </Chip>
                  )}
                </div>
              </ListItem>
            ))}
          </List>

          {studentStats.length > 10 && (
            <Block style={{ textAlign: "center", marginTop: "8px" }}>
              <Button
                fill
                onClick={() => setShowAllStudents(!showAllStudents)}
                style={{ margin: "0 16px" }}
              >
                {showAllStudents
                  ? "Toon Minder"
                  : `Toon Alle ${studentStats.length} Studenten`}
              </Button>
            </Block>
          )}
        </>
      )}

      {/* Refresh Button */}
      <Block style={{ textAlign: "center", marginTop: "16px" }}>
        <Button outline onClick={loadReferralData}>
          <Icon f7="arrow_clockwise" style={{ marginRight: "8px" }} />
          Ververs Gegevens
        </Button>
      </Block>
    </div>
  );
};

export default AdminReferralsSection;
