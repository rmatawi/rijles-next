// components/ReferralLeaderboard.jsx
import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Card,
  CardContent,
  List,
  ListItem,
  Segmented,
  Button,
  Preloader,
  Badge,
  f7,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  trophyOutline,
  ribbonOutline,
  medalOutline,
  personOutline,
} from "ionicons/icons";
import { referralService } from "../services/referralService";

/**
 * ReferralLeaderboard Component
 * Displays top referrers leaderboard with:
 * - School leaderboard (per school)
 * - Global leaderboard (all schools)
 * - Time frame filters (week, month, all-time)
 * - Current user's position highlight
 */
const ReferralLeaderboard = ({ studentId, schoolId, schoolName }) => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState("month");
  const [scope, setScope] = useState("school"); // 'school' or 'global'
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    if ((scope === "school" && schoolId) || scope === "global") {
      loadLeaderboard();
    }
  }, [studentId, schoolId, timeframe, scope]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const { data, error } = await referralService.getLeaderboard(
        scope === "school" ? schoolId : null,
        timeframe,
        100 // Get top 100
      );

      if (!error && data) {
        setLeaderboard(data);

        // Find current user's rank
        if (studentId) {
          const rank = data.findIndex((entry) => entry.studentId === studentId) + 1;
          setMyRank(rank > 0 ? rank : null);
        }
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      f7.dialog.alert("Error loading leaderboard. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position) => {
    if (position === 1) return { icon: trophyOutline, color: "#FFD700" }; // Gold
    if (position === 2) return { icon: medalOutline, color: "#C0C0C0" }; // Silver
    if (position === 3) return { icon: ribbonOutline, color: "#CD7F32" }; // Bronze
    return { icon: personOutline, color: "#8E8E93" };
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "alltime":
        return "All Time";
      default:
        return "This Month";
    }
  };

  if (loading) {
    return (
      <Block className="text-align-center">
        <Preloader />
        <p>Loading leaderboard...</p>
      </Block>
    );
  }

  return (
    <div className="referral-leaderboard">
      {/* Scope Segmented Control */}
      <Block strong inset>
        <Segmented raised>
          <Button
            active={scope === "school"}
            onClick={() => setScope("school")}
          >
            {schoolName || "School"}
          </Button>
          <Button
            active={scope === "global"}
            onClick={() => setScope("global")}
          >
            Global
          </Button>
        </Segmented>
      </Block>

      {/* Timeframe Segmented Control */}
      <Block strong inset>
        <Segmented raised>
          <Button
            active={timeframe === "week"}
            onClick={() => setTimeframe("week")}
          >
            Week
          </Button>
          <Button
            active={timeframe === "month"}
            onClick={() => setTimeframe("month")}
          >
            Month
          </Button>
          <Button
            active={timeframe === "alltime"}
            onClick={() => setTimeframe("alltime")}
          >
            All Time
          </Button>
        </Segmented>
      </Block>

      {/* My Rank Card */}
      {myRank && (
        <>
          <BlockTitle>Your Rank</BlockTitle>
          <Block strong inset className="margin-bottom">
            <Card className="elevation-3">
              <CardContent>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "var(--f7-theme-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px",
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                    >
                      {myRank}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        You're #{myRank}!
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {getTimeframeLabel()} - {scope === "school" ? schoolName : "Global"}
                      </div>
                    </div>
                  </div>
                  {myRank <= 3 && (
                    <IonIcon
                      icon={getMedalIcon(myRank).icon}
                      style={{
                        fontSize: "40px",
                        color: getMedalIcon(myRank).color,
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </Block>
        </>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <>
          <BlockTitle>Top 3 Champions</BlockTitle>
          <Block strong inset className="margin-bottom">
            <Card className="elevation-3">
              <CardContent>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    textAlign: "center",
                  }}
                >
                  {/* 2nd Place */}
                  <div style={{ paddingTop: "24px" }}>
                    <IonIcon
                      icon={medalOutline}
                      style={{ fontSize: "32px", color: "#C0C0C0" }}
                    />
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      {leaderboard[1]?.name || "Unknown"}
                    </div>
                    <Badge color="gray">{leaderboard[1]?.count || 0}</Badge>
                  </div>

                  {/* 1st Place */}
                  <div>
                    <IonIcon
                      icon={trophyOutline}
                      style={{ fontSize: "48px", color: "#FFD700" }}
                    />
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        marginTop: "4px",
                      }}
                    >
                      {leaderboard[0]?.name || "Unknown"}
                    </div>
                    <Badge color="yellow">{leaderboard[0]?.count || 0}</Badge>
                  </div>

                  {/* 3rd Place */}
                  <div style={{ paddingTop: "24px" }}>
                    <IonIcon
                      icon={ribbonOutline}
                      style={{ fontSize: "32px", color: "#CD7F32" }}
                    />
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      {leaderboard[2]?.name || "Unknown"}
                    </div>
                    <Badge color="orange">{leaderboard[2]?.count || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Block>
        </>
      )}

      {/* Full Leaderboard */}
      <BlockTitle>
        Top Referrers - {getTimeframeLabel()}
      </BlockTitle>
      {leaderboard.length === 0 ? (
        <Block strong inset>
          <Card className="elevation-3">
            <CardContent className="text-align-center" style={{ padding: "32px" }}>
              <IonIcon
                icon={trophyOutline}
                style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
              />
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                No Data Yet
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Be the first to refer friends and top the leaderboard!
              </div>
            </CardContent>
          </Card>
        </Block>
      ) : (
        <List strong inset>
          {leaderboard.slice(0, 50).map((entry, index) => {
            const position = index + 1;
            const medal = getMedalIcon(position);
            const isCurrentUser = entry.studentId === studentId;

            return (
              <ListItem
                key={entry.studentId}
                style={{
                  backgroundColor: isCurrentUser
                    ? "rgba(0, 122, 255, 0.1)"
                    : "transparent",
                }}
              >
                <div
                  slot="media"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background:
                      position <= 3
                        ? medal.color
                        : "var(--f7-list-item-media-bg-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: position <= 3 ? "#fff" : "inherit",
                  }}
                >
                  {position <= 3 ? (
                    <IonIcon icon={medal.icon} />
                  ) : (
                    position
                  )}
                </div>
                <div slot="title">
                  {entry.name || "Anonymous"}
                  {isCurrentUser && (
                    <Badge color="blue" style={{ marginLeft: "8px" }}>
                      You
                    </Badge>
                  )}
                </div>
                <div slot="text">
                  {entry.count} referral{entry.count !== 1 ? "s" : ""}
                </div>
                <div
                  slot="after"
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color:
                      position <= 3 ? medal.color : "var(--f7-theme-color)",
                  }}
                >
                  {entry.count}
                </div>
              </ListItem>
            );
          })}
        </List>
      )}

      {leaderboard.length > 50 && (
        <Block className="text-align-center">
          <p style={{ color: "#666", fontSize: "14px" }}>
            Showing top 50 referrers
          </p>
        </Block>
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
                How Leaderboard Works
              </div>
              <ul style={{ margin: "0", paddingLeft: "20px" }}>
                <li>Rankings based on completed referrals</li>
                <li>Updates in real-time as referrals sign up</li>
                <li>Top referrers earn special badges</li>
                <li>Monthly winners get featured on school wall</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </Block>
    </div>
  );
};

export default ReferralLeaderboard;
