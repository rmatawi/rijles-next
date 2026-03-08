// pages/HomePage.jsx - Refactored version with extracted components
// pages/HomePage.jsx - Refactored version with extracted components
import {
  Page,
  Navbar,
  NavLeft,
  NavRight,
  CardFooter,
  Button,
  NavTitle,
  Toolbar,
  f7,
  Sheet,
  useStore,
  Icon,
  SkeletonBlock,
} from "framework7-react";
import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { IonIcon } from "@ionic/react";
import { personCircle, warning, documentText, megaphone } from "ionicons/icons";
import { authService } from "../services/authService";
import { schoolService } from "../services/schoolService";
import { inviteService } from "../services/inviteService";
import { adminService } from "../services/adminService";
import {
  setSafeSelectedSchoolId,
  isAdminUser,
  getLayout,
  isSuperAdmin,
  getThemeGradient,
} from "../js/utils";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import useAdminProfile from "../hooks/useAdminProfile";
import { useData } from "../contexts/DataContext";
import {
  openStudentAccessGrantDialog,
  openStudentCredentialsAccessWhatsAppDialog,
} from "../services/studentAccessGrantService";
import { studentSchoolService } from "../services/studentSchoolService";
import { uploadLogoImage, uploadCoverImage } from "../utils/imageUpload";
import { instructorService } from "../services/instructorService";
import {
  openWhatsAppWithPhone,
  resolveActiveAdminContact,
} from "../services/adminContactService";
import { t } from "../i18n/translate";
import { importSkinComponent } from "../utils/skinUtils";
import { getAdminAccessWhatsAppNumber } from "../utils/contactTargets";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { SEO } from "../js/seoUtils";

// Import Sheet Components
import RegisterSheet from "../components/RegisterSheet";
import AboutSheet from "../components/AboutSheet";
import RegistrationBenefitsSheet from "../components/RegistrationBenefitsSheet";
import SchoolSwitcherSheet from "../components/SchoolSwitcherSheet";
import EditSchoolSheet from "../components/EditSchoolSheet";
import TrialExpired from "../components/TrialExpired";
import FreeTrialSignupPromo from "../components/FreeTrialSignupPromo";
import ReferralCard from "../components/ReferralCard";
import DashboardActionCard from "../components/DashboardActionCard";
import LocalAdPlaceholder from "../components/LocalAdPlaceholder";

// Import Home Page Components
import {
  AdminSchoolSelectionCard,
  ProfileDashboardSection,
  HomePageActions,
  BookmarksSection,
} from "../components/home";

// Define dynamic skin components once to avoid remounting on every render
const DynamicDrivingSchoolCard = lazy(() =>
  importSkinComponent("DrivingSchoolCard").then((component) => ({
    default: component,
  })),
);
const DynamicLearningModulesGrid = lazy(() =>
  importSkinComponent("LearningModulesGrid").then((component) => ({
    default: component,
  })),
);

const DrivingSchoolCardSkeleton = () => (
  <div
    className="neu-card skeleton-effect-wave"
    style={{ margin: "16px", overflow: "hidden" }}
    aria-hidden="true"
  >
    <SkeletonBlock style={{ width: "100%", height: "180px" }} />
    <div style={{ padding: "16px" }}>
      <div className="skeleton-text">
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          Driving School Name
        </div>
        <div style={{ fontSize: "14px", marginBottom: "8px" }}>
          Subtitle text placeholder
        </div>
        <div style={{ fontSize: "14px", marginBottom: "16px" }}>
          Placeholder line for school information and actions
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <SkeletonBlock
          style={{ width: "120px", height: "36px", borderRadius: "999px" }}
        />
        <SkeletonBlock
          style={{ width: "96px", height: "36px", borderRadius: "999px" }}
        />
      </div>
    </div>
  </div>
);

