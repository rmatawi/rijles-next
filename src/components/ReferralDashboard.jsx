// components/ReferralDashboard.jsx
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
  Progressbar,
  Preloader,
  f7,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  giftOutline,
  peopleOutline,
  trophyOutline,
  shareOutline,
  copyOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { referralService } from "../services/referralService";

/**
 * ReferralDashboard Component
 * Displays student's referral overview including:
 * - Referral code and share options
 * - Statistics (invites sent, signups, rewards earned)
 * - Progress to next reward
 * - Leaderboard position
 */
const ReferralDashboard = ({ studentId, schoolId, schoolName }) => {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState(null);
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (studentId && schoolId) {
      loadReferralData();
    }
  }, [studentId, schoolId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get or create referral code
      const { data: codeData, error: codeError } =
        await referralService.getOrCreateReferralCode(studentId, schoolId);

      if (!codeError && codeData) {
        setReferralCode(codeData.referral_code);
      }

      // Get referral statistics
      const { data: statsData, error: statsError } =
        await referralService.getReferralStats(studentId);

      if (!statsError && statsData) {
        setStats(statsData);
      }

      // Get leaderboard position
      const { data: leaderboard, error: leaderboardError } =
        await referralService.getLeaderboard(schoolId, "month", 100);

      if (!leaderboardError && leaderboard) {
        const position =
          leaderboard.findIndex((entry) => entry.studentId === studentId) + 1;
        setLeaderboardPosition(position > 0 ? position : null);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
      f7.dialog.alert("Error loading referral data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (!referralCode) return;

    navigator.clipboard
      .writeText(referralCode)
      .then(() => {
        setCopiedCode(true);
        f7.toast
          .create({
            text: "Referral code copied to clipboard!",
            closeTimeout: 2000,
            position: "center",
          })
          .open();

        setTimeout(() => setCopiedCode(false), 2000);
      })
      .catch((err) => {
        console.error("Error copying code:", err);
      });
  };

  const openShareSheet = () => {
    f7.sheet.open(".referral-share-sheet");
  };

  const getNextMilestone = (completedReferrals) => {
    if (completedReferrals < 3) return { target: 3, reward: "7 Dagen Gratis" };
    if (completedReferrals < 5) return { target: 5, reward: "14 Dagen Gratis" };
    if (completedReferrals < 10)
      return { target: 10, reward: "30 Dagen Gratis" };
    return { target: completedReferrals + 10, reward: "30 Dagen Extra" };
  };

  if (loading) {
    return (
      <Block className="text-align-center">
        <Preloader />
        <p>Loading referral dashboard...</p>
      </Block>
    );
  }

  if (!stats) {
    return (
      <Block>
        <p>Unable to load referral data. Please try again later.</p>
      </Block>
    );
  }

  const nextMilestone = getNextMilestone(stats.completedReferrals);
  const progressPercentage =
    (stats.completedReferrals / nextMilestone.target) * 100;

  return (
    <div className="referral-dashboard">
      {/* Header Stats */}
      <Block strong inset className="margin-bottom">
        <div className="referral-header-stats">
          <Card className="elevation-3">
            <CardContent className="padding">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {stats.totalInvites}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--f7-text-color-secondary)",
                    }}
                  >
                    Invites Sent
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "var(--f7-theme-color)",
                    }}
                  >
                    {stats.completedReferrals}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--f7-text-color-secondary)",
                    }}
                  >
                    Signups
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {stats.totalRewards}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--f7-text-color-secondary)",
                    }}
                  >
                    Rewards
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Block>

      {/* Referral Code Card */}
      <BlockTitle>Your Referral Link</BlockTitle>
      <Block strong inset className="margin-bottom">
        <Card className="elevation-3" style={{ margin: 0 }}>
          <CardContent style={{ padding: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(var(--f7-theme-color-rgb), 0.12)",
                  color: "var(--f7-theme-color)",
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={peopleOutline} style={{ fontSize: "22px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                  Deel je link en verdien extra dagen
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--f7-text-color-secondary)",
                    lineHeight: "1.45",
                  }}
                >
                  Stuur je referral link via WhatsApp of kopieer de link. Als
                  iemand zich aanmeldt met jouw code, telt dat mee voor je
                  beloningen.
                </div>
              </div>
            </div>

            {referralCode && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: "rgba(0,0,0,0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--f7-text-color-secondary)",
                  }}
                >
                  Jouw code
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    color: "var(--f7-theme-color)",
                  }}
                >
                  {referralCode}
                </span>
              </div>
            )}

            <Button
              fill
              large
              round
              color="green"
              onClick={openShareSheet}
              style={{
                width: "100%",
                minHeight: "48px",
                fontWeight: "700",
                boxShadow: "0 8px 20px rgba(52, 199, 89, 0.28)",
              }}
            >
              <IonIcon icon={shareOutline} style={{ marginRight: "8px" }} />
              Deel Referral Link
            </Button>
          </CardContent>
        </Card>
      </Block>

      {/* Progress to Next Reward */}
      <BlockTitle>Next Reward</BlockTitle>
      <Block strong inset className="margin-bottom">
        <Card className="elevation-3">
          <CardContent>
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {nextMilestone.reward}
                </span>
                <span
                  style={{
                    color: "var(--f7-theme-color)",
                    fontWeight: "bold",
                  }}
                >
                  {stats.completedReferrals} / {nextMilestone.target}
                </span>
              </div>
              <Progressbar
                progress={progressPercentage}
                color="blue"
                style={{ height: "8px", borderRadius: "4px" }}
              />
              <div
                style={{
                  textAlign: "center",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--f7-text-color-secondary)",
                }}
              >
                {nextMilestone.target - stats.completedReferrals} more{" "}
                {nextMilestone.target - stats.completedReferrals === 1
                  ? "referral"
                  : "referrals"}{" "}
                to unlock
              </div>
            </div>
          </CardContent>
        </Card>
      </Block>

      {/* Leaderboard Position */}
      {leaderboardPosition && (
        <>
          <BlockTitle>Leaderboard</BlockTitle>
          <Block strong inset className="margin-bottom">
            <Card className="elevation-3">
              <CardContent>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IonIcon
                      icon={trophyOutline}
                      style={{
                        fontSize: "32px",
                        marginRight: "16px",
                        color: "#FFD700",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        #{leaderboardPosition}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--f7-text-color-secondary)",
                        }}
                      >
                        Your Rank This Month
                      </div>
                    </div>
                  </div>
                  <Button
                    small
                    outline
                    onClick={() =>
                      f7.views.main.router.navigate(
                        "/?page=referral-leaderboard",
                      )
                    }
                  >
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Block>
        </>
      )}

      {/* Rewards Summary */}
      {stats.rewards && stats.rewards.length > 0 && (
        <>
          <BlockTitle>Recent Rewards ({stats.totalRewards})</BlockTitle>
          <List inset strong>
            {stats.rewards.slice(0, 3).map((reward) => (
              <ListItem key={reward.id} title={reward.reward_type}>
                <div
                  slot="after"
                  style={{
                    color: reward.redeemed ? "var(--f7-theme-color)" : "#999",
                  }}
                >
                  {reward.redeemed ? "Redeemed" : "Available"}
                </div>
                <IonIcon icon={giftOutline} slot="media" />
              </ListItem>
            ))}
          </List>
          {stats.rewards.length > 3 && (
            <Block className="text-align-center">
              <Button
                small
                outline
                onClick={() =>
                  f7.views.main.router.navigate("/?page=referral-rewards")
                }
              >
                View All Rewards
              </Button>
            </Block>
          )}
        </>
      )}

      {/* How It Works */}
      <BlockTitle>How It Works</BlockTitle>
      <Block strong inset>
        <Card className="elevation-3">
          <CardContent>
            <List>
              <ListItem header="Step 1">
                <div slot="title">
                  <strong>Share Your Code</strong>
                </div>
                <div slot="text">
                  Share your unique referral code with friends and family
                </div>
              </ListItem>
              <ListItem header="Step 2">
                <div slot="title">
                  <strong>They Sign Up</strong>
                </div>
                <div slot="text">
                  When they register using your code, you both benefit
                </div>
              </ListItem>
              <ListItem header="Step 3">
                <div slot="title">
                  <strong>Earn Rewards</strong>
                </div>
                <div slot="text">
                  Get free time, premium features, and lesson credits
                </div>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Block>

      {/* Reward Tiers */}
      <BlockTitle>Reward Tiers</BlockTitle>
      <Block strong inset>
        <List inset>
          <ListItem
            title="3 Referrals"
            after="7 Dagen Gratis"
            text="Krijg 7 dagen gratis verlenging"
          >
            <IonIcon
              icon={
                stats.completedReferrals >= 3 ? checkmarkCircle : giftOutline
              }
              slot="media"
              style={{
                color:
                  stats.completedReferrals >= 3
                    ? "var(--f7-theme-color)"
                    : "#999",
              }}
            />
          </ListItem>
          <ListItem
            title="5 Referrals"
            after="14 Dagen Gratis"
            text="Krijg 14 dagen gratis verlenging"
          >
            <IonIcon
              icon={
                stats.completedReferrals >= 5 ? checkmarkCircle : giftOutline
              }
              slot="media"
              style={{
                color:
                  stats.completedReferrals >= 5
                    ? "var(--f7-theme-color)"
                    : "#999",
              }}
            />
          </ListItem>
          <ListItem
            title="10 Referrals"
            after="30 Dagen Gratis"
            text="Krijg 30 dagen gratis verlenging"
          >
            <IonIcon
              icon={
                stats.completedReferrals >= 10 ? checkmarkCircle : giftOutline
              }
              slot="media"
              style={{
                color:
                  stats.completedReferrals >= 10
                    ? "var(--f7-theme-color)"
                    : "#999",
              }}
            />
          </ListItem>
        </List>
      </Block>
    </div>
  );
};

export default ReferralDashboard;
