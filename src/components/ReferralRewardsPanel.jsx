// components/ReferralRewardsPanel.jsx
import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Card,
  CardContent,
  List,
  ListItem,
  Button,
  Preloader,
  Badge,
  f7,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  giftOutline,
  timeOutline,
  starOutline,
  schoolOutline,
  ribbonOutline,
  checkmarkCircle,
  ellipseOutline,
} from "ionicons/icons";
import { referralService } from "../services/referralService";
import { getLayout } from "../js/utils";

/**
 * ReferralRewardsPanel Component
 * Displays earned rewards from the referral program:
 * - Available rewards (not yet redeemed)
 * - Redeemed rewards
 * - Reward details and redemption status
 */
const ReferralRewardsPanel = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadRewards();
    }
  }, [studentId]);

  const loadRewards = async () => {
    try {
      setLoading(true);

      // Get referral statistics which includes rewards
      const { data: statsData, error: statsError } =
        await referralService.getReferralStats(studentId);

      if (!statsError && statsData) {
        setStats(statsData);
        setRewards(statsData.rewards || []);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
      f7.dialog.alert("Error loading rewards. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (rewardType) => {
    switch (rewardType) {
      case "time_extension":
        return timeOutline;
      case "premium_unlock":
        return starOutline;
      case "lesson_credit":
        return schoolOutline;
      case "badge":
        return ribbonOutline;
      default:
        return giftOutline;
    }
  };

  const getRewardColor = (rewardType) => {
    switch (rewardType) {
      case "time_extension":
        return "var(--app-primary-color)";
      case "premium_unlock":
        return getLayout()?.colorScheme?.[0];
      case "lesson_credit":
        return "#34C759";
      case "badge":
        return "#AF52DE";
      default:
        return "#8E8E93";
    }
  };

  const getRewardTitle = (rewardType, rewardValue) => {
    switch (rewardType) {
      case "time_extension":
        return rewardValue?.description || "Time Extension";
      case "premium_unlock":
        return rewardValue?.description || "Premium Features";
      case "lesson_credit":
        return rewardValue?.description || "Lesson Credit";
      case "badge":
        return rewardValue?.description || "Special Badge";
      default:
        return "Reward";
    }
  };

  const formatRewardValue = (rewardType, rewardValue) => {
    if (!rewardValue) return "";

    switch (rewardType) {
      case "time_extension":
        return `${rewardValue.days || 30} days`;
      case "premium_unlock":
        return rewardValue.features?.length
          ? `${rewardValue.features.length} features`
          : "All features";
      case "lesson_credit":
        return `${rewardValue.credits || 1} lesson${
          rewardValue.credits > 1 ? "s" : ""
        }`;
      case "badge":
        return rewardValue.type || "Badge";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Block className="text-align-center">
        <Preloader />
        <p>Loading rewards...</p>
      </Block>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <Block strong inset>
        <Card className="elevation-3">
          <CardContent className="text-align-center" style={{ padding: "32px" }}>
            <IonIcon
              icon={giftOutline}
              style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              No Rewards Yet
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              Start referring friends to earn rewards!
            </div>
          </CardContent>
        </Card>
      </Block>
    );
  }

  const availableRewards = rewards.filter((r) => !r.redeemed);
  const redeemedRewards = rewards.filter((r) => r.redeemed);

  return (
    <div className="referral-rewards-panel">
      {/* Summary Stats */}
      <Block strong inset className="margin-bottom">
        <Card className="elevation-3">
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
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "var(--f7-theme-color)",
                  }}
                >
                  {availableRewards.length}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Available
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#34C759",
                  }}
                >
                  {redeemedRewards.length}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Redeemed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Block>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <>
          <BlockTitle>Available Rewards</BlockTitle>
          <List strong inset>
            {availableRewards.map((reward) => (
              <ListItem key={reward.id}>
                <IonIcon
                  icon={getRewardIcon(reward.reward_type)}
                  slot="media"
                  style={{
                    color: getRewardColor(reward.reward_type),
                    fontSize: "28px",
                  }}
                />
                <div slot="title">
                  {getRewardTitle(reward.reward_type, reward.reward_value)}
                </div>
                <div slot="text">
                  {formatRewardValue(reward.reward_type, reward.reward_value)}
                  <br />
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    Earned: {formatDate(reward.created_at)}
                  </span>
                </div>
                <Badge
                  slot="after"
                  color="blue"
                  style={{ marginRight: "8px" }}
                >
                  Available
                </Badge>
              </ListItem>
            ))}
          </List>
          <Block className="margin-bottom">
            <Button fill round large>
              Contact School to Redeem
            </Button>
          </Block>
        </>
      )}

      {/* Redeemed Rewards */}
      {redeemedRewards.length > 0 && (
        <>
          <BlockTitle>Redeemed Rewards</BlockTitle>
          <List strong inset>
            {redeemedRewards.map((reward) => (
              <ListItem key={reward.id}>
                <IonIcon
                  icon={checkmarkCircle}
                  slot="media"
                  style={{
                    color: "#34C759",
                    fontSize: "28px",
                  }}
                />
                <div slot="title">
                  {getRewardTitle(reward.reward_type, reward.reward_value)}
                </div>
                <div slot="text">
                  {formatRewardValue(reward.reward_type, reward.reward_value)}
                  <br />
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    Redeemed: {formatDate(reward.redeemed_at)}
                  </span>
                </div>
                <IonIcon
                  icon={checkmarkCircle}
                  slot="after"
                  style={{ color: "#34C759", fontSize: "20px" }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Info Card */}
      <Block strong inset>
        <Card className="elevation-3">
          <CardContent>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.6",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                How to Redeem Rewards
              </div>
              <ul style={{ margin: "0", paddingLeft: "20px" }}>
                <li>Time extensions are applied automatically</li>
                <li>Premium features unlock instantly</li>
                <li>Lesson credits can be scheduled with your instructor</li>
                <li>Contact your school for special rewards</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </Block>
    </div>
  );
};

export default ReferralRewardsPanel;
