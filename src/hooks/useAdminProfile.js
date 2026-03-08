import { useState, useEffect, useMemo } from "react";
import { f7 } from "framework7-react";
import {
  supabase,
  authService,
  schoolService,
  studentService,
  adminService,
  paymentService,
} from "../services";
import { referralService } from "../services/referralService";
import { studentSchoolService } from "../services/studentSchoolService";
import { SUPABASE_CONFIG } from "../services/supabase";
import {
  setSafeSelectedSchoolId,
  isSuperAdmin,
} from "../js/utils";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { normalizePhoneForWhatsApp } from "../services/adminContactService";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isStandalonePwa = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
};

const showWhatsAppLaunchDialog = ({
  title = "Open WhatsApp",
  description = "Klik op de knop hieronder om WhatsApp te openen.",
  whatsappUrl,
  whatsappFallbackUrl = "",
  buttonText = "Open WhatsApp",
} = {}) => {
  if (!whatsappUrl) {
    throw new Error("Geen WhatsApp-link beschikbaar.");
  }

  f7.dialog.create({
    title,
    text: description,
    content: `
      <div style="padding: 0 16px 16px;">
        <a
          href="${escapeHtml(whatsappUrl)}"
          target="${isStandalonePwa() ? "_self" : "_blank"}"
          rel="noopener noreferrer"
          class="button button-fill external"
          external=""
        >
          ${escapeHtml(buttonText)}
        </a>
        ${whatsappFallbackUrl
          ? `
        <a
          href="${escapeHtml(whatsappFallbackUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="button button-outline external"
          external=""
          style="margin-top: 12px;"
        >
          Open web fallback
        </a>
        `
          : ""}
      </div>
    `,
    buttons: [
      {
        text: "Sluiten",
      },
    ],
  }).open();
};

const buildWhatsAppUrl = ({ phone, message = "" } = {}) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone || "");
  if (!normalizedPhone) {
    throw new Error("Geen geldig telefoonnummer");
  }

  const encodedMessage = encodeURIComponent(message);
  return {
    appUrl: `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`,
    webUrl: `https://wa.me/${normalizedPhone}?text=${encodedMessage}`,
  };
};

