// pages/ReferralPage.jsx
import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Link,
  Toolbar,
  Tabs,
  Tab,
  Block,
  Button,
  f7,
  useStore,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  shareOutline,
  giftOutline,
  trophyOutline,
  homeOutline,
} from "ionicons/icons";

// Import referral components
import ReferralDashboard from "../components/ReferralDashboard";
import ReferralShareSheet from "../components/ReferralShareSheet";
import ReferralRewardsPanel from "../components/ReferralRewardsPanel";
import ReferralLeaderboard from "../components/ReferralLeaderboard";
import { referralService } from "../services/referralService";
import { SEO } from "../js/seoUtils";
import useAppNavigation from "../hooks/useAppNavigation";

/**
 * ReferralPage Component
 * Main page for the referral system with tabs for:
 * - Dashboard: Overview of referral stats and code
 * - Rewards: Earned rewards display
 * - Leaderboard: Rankings and competition
 */
const ReferralPage = () => {
  const { back } = useAppNavigation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const authUser = useStore("authUser");
  const [studentId, setStudentId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Get student and school info
    const storedStudentId = localStorage.getItem("studentId");
    const storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const storedSchoolName = localStorage.getItem("selectedSchoolName");

    setStudentId(storedStudentId || authUser?.id);
    setSchoolId(storedSchoolId);
    setSchoolName(storedSchoolName || "Jouw Rijschool");

    // Get student name
    if (authUser?.name) {
      setStudentName(authUser.name);
    } else {
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          setStudentName(profile.name || "Student");
        } catch (e) {
          setStudentName("Student");
        }
      }
    }
  }, [authUser]);

  useEffect(() => {
    const loadReferralCode = async () => {
      if (!studentId || !schoolId) return;

      try {
        const { data, error } = await referralService.getOrCreateReferralCode(
          studentId,
          schoolId,
        );

        if (!error && data?.referral_code) {
          setReferralCode(data.referral_code);
        }
      } catch (error) {
        console.error("Error loading referral code on referral page:", error);
      }
    };

    loadReferralCode();
  }, [studentId, schoolId]);

  const openShareSheet = () => {
    f7.sheet.open(".referral-share-sheet");
  };

  if (!studentId || !schoolId) {
    return (
      <Page name="referral">
        <Navbar>
          <NavLeft>
            <button
              type="button"
              onClick={back}
              aria-label="Go back"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <IonIcon icon={arrowBack} />
            </button>
          </NavLeft>
          <NavTitle>Referral Program</NavTitle>
        </Navbar>
        <Block className="text-align-center" style={{ marginTop: "50%" }}>
          <IonIcon
            icon={giftOutline}
            style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
          />
          <h3>Login Required</h3>
          <p style={{ color: "#666" }}>
            Please log in to access the referral program.
          </p>
        </Block>
      </Page>
    );
  }

  return (
    <Page name="referral">
      <SEO page="referral" />
      {/* Navbar */}
      <Navbar>
        <NavLeft>
          <button
            type="button"
            onClick={back}
            aria-label="Go back"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <IonIcon icon={arrowBack} />
          </button>
        </NavLeft>
        <NavTitle>Referral Program</NavTitle>
      </Navbar>

      <Toolbar tabbar labels bottom>
        <Link
          tabLink="#tab-dashboard"
          tabLinkActive={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        >
          <IonIcon icon={homeOutline} />
          <span className="tabbar-label">Dashboard</span>
        </Link>
        <Link
          tabLink="#tab-rewards"
          tabLinkActive={activeTab === "rewards"}
          onClick={() => setActiveTab("rewards")}
        >
          <IonIcon icon={giftOutline} />
          <span className="tabbar-label">Rewards</span>
        </Link>
        <Link
          tabLink="#tab-leaderboard"
          tabLinkActive={activeTab === "leaderboard"}
          onClick={() => setActiveTab("leaderboard")}
        >
          <IonIcon icon={trophyOutline} />
          <span className="tabbar-label">Leaderboard</span>
        </Link>
      </Toolbar>

      {/* Tabs */}
      <Tabs>
        {/* Dashboard Tab */}
        <Tab id="tab-dashboard" tabActive={activeTab === "dashboard"}>
          <ReferralDashboard
            studentId={studentId}
            schoolId={schoolId}
            schoolName={schoolName}
          />
        </Tab>

        {/* Rewards Tab */}
        <Tab id="tab-rewards" tabActive={activeTab === "rewards"}>
          <ReferralRewardsPanel studentId={studentId} />
        </Tab>

        {/* Leaderboard Tab */}
        <Tab id="tab-leaderboard" tabActive={activeTab === "leaderboard"}>
          <ReferralLeaderboard
            studentId={studentId}
            schoolId={schoolId}
            schoolName={schoolName}
          />
        </Tab>
      </Tabs>

      {/* Share Sheet */}
      <ReferralShareSheet
        referralCode={referralCode}
        schoolName={schoolName}
        studentName={studentName}
        schoolId={schoolId}
      />
    </Page>
  );
};

export default ReferralPage;
