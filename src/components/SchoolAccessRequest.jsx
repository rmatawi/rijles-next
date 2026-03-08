import { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  Card,
  CardContent,
  Button,
  f7,
  Icon,
} from "framework7-react";
import { SUPABASE_CONFIG } from "../services/supabase";
import { useI18n } from "../i18n/i18n";
import useAppNavigation from "../hooks/useAppNavigation";

const SchoolAccessRequest = () => {
  const { t } = useI18n();
  const { navigate } = useAppNavigation();
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const [authAdmin, setAuthAdmin] = useState(false);

  useEffect(() => {
    // Parse URL parameters
    // School ID is now handled by background configuration (VITE_REACT_APP_DEFAULTSCHOOL)
    const urlSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const urlEmail = urlParams.get("email");
    let adminEmail = localStorage.getItem("userProfile");
    adminEmail = JSON.parse(adminEmail);

    if (page === "school-access-request") {
      // Prioritize school ID over school name for improved stability
      if (urlSchoolId) {
        // If we have a school ID, we'll need to fetch the school name
        fetchSchoolNameById(decodeURIComponent(urlSchoolId)).then(name => {
          if (name) {
            setSchoolName(name);
          }
        });
      } else if (urlSchoolName) {
        setSchoolName(decodeURIComponent(urlSchoolName));
      }
      
      if (urlEmail) setEmail(decodeURIComponent(urlEmail));

      // Check authorization for the current user using either school ID or name
      if (urlSchoolId) {
        checkUserAuthorization({
          email: adminEmail?.email,
          schoolId: decodeURIComponent(urlSchoolId),
        });
      } else if (urlSchoolName) {
        checkUserAuthorization({
          email: adminEmail?.email,
          schoolName: decodeURIComponent(urlSchoolName),
        });
      }
    }
  }, []);

  // Function to fetch school name by ID
  const fetchSchoolNameById = async (schoolId) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const schoolResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?id=eq.${schoolId}&select=name`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!schoolResponse.ok) {
        throw new Error(`HTTP error getting school! Status: ${schoolResponse.status}`);
      }

      const schoolData = await schoolResponse.json();
      if (Array.isArray(schoolData) && schoolData.length > 0) {
        return schoolData[0].name;
      }
      return null;
    } catch (error) {
      console.error("Error fetching school name by ID:", error);
      return null;
    }
  };

  const checkUserAuthorization = async ({ email, schoolName, schoolId: schoolIdParam }) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      if (!email) {
        f7.dialog.alert("Please log in to access this page");
        return;
      }

      // Get the school ID - either directly provided or derived from name
      let finalSchoolId = schoolIdParam;
      let selectFields = "id,admin_id";
      
      if (!finalSchoolId && schoolName) {
        // If we only have school name, query by name
        const schoolResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_schools?name=eq.${encodeURIComponent(
            schoolName
          )}&select=${selectFields}`,
          {
            method: "GET",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!schoolResponse.ok) {
          throw new Error(
            `HTTP error getting school by name! Status: ${schoolResponse.status}`
          );
        }

        const schoolData = await schoolResponse.json();
        if (Array.isArray(schoolData) && schoolData.length > 0) {
          finalSchoolId = schoolData[0].id;
        } else {
          throw new Error(`School not found: ${schoolName}`);
        }
      } else if (finalSchoolId) {
        // If we have school ID, query by ID
        const schoolResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_schools?id=eq.${finalSchoolId}&select=${selectFields}`,
          {
            method: "GET",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!schoolResponse.ok) {
          throw new Error(
            `HTTP error getting school by ID! Status: ${schoolResponse.status}`
          );
        }

        const schoolData = await schoolResponse.json();
        if (Array.isArray(schoolData) && schoolData.length === 0) {
          throw new Error(`School not found: ${finalSchoolId}`);
        }
      }

      // Check if the user has this school in their admin access
      if (finalSchoolId) {
        // Get the school record to check admin access
        const schoolResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_schools?id=eq.${finalSchoolId}&select=admin_id`,
          {
            method: "GET",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!schoolResponse.ok) {
          throw new Error(`HTTP error checking school! Status: ${schoolResponse.status}`);
        }

        const schoolData = await schoolResponse.json();
        if (schoolData?.[0]?.admin_id === email) {
          setAuthAdmin(true);
        } else {
          f7.dialog.alert(
            "Access denied: You don't have permission to access this school"
          );
        }
      }
    } catch (error) {
      console.error("Error checking user authorization:", error);
      f7.dialog.alert("Error checking authorization: " + error.message);
    }
  };

  const handleApproveRequest = async () => {
    setIsProcessing(true);
    setMessage("");
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      // First, get the school ID for the requested school name
      const schoolResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?name=eq.${encodeURIComponent(
          schoolName
        )}&select=id`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!schoolResponse.ok) {
        throw new Error(
          `HTTP error getting school! Status: ${schoolResponse.status}`
        );
      }

      const schoolData = await schoolResponse.json();
      if (!schoolData || schoolData.length === 0) {
        throw new Error("School not found");
      }

      const schoolId = schoolData[0].id;

      // Get the current admin's school_ids array
      const adminResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(
          email
        )}&select=school_ids`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!adminResponse.ok) {
        throw new Error(
          `HTTP error getting admin! Status: ${adminResponse.status}`
        );
      }

      const adminData = await adminResponse.json();
      if (!adminData || adminData.length === 0) {
        throw new Error("Admin not found");
      }

      // Get current school_ids array, or initialize as empty array if null
      const currentSchoolIds = adminData[0].school_ids || [];

      // Check if school ID is already in the array to avoid duplicates
      if (currentSchoolIds.includes(schoolId)) {
        // Show alert and redirect to home page
        f7.dialog.alert("School is already in the admin's list", "Info", () => {
          // Navigate back to home page
          navigate("/");
        });
        return;
      }

      // Create new school_ids array with the new school ID added
      const updatedSchoolIds = [...currentSchoolIds, schoolId];

      // Update the admin's record with the new school_ids array
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(
          email
        )}`,
        {
          method: "PATCH", // Use PATCH to update specific fields
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ school_ids: updatedSchoolIds }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          `HTTP error updating admin! Status: ${updateResponse.status}`
        );
      }

      setMessage("Request approved successfully! School access granted.");
      setRequestStatus("success");

      // Show success dialog and navigate after it's closed
      f7.dialog.alert("School access approved successfully!", "Success", () => {
        // Navigate back to home page after successful approval
        navigate("/");
      });
    } catch (error) {
      console.error("Error approving request:", error);
      setMessage("Error approving request: " + error.message);
      setRequestStatus("error");
      f7.dialog.alert("Error approving request: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Page>
      <Navbar title="School Access Request" backLink="Back" />

      <Block style={{ margin: "16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon
                f7="building_2"
                size="60"
                color="blue"
                style={{ marginBottom: "20px" }}
              />
              <h2>{t('adminRequest.schoolAccessRequestTitle')}</h2>
              <p>{t('school.schoolName')}: {schoolName || t('adminRequest.notSpecified')}</p>
              <p>{email || t('adminRequest.notSpecified')}</p>
            </div>
          </CardContent>
        </Card>
      </Block>

      {authAdmin && (
        <Block style={{ margin: "0 16px 16px" }}>
          <Block style={{ margin: "0 16px 16px" }}>
            <Button
              fill
              large
              color="blue"
              onClick={handleApproveRequest}
              disabled={isProcessing}
            >
              <Icon f7="checkmark" slot="start" />
              {isProcessing ? t('adminRequest.approving') || "Approving..." : t('adminRequest.approveRequest') || "Approve Request"}
            </Button>
          </Block>
        </Block>
      )}

      {message && (
        <Block style={{ margin: "0 16px 16px" }}>
          <Card
            style={{
              backgroundColor:
                requestStatus === "success" ? "#e8f5e9" : "#ffebee",
              borderColor: requestStatus === "success" ? "#4caf50" : "#f44336",
            }}
          >
            <CardContent>
              <div
                style={{
                  color: requestStatus === "success" ? "#2e7d32" : "#c62828",
                  textAlign: "center",
                  padding: "10px",
                }}
              >
                {message}
              </div>
            </CardContent>
          </Card>
        </Block>
      )}

      <Block style={{ margin: "0 16px 16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center" }}>
              <Icon
                f7="info_circle"
                size="40"
                color="blue"
                style={{ marginBottom: "10px" }}
              />
              <p style={{ fontSize: "14px", color: "var(--color-gray-text)" }}>
                After submitting your request, the system administrator will
                review it and either approve or deny your request. You will be
                notified of the decision. A WhatsApp message will be sent to the
                administrator for approval.
              </p>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default SchoolAccessRequest;