const useAdminProfile = () => {
  const [profile, setProfile] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [students, setStudents] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState("none"); // none, pending, approved
  const [user, setUser] = useState(null);
  const [adminRecordId, setAdminRecordId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [noUser, setNoUser] = useState(false); // Track if no user is found
  const [allSchools, setAllSchools] = useState([]); // For default admin to see all schools
  const [schoolsLoading, setSchoolsLoading] = useState(false); // Track schools loading state
  const [allAdmins, setAllAdmins] = useState([]); // For default admin to manage all admins
  const [editingSchool, setEditingSchool] = useState(null); // For editing a school
  const [showCreateSchoolForm, setShowCreateSchoolForm] = useState(false); // For showing create school form
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]); // For admin to select multiple schools
  const [selectedSchoolForStudents, setSelectedSchoolForStudents] =
    useState(null); // For tracking which school's students to display
  const [assignedSchools, setAssignedSchools] = useState([]); // For storing assigned schools
  const [popoverTarget, setPopoverTarget] = useState(null); // For tracking popover target
  const [selectedStudent, setSelectedStudent] = useState(null); // For tracking selected student
  const [selectedSchool, setSelectedSchool] = useState(null); // For tracking selected school for popover
  const [lastFetchedSchoolId, setLastFetchedSchoolId] = useState(null); // Cache for student fetching
  const [lastFetchedTimestamp, setLastFetchedTimestamp] = useState(0); // Cache timestamp

  const debug = () => {};

  const handleSignIn = async () => {
    // Store a key/value in localStorage to indicate admin login attempt
    localStorage.setItem("adminLoginAttempt", "true");
    // Redirect to the auth page for sign in
    f7.views.main.router.navigate("/?page=auth");
  };

  const handleSignUp = async () => {
    // Redirect to the auth page for sign up (same page handles both)
    f7.views.main.router.navigate("/?page=auth");
  };

  const handleSignOut = async () => {
    try {
      const { error } = await authService.signOut();

      if (error) {
        f7.toast.show({
          text: `Sign out failed: ${error.message}`,
          position: "top",
        });
        return;
      }

      // Update state to reflect signed out status
      setUser(null);
      setAdminRecordId(null);
      // setIsAdmin(false); // Removed since we now use centralized isAdmin() function
      setRequestStatus("none");
      setProfile({
        id: null,
        name: "",
        email: "",
        description: "",
        logoUrl: "",
        coverImageUrl: "",
      });
      setStudents([]);
      setArchivedStudents([]);
      setNoUser(true);

      f7.toast.show({ text: "Signed out successfully", position: "top" });

      // Reload the app after successful sign out
      window.location.reload();
    } catch (error) {
      f7.preloader.hide();
      f7.toast.show({
        text: "Sign out failed. Please try again.",
        position: "top",
      });
    }
  };

  const initializeProfileData = async (currentUser) => {
    try {
      debug("initializeProfileData:start", {
        email: currentUser?.email,
      });

      // Special case: Super admin is always an admin
      if (isSuperAdmin(currentUser.email)) {
        debug("initializeProfileData:superAdminPath", {
          email: currentUser.email,
        });
        const result = await handleDefaultAdmin(currentUser);
        if (result) return; // If default admin was handled, exit early
      }

      // Check if user already has an admin record
      const { adminProfile, adminError } = await checkAdminProfile(
        currentUser.email
      );

      if (adminProfile) {
        debug("initializeProfileData:adminProfileFound", {
          id: adminProfile.id,
          email: adminProfile.email,
          phone: adminProfile.phone,
          status: adminProfile.status,
        });
        // Process the admin profile
        await processAdminProfile(adminProfile, currentUser);
      } else {
        setAdminRecordId(null);
        debug("initializeProfileData:noAdminProfile", {
          email: currentUser?.email,
        });
        // User is logged in but doesn't have admin profile yet
        // They should see the request admin status UI
        // setIsAdmin(false); // Removed since we now use centralized isAdmin() function
        setRequestStatus("none");
        // Populate profile with user data from auth
        setProfile({
          id: null,
          name:
            currentUser.user_metadata?.name || currentUser.email.split("@")[0],
          email: currentUser.email || "",
          phone: "",
          birth_date: "",
          address: "",
          city: "",
          postal_code: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          license_type: "",
          preferred_language: "nl",
        });
        debug("initializeProfileData:setProfileNoAdmin", {
          phone: "",
        });
      }
    } catch (error) {
      console.error("Error initializing profile data:", error);
      f7.toast.show({
        text: "Error initializing profile data: " + error.message,
      });
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Check if there's a pending request status in query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const requestParam = urlParams.get("request");
        if (requestParam === "pending") {
          setRequestStatus("pending");
        }

        // Get current user
        const { user: currentUser, error: userError } =
          await authService.getCurrentUser();
        if (userError) {
          console.error("Error getting user:", userError);
          f7.toast.show({
            text: "Error getting user: " + userError.message,
            position: "top",
          });
          setLoading(false);
          return;
        }

        if (!currentUser) {
          setNoUser(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        setNoUser(false);

        // Check if school selection is needed
        let storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        let storedSchoolName = localStorage.getItem("selectedSchoolName");

        // Fetch all schools for dropdown
        setSchoolsLoading(true);
        const { data: schools, error: schoolsError } =
          await schoolService.getSchools();
        if (schoolsError) {
          console.error("Error in initial schools fetch:", schoolsError);
          f7.toast.show({
            text: "Error loading schools: " + schoolsError.message,
            position: "top",
          });
          setAllSchools([]); // Set to empty array on error
        } else if (schools) {
          setAllSchools(schools);
        } else {
          setAllSchools([]);
        }
        setSchoolsLoading(false);

        // If no school is selected in localStorage, try to auto-select one
        if (!storedSchoolId || !storedSchoolName) {
          // But only if the user is an admin or has an admin profile
          const { data: adminProfile, error: adminError } =
            await adminService.getAdminByEmail(currentUser.email);

          if (!adminError && adminProfile) {
            // If user has an admin profile, check if they have assigned schools
            if (adminProfile.school_ids && adminProfile.school_ids.length > 0) {
              // Get the first assigned school and set it as selected
              const firstSchoolId = adminProfile.school_ids[0];
              const { data: school, error: schoolError } =
                await schoolService.getSchoolById(firstSchoolId);

              if (!schoolError && school) {
                // Update cache and store with the school data
                schoolService.updateSchoolCacheAndStore(school);
                // Store selection in localStorage
                setSafeSelectedSchoolId(school.id, school.name);
                // Set the stored values so we don't navigate to school selection
                storedSchoolId = school.id;
                storedSchoolName = school.name;
              }
            }
          }

          // Only redirect to school selection if we came from an appropriate context
          // Don't redirect if the user intentionally navigated to the admin profile
          const urlParams = new URLSearchParams(window.location.search);
          const tabParam = urlParams.get("tab");

          // If navigating to schools tab, also set the create school form to be visible
          if (tabParam === "schools") {
            setShowCreateSchoolForm(true);
          }
        }

        // Initialize profile data
        await initializeProfileData(currentUser);

        // If user is a super admin, also fetch all admins
        if (isSuperAdmin(currentUser.email)) {
          await fetchAllAdmins();
        }
      } catch (error) {
        console.error("Error initializing profile:", error);
        f7.toast.show({
          text: "Error initializing profile: " + error.message,
          position: "top",
        });
      } finally {
        // Ensure loading is always set to false to prevent hanging spinner
        setLoading(false);
      }
    };

    // Set loading to true initially
    setLoading(true);

    // Call the initialization function
    initializeProfile();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        // setIsAdmin(false); // Removed since we now use centralized isAdmin() function
        setRequestStatus("none");
        setProfile({
          id: null,
          name: "",
          email: "",
          phone: "",
          address: "",
        });
        setStudents([]);
        setArchivedStudents([]);
        setNoUser(true);
        setAssignedSchools([]);
        setSelectedSchoolForStudents(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        // Set loading to true when user signs in to indicate data is being loaded
        setLoading(true);

        // Re-initialize profile when user signs in instead of reloading
        setUser(session.user);
        setNoUser(false);

        // Wrap the profile initialization in a try-catch to ensure loading state is handled
        (async () => {
          try {
            await initializeProfileData(session.user);
          } catch (error) {
            console.error(
              "Error re-initializing profile after sign-in:",
              error
            );
            f7.toast.show({
              text: "Error loading profile: " + error.message,
              position: "top",
            });
          } finally {
            setLoading(false);
          }
        })();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchStudents = async (schoolId, { forceRefresh = false } = {}) => {
    // Check if schoolId is valid before proceeding
    if (!schoolId || schoolId === "undefined" || schoolId === undefined) {
      setStudents([]);
      setArchivedStudents([]);
      return;
    }

    // Check cache: if we're fetching the same school within 30 seconds, skip the API call
    const currentTime = Date.now();
    if (!forceRefresh && lastFetchedSchoolId === schoolId && (currentTime - lastFetchedTimestamp) < 30000) {
      return;
    }

    try {
      const { data: studentsData, error } =
        await studentService.getStudentsBySchoolId(schoolId);
      
      // Update cache
      setLastFetchedSchoolId(schoolId);
      setLastFetchedTimestamp(currentTime);

      if (error) {
        console.error("Error fetching students:", error);
        f7.toast.show({
          text: "Error fetching students: " + error.message,
          position: "top",
        });
        return;
      }

      // Convert Supabase data to component format, separating active and archived students
      const activeStudents = [];
      const archivedStudentsList = [];

      studentsData.forEach((student) => {
        const formattedStudent = {
          id: student.id,
          name: student.name,
          phone: student.phone || "",
          email: student.email || "",
          progress: student.progress || 0,
          whatsapp_template_history: Array.isArray(student.whatsapp_template_history)
            ? student.whatsapp_template_history
            : [],
          createdAt: student.created_at,
          lastActive: student.updated_at
            ? new Date(student.updated_at).toISOString().split("T")[0]
            : "",
          passcode: student.passcode,
          archived: student.archived || false,
          student_school_id: student.student_school_id,
          instructor_id: student.instructor_id || student.granted_by_admin_id || null,
          granted_by_admin_id: student.granted_by_admin_id || null,
          linkedInstructorName: student.linked_instructor_name || null,
          linkedInstructorEmail: student.linked_instructor_email || null,
        };

        if (student.archived) {
          archivedStudentsList.push(formattedStudent);
        } else {
          activeStudents.push(formattedStudent);
        }
      });

      setStudents(activeStudents);
      setArchivedStudents(archivedStudentsList);
    } catch (error) {
      console.error("Error processing students:", error);
      f7.toast.show({
        text: "Error processing students: " + error.message,
        position: "top",
      });
    }
  };

  const handleSave = async () => {
    try {
      f7.preloader.show();

      if (!user?.email) {
        throw new Error("Unable to determine current admin user");
      }

      // Profile save is admin-only. School writes are handled exclusively in
      // explicit school actions (handleCreateSchool / handleUpdateSchool).
      const { data: adminProfile, error: adminError } =
        await adminService.getAdminByEmail(user.email);
      if (adminError && adminError.code !== "PGRST116") {
        throw new Error(adminError.message);
      }

      const adminData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        school_ids: selectedSchoolIds,
        updated_at: new Date(),
      };

      let shouldShowPendingMessage = false;
      if (adminProfile?.id) {
        // Existing admin update.
        const isApproved = adminProfile.status === "approved";
        const { error: updateError } = await adminService.updateAdmin(
          adminProfile.id,
          {
            ...adminData,
            ...(isApproved ? {} : { status: "pending" }),
          }
        );
        if (updateError) {
          throw new Error(updateError.message);
        }

        if (!isApproved) {
          setRequestStatus("pending");
          shouldShowPendingMessage = true;
        }
      } else {
        // No admin record yet: create one as pending request unless super admin.
        const isSuperAdminUser = isSuperAdmin(user.email);
        const createPayload = {
          ...adminData,
          status: isSuperAdminUser ? "approved" : "pending",
          created_at: new Date(),
        };
        const { error: createError } = await adminService.createAdmin(
          createPayload
        );
        if (createError) {
          throw new Error(createError.message);
        }

        if (!isSuperAdminUser) {
          setRequestStatus("pending");
          shouldShowPendingMessage = true;
        }
      }

      f7.preloader.hide();
      f7.toast.show({
        text: shouldShowPendingMessage
          ? "Profile changes submitted. Waiting for admin approval."
          : "Profile updated successfully",
        position: "top",
      });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error saving profile:", error);
      f7.toast.show({
        text: "Error saving profile: " + error.message,
        position: "top",
      });
    }
  };

  // Fetch all schools for default admin
  const fetchAllSchools = async () => {
    try {
      setSchoolsLoading(true);

      const { data: schools, error } = await schoolService.getSchools();
      if (error) {
        f7.toast.show({
          text: "Error loading schools: " + error.message,
          position: "top",
        });
        setSchoolsLoading(false);
        return;
      }

      setAllSchools(schools || []);
      setSchoolsLoading(false);
      f7.toast.show({ text: "Schools loaded successfully", position: "top" });
    } catch (error) {
      setSchoolsLoading(false);
      console.error("Error fetching schools:", error);
      f7.toast.show({
        text: "Error fetching schools: " + error.message,
        position: "top",
      });
    }
  };

  // Fetch all admins for default admin
  const fetchAllAdmins = async () => {
    try {
      const { data: admins, error } = await adminService.getAllAdmins();
      if (error) {
        f7.toast.show({
          text: "Error loading admins: " + error.message,
          position: "top",
        });
        return;
      }

      setAllAdmins(admins || []);
      // f7.toast.show({ text: "Admins loaded successfully", position: "top" });
    } catch (error) {
      console.error("Error fetching admins:", error);
      f7.toast.show({
        text: "Error fetching admins: " + error.message,
        position: "top",
      });
    }
  };

  // Handle editing a school
  const handleEditSchool = (school) => {
    setEditingSchool(school);
    setShowCreateSchoolForm(false);
  };

  // Handle creating a new school
  const handleCreateSchool = async () => {
    if (!editingSchool || editingSchool.id) return; // Only create if no ID exists

    try {
      f7.preloader.show();

      // Get current admin to use in create scenario
      let currentAdmin = null;
      let adminError = null;
      if (user?.email) {
        ({ data: currentAdmin, error: adminError } =
          await adminService.getAdminByEmail(user.email));

        if (adminError && adminError.code !== "PGRST116") {
          // There was an actual error with the query
          throw new Error(`Error getting admin info: ${adminError.message}`);
        }
      }

      // Create new school
      const { id, ...createData } = editingSchool;
      const schoolData = {
        ...createData,
        // Ensure new fields are included properly
        address: createData.address || null,
        area: createData.area || null,
        district: createData.district || null,
        details: createData.details || null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add admin_id if the current user is an admin
      if (currentAdmin && currentAdmin.email) {
        schoolData.admin_id = currentAdmin.email;
      }

      // Use the centralized function that creates the school and updates the admin record
      const result = await schoolService.createSchoolForAdmin(
        schoolData,
        user?.email
      );
      const { data, error } = result;
      if (error) throw new Error(error.message);

      // Add new school to the list
      setAllSchools([...allSchools, data]);

      // Reset editing state
      setEditingSchool(null);
      setShowCreateSchoolForm(false);

      f7.preloader.hide();
      f7.sheet.close();
      f7.toast.show({
        text: "School created successfully",
        position: "top",
      });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error creating school:", error);
      f7.toast.show({
        text: "Error creating school: " + error.message,
        position: "top",
      });
    }
  };

  // Handle updating an existing school
  const handleUpdateSchool = async () => {
    if (!editingSchool || !editingSchool.id) return; // Only update if an ID exists

    try {
      f7.preloader.show();

      // Update existing school
      const { id, ...updateData } = editingSchool;
      const result = await schoolService.updateSchool(id, {
        ...updateData,
        // Ensure new fields are included properly
        address: updateData.address || null,
        area: updateData.area || null,
        district: updateData.district || null,
        details: updateData.details || null,
        updated_at: new Date(),
      });

      const { data, error } = result;
      if (error) throw new Error(error.message);

      // Update existing school in the list
      setAllSchools(
        allSchools.map((school) =>
          school.id === editingSchool.id ? data : school
        )
      );

      // Reset editing state
      setEditingSchool(null);
      setShowCreateSchoolForm(false);

      f7.preloader.hide();
      f7.sheet.close();
      f7.toast.show({
        text: "School updated successfully",
        position: "top",
      });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error updating school:", error);
      f7.toast.show({
        text: "Error updating school: " + error.message,
        position: "top",
      });
    }
  };

  // Handle saving a school (create or update) - maintains the old function for compatibility
  const handleSaveSchool = async () => {
    if (!editingSchool) return;

    if (editingSchool.id) {
      // Update existing school
      await handleUpdateSchool();
    } else {
      // Create new school
      await handleCreateSchool();
    }
  };

  // Handle deleting a school
  const handleDeleteSchool = async (schoolId) => {
    try {
      const { error } = await schoolService.deleteSchool(schoolId);
      if (error) throw new Error(error.message);

      // Update local state
      setAllSchools(allSchools.filter((school) => school.id !== schoolId));

      f7.toast.show({ text: "School deleted successfully", position: "top" });
    } catch (error) {
      console.error("Error deleting school:", error);
      f7.toast.show({
        text: "Error deleting school: " + error.message,
        position: "top",
      });
    }
  };

  // Handle canceling school edit/create
  const handleCancelSchoolEdit = () => {
    setEditingSchool(null);
    setShowCreateSchoolForm(false);
  };

  const checkAdminProfile = async (userEmail) => {
    const { data: adminProfile, error: adminError } =
      await adminService.getAdminByEmail(userEmail);

    if (adminError && adminError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected for new users
      console.error("Error getting admin profile:", adminError);
      f7.toast.show({
        text: "Error getting admin profile: " + adminError.message,
        position: "top",
      });
      // Don't return early, continue to allow user to request admin status
    }

    return { adminProfile, adminError };
  };

  const handleDefaultAdmin = async (currentUser) => {
    debug("handleDefaultAdmin:start", {
      email: currentUser?.email,
    });
    // Load the admin row so profile fields (phone/address/name) come from drv_admins.
    const { data: defaultAdminProfile } = await adminService.getAdminByEmail(
      currentUser.email
    );
    const adminName =
      defaultAdminProfile?.name ||
      currentUser.user_metadata?.name ||
      currentUser.email.split("@")[0];
    const adminPhone = defaultAdminProfile?.phone || "";
    const adminAddress = defaultAdminProfile?.address || "";

    // setIsAdmin(true); // Removed since we now use centralized isAdmin() function
    setRequestStatus("approved");

    // Get all driving schools for the default admin to manage
    setSchoolsLoading(true);
    const { data: allSchools, error: schoolsError } =
      await schoolService.getSchools();
    if (schoolsError) {
      console.error("Error getting schools:", schoolsError);
      f7.toast.show({
        text: "Error getting schools: " + schoolsError.message,
        position: "top",
      });
      setSchoolsLoading(false);
      return false; // Indicate failure
    }

    setAllSchools(allSchools || []);
    setAssignedSchools(allSchools || []); // Default admin sees all schools
    setSchoolsLoading(false);

    // Get all admins for the default admin to manage with timeout
    const { data: admins, error: adminsError } =
      await adminService.getAllAdmins();
    if (!adminsError && admins) {
      setAllAdmins(admins);
    }

    // Check if a school is already selected in localStorage
    const storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    if (storedSchoolId && allSchools && allSchools.length > 0) {
      const selectedSchool = allSchools.find(
        (school) => school.id === storedSchoolId
      );
      if (selectedSchool) {
        setSchoolId(selectedSchool.id);
        // Populate profile with selected school data
        setProfile({
          id: selectedSchool.id,
          // Preserve admin's profile fields from drv_admins.
          name: adminName,
          email: currentUser.email || "",
          phone: adminPhone,
          address: adminAddress,
        });
        debug("handleDefaultAdmin:setProfileSelectedSchool", {
          schoolId: selectedSchool.id,
          phone: adminPhone,
        });
        // Fetch students for this school
        // await fetchStudents(selectedSchool.id);
        return true; // Indicate success and completion
      }
    }

    // For now, just show the first school if exists, or allow creating one
    if (allSchools && allSchools.length > 0) {
      const school = allSchools[0];
      setSchoolId(school.id);
      setProfile({
        id: school.id,
        // Preserve admin's profile fields from drv_admins.
        name: adminName,
        email: currentUser.email || "",
        phone: adminPhone,
        address: adminAddress,
      });
      debug("handleDefaultAdmin:setProfileFirstSchool", {
        schoolId: school.id,
        phone: adminPhone,
      });

      // Fetch students for this school
      await fetchStudents(school.id);
    } else {
      // No schools exist yet, initialize with empty profile
      setProfile({
        id: null,
        name: adminName,
        email: currentUser.email || "",
        phone: adminPhone,
        address: adminAddress,
      });
      debug("handleDefaultAdmin:setProfileNoSchools", {
        phone: adminPhone,
      });
    }

    return true; // Indicate success
  };

  const processAdminProfile = async (adminProfile, currentUser) => {
    setAdminRecordId(adminProfile?.id || null);
    debug("processAdminProfile:start", {
      id: adminProfile?.id,
      email: adminProfile?.email,
      phone: adminProfile?.phone,
      status: adminProfile?.status,
      schoolIds: adminProfile?.school_ids,
    });
    // Set admin status based on the admin record
    if (adminProfile.status === "approved") {
      // setIsAdmin(true); // Removed since we now use centralized isAdmin() function
      setRequestStatus("approved");
    } else if (adminProfile.status === "pending") {
      // setIsAdmin(false); // Removed since we now use centralized isAdmin() function
      setRequestStatus("pending");
      // Show a message to the user that their changes are pending approval
      f7.toast.show({
        text: "Your profile changes are pending approval.",
        position: "top",
      });
    } else if (adminProfile.status === "rejected") {
      // setIsAdmin(false); // Removed since we now use centralized isAdmin() function
      setRequestStatus("none");
      // Show a message to the user that their request was rejected
      f7.toast.show({
        text: "Your admin request was rejected. Please contact support.",
        position: "top",
      });
    }

    // Set selected school IDs
    if (adminProfile.school_ids) {
      const schoolIdsArray = Array.isArray(adminProfile.school_ids)
        ? adminProfile.school_ids
        : [];
      setSelectedSchoolIds(schoolIdsArray);

      // Fetch assigned schools
      if (schoolIdsArray.length > 0) {
        setSchoolsLoading(true);

        // Get all schools first
        const { data: allSchoolsData, error: schoolsError } =
          await schoolService.getSchools();

        if (schoolsError) {
          console.error("Error fetching all schools:", schoolsError);
          f7.toast.show({
            text: "Error loading schools: " + schoolsError.message,
            position: "top",
          });
        } else if (allSchoolsData) {
          setAllSchools(allSchoolsData);

          // Filter to only the schools assigned to this admin
          const assigned = allSchoolsData.filter((school) =>
            schoolIdsArray.includes(school.id)
          );
          setAssignedSchools(assigned);
        } else {
          setAllSchools([]);
          setAssignedSchools([]);
        }

        setSchoolsLoading(false);
      }
    }

    // Get driving schools for this admin
    if (adminProfile.school_ids && adminProfile.school_ids.length > 0) {
      // Get assigned schools
      setSchoolsLoading(true);
      const { data: schools, error: schoolsError } =
        await schoolService.getSchools();
      if (!schoolsError && schools) {
        const assigned = schools.filter((school) =>
          adminProfile.school_ids.includes(school.id)
        );
        setAllSchools(schools);
        setAssignedSchools(assigned);

        // Check if a school is already selected in localStorage
        const storedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        if (storedSchoolId) {
          const selectedSchool = assigned.find(
            (school) => school.id === storedSchoolId
          );
          if (selectedSchool) {
            setSchoolId(selectedSchool.id);
            // Populate profile with selected school data
            setProfile({
              id: selectedSchool.id,
              // Preserve admin's name instead of using school name
              name:
                adminProfile.name ||
                currentUser.user_metadata?.name ||
                currentUser.email.split("@")[0],
              email: adminProfile.email || currentUser.email || "",
              phone: adminProfile?.phone || "",
              address: adminProfile?.address || "",
            });
            debug("processAdminProfile:setProfileStoredSchool", {
              schoolId: selectedSchool.id,
              phone: adminProfile?.phone || "",
            });
            // Fetch students for this school
            await fetchStudents(selectedSchool.id);
            setSchoolsLoading(false);
            return;
          }
        }

        // For now, just show the first school if exists
        const firstSchoolId = adminProfile.school_ids[0];
        const { data: school, error: schoolError } =
          await schoolService.getSchoolById(firstSchoolId);
        if (!schoolError && school) {
          // Update cache and store with the school data
          schoolService.updateSchoolCacheAndStore(school);
          setSchoolId(school.id);
          // Store selection in localStorage
          setSafeSelectedSchoolId(school.id, school.name);
          // Populate profile with school data
          setProfile({
            id: school.id,
            // Preserve admin's name instead of using school name
            name:
              adminProfile.name ||
              currentUser.user_metadata?.name ||
              currentUser.email.split("@")[0],
            email: adminProfile.email || currentUser.email || "",
            phone: adminProfile?.phone || "",
            address: adminProfile?.address || "",
          });
          debug("processAdminProfile:setProfileFirstSchool", {
            schoolId: school.id,
            phone: adminProfile?.phone || "",
          });

          // Fetch students for this school
          await fetchStudents(school.id);
        } else {
          // If we can't get the school, populate profile with admin data
          setProfile({
            id: adminProfile.id,
            name:
              adminProfile.name ||
              currentUser.user_metadata?.name ||
              currentUser.email.split("@")[0],
            email: adminProfile.email || currentUser.email || "",
            phone: adminProfile.phone || "",
            address: adminProfile.address || "",
          });
          debug("processAdminProfile:setProfileNoSchoolFallback", {
            phone: adminProfile.phone || "",
          });
        }
      } else {
        // If we can't get schools, populate profile with admin data
        setProfile({
          id: adminProfile.id,
          name:
            adminProfile.name ||
            currentUser.user_metadata?.name ||
            currentUser.email.split("@")[0],
          email: adminProfile.email || currentUser.email || "",
          phone: adminProfile.phone || "",
          address: adminProfile.address || "",
        });
        debug("processAdminProfile:setProfileNoSchoolsData", {
          phone: adminProfile.phone || "",
        });
      }
      setSchoolsLoading(false);
    } else {
      f7.toast.show({
        text: "No schools assigned to admin",
        position: "top",
      });
      // Populate profile with admin data
      setProfile({
        id: adminProfile.id,
        name:
          adminProfile.name ||
          currentUser.user_metadata?.name ||
          currentUser.email.split("@")[0],
        email: adminProfile.email || currentUser.email || "",
        description: adminProfile.description || "",
        logoUrl: adminProfile.logo_url || "",
        coverImageUrl: adminProfile.cover_image_url || "",
      });
      debug("processAdminProfile:setProfileNoAssignedSchools", {
        phone: adminProfile?.phone || "",
      });
    }
  };

  const handleApproveRequest = async (adminId) => {
    try {
      // Get the admin record
      const { data: admin, error: adminError } =
        await adminService.getAdminById(adminId);
      if (adminError) {
        throw new Error(adminError.message);
      }

      // Update admin status to approved
      const { data, error } = await adminService.updateAdminStatus(
        adminId,
        "approved"
      );
      if (error) {
        throw new Error(error.message);
      }

      // Assign admin to selected schools
      if (admin && admin.school_ids && Array.isArray(admin.school_ids)) {
        for (const schoolId of admin.school_ids) {
          try {
            await schoolService.updateSchool(schoolId, { admin_id: adminId });
          } catch (schoolError) {
            console.error(
              `Error assigning admin to school ${schoolId}:`,
              schoolError
            );
          }
        }
      }

      // Update local state
      setAllAdmins(
        allAdmins.map((a) =>
          a.id === adminId ? data || { ...a, status: "approved" } : a
        )
      );

      f7.toast.show({ text: "Request approved successfully", position: "top" });
    } catch (error) {
      console.error("Error approving request:", error);
      f7.toast.show({
        text: "Error approving request: " + error.message,
        position: "top",
      });
    }
  };

  const handleRejectRequest = async (adminId) => {
    try {
      // Update admin status to rejected
      const { data, error } = await adminService.updateAdminStatus(
        adminId,
        "rejected"
      );
      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setAllAdmins(
        allAdmins.map((admin) =>
          admin.id === adminId
            ? data || { ...admin, status: "rejected" }
            : admin
        )
      );

      f7.toast.show({ text: "Request rejected", position: "top" });
    } catch (error) {
      console.error("Error rejecting request:", error);
      f7.toast.show({
        text: "Error rejecting request: " + error.message,
        position: "top",
      });
    }
  };

  const handleReverseApproval = async (adminId) => {
    try {
      // Update admin status back to pending
      const { data, error } = await adminService.updateAdminStatus(
        adminId,
        "pending"
      );
      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setAllAdmins(
        allAdmins.map((admin) =>
          admin.id === adminId ? data || { ...admin, status: "pending" } : admin
        )
      );

      f7.toast.show({ text: "Approval reversed", position: "top" });
    } catch (error) {
      console.error("Error reversing approval:", error);
      f7.toast.show({
        text: "Error reversing approval: " + error.message,
        position: "top",
      });
    }
  };

  // Admin Management Functions
  const handleDeleteAdmin = async (adminId) => {
    try {
      const { error } = await adminService.deleteAdmin(adminId);
      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setAllAdmins(allAdmins.filter((admin) => admin.id !== adminId));

      f7.toast.show({ text: "Admin deleted successfully", position: "top" });
    } catch (error) {
      console.error("Error deleting admin:", error);
      f7.toast.show({
        text: "Error deleting admin: " + error.message,
        position: "top",
      });
    }
  };

  const requestAdminStatus = async () => {
    if (!user || !user.email) {
      f7.toast.show({ text: "Unable to get user email", position: "top" });
      return;
    }

    try {
      // Create admin record with pending status and selected schools
      const { data, error } = await adminService.createAdmin({
        email: user.email,
        name: user.user_metadata?.name || user.email.split("@")[0],
        status: "pending",
        school_ids: selectedSchoolIds,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setRequestStatus("pending");

      f7.toast.show({
        text: "Admin request submitted. Waiting for approval.",
        position: "top",
      });
    } catch (error) {
      console.error("Error requesting admin status:", error);
      f7.toast.show({
        text: "Error requesting admin status: " + error.message,
        position: "top",
      });
    }
  };

  const handleMessageStudent = (student) => {
    // Close the popover first
    f7.popover.close();

    const whatsappUrls = buildWhatsAppUrl({
      phone: student.phone,
      message: `Hallo ${student.name}, ik ben de admin van Rijles Hulp en wil graag contact met je opnemen.`,
    });

    showWhatsAppLaunchDialog({
      title: "WhatsApp klaar",
      description: `Gebruik de knop hieronder om ${student.name} te contacteren.`,
      whatsappUrl: isStandalonePwa() ? whatsappUrls.appUrl : whatsappUrls.webUrl,
      whatsappFallbackUrl: whatsappUrls.webUrl,
      buttonText: `Open WhatsApp voor ${student.name}`,
    });
  };

  // Function to generate a single-use student invite link
  const generateStudentInviteLink = async (studentId, schoolId) => {
    try {
      // Generate a unique token on the client side as an alternative approach
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Insert the new student invite record using fetch API
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_invite_links`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            student_id: studentId,
            school_id: schoolId,
            token: token,
            created_by: user.id || authUser?.id, // Record who sent the invite
            created_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Return the complete invite URL
      const inviteUrl = `${window.location.origin}/?invite_token=${token}`;
      f7.preloader.hide();
      return inviteUrl;
    } catch (error) {
      f7.preloader.hide();
      console.error("Error creating student invite link:", error);
      f7.dialog.alert("Error creating student invite link: " + error.message);
      return null;
    }
  };

  // Function to send student invite via WhatsApp
  const handleInviteStudent = async (student) => {
    // Close the popover first
    f7.popover.close();

    try {
      // Get the currently selected school for the admin
      const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (!selectedSchoolId) {
        f7.dialog.alert(
          "Please select a school first before inviting students."
        );
        return;
      }

      // Generate single-use student invite link
      const inviteUrl = await generateStudentInviteLink(
        student.id,
        selectedSchoolId
      );

      if (inviteUrl) {
        const whatsappUrls = buildWhatsAppUrl({
          phone: student.phone,
          message: `Hi ${student.name}, you've been invited to join our driving school on Rijles Hulp. Please click this link to complete your registration: ${inviteUrl}`,
        });

        showWhatsAppLaunchDialog({
          title: "WhatsApp klaar",
          description: `Gebruik de knop hieronder om de uitnodiging voor ${student.name} te openen.`,
          whatsappUrl: isStandalonePwa() ? whatsappUrls.appUrl : whatsappUrls.webUrl,
          whatsappFallbackUrl: whatsappUrls.webUrl,
          buttonText: `Open uitnodiging voor ${student.name}`,
        });
      }
    } catch (error) {
      console.error("Error inviting student:", error);
      f7.dialog.alert("Error inviting student: " + error.message);
    }
  };

  const handleCopyStudentAccessLink = async (student) => {
    // Close the popover first
    f7.popover.close();

    try {
      const selectedSchoolId =
        selectedSchoolForStudents?.id ||
        process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (!selectedSchoolId) {
        f7.dialog.alert(
          "Selecteer eerst een rijschool voordat je een toegang link kopieert."
        );
        return;
      }

      const grantAccess = async (durationDays) => {
        f7.preloader.show();
        const generatePasscode = () =>
          Math.floor(1000 + Math.random() * 9000).toString();
        const generateVerificationKey = () =>
          `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        const { data: existingRelationship, error: relationshipError } =
          await studentSchoolService.getRelationshipByStudentAndSchool(
            student.id,
            selectedSchoolId
          );

        if (relationshipError) {
          throw new Error("Fout bij ophalen van relatiegegevens");
        }

        const now = new Date();
        const accessExpiresAt = existingRelationship?.expires_at
          ? new Date(existingRelationship.expires_at)
          : null;
        const hasActiveApprovedAccess =
          existingRelationship?.approved === true &&
          existingRelationship?.archived !== true &&
          accessExpiresAt &&
          now <= accessExpiresAt;

        if (
          hasActiveApprovedAccess &&
          existingRelationship?.verification_key &&
          existingRelationship.verification_key !== ""
        ) {
          return existingRelationship.verification_key;
        }

        const passcode =
          existingRelationship?.passcode && existingRelationship.passcode !== ""
            ? existingRelationship.passcode
            : generatePasscode();

        let verificationKey = null;
        let lastError = null;

        const persistAccessWithKey = async (key) => {
          const grantedAdminId = adminRecordId || null;
          if (existingRelationship) {
            return await studentSchoolService.updateRelationship(
              existingRelationship.id,
              {
                approved: true,
                passcode,
                verification_key: key,
                verification_key_used: false,
                verification_key_expires_at: expiresAt.toISOString(),
                expires_at: expiresAt.toISOString(),
                is_trial: false,
                access_source: "admin_grant",
                granted_by_admin_id: grantedAdminId,
                instructor_id: grantedAdminId,
                updated_at: new Date().toISOString(),
              }
            );
          }

          return await studentSchoolService.createStudentSchoolRelationship({
            student_id: student.id,
            school_id: selectedSchoolId,
            approved: true,
            passcode,
            verification_key: key,
            verification_key_used: false,
            verification_key_expires_at: expiresAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            is_trial: false,
            access_source: "admin_grant",
            granted_by_admin_id: grantedAdminId,
            instructor_id: grantedAdminId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        };

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const key = generateVerificationKey();
          const { error } = await persistAccessWithKey(key);
          if (!error) {
            verificationKey = key;
            lastError = null;
            break;
          }

          lastError = error;
          const errorMessage = error?.message || "";
          const isVerificationKeyConflict =
            errorMessage.includes("409") &&
            /verification_key|duplicate key|unique/i.test(errorMessage);

          if (!isVerificationKeyConflict) {
            break;
          }
        }

        if (!verificationKey) {
          const fallbackKey =
            existingRelationship?.verification_key &&
            existingRelationship.verification_key !== ""
              ? existingRelationship.verification_key
              : null;

          if (fallbackKey) {
            verificationKey = fallbackKey;
          } else {
            throw new Error(lastError?.message || "Fout bij updaten van toegang");
          }
        }

        return verificationKey;
      };

      const showGrantSheet = () =>
        new Promise((resolve) => {
          const instanceId = `grant-access-sheet-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          const ids = {
            root: instanceId,
            cancel: `${instanceId}-cancel`,
          };
          const durations = [3, 7, 30, 90];

          const sheetContent = `
            <div id="${ids.root}" class="sheet-modal" style="height: 70vh;">
              <div class="page">
                <div class="navbar">
                  <div class="navbar-bg"></div>
                  <div class="navbar-inner sliding">
                    <div class="title">Toegang toekennen</div>
                    <div class="right">
                      <a href="#" class="link sheet-close">Sluiten</a>
                    </div>
                  </div>
                </div>
                <div class="page-content">
                  <div class="list no-hairlines-md">
                    <ul>
                      ${durations
                        .map(
                          (days) => `
                        <li>
                          <a href="#" class="item-link item-content grant-duration-option" data-duration="${days}">
                            <div class="item-inner">
                              <div class="item-title">${days} dagen</div>
                            </div>
                          </a>
                        </li>
                      `
                        )
                        .join("")}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `;

          let settled = false;
          let cleanup = () => {};
          let sheet;

          const safeResolve = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };

          sheet = f7.sheet.create({
            content: sheetContent,
            swipeToClose: true,
            backdrop: true,
            closeByBackdropClick: true,
            on: {
              opened: () => {
                const rootEl = document.getElementById(ids.root);
                if (!rootEl) return;

                const cancelEl = document.getElementById(ids.cancel);
                const durationEls = Array.from(
                  rootEl.querySelectorAll(".grant-duration-option")
                );

                const onCancel = (event) => {
                  event.preventDefault();
                  safeResolve(null);
                  sheet.close();
                };

                const onDurationClick = (event) => {
                  event.preventDefault();
                  const targetEl =
                    typeof Element !== "undefined" && event.currentTarget instanceof Element
                      ? event.currentTarget
                      : null;
                  const selectedDuration = parseInt(
                    targetEl?.getAttribute("data-duration") || "",
                    10
                  );

                  safeResolve({
                    durationDays: Number.isNaN(selectedDuration)
                      ? null
                      : selectedDuration,
                  });
                  sheet.close();
                };

                cancelEl?.addEventListener("click", onCancel);
                durationEls.forEach((durationEl) =>
                  durationEl.addEventListener("click", onDurationClick)
                );

                cleanup = () => {
                  cancelEl?.removeEventListener("click", onCancel);
                  durationEls.forEach((durationEl) =>
                    durationEl.removeEventListener("click", onDurationClick)
                  );
                };
              },
              closed: () => {
                cleanup();
                sheet.destroy();
                if (!settled) {
                  safeResolve(null);
                }
              },
            },
          });

          sheet.open();
        });

      const grantSelection = await showGrantSheet();
      const durationDays = grantSelection?.durationDays;
      if (!durationDays) {
        return;
      }

      const verificationKey = await grantAccess(durationDays);
      const accessUrl = buildAbsolutePageUrl("verify-access", {
        key: verificationKey,
      });

      const schoolName = selectedSchoolForStudents?.name || "je rijschool";
      const whatsappUrls = buildWhatsAppUrl({
        phone: student.phone,
        message: `Hallo ${student.name}, je toegang tot ${schoolName} is goedgekeurd voor ${durationDays} dagen.\n\nKlik op deze link om je toegang te activeren:\n${accessUrl}`,
      });

      showWhatsAppLaunchDialog({
        title: "WhatsApp klaar",
        description: `Gebruik de knop hieronder om het toegangsbericht voor ${student.name} te openen.`,
        whatsappUrl: isStandalonePwa() ? whatsappUrls.appUrl : whatsappUrls.webUrl,
        whatsappFallbackUrl: whatsappUrls.webUrl,
        buttonText: `Open WhatsApp voor ${student.name}`,
      });
    } catch (error) {
      console.error("Error copying student access link:", error);
      f7.dialog.alert(
        error?.message || "Kon de toegang link niet genereren. Probeer het opnieuw."
      );
    } finally {
      f7.preloader.hide();
    }
  };

  const handleArchiveStudent = async (studentId) => {
    // Close the popover first
    f7.popover.close();

    const studentToArchive = students.find((s) => s.id === studentId);
    if (studentToArchive) {
      try {
        // In a real implementation, we would add an 'archived' field to the students table
        // For now, we'll simulate this by updating the UI state only
        setStudents(students.filter((s) => s.id !== studentId));
        setArchivedStudents([
          ...archivedStudents,
          { ...studentToArchive, archived: true },
        ]);
        f7.toast.show({
          text: `${studentToArchive.name} is gearchiveerd (simulated)`,
        });
      } catch (error) {
        console.error("Error archiving student:", error);
        f7.toast.show({ text: `Error archiving student: ${error.message}` });
      }
    }
  };

  const handleBlockStudent = async (studentId) => {
    // Close the popover first
    f7.popover.close();

    const studentToBlock = students.find((s) => s.id === studentId);
    if (studentToBlock) {
      try {
        // In a real implementation, we would add a 'blocked' field to the students table
        // For now, we'll simulate this by showing a message
        f7.dialog.alert(
          `${studentToBlock.name} is geblokkeerd. In een volledige implementatie zou dit de student toegang tot de app ontzeggen.`,
          "Student Geblokkeerd"
        );
      } catch (error) {
        console.error("Error blocking student:", error);
        f7.toast.show({ text: `Error blocking student: ${error.message}` });
      }
    }
  };

  const handleAllowStudent = async (studentId) => {
    // Close the popover first
    f7.popover.close();

    const studentToAllow = students.find((s) => s.id === studentId);
    if (!studentToAllow) {
      return;
    }

    // Create dialog HTML with duration options and payment amount input
    const dialogHtml = `
      <div class="dialog-text"><p>Selecteer de toegangsperiode voor ${studentToAllow.name}:</p></div>
      <div class="list no-hairlines-md">
        <ul>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-input-wrap" style="width: 100%;">
                <div class="segmented segmented-strong" id="access-duration-buttons">
                  <button type="button" class="button" data-duration="3">3</button>
                  <button type="button" class="button button-active" data-duration="7">7</button>
                  <button type="button" class="button" data-duration="30">30</button>
                  <button type="button" class="button" data-duration="90">90</button>
                  <span class="segmented-highlight"></span>
                </div>
              </div>
            </div>
          </li>
          <li class="item-content item-input">
            <div class="item-inner">
              <div class="item-title item-label">Bedrag (SRD)</div>
              <div class="item-input-wrap">
                <input type="number" id="payment-amount" placeholder="Bedrag in SRD" step="0.01" min="0" style="text-align: right;">
              </div>
            </div>
          </li>
        </ul>
      </div>
    `;

    const dialog = f7.dialog.create({
      title: "Toegang Verlenen",
      content: dialogHtml,
      buttons: [
        { text: "Cancel", color: "red" },
        {
          text: "Bevestigen",
          color: "blue",
          onClick: async () => {
            const activeButton = document.querySelector(
              "#access-duration-buttons .button-active"
            );
            const duration = activeButton
              ? parseInt(activeButton.getAttribute("data-duration"))
              : 7;

            // Get payment amount from input
            const paymentAmountInput = document.getElementById("payment-amount");
            const paymentAmount = paymentAmountInput
              ? parseFloat(paymentAmountInput.value) || 0
              : 0;

            try {
              // Show preloader
              f7.preloader.show();

              // Calculate expiration date
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + duration);

              // Update student-school relationship
              if (studentToAllow.student_school_id) {
                const { error } = await studentSchoolService.updateRelationship(
                  studentToAllow.student_school_id,
                  {
                    approved: true,
                    is_trial: false,
                    expires_at: expiresAt.toISOString(),
                    access_source: "cash_payment",
                    updated_at: new Date().toISOString(),
                  }
                );

                if (error) {
                  throw new Error("Fout bij het bijwerken van toegang");
                }

                // Create payment record if amount is provided
                let paymentRecord = null;
                if (paymentAmount > 0) {
                  const paymentData = {
                    student_id: studentToAllow.id,
                    school_id: selectedSchoolForStudents.id,
                    student_school_id: studentToAllow.student_school_id,
                    amount: paymentAmount,
                    payment_date: new Date().toISOString(),
                    payment_method: "cash",
                    duration_days: duration,
                    notes: `Toegang verlengd voor ${duration} dagen tot ${expiresAt.toLocaleDateString("nl-NL")}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

                  const { data: createdPayment, error: paymentError } =
                    await paymentService.createPayment(paymentData);

                  if (paymentError) {
                    console.error("Error creating payment record:", paymentError);
                    // Don't throw error - access was already granted
                  } else {
                    paymentRecord = createdPayment || null;
                  }
                }

                // Update subscription tracking (paid days)
                if (selectedSchoolForStudents?.id) {
                  const { data: subscription, error: subscriptionError } =
                    await referralService.getOrCreateSubscription(
                      studentToAllow.id,
                      selectedSchoolForStudents.id
                    );

                  if (subscriptionError) {
                    console.error("Error getting subscription:", subscriptionError);
                  } else if (subscription?.id) {
                    const { error: extendError } =
                      await referralService.extendSubscription(
                        subscription.id,
                        duration,
                        "payment",
                        paymentRecord?.id || null
                      );

                    if (extendError) {
                      console.error("Error extending subscription:", extendError);
                    }
                  }
                }

                // Hide preloader
                f7.preloader.hide();

                // Show success message
                const successMessage = paymentAmount > 0
                  ? `${studentToAllow.name} heeft nu toegang tot ${expiresAt.toLocaleDateString("nl-NL")}. Betaling van SRD ${paymentAmount.toFixed(2)} geregistreerd.`
                  : `${studentToAllow.name} heeft nu toegang tot ${expiresAt.toLocaleDateString("nl-NL")}`;

                f7.toast.show({
                  text: successMessage,
                  position: "top",
                  closeTimeout: 4000,
                });

                // Refresh students list
                if (selectedSchoolForStudents?.id) {
                  await fetchStudents(selectedSchoolForStudents.id, { forceRefresh: true });
                }
              } else {
                throw new Error("Student-school relatie niet gevonden");
              }
            } catch (error) {
              f7.preloader.hide();
              console.error("Error granting access:", error);
              f7.dialog.alert(
                error.message || "Er is een fout opgetreden bij het verlenen van toegang",
                "Fout"
              );
            }
          },
        },
      ],
      on: {
        opened: () => {
          const buttons = document.querySelectorAll(
            "#access-duration-buttons .button"
          );
          buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
              buttons.forEach((b) => b.classList.remove("button-active"));
              btn.classList.add("button-active");
            });
          });
        },
      },
    });

    dialog.open();
  };

  const handleDeleteStudent = async (studentId) => {
    // Close the popover first
    f7.popover.close();

    const studentToDelete = students.find((s) => s.id === studentId);
    if (!studentToDelete) {
      return;
    }

    // Show confirmation dialog
    f7.dialog.confirm(
      `Weet je zeker dat je ${studentToDelete.name} permanent wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.`,
      "Student Verwijderen",
      async () => {
        try {
          // Show preloader
          f7.preloader.show();

          // Delete student and dependent records to avoid FK conflicts
          const { error: studentError } = await studentService.deleteStudentCascade(studentId);

          if (studentError) {
            console.error("Error deleting student:", studentError);
            throw new Error(studentError.message || "Fout bij het verwijderen van de student");
          }

          // Remove student from local state
          setStudents(students.filter((s) => s.id !== studentId));
          setArchivedStudents(archivedStudents.filter((s) => s.id !== studentId));

          // Hide preloader
          f7.preloader.hide();

          // Show success message
          f7.toast.show({
            text: `${studentToDelete.name} is succesvol verwijderd`,
            position: "top",
            closeTimeout: 3000,
          });
        } catch (error) {
          // Hide preloader
          f7.preloader.hide();

          console.error("Error deleting student:", error);
          f7.dialog.alert(
            error.message || "Er is een fout opgetreden bij het verwijderen van de student",
            "Fout"
          );
        }
      }
    );
  };

  const filteredStudents = useMemo(() => {
    const studentsToFilter = showArchived ? archivedStudents : students;

    if (!searchQuery) return studentsToFilter;

    const query = searchQuery.toLowerCase();
    return studentsToFilter.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [students, archivedStudents, searchQuery, showArchived]);

  return {
    profile,
    setProfile,
    students,
    archivedStudents,
    showArchived,
    setShowArchived,
    searchQuery,
    setSearchQuery,
    loading,
    requestStatus,
    user,
    schoolId,
    noUser,
    allSchools,
    schoolsLoading, // Add the schools loading state
    allAdmins,
    editingSchool,
    setEditingSchool,
    showCreateSchoolForm,
    setShowCreateSchoolForm,
    selectedSchoolIds,
    setSelectedSchoolIds,
    selectedSchoolForStudents,
    setSelectedSchoolForStudents,
    assignedSchools,
    popoverTarget,
    setPopoverTarget,
    selectedStudent,
    setSelectedStudent,
    selectedSchool,
    setSelectedSchool,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    initializeProfileData,
    fetchStudents,
    handleSave,
    fetchAllSchools,
    fetchAllAdmins,
    handleEditSchool,
    handleSaveSchool,
    handleCreateSchool,
    handleUpdateSchool,
    handleDeleteSchool,
    handleCancelSchoolEdit,
    handleApproveRequest,
    handleRejectRequest,
    handleReverseApproval,
    handleDeleteAdmin,
    requestAdminStatus,
    handleMessageStudent,
    handleInviteStudent,
    handleCopyStudentAccessLink,
    handleArchiveStudent,
    handleBlockStudent,
    handleAllowStudent,
    handleDeleteStudent,
    filteredStudents,
  };
};

export default useAdminProfile;

