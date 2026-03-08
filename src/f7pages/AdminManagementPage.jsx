import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  Card,
  CardContent,
  Button,
  f7,
  useStore,
  List,
  ListItem,
  Input,
  BlockTitle,
  Radio,
  Toggle,
  Searchbar,
  Preloader,
  Tab,
  Tabs,
  Toolbar,
  Link,
  Checkbox,
  Icon,
  Popover,
  Actions,
  ActionsGroup,
  ActionsButton,
  ActionsLabel,
  Sheet,
} from "framework7-react";
import { schoolService } from "../services/schoolService";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { isLocalhost, isSuperAdmin } from "../js/utils";
import { SUPABASE_CONFIG } from "../services/supabase";
import AdminManagementSection from "../components/AdminManagementSection";

// Helper function to get Supabase config and validate
const getSupabaseConfig = () => {
  const supabaseUrl = SUPABASE_CONFIG.URL;
  const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
    );
  }

  return { supabaseUrl, supabaseAnonKey };
};

const AdminManagementPage = () => {
  const authUser = useStore("authUser");
  const { isAdmin: isAdminStatus } = useAdminStatus();
  const isSuper = isSuperAdmin();
  const canManageRequests = isSuper || isLocalhost();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [deniedAdmins, setDeniedAdmins] = useState([]);
  const [schools, setSchools] = useState([]);
  const [activeTab, setActiveTab] = useState(
    canManageRequests ? "pending" : "school-admins"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState(""); // Fix: Move useState to component level
  const [popoverTarget, setPopoverTarget] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [tempSelectedSchools, setTempSelectedSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL || "";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get("tab");

    if (requestedTab === "school-admins") {
      setActiveTab("school-admins");
    } else if (requestedTab && canManageRequests) {
      setActiveTab(requestedTab);
    } else if (!canManageRequests) {
      setActiveTab("school-admins");
    }
  }, [canManageRequests]);

  useEffect(() => {
    if (!isSuper && !isAdminStatus) {
      setError("Access denied");
      setLoading(false);
      return;
    }

    const resolveSelectedSchool = async (allSchools) => {
      if (!currentSchoolId) {
        setSelectedSchool(null);
        return;
      }

      const matchedFromList = allSchools?.find(
        (school) => school.id === currentSchoolId
      );

      if (matchedFromList) {
        setSelectedSchool(matchedFromList);
        return;
      }

      const { data: schoolData } = await schoolService.getSchoolById(
        currentSchoolId
      );
      setSelectedSchool(schoolData || null);
    };

    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        let allSchools = [];

        if (canManageRequests) {
          // Access environment variables from centralized configuration
          const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

          // Make fetch request to Supabase REST API to get all admins
          const response = await fetch(
            `${supabaseUrl}/rest/v1/drv_admins?order=created_at.desc&select=*`,
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

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const allAdmins = await response.json();

          // Fetch all schools
          const { data: fetchedSchools, error: schoolsError } =
            await schoolService.getSchools();
          if (schoolsError) throw new Error(schoolsError.message);

          allSchools = fetchedSchools || [];

          setAdmins(allAdmins || []);
          setSchools(allSchools);

          // Categorize admins by status
          const pending =
            allAdmins?.filter((admin) => admin.status === "pending") || [];
          const approved =
            allAdmins?.filter((admin) => admin.status === "approved") || [];
          const denied =
            allAdmins?.filter((admin) => admin.status === "denied") || [];

          setPendingAdmins(pending);
          setApprovedAdmins(approved);
          setDeniedAdmins(denied);
        }

        await resolveSelectedSchool(allSchools);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [
    authUser,
    isAdminStatus,
    isSuper,
    canManageRequests,
    currentSchoolId,
  ]);

  const handleApprove = async (adminId, email) => {
    try {
      f7.preloader.show();

      // Access environment variables from centralized configuration
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

      // Make fetch request to Supabase REST API to update admin status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${adminId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "approved",
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedAdmin = await response.json();
      const adminData =
        Array.isArray(updatedAdmin) && updatedAdmin.length > 0
          ? updatedAdmin[0]
          : updatedAdmin;

      // Update local state
      const updatedPendingAdmins = pendingAdmins.filter(
        (admin) => admin.id !== adminId
      );
      setPendingAdmins(updatedPendingAdmins);

      setApprovedAdmins([...approvedAdmins, adminData]);

      f7.toast.show({
        text: `Admin access approved for ${email}`,
        position: "top",
      });
    } catch (error) {
      f7.toast.show({
        text: `Error approving admin: ${error.message}`,
        position: "top",
      });
    } finally {
      f7.preloader.hide();
    }
  };

  const handleDeny = async (adminId, email) => {
    try {
      f7.preloader.show();

      // Access environment variables from centralized configuration
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

      // Make fetch request to Supabase REST API to update admin status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${adminId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "denied",
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedAdmin = await response.json();
      const adminData =
        Array.isArray(updatedAdmin) && updatedAdmin.length > 0
          ? updatedAdmin[0]
          : updatedAdmin;

      // Update local state
      const updatedPendingAdmins = pendingAdmins.filter(
        (admin) => admin.id !== adminId
      );
      setPendingAdmins(updatedPendingAdmins);

      setDeniedAdmins([...deniedAdmins, adminData]);

      f7.toast.show({
        text: `Admin access denied for ${email}`,
        position: "top",
      });
    } catch (error) {
      f7.toast.show({
        text: `Error denying admin: ${error.message}`,
        position: "top",
      });
    } finally {
      f7.preloader.hide();
    }
  };

  const handleRevoke = async (adminId, email) => {
    try {
      f7.preloader.show();

      // Access environment variables from centralized configuration
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

      // Make fetch request to Supabase REST API to update admin status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${adminId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "pending",
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedAdmin = await response.json();
      const adminData =
        Array.isArray(updatedAdmin) && updatedAdmin.length > 0
          ? updatedAdmin[0]
          : updatedAdmin;

      // Update local state
      const updatedApprovedAdmins = approvedAdmins.filter(
        (admin) => admin.id !== adminId
      );
      setApprovedAdmins(updatedApprovedAdmins);

      setPendingAdmins([...pendingAdmins, adminData]);

      f7.toast.show({
        text: `Admin access revoked for ${email}`,
        position: "top",
      });
    } catch (error) {
      f7.toast.show({
        text: `Error revoking admin access: ${error.message}`,
        position: "top",
      });
    } finally {
      f7.preloader.hide();
    }
  };

  const handleDelete = async (adminId, email) => {
    // Confirm delete action first, before showing preloader
    f7.dialog.confirm(
      `Are you sure you want to delete admin access for ${email}?`,
      "Confirm Delete",
      async () => {
        try {
          f7.preloader.show();

          // Access environment variables from centralized configuration
          const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

          // Make fetch request to Supabase REST API to delete admin
          const response = await fetch(
            `${supabaseUrl}/rest/v1/drv_admins?id=eq.${adminId}`,
            {
              method: "DELETE",
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          // Update local state
          setPendingAdmins(
            pendingAdmins.filter((admin) => admin.id !== adminId)
          );
          setApprovedAdmins(
            approvedAdmins.filter((admin) => admin.id !== adminId)
          );
          setDeniedAdmins(deniedAdmins.filter((admin) => admin.id !== adminId));

          f7.toast.show({
            text: `Admin access deleted for ${email}`,
            position: "top",
          });
        } catch (error) {
          f7.toast.show({
            text: `Error deleting admin: ${error.message}`,
            position: "top",
          });
        } finally {
          f7.preloader.hide();
        }
      }
    );
  };

  const handleAddAdmin = async (email) => {
    try {
      f7.preloader.show();

      // Access environment variables from centralized configuration
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

      // Make fetch request to Supabase REST API to check if admin already exists
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(
          email
        )}&select=*`,
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

      if (!checkResponse.ok) {
        throw new Error(`HTTP error! Status: ${checkResponse.status}`);
      }

      const existingAdmins = await checkResponse.json();
      const existingAdmin =
        Array.isArray(existingAdmins) && existingAdmins.length > 0
          ? existingAdmins[0]
          : null;

      if (existingAdmin) {
        f7.toast.show({
          text: `Admin with email ${email} already exists`,
          position: "top",
        });
        return;
      }

      // Make fetch request to Supabase REST API to create new admin
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/drv_admins`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          email,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`HTTP error! Status: ${createResponse.status}`);
      }

      const newAdmin = await createResponse.json();
      const createdAdminData =
        Array.isArray(newAdmin) && newAdmin.length > 0 ? newAdmin[0] : newAdmin;

      // Update local state
      setPendingAdmins([...pendingAdmins, createdAdminData]);

      f7.toast.show({
        text: `Admin request added for ${email}`,
        position: "top",
      });
    } catch (error) {
      f7.toast.show({
        text: `Error adding admin: ${error.message}`,
        position: "top",
      });
    } finally {
      f7.preloader.hide();
    }
  };

  const handleUpdateSchools = async (adminId, schoolIds) => {
    try {
      f7.preloader.show();

      // Access environment variables from centralized configuration
      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

      // Make fetch request to Supabase REST API to update admin's school IDs
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${adminId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            school_ids: schoolIds,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedAdmin = await response.json();
      const adminData =
        Array.isArray(updatedAdmin) && updatedAdmin.length > 0
          ? updatedAdmin[0]
          : updatedAdmin;

      // Update local state
      const allAdmins = [...pendingAdmins, ...approvedAdmins, ...deniedAdmins];
      const updatedAllAdmins = allAdmins.map((admin) =>
        admin.id === adminId ? adminData : admin
      );

      // Re-categorize admins
      setPendingAdmins(
        updatedAllAdmins.filter((admin) => admin.status === "pending")
      );
      setApprovedAdmins(
        updatedAllAdmins.filter((admin) => admin.status === "approved")
      );
      setDeniedAdmins(
        updatedAllAdmins.filter((admin) => admin.status === "denied")
      );

      // Update selectedAdmin if it's the one being updated
      if (selectedAdmin && selectedAdmin.id === adminId) {
        setSelectedAdmin(adminData);
      }

      f7.toast.show({
        text: "Admin schools updated successfully",
        position: "top",
      });
    } catch (error) {
      f7.toast.show({
        text: `Error updating admin schools: ${error.message}`,
        position: "top",
      });
    } finally {
      f7.preloader.hide();
    }
  };

  const filteredAdmins = (list) => {
    if (!searchTerm) return list;
    return list.filter((admin) =>
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAdminClick = (admin, e) => {
    setSelectedAdmin(admin);
    setPopoverTarget(e.target);
  };

  const handleManageSchools = () => {
    // Initialize temp selected schools with admin's current schools
    if (selectedAdmin) {
      setTempSelectedSchools(selectedAdmin.school_ids || []);
    }
    setShowSchoolSheet(true);
  };

  const handleSchoolToggle = (schoolId) => {
    setTempSelectedSchools((prev) => {
      if (prev.includes(schoolId)) {
        return prev.filter((id) => id !== schoolId);
      } else {
        return [...prev, schoolId];
      }
    });
  };

  const renderAdminList = (adminsList) => {
    if (!adminsList || adminsList.length === 0) {
      return (
        <Block strong>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "100px" }}
          >
            <p className="text-align-center">No admins found</p>
          </div>
        </Block>
      );
    }

    return (
      <List mediaList>
        {filteredAdmins(adminsList).map((admin) => (
          <ListItem
            key={admin.id}
            link="#"
            onClick={(e) => handleAdminClick(admin, e)}
            popoverOpen="#admin-actions-popover"
          >
            <div slot="title" style={{ fontWeight: "bold" }}>
              {admin.email}
            </div>
            <div slot="after">
              <span
                style={{
                  fontSize: "12px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor:
                    admin.status === "approved"
                      ? "#4CAF50"
                      : admin.status === "pending"
                      ? "#FF9800"
                      : "#F44336",
                  color: "white",
                }}
              >
                {admin.status}
              </span>
            </div>
            <div slot="footer">
              <span style={{ fontSize: "12px", color: "#888" }}>
                {admin.school_ids?.length || 0} school(s) assigned
              </span>
            </div>
          </ListItem>
        ))}
      </List>
    );
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Admin Management" />
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <Preloader size="24" />
          </div>
        </Block>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Navbar title="Admin Management" backLink="Back" />
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div style={{ textAlign: "center", color: "red" }}>
              <p>{error}</p>
            </div>
          </div>
        </Block>
      </Page>
    );
  }

  if (!isSuper && !isAdminStatus) {
    return (
      <Page>
        <Navbar title="Admin Management" backLink="Back" />
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div style={{ textAlign: "center" }}>
              <p>Access denied</p>
            </div>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title="Admin Management" backLink="Back"></Navbar>
      {canManageRequests && activeTab !== "school-admins" && (
        <Searchbar
          slot="subnavbar"
          placeholder="Search admins..."
          value={searchTerm}
          onInput={(e) => setSearchTerm(e.target.value)}
          clearButton
        />
      )}

      {/* Tab Navigation using Framework7 Toolbar */}
      <Toolbar tabbar bottom>
        {canManageRequests && (
          <>
            <Link
              tabLink="#pending"
              tabLinkActive={activeTab === "pending"}
              onClick={() => setActiveTab("pending")}
              style={{
                flex: 1,
                textAlign: "center",
                color:
                  activeTab === "pending"
                    ? "var(--f7-theme-color, #007aff)"
                    : "#8e8e93",
                fontWeight: activeTab === "pending" ? "bold" : "normal",
              }}
            >
              Pending ({pendingAdmins.length})
            </Link>
            <Link
              tabLink="#approved"
              tabLinkActive={activeTab === "approved"}
              onClick={() => setActiveTab("approved")}
              style={{
                flex: 1,
                textAlign: "center",
                color:
                  activeTab === "approved"
                    ? "var(--f7-theme-color, #007aff)"
                    : "#8e8e93",
                fontWeight: activeTab === "approved" ? "bold" : "normal",
              }}
            >
              Approved ({approvedAdmins.length})
            </Link>
            <Link
              tabLink="#denied"
              tabLinkActive={activeTab === "denied"}
              onClick={() => setActiveTab("denied")}
              style={{
                flex: 1,
                textAlign: "center",
                color:
                  activeTab === "denied"
                    ? "var(--f7-theme-color, #007aff)"
                    : "#8e8e93",
                fontWeight: activeTab === "denied" ? "bold" : "normal",
              }}
            >
              Denied ({deniedAdmins.length})
            </Link>
          </>
        )}
        <Link
          tabLink="#school-admins"
          tabLinkActive={activeTab === "school-admins"}
          onClick={() => setActiveTab("school-admins")}
          style={{
            flex: 1,
            textAlign: "center",
            color:
              activeTab === "school-admins"
                ? "var(--f7-theme-color, #007aff)"
                : "#8e8e93",
            fontWeight: activeTab === "school-admins" ? "bold" : "normal",
          }}
        >
          School Admins
        </Link>
      </Toolbar>

      {/* Tab Content with Framework7 Tabs */}
      <Tabs>
        {canManageRequests && (
          <>
            <Tab id="pending" tabActive={activeTab === "pending"}>
              <Block strong>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>Pending Requests ({pendingAdmins.length})</h3>
                </div>
                {renderAdminList(pendingAdmins)}
              </Block>
            </Tab>

            <Tab id="approved" tabActive={activeTab === "approved"}>
              <Block strong>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>Approved Admins ({approvedAdmins.length})</h3>
                </div>
                {renderAdminList(approvedAdmins)}
              </Block>
            </Tab>

            <Tab id="denied" tabActive={activeTab === "denied"}>
              <Block strong>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>Denied Access ({deniedAdmins.length})</h3>
                </div>
                {renderAdminList(deniedAdmins)}
              </Block>
            </Tab>
          </>
        )}

        <Tab id="school-admins" tabActive={activeTab === "school-admins"}>
          <AdminManagementSection selectedSchool={selectedSchool} />
        </Tab>
      </Tabs>

      {canManageRequests && (
        <>
          {/* Actions Popover for Admin Management */}
          <Popover
            id="admin-actions-popover"
            opened={!!popoverTarget}
            target={popoverTarget}
            onPopoverClosed={() => setPopoverTarget(null)}
          >
            <List>
              {selectedAdmin && (
                <>
                  <ListItem
                    popoverClose
                    link="#"
                    onClick={handleManageSchools}
                    title="Manage Schools"
                  >
                    <Icon f7="building_2" slot="media" />
                  </ListItem>

                  {selectedAdmin.status === "pending" && (
                    <>
                      <ListItem
                        popoverClose
                        link="#"
                        onClick={() => {
                          handleApprove(selectedAdmin.id, selectedAdmin.email);
                          f7.popover.close();
                        }}
                        title="Approve"
                      >
                        <Icon
                          f7="check_circle_fill"
                          slot="media"
                          color="green"
                        />
                      </ListItem>
                      <ListItem
                        popoverClose
                        link="#"
                        onClick={() => {
                          handleDeny(selectedAdmin.id, selectedAdmin.email);
                          f7.popover.close();
                        }}
                        title="Deny"
                      >
                        <Icon
                          f7="xmark_circle_fill"
                          slot="media"
                          color="red"
                        />
                      </ListItem>
                    </>
                  )}

                  {selectedAdmin.status === "approved" && (
                    <ListItem
                      popoverClose
                      link="#"
                      onClick={() => {
                        handleRevoke(selectedAdmin.id, selectedAdmin.email);
                        f7.popover.close();
                      }}
                      title="Revoke Access"
                    >
                      <Icon
                        f7="hand_raised_fill"
                        slot="media"
                        color="orange"
                      />
                    </ListItem>
                  )}

                  <ListItem
                    popoverClose
                    link="#"
                    onClick={() => {
                      handleDelete(selectedAdmin.id, selectedAdmin.email);
                      f7.popover.close();
                    }}
                    title="Delete"
                  >
                    <Icon f7="trash_fill" slot="media" color="red" />
                  </ListItem>

                  <ListItem popoverClose link="#" title="Close">
                    <Icon f7="xmark" slot="media" />
                  </ListItem>
                </>
              )}
            </List>
          </Popover>

          {/* School Management Sheet */}
          <Sheet
            opened={showSchoolSheet}
            onSheetClosed={() => setShowSchoolSheet(false)}
            swipeToClose
            backdrop
          >
            <Page>
              <Toolbar>
                <div className="left">
                  <Link sheetClose>Close</Link>
                </div>
                <div className="right">
                  <Link
                    onClick={async () => {
                      if (selectedAdmin) {
                        await handleUpdateSchools(
                          selectedAdmin.id,
                          tempSelectedSchools
                        );
                        setShowSchoolSheet(false);
                      }
                    }}
                  >
                    Save
                  </Link>
                </div>
              </Toolbar>
              <Block>
                {selectedAdmin && (
                  <>
                    <BlockTitle>
                      Manage School Access for {selectedAdmin.email}
                    </BlockTitle>
                    <List>
                      {schools.map((school) => (
                        <ListItem
                          key={school.id}
                          checkbox
                          title={school.name}
                          name="schools"
                          value={school.id}
                          checked={tempSelectedSchools.includes(school.id)}
                          onChange={() => handleSchoolToggle(school.id)}
                        />
                      ))}
                    </List>
                  </>
                )}
              </Block>
              <br />
              <br />
              <br />
            </Page>
          </Sheet>
        </>
      )}
    </Page>
  );
};

export default AdminManagementPage;