const LearningModulesGridSkeleton = () => (
  <div style={{ margin: "16px" }} className="skeleton-effect-wave" aria-hidden="true">
    <div className="skeleton-text" style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "18px", fontWeight: 700 }}>Modules</div>
      <div style={{ fontSize: "14px" }}>Loading content grid</div>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "12px",
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="neu-card"
          style={{ padding: "12px", borderRadius: "12px" }}
        >
          <SkeletonBlock
            style={{ width: "100%", height: "96px", borderRadius: "10px" }}
          />
          <div className="skeleton-text" style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>
              Module title
            </div>
            <div style={{ fontSize: "12px" }}>Short description</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HomePage = () => {
  const IMAGEKIT_PUBLICKEY = process.env.VITE_REACT_APP_IMAGEKIT_PUBLICKEY;
  const userName = useStore("userName");
  const authUser = useStore("authUser");
  const { isAdmin: isAdminStatus, canManageCurrentSchool } = useAdminStatus();
  const { handleSignOut } = useAdminProfile();
  const { getSchools, getSchoolById } = useData();

  const [drivingSchool, setDrivingSchool] = useState(null);
  const [assignedSchools, setAssignedSchools] = useState([]);
  const [userType, setUserType] = useState("none");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [otherSchools, setOtherSchools] = useState([]);
  const [editingSchool, setEditingSchool] = useState({
    id: null,
    name: "",
    description: "",
    logo_url: "",
    cover_image_url: "",
    address: "",
    area: "",
    district: "",
  });
  const [editingSchoolCreate, setEditingSchoolCreate] = useState({
    id: null,
    name: "",
    description: "",
    logo_url: "",
    cover_image_url: "",
    address: "",
    area: "",
    district: "",
  });
  const [shareUrl, setShareUrl] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [showTrialSignup, setShowTrialSignup] = useState(false);
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const isStandalonePwa =
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://"));
  const whatsappTestMessage = encodeURIComponent(
    "Rijschool PWA WhatsApp test",
  );
  const whatsappTestUrl = isStandalonePwa
    ? `whatsapp://send?text=${whatsappTestMessage}`
    : `https://wa.me/?text=${whatsappTestMessage}`;

  const sanitizeAlias = (value) =>
    String(value || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

  const buildAdminAliasUrl = async (adminRef) => {
    const origin = window.location.origin;
    const rawRef = String(adminRef || "").trim();
    if (!rawRef) {
      return origin;
    }

    let alias =
      sanitizeAlias(
        authUser?.adminProfile?.id === rawRef ? authUser?.adminProfile?.alias : null
      ) ||
      sanitizeAlias(
        drivingSchool?.admin_id === rawRef ? drivingSchool?.admin_alias : null
      );

    if (!alias) {
      const { data: adminData } = await adminService.getAdminById(rawRef);
      alias = sanitizeAlias(adminData?.alias);
    }

    // Fallback to UUID if alias is missing so the link still works with the new parser.
    const finalRef = alias || rawRef;
    const finalUrl = `${origin}/admin?${encodeURIComponent(finalRef)}`;
    return finalUrl;
  };

  const resolveFlowAdminLandingUrl = async ({
    schoolId,
    prioritizeCurrentAdmin = false,
  } = {}) => {
    const resolved = await instructorService.resolveAdminIdForFlow({
      schoolId,
      authUser,
      prioritizeCurrentAdmin,
      includeExplicitInstructor: true,
      includeEnvFallback: true,
    });

    return {
      adminId: resolved.adminId || null,
      source: resolved.source || null,
      url: resolved.adminId
        ? await buildAdminAliasUrl(resolved.adminId)
        : `${window.location.origin}`,
    };
  };

  // Check if student is logged in with phone/passcode
  const studentId = localStorage.getItem("studentId");
  const hasSelectedSchoolInStorage = process.env
    .VITE_REACT_APP_DEFAULTSCHOOL;
  const isPhonePasscodeStudent = studentId && hasSelectedSchoolInStorage;

  // Only log once to prevent infinite loop in console
  if (!window.homePageUserNameLogged) {
    window.homePageUserNameLogged = true;
  }

  // Detect current theme mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Detect user type (admin, student, or not at all)
  const userTypeRef = useRef();
  const isAdminRef = useRef();
  const isStudentRef = useRef();

  useEffect(() => {
    const detectUserType = () => {
      const isAdminStatusLocal = isAdminUser(authUser);
      const isStudentStatus =
        isPhonePasscodeStudent || localStorage.getItem("isInvite") === "true";
      const isGuestStatus =
        !authUser &&
        !isPhonePasscodeStudent &&
        localStorage.getItem("isInvite") !== "true";
      const isTrialStatus = localStorage.getItem("isTrial") === "true";

      let userTypeStatus = "none";
      if (isAdminStatusLocal) {
        userTypeStatus = "admin";
      } else if (isStudentStatus) {
        userTypeStatus = "student";
      }

      if (userTypeRef.current !== userTypeStatus) {
        userTypeRef.current = userTypeStatus;
        setUserType(userTypeStatus);
      }
      if (isAdminRef.current !== isAdminStatusLocal) {
        isAdminRef.current = isAdminStatusLocal;
        setIsAdmin(isAdminStatusLocal);
      }
      if (isStudentRef.current !== isStudentStatus) {
        isStudentRef.current = isStudentStatus;
        setIsStudent(isStudentStatus);
      }
    };

    const timer = setTimeout(detectUserType, 500);
    return () => clearTimeout(timer);
  }, [authUser, isPhonePasscodeStudent]);

  // Fetch assigned schools for admin users
  const assignedSchoolsRef = useRef();
  const otherSchoolsRef = useRef();

  useEffect(() => {
    const fetchAssignedSchools = async () => {
      if (
        isAdminStatus &&
        authUser?.schoolIds &&
        authUser.schoolIds.length > 0
      ) {
        try {
          const schoolPromises = authUser.schoolIds.map((schoolId) =>
            getSchoolById(schoolId),
          );
          const schoolResults = await Promise.all(schoolPromises);

          const schools = schoolResults
            .filter((result) => !result.error && result.data)
            .map((result) => result.data);

          const prevIds = assignedSchoolsRef.current
            ? assignedSchoolsRef.current.map((s) => s.id).sort()
            : [];
          const newIds = schools.map((s) => s.id).sort();
          if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
            assignedSchoolsRef.current = schools;
            setAssignedSchools(schools);
          }
        } catch (error) {
          console.error("Error fetching assigned schools:", error);
        }
      } else if (isSuperAdmin(authUser?.email)) {
        try {
          const { data: allSchools, error } = await getSchools();
          if (!error && allSchools) {
            const prevIds = assignedSchoolsRef.current
              ? assignedSchoolsRef.current.map((s) => s.id).sort()
              : [];
            const newIds = allSchools ? allSchools.map((s) => s.id).sort() : [];
            if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
              assignedSchoolsRef.current = allSchools;
              setAssignedSchools(allSchools);
            }
          }
        } catch (error) {
          console.error("Error fetching all schools for default admin:", error);
        }
      } else {
        if (
          assignedSchoolsRef.current &&
          assignedSchoolsRef.current.length > 0
        ) {
          assignedSchoolsRef.current = [];
          setAssignedSchools([]);
        }
      }
    };

    if (authUser?.admin_status) {
      fetchAssignedSchools();
    }
  }, [authUser?.admin_status]); // Removed getSchools and getSchoolById from dependencies

  // Fetch other schools
  useEffect(() => {
    const fetchOtherSchools = async () => {
      if (isAdminStatus) {
        try {
          const { data: allSchools, error: allSchoolsError } =
            await getSchools();

          if (allSchoolsError || !allSchools) {
            return;
          }

          const assignedIds = assignedSchools.map((school) => school.id);
          const otherSchoolsList = allSchools.filter(
            (school) => !assignedIds.includes(school.id),
          );

          const prevOtherIds = otherSchoolsRef.current
            ? otherSchoolsRef.current.map((s) => s.id).sort()
            : [];
          const newOtherIds = otherSchoolsList.map((s) => s.id).sort();
          if (JSON.stringify(prevOtherIds) !== JSON.stringify(newOtherIds)) {
            otherSchoolsRef.current = otherSchoolsList;
            setOtherSchools(otherSchoolsList);
          }
        } catch (error) {
          console.error("Error fetching other schools:", error);
        }
      } else {
        if (otherSchoolsRef.current && otherSchoolsRef.current.length > 0) {
          otherSchoolsRef.current = [];
          setOtherSchools([]);
        }
      }
    };

    if (authUser) {
      fetchOtherSchools();
    }
  }, [authUser, assignedSchools]);

  // Load store data
  useEffect(() => {
    if (f7 && f7.store) {
      try {
        setTimeout(() => {
          if (!window.homePageStoreLogged) {
            window.homePageStoreLogged = true;
          }
        }, 1000);
      } catch (error) {
        console.warn("Error loading store data:", error);
      }
    }
  }, [f7]);

  // Load driving school data
  useEffect(() => {
    const loadDrivingSchoolData = async () => {
      try {
        const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

        if (schoolId) {
          const { data: school, error } = await getSchoolById(schoolId);
          if (!error && school) {
            if (!window.schoolDataLogged || window.lastSchoolId !== school.id) {
              window.schoolDataLogged = true;
              window.lastSchoolId = school.id;
            }

            const studentId = localStorage.getItem("studentId");
            const { admin, normalizedPhone } = await resolveActiveAdminContact({
              schoolId: school.id,
              studentId,
              authUser,
              canManageCurrentSchool,
            });
            setDrivingSchool({
              id: school.id,
              name: school.name || "Rijles Suriname",
              logo: school.logo_url || "/placeholders/placeholder-a02.jpg",
              coverPhoto:
                school.cover_image_url || "/placeholders/placeholder-a01.jpg",
              adminPhoneNumber: normalizedPhone,
              phoneNumber: normalizedPhone,
              admin_id: admin?.id,
              admin_alias: admin?.alias,
              admin_name: admin?.name,
              admin_email: admin?.email,
              admin_phone: admin?.phone,
            });

            // School ID is now strictly handled by environment
          }
        }
      } catch (error) {
        console.error("Error loading driving school data:", error);
      }
    };

    loadDrivingSchoolData();
  }, [authUser, canManageCurrentSchool]);

  // Pre-calculate shareUrl for admins to ensure QR code is ready with correct attribution
  useEffect(() => {
    const resolvePrecalcShareUrl = async () => {
      if (!drivingSchool?.id) return;

      const resolved = await instructorService.resolveAdminIdForFlow({
        schoolId: drivingSchool.id,
        authUser,
        prioritizeCurrentAdmin: isAdminUser(authUser),
        includeExplicitInstructor: true,
        includeEnvFallback: true,
      });
      const url = resolved.adminId
        ? await buildAdminAliasUrl(resolved.adminId)
        : `${window.location.origin}`;

      setShareUrl(url);
    };

    resolvePrecalcShareUrl();
  }, [authUser, drivingSchool]);

  // Check for invite or access token on component mount
  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    if (studentId && selectedSchoolId) {
      studentSchoolService
        .getRelationshipByStudentAndSchool(studentId, selectedSchoolId)
        .then(({ data: relationshipData, error }) => {
          if (!error && relationshipData) {
            // Check if trial user has been upgraded to paid user
            const wasTrialUser = localStorage.getItem("isTrial") === "true";
            const isNowPaidUser =
              !relationshipData.is_trial && relationshipData.approved;

            if (wasTrialUser && isNowPaidUser) {
              // User has been upgraded from trial to paid!
              // Remove trial flags from localStorage
              localStorage.removeItem("isTrial");
              localStorage.removeItem("trialExpiresAt");

              // Show success notification with expiration date
              if (relationshipData.expires_at) {
                const expirationDate = new Date(relationshipData.expires_at);
                const formattedDate = expirationDate.toLocaleDateString(
                  "nl-NL",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                );

                f7.dialog.alert(
                  `Geweldig nieuws! Je toegang is verlengd tot ${formattedDate}. Je hebt nu volledige toegang tot al ons lesmateriaal.`,
                  "Toegang Verlengd! 🎉",
                );
              } else {
                f7.dialog.alert(
                  "Geweldig nieuws! Je toegang is geactiveerd. Je hebt nu volledige toegang tot al ons lesmateriaal.",
                  "Toegang Geactiveerd! 🎉",
                );
              }
            }

            // Check trial expiration first
            if (
              relationshipData.is_trial &&
              relationshipData.trial_expires_at
            ) {
              const trialExpirationDate = new Date(
                relationshipData.trial_expires_at,
              );
              const now = new Date();
              if (now > trialExpirationDate) {
                // Trial has expired - show trial expired UI
                setIsTrialExpired(true);
                return;
              }
            }

            // Check regular expiration
            if (relationshipData.expires_at) {
              const expirationDate = new Date(relationshipData.expires_at);
              const now = new Date();
              if (now > expirationDate) {
                localStorage.removeItem("studentId");
                localStorage.removeItem("studentData");
                localStorage.removeItem("selectedSchoolId");
                localStorage.removeItem("isTrial");
                localStorage.removeItem("trialExpiresAt");
                f7.dialog.alert(
                  "Uw toegang is verlopen. Neem contact op met uw rijschool voor een verlenging.",
                  "Toegang Verlopen",
                );
              }
            }
          }
        })
        .catch((err) => {
          console.error(
            "Error checking student-school relationship expiration:",
            err,
          );
        });
    } else {
      // No student logged in - check if we should show trial signup
      if (userType === "none" && !authUser) {
        setShowTrialSignup(true);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const inviteToken =
      urlParams.get("invite_token") || urlParams.get("student_invite_token");

    // Capture and persist instructor/admin from URL (UUID or alias; supports admin/admin_id variants)
    const { value: adminRefParam } = instructorService.extractAdminRefFromUrl();
    if (adminRefParam) {
      instructorService.setInstructorFromUrl(adminRefParam);
    }

    if (accessToken) {
      validateAccessToken(accessToken)
        .then((result) => {
          if (result.success) {
            localStorage.setItem("accessSchoolId", result.school_id);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("isAccessToken", "true");
            f7.views.main.router.navigate("/?page=student-access-registration");
          } else {
            f7.dialog.alert(result.message, "Access Token Error");
          }
        })
        .catch((error) => {
          console.error("Error validating access token:", error);
          f7.dialog.alert(
            "Error validating access token. Please try again.",
            "Access Token Error",
          );
        });
    } else if (inviteToken) {
      validateInviteToken(inviteToken)
        .then((result) => {
          if (result.success) {
            localStorage.setItem("inviteSchoolId", result.school_id);
            localStorage.setItem("inviteToken", inviteToken);
            localStorage.setItem("inviteAdminId", result.admin_id);
            localStorage.setItem("isInvite", "true");
            f7.views.main.router.navigate("/?page=student-login");
          } else {
            f7.dialog.alert(result.message, "Invite Error");
          }
        })
        .catch((error) => {
          console.error("Error validating invite token:", error);
          f7.dialog.alert(
            "Error validating invite token. Please try again.",
            "Invite Error",
          );
        });
    } else {
      // School ID is now strictly handled by environment
      const storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      const storedSchoolName = localStorage.getItem("selectedSchoolName");

      const checkAuthState = async () => {
        const { user } = await authService.getCurrentUser();
        if (user && (!storedSchoolId || !storedSchoolName)) {
          // Allow users to navigate manually
        }
      };

      checkAuthState();
    }
  }, [userType, authUser]);

  // Token validation functions
  const validateAccessToken = async (token) => {
    try {
      const { data: tokenData, error: tokenError } =
        await accessTokenService.getTokenByValue(token);

      if (tokenError) {
        return {
          success: false,
          message: "Error validating access token: " + tokenError.message,
        };
      }
      if (!tokenData) {
        return { success: false, message: "Invalid access token" };
      }
      if (new Date(tokenData.expires_at) < new Date()) {
        return { success: false, message: "Access token has expired" };
      }
      if (tokenData.is_used) {
        return {
          success: false,
          message:
            "This access token has already been used. Please contact your driving school for a new one.",
        };
      }

      return {
        success: true,
        message: "Access token validated successfully",
        school_id: tokenData.school_id,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error validating access token: " + error.message,
      };
    }
  };

  const validateInviteToken = async (token) => {
    try {
      const { data: allInvites, error: fetchError } =
        await inviteService.getAllInvites();
      let inviteData = null;
      if (allInvites && Array.isArray(allInvites)) {
        inviteData = allInvites.filter(
          (invite) => invite.token.toLowerCase() === token.toLowerCase(),
        );
      }
      const count = inviteData ? inviteData.length : 0;

      if (fetchError) {
        return {
          success: false,
          message: "Error validating invite: " + fetchError.message,
        };
      }
      if (count === 0 || !inviteData || inviteData.length === 0) {
        return { success: false, message: "Invalid invite token" };
      }

      const invite = inviteData[0];
      if (new Date(invite.expires_at) < new Date()) {
        return { success: false, message: "Invite link has expired" };
      }
      if (invite.is_used) {
        return { success: false, message: "Invite link has already been used" };
      }

      const { error: updateError } = await inviteService.updateInvite(token, {
        is_used: true,
        usage_count: (invite.usage_count || 0) + 1,
        first_used_at: invite.first_used_at || new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      });

      if (updateError) {
        return {
          success: false,
          message: "Error processing invite: " + updateError.message,
        };
      }

      return {
        success: true,
        message: "Invite validated successfully",
        school_id: invite.school_id,
        admin_id: invite.admin_id || invite.created_by, // Try both fields due to schema variations
        recipient_email: invite.recipient_email,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error validating invite: " + error.message,
      };
    }
  };

  // School management functions
  const handleUpdateSchool = async () => {
    await schoolService.handleCreateOrUpdateSchool(
      editingSchool,
      f7,
      setEditingSchool,
      setDrivingSchool,
      setAssignedSchools,
      authUser,
    );
  };

  const handleCreateSchool = async () => {
    await schoolService.handleCreateOrUpdateSchool(
      editingSchoolCreate,
      f7,
      setEditingSchoolCreate,
      setDrivingSchool,
      setAssignedSchools,
      authUser,
    );
  };

  const requestSchoolAccess = async (school) => {
    await schoolService.requestSchoolAccess(school, f7);
  };

  // Listen for service worker updates
  useEffect(() => {
    const handleSWUpdate = () => {
      f7.dialog
        .create({
          title: "Update Available",
          text: "A new version of the app is available. Would you like to refresh to get the latest version?",
          buttons: [
            { text: "Later", color: "gray" },
            {
              text: "Refresh",
              onClick: () => {
                if (window.checkForUpdates) window.checkForUpdates();
                window.location.reload();
              },
            },
          ],
        })
        .open();
    };

    window.addEventListener("swUpdated", handleSWUpdate);
    return () => window.removeEventListener("swUpdated", handleSWUpdate);
  }, []);

  // Helper functions
  const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== "string") return "";
    return fullName.split(" ")[0];
  };

  const openSchoolEditSheet = () => {
    const canEditSchool =
      authUser?.schoolIds && Array.isArray(authUser.schoolIds)
        ? authUser.schoolIds.includes(drivingSchool?.id)
        : false;

    if (isAdminStatus && canEditSchool) {
      if (drivingSchool?.id) {
        setEditingSchool({
          id: drivingSchool.id,
          name: drivingSchool.name || "",
          description: drivingSchool.description || "",
          logo_url: drivingSchool.logo || "",
          cover_image_url: drivingSchool.coverPhoto || "",
          address: drivingSchool.address || "",
          area: drivingSchool.area || "",
          district: drivingSchool.district || "",
        });
        f7.sheet.open("#editschool-sheet");
      } else {
        f7.sheet.open("#sheet-registration-benefits");
      }
    } else {
      const hasNoAssignedSchools =
        authUser?.schoolIds && Array.isArray(authUser.schoolIds)
          ? authUser.schoolIds.length === 0
          : true;

      if (isAdminStatus && hasNoAssignedSchools) {
        setEditingSchool({
          id: null,
          name: "",
          description: "",
          logo_url: "",
          cover_image_url: "",
          address: "",
          area: "",
          district: "",
        });
        f7.sheet.open("#editschool-sheet");
      } else if (isAdminStatus) {
        f7.dialog.confirm(
          "U bent geen beheerder voor deze rijschool. Wilt u wisselen naar een van uw eigen rijscholen?",
          "Wisselen van Rijschool",
          () => f7.sheet.open("#sheet-school-switcher"),
        );
      } else {
        f7.sheet.open("#sheet-registration-benefits");
      }
    }
  };

  const handleShareSchool = async () => {
    let schoolId =
      drivingSchool?.id || process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    if (!schoolId) {
      f7.toast.show({
        text: "Geen school geselecteerd om te delen",
        position: "center",
      });
      return;
    }

    const { url: schoolUrl } = await resolveFlowAdminLandingUrl({
      schoolId,
      prioritizeCurrentAdmin: isAdminUser(authUser),
    });
    // Set initial full URL
    setShareUrl(schoolUrl);
    f7.actions.open("#actions-share-school");
  };

  const handleShareOnSocial = async () => {
    let shareUrlToUse = shareUrl || `${window.location.origin}`;
    const schoolId =
      drivingSchool?.id || process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    if (!/\/admin\?/i.test(shareUrlToUse)) {
      const resolved = await resolveFlowAdminLandingUrl({
        schoolId,
        prioritizeCurrentAdmin: false,
      });
      shareUrlToUse = resolved.url;
      setShareUrl(shareUrlToUse);
    }

    const copySchoolLink = async () => {
      try {
        await navigator.clipboard.writeText(shareUrlToUse);
        f7.toast.show({
          text: "School link gekopieerd naar klembord!",
          position: "center",
        });
      } catch (err) {
        f7.toast.show({ text: "Failed to copy link", position: "center" });
      }
    };

    try {
      if (drivingSchool?.name && navigator.share) {
        await navigator.share({
          title: drivingSchool.name,
          text: `Check out the ${drivingSchool.name} app!`,
          url: shareUrlToUse,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Rijles App",
          text: "Check out this Driving School app!",
          url: shareUrlToUse,
        });
      } else {
        copySchoolLink();
      }
    } catch (error) {
      copySchoolLink();
    }
  };

  const handleShowQRCode = () => {
    setTimeout(() => f7.sheet.open("#sheet-qr-code"), 500);
  };

  const handleCardClick = (link) => {
    f7.sheet.close();
    setTimeout(() => f7.views.main.router.navigate(link), 500);
  };

  const generateAndSendAccessToken = async () => {
    const schoolId =
      drivingSchool?.id || localStorage.getItem("selectedSchoolId");
    await openStudentAccessGrantDialog({
      adminId: authUser?.id,
      schoolId,
    });
  };

  const sendStudentLoginCredentialsViaWhatsApp = async () => {
    const schoolId = drivingSchool?.id || localStorage.getItem("selectedSchoolId");
    if (!schoolId) {
      f7.dialog.alert("Geen rijschool geselecteerd.");
      return;
    }

    await openStudentCredentialsAccessWhatsAppDialog({
      adminId: authUser?.adminProfile?.id || authUser?.id,
      schoolId,
      schoolName: drivingSchool?.name || "Rijschool",
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenStudentAccess = params.get("open") === "student-access";
    if (!shouldOpenStudentAccess || !isAdminStatus) {
      return;
    }

    const timer = setTimeout(() => {
      generateAndSendAccessToken();
      params.delete("open");
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", nextUrl.endsWith("?") ? window.location.pathname : nextUrl);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAdminStatus, authUser?.id, drivingSchool?.id]);

  // LocalStorage change listeners
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key === "selectedSchoolId" &&
        event.newValue !== event.oldValue
      ) {
        const newSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        if (
          newSchoolId &&
          newSchoolId !== "null" &&
          newSchoolId !== "undefined"
        ) {
          const currentUrl = new URL(window.location);
          currentUrl.searchParams.set("school", newSchoolId);
          window.history.replaceState({}, "", currentUrl.toString());
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Image upload handlers
  const handleUploadLogo = (file) => uploadLogoImage(file, IMAGEKIT_PUBLICKEY);
  const handleUploadCover = (file) =>
    uploadCoverImage(file, IMAGEKIT_PUBLICKEY);

  // Determine base color for page gradient
  const baseColor = getLayout()?.colorScheme?.[0] || "#3b82f6";
  const brandGradient = `linear-gradient(to bottom, ${baseColor}, #f8fafc)`;
  const isDevPort4000 = process.env.DEV && window.location.port === "4000";
  const hasCountryInUrl = Boolean(
    new URLSearchParams(window.location.search).get("country"),
  );

  return (
    <Page name="home" className="page-neu">
      <SEO page="home" />
      <Navbar className="neu-navbar">
        <NavLeft>
          <div
            className="neu-avatar"
            style={{
              width: "40px",
              height: "40px",
              cursor: "pointer",
              overflow: "hidden",
            }}
            onClick={() => f7.actions.open("#actions-contact-school")}
          >
            <img
              src={drivingSchool?.logo || "/placeholders/placeholder-a02.jpg"}
              alt="School Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.4)",
              }}
            />
          </div>
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          {drivingSchool?.name || "Rijles App"}
        </NavTitle>
        {(userName ||
          (authUser?.phone && authUser.phone.trim() !== "") ||
          isPhonePasscodeStudent) && (
          <NavRight>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingRight: "10px",
                gap: "12px",
              }}
            >
              <span
                className="neu-text-primary"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {getFirstName(
                  userName ||
                    (isPhonePasscodeStudent
                      ? (() => {
                          try {
                            const studentData =
                              localStorage.getItem("studentData");
                            if (studentData) {
                              const parsedData = JSON.parse(studentData);
                              return (
                                parsedData.name ||
                                parsedData.full_name ||
                                parsedData.email?.split("@")[0] ||
                                "Student"
                              );
                            }
                          } catch (e) {}
                          return (
                            authUser?.user_metadata?.full_name ||
                            authUser?.user_metadata?.name ||
                            "Gebruiker"
                          );
                        })()
                      : authUser?.user_metadata?.full_name ||
                        authUser?.user_metadata?.name ||
                        "Gebruiker"),
                )}
              </span>
              <div
                className="neu-btn-circle"
                style={{ width: "36px", height: "36px", cursor: "pointer" }}
                onClick={() => {
                  const profilePage = ["approved", "pending"].includes(
                    authUser?.admin_status,
                  )
                    ? "/?page=admin-profile"
                    : "/?page=profile";
                  f7.views.main.router.navigate(profilePage);
                }}
              >
                <Icon f7="person_circle" style={{ fontSize: "18px" }} />
              </div>
            </div>
          </NavRight>
        )}
      </Navbar>

      <Toolbar bottom className="neu-toolbar">
        <div
          className="neu-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onClick={() => f7.actions.open("#actions-styles")}
        >
          <i className="f7-icons" style={{ fontSize: "16px" }}>
            {isDarkMode ? "sun_max" : "moon"}
          </i>
          {isDarkMode ? "Licht" : "Donker"}
        </div>
        {/*
        {isAdmin && (
          <div
            className="neu-btn"
            style={{ padding: "8px 16px", fontSize: "13px" }}
            onClick={() => {
              localStorage.removeItem("allSchoolsData");
              localStorage.removeItem("currentSchoolData");
              localStorage.removeItem("schoolsList");
              localStorage.removeItem("userProfile");
              setTimeout(() => location.reload(), 500);
            }}
          >
            Reset
          </div>
        )}
        */}
        <div
          className="neu-btn"
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onClick={() => {
            localStorage.removeItem("selectedSchoolId");
            localStorage.removeItem("selectedSchoolName");
            localStorage.removeItem("maquettenData");
            localStorage.removeItem("maquettenSyncStatus");
            location.reload();
          }}
        >
          <i className="f7-icons" style={{ fontSize: "16px" }}>
            arrow_clockwise
          </i>
          {t("common.refresh")}
        </div>

        {isDevPort4000 && (
          <div
            className="neu-btn"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#b91c1c",
            }}
            onClick={() => {
              localStorage.clear();
              location.reload();
            }}
          >
            <i className="f7-icons" style={{ fontSize: "16px" }}>
              trash
            </i>
            Clear Storage
          </div>
        )}
      </Toolbar>

      {/* Admin School Selection Card */}
      {(() => {
        // Don't show the card for super admins - they have access to all schools
        const isSuperAdminUser = isSuperAdmin(authUser?.email);
        const shouldShowCard =
          isAdmin && authUser?.schoolIds?.length === 0 && !isSuperAdminUser;
        return shouldShowCard ? (
          <AdminSchoolSelectionCard
            authUser={authUser}
            assignedSchools={assignedSchools}
            setEditingSchool={setEditingSchool}
            requestSchoolAccess={requestSchoolAccess}
            drivingSchool={drivingSchool}
            handleSignOut={handleSignOut}
          />
        ) : null;
      })()}

      {/* Driving School Info Card */}
      <Suspense
        fallback={
          <DrivingSchoolCardSkeleton />
        }
      >
        {drivingSchool || !process.env.VITE_REACT_APP_DEFAULTSCHOOL ? (
          <DynamicDrivingSchoolCard
            drivingSchool={drivingSchool}
            isAdminStatus={isAdminStatus}
            openSchoolEditSheet={openSchoolEditSheet}
            handleShareSchool={handleShareSchool}
          />
        ) : (
          <DrivingSchoolCardSkeleton />
        )}
      </Suspense>

      {/* Trial Expired - Show access request options */}
      {isTrialExpired && <TrialExpired />}

      {/* Trial Signup - Show for users who are not logged in */}
      {(() => {
        const shouldShowPromo =
          !isTrialExpired && showTrialSignup && userType === "none";
        return shouldShowPromo ? (
          <div style={{ padding: "0 16px", marginBottom: "16px" }}>
            <FreeTrialSignupPromo description="Start vandaag met leren voor je rijexamen. Krijg direct toegang tot al ons lesmateriaal." />
          </div>
        ) : null;
      })()}

      {/* Registration Requirements Link */}
      <div
        style={{ padding: "0 16px", marginTop: "24px", marginBottom: "24px" }}
      >
        {!hasCountryInUrl && (
          <DashboardActionCard
            title="Inschrijfvoorwaarden"
            description="Wat heb je nodig om te starten met rijlessen?"
            icon={documentText}
            background={getThemeGradient()}
            iconColor="#fff"
            iconBackground="rgba(255, 255, 255, 0.25)"
            onClick="/?page=registration-requirements"
          />
        )}

        {isAdminStatus && (
          <div style={{ marginTop: "14px" }}>
            <DashboardActionCard
              title="Admin Marketing Gids"
              description="Stappenplan voor social media, dashboard follow-up en campagnegebruik."
              icon={megaphone}
              background={getThemeGradient()}
              iconColor="#fff"
              iconBackground="rgba(255, 255, 255, 0.25)"
              onClick="/?page=admin-marketing-guide"
            />
          </div>
        )}
      </div>

      {/* Learning Modules */}
      {!isTrialExpired && (
        <Suspense
          fallback={
            <LearningModulesGridSkeleton />
          }
        >
          <DynamicLearningModulesGrid />
        </Suspense>
      )}

      {/* Bookmarks Section */}
      <BookmarksSection />

      {/* Pending Admin Status Card */}
      {authUser?.admin_status === "approved" && !isAdminStatus && (
        <div style={{ padding: "0 16px", marginBottom: "16px" }}>
          <div
            className="neu-card"
            style={{ padding: "24px", textAlign: "center" }}
          >
            <div className="neu-icon" style={{ marginBottom: "16px" }}>
              <IonIcon
                icon={warning}
                style={{
                  fontSize: "32px",
                  color: getLayout()?.colorScheme?.[0],
                }}
              />
            </div>
            <h3
              className="neu-text-primary"
              style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}
            >
              Admin Toegang Nog Niet Actief
            </h3>
            <p
              className="neu-text-secondary"
              style={{ margin: "0", fontSize: "14px" }}
            >
              Je probeerde als admin in te loggen, maar je account heeft nog geen toegang tot een toegewezen rijschool.
            </p>
          </div>
        </div>
      )}

      {authUser?.admin_status === "pending-bak" && (
        <div style={{ padding: "0 16px", marginBottom: "16px" }}>
          <div
            className="neu-card"
            style={{ padding: "24px", textAlign: "center" }}
          >
            <div className="neu-icon" style={{ marginBottom: "16px" }}>
              <IonIcon
                icon={warning}
                style={{
                  fontSize: "32px",
                  color: getLayout()?.colorScheme?.[0],
                }}
              />
            </div>
            <h3
              className="neu-text-primary"
              style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}
            >
              Admin Verificatie
            </h3>
            <p
              className="neu-text-secondary"
              style={{ margin: "0 0 20px 0", fontSize: "14px" }}
            >
              Stuur uw aanvraag om als admin geverifieerd te worden.
            </p>
            <div
              className="neu-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 24px",
                color: "#25d366",
                fontWeight: 600,
              }}
              onClick={() => {
                const domain = window.location.origin;
                const schoolName =
                  authUser?.adminProfile?.name || "onbekende school";
                const approvalLink = buildAbsolutePageUrl(
                  "admin-access",
                  { email: authUser?.email || "" },
                  domain,
                );
                const message =
                  `Admin toegang verzoek voor: ${
                    authUser?.email || "onbekend"
                  } van school: ${schoolName}. Mijn verzoek is nog in behandeling. Approve access using this link: ${approvalLink}`;
                const adminAccessPhone = getAdminAccessWhatsAppNumber();
                openWhatsAppWithPhone({
                  phone: adminAccessPhone,
                  message,
                });
              }}
            >
              <i className="f7-icons" style={{ fontSize: "18px" }}>
                paperplane
              </i>
              Verstuur Verzoek via WhatsApp
            </div>
          </div>
        </div>
      )}

      {/* Profile & Dashboard */}
      <ProfileDashboardSection
        isAdmin={isAdmin}
        isStudent={isStudent}
        handleCardClick={handleCardClick}
        isDarkMode={isDarkMode}
      />

      {/* Referral Program Card */}
      {isStudent && (
        <div style={{ padding: "0 16px", marginBottom: "16px" }}>
          <ReferralCard variant="purple" onClick="/?page=referral" />
        </div>
      )}

      {/* Additional Services */}
      {/* <AdditionalServicesGrid handleCardClick={handleCardClick} /> */}

      {/* Superadmin Tools Hub */}
      {isSuperAdmin(authUser?.email) && (
        <div
          style={{ padding: "0 16px", marginTop: "16px", marginBottom: "16px" }}
        >
          <DashboardActionCard
            title="Superadmin Tools"
            description="Open centrale toegang tot beheerpagina's en tools"
            icon="person"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            onClick="/?page=superadmin-tools"
          />
        </div>
      )}

      {/* Community Sections */}
      {/* <CommunitySections handleCardClick={handleCardClick} /> */}

      <LocalAdPlaceholder
        adSlot="home"
        headline="Lokale advertentie"
        description="Bereik dagelijkse app-bezoekers met interesse in mobiliteit, auto en rijopleiding."
        ctaLabel="Bekijk adverteerpakketten"
      />

      {/* Footer */}
      <div
        style={{ margin: "24px 16px", padding: "16px", textAlign: "center" }}
      >
        Developed by{" "}
        <a
          external=""
          className="external neu-text-accent"
          target="_blank"
          href="https://synergyapps.vercel.app/"
          rel="noreferrer"
          style={{ textDecoration: "none", fontWeight: 600 }}
        >
          Quinn Wilson
        </a>{" "}
        for Synergy Apps
      </div>

      {/* Sheet Components */}
      <RegisterSheet
        profileSections={[
          {
            label: "Student",
            link: "/free-trial-signup/",
            description: "Registreer als student",
            type: "student",
          },
          {
            label: "Admin",
            link: "/?page=admin-profile",
            description: "Registreer als admin",
            type: "admin",
          },
        ]}
        handleCardClick={handleCardClick}
      />
      <AboutSheet />
      <RegistrationBenefitsSheet />
      <SchoolSwitcherSheet
        getLayout={getLayout}
        assignedSchools={assignedSchools}
        otherSchools={otherSchools}
        requestSchoolAccess={requestSchoolAccess}
      />

      <Sheet
        id="createschool-sheet"
        className="createschool-sheet"
        style={{ height: "75vh" }}
        swipeToClose
        backdrop
      >
        <EditSchoolSheet
          editingSchool={editingSchoolCreate}
          setEditingSchool={setEditingSchoolCreate}
          handleCreateSchool={handleCreateSchool}
          uploadLogoImage={handleUploadLogo}
          uploadCoverImage={handleUploadCover}
          showUploadOptions={true}
          showFloppyDiskIcon={false}
        />
      </Sheet>

      <Sheet
        id="editschool-sheet"
        className="editschool-sheet"
        style={{ height: "75vh" }}
        swipeToClose
        backdrop
      >
        <EditSchoolSheet
          editingSchool={editingSchool}
          setEditingSchool={setEditingSchool}
          handleCreateSchool={handleUpdateSchool}
          handleUpdateSchool={handleUpdateSchool}
          uploadLogoImage={handleUploadLogo}
          uploadCoverImage={handleUploadCover}
          showUploadOptions={true}
          showFloppyDiskIcon={true}
        />
      </Sheet>

      {/* Action Sheets */}
      <HomePageActions
        drivingSchool={drivingSchool}
        isAdminStatus={isAdminStatus}
        shareUrl={shareUrl}
        handleShareOnSocial={handleShareOnSocial}
        handleShowQRCode={handleShowQRCode}
        generateAndSendAccessToken={generateAndSendAccessToken}
        sendStudentLoginCredentialsViaWhatsApp={
          sendStudentLoginCredentialsViaWhatsApp
        }
      />

      <br />
      <br />
      <br />
    </Page>
  );
};

export default HomePage;
