// src/components/AdminRequestPage.jsx
import React, { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Card,
  CardContent,
  Button,
  f7,
  Icon,
  List,
  ListItem,
  ListInput,
} from "framework7-react";
import {
  supabase,
  authService,
  adminService,
  schoolService,
} from "../services";
import { useI18n } from "../i18n/i18n";
import { isSuperAdmin } from "../js/utils";
import useAppNavigation from "../hooks/useAppNavigation";

const AdminRequestPage = ({ f7route }) => {
  const { t } = useI18n();
  const { navigate, back } = useAppNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    name: "",
  });
  const [requestingUser, setRequestingUser] = useState(null);
  const [schools, setSchools] = useState([]); // For regular users to choose a school
  const [selectedSchoolId, setSelectedSchoolId] = useState(""); // Selected school for regular users

  // If f7route is not available, use window.location for query parameters
  const getQueryParams = () => {
    if (f7route && f7route.query) {
      return f7route.query;
    }
    // Fallback to URLSearchParams
    return Object.fromEntries(new URLSearchParams(window.location.search));
  };

  // Check if user is authenticated and has access
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user: currentUser, error: userError } =
          await authService.getCurrentUser();

        if (userError) {
          console.error("Error getting user:", userError);
          // Removed automatic redirect to auth page
          return;
        }

        if (!currentUser) {
          // Removed automatic redirect to auth page
          console.log("No current user - no automatic redirect to auth");
          return;
        }

        setUser(currentUser);

        // Get email from query parameter for regular users requesting admin access
        const queryParams = getQueryParams();
        const emailParam = queryParams.email;

        // Check if user is a super admin
        if (isSuperAdmin(currentUser.email)) {
          setIsAdmin(true);
          try {
            await fetchAdminRequests();
          } catch (fetchError) {
            console.error("Error fetching admin requests:", fetchError);
            // Still set loading to false even if fetch fails
          }

          // If there's an email parameter, pre-fill the create admin form
          if (emailParam) {
            setNewAdminData((prev) => ({ ...prev, email: emailParam }));
          }
        } else {
          // Regular user requesting admin access
          setRequestingUser({
            email: currentUser.email,
            name:
              currentUser.user_metadata?.name ||
              currentUser.email.split("@")[0],
          });

          // If this is the user requesting access, pre-fill their info
          if (emailParam && emailParam === currentUser.email) {
            setNewAdminData({
              email: currentUser.email,
              name:
                currentUser.user_metadata?.name ||
                currentUser.email.split("@")[0],
            });
          }

          // Check if user has already submitted a request
          try {
            const { data: existingRequests, error: requestsError } =
              await adminService.getAdminRequests();

            if (!requestsError && existingRequests) {
              // Check if there's a pending request for this user's email
              const existingRequest = existingRequests.find(
                (request) => request.email === currentUser.email
              );

              if (existingRequest) {
                // User has already submitted a request 
                console.log("User already submitted request - no automatic redirect");
                return;
              }
            }
          } catch (error) {
            console.error("Error checking existing requests:", error);
          }

          // Fetch all schools for regular users to choose from
          try {
            const { data: schoolsData, error: schoolsError } =
              await schoolService.getSchools();
            if (!schoolsError && schoolsData) {
              setSchools(schoolsData);
            }
          } catch (error) {
            console.error("Error fetching schools:", error);
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchAdminRequests = async () => {
    try {
      const { data, error } = await adminService.getAdminRequests();
      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === "42P01") {
          f7.toast.show({
            text: "Admin requests feature not yet available in database",
            position: "center",
            closeTimeout: 3000,
          });
          // Use mock data when table doesn't exist
          const mockRequests = [
            {
              id: 1,
              email: "user1@example.com",
              name: "John Doe",
              status: "pending",
              created_at: "2023-05-15T10:30:00Z",
            },
            {
              id: 2,
              email: "user2@example.com",
              name: "Jane Smith",
              status: "approved",
              created_at: "2023-05-10T14:20:00Z",
            },
            {
              id: 3,
              email: "user3@example.com",
              name: "Bob Johnson",
              status: "rejected",
              created_at: "2023-05-05T09:15:00Z",
            },
          ];
          setRequests(mockRequests);
          return;
        } else {
          throw new Error(error.message);
        }
      }

      // Use mock data if no data
      const mockRequests = [
        {
          id: 1,
          email: "user1@example.com",
          name: "John Doe",
          status: "pending",
          created_at: "2023-05-15T10:30:00Z",
        },
        {
          id: 2,
          email: "user2@example.com",
          name: "Jane Smith",
          status: "approved",
          created_at: "2023-05-10T14:20:00Z",
        },
        {
          id: 3,
          email: "user3@example.com",
          name: "Bob Johnson",
          status: "rejected",
          created_at: "2023-05-05T09:15:00Z",
        },
      ];
      setRequests(data || mockRequests);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      f7.toast.show({
        text: "Error fetching admin requests: " + error.message,
      });

      // Fallback to mock data
      const mockRequests = [
        {
          id: 1,
          email: "user1@example.com",
          name: "John Doe",
          status: "pending",
          created_at: "2023-05-15T10:30:00Z",
        },
        {
          id: 2,
          email: "user2@example.com",
          name: "Jane Smith",
          status: "approved",
          created_at: "2023-05-10T14:20:00Z",
        },
        {
          id: 3,
          email: "user3@example.com",
          name: "Bob Johnson",
          status: "rejected",
          created_at: "2023-05-05T09:15:00Z",
        },
      ];
      setRequests(mockRequests);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {

      // Find the request
      const request = requests.find((req) => req.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // First check if admin already exists
      const { data: existingAdmin, error: fetchError } =
        await adminService.getAdminByEmail(request.email);

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is expected if admin doesn't exist
        // Check if it's a "table doesn't exist" error
        if (fetchError.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          return;
        } else {
          throw new Error(fetchError.message);
        }
      }

      // If admin already exists, just update the request status
      if (existingAdmin) {
        // Update request status
        const { data: updatedRequest, error: updateError } =
          await adminService.updateAdminRequestStatus(requestId, "approved");
        if (updateError) {
          // Check if it's a "table doesn't exist" error
          if (updateError.code === "42P01") {
            f7.preloader.hide();
            f7.toast.show({
              text: "Database feature not yet available. Please contact support.",
              position: "center",
              closeTimeout: 5000,
            });
            // Still update local state to show approval
            setRequests(
              requests.map((req) =>
                req.id === requestId ? { ...req, status: "approved" } : req
              )
            );
            return;
          } else {
            throw new Error(updateError.message);
          }
        }

        // Update local state
        setRequests(
          requests.map((req) =>
            req.id === requestId
              ? updatedRequest || { ...req, status: "approved" }
              : req
          )
        );

        f7.toast.show({ text: "Request approved successfully" });
        return;
      }

      // Create admin record in the database
      const { data: adminData, error: adminError } =
        await adminService.createAdmin({
          email: request.email,
          name: request.name,
          // Add other fields as needed
        });

      if (adminError) {
        // Check if it's a "table doesn't exist" error
        if (adminError.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          return;
        } else {
          throw new Error(adminError.message);
        }
      }

      // If the request has a school_id, link the admin to that school
      if (request.school_id) {
        try {
          // Update the school to set this admin as its admin
          const { error: schoolUpdateError } = await schoolService.updateSchool(
            request.school_id,
            { admin_id: adminData.id }
          );

          if (schoolUpdateError) {
            console.error("Error linking admin to school:", schoolUpdateError);
            // Don't fail the whole process if school linking fails, just log it
            f7.toast.show({
              text: "Admin created but failed to link to school. Please link manually.",
              position: "center",
              closeTimeout: 3000,
            });
          }
        } catch (schoolError) {
          console.error("Error linking admin to school:", schoolError);
          // Don't fail the whole process if school linking fails, just log it
          f7.toast.show({
            text: "Admin created but failed to link to school. Please link manually.",
            position: "center",
            closeTimeout: 3000,
          });
        }
      }

      // Update request status
      const { data: updatedRequest, error: updateError } =
        await adminService.updateAdminRequestStatus(requestId, "approved");
      if (updateError) {
        // Check if it's a "table doesn't exist" error
        if (updateError.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          // Still update local state to show approval
          setRequests(
            requests.map((req) =>
              req.id === requestId ? { ...req, status: "approved" } : req
            )
          );
          return;
        } else {
          throw new Error(updateError.message);
        }
      }

      // Update local state
      setRequests(
        requests.map((req) =>
          req.id === requestId
            ? updatedRequest || { ...req, status: "approved" }
            : req
        )
      );

      f7.preloader.hide();
      f7.toast.show({ text: "Request approved successfully" });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error approving request:", error);
      f7.toast.show({ text: "Error approving request: " + error.message });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {

      // Update request status in the database
      const { data, error } = await adminService.updateAdminRequestStatus(
        requestId,
        "rejected"
      );
      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          // Still update local state to show rejection
          setRequests(
            requests.map((req) =>
              req.id === requestId ? { ...req, status: "rejected" } : req
            )
          );
          return;
        } else {
          throw new Error(error.message);
        }
      }

      // Update local state
      setRequests(
        requests.map((req) =>
          req.id === requestId ? data || { ...req, status: "rejected" } : req
        )
      );

      f7.preloader.hide();
      f7.toast.show({ text: "Request rejected" });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error rejecting request:", error);
      f7.toast.show({ text: "Error rejecting request: " + error.message });
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminData.email || !newAdminData.name) {
      f7.toast.show({ text: "Please fill in all fields" });
      return;
    }

    try {

      // First check if admin already exists
      const { data: existingAdmin, error: fetchError } =
        await adminService.getAdminByEmail(newAdminData.email);

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is expected if admin doesn't exist
        // Check if it's a "table doesn't exist" error
        if (fetchError.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          return;
        } else {
          throw new Error(fetchError.message);
        }
      }

      // If admin already exists, show a message and return
      if (existingAdmin) {
        f7.preloader.hide();
        f7.toast.show({ text: "Admin already exists" });
        return;
      }

      // Create admin record in the database
      const { data: adminData, error: adminError } =
        await adminService.createAdmin({
          email: newAdminData.email,
          name: newAdminData.name,
          // Add other fields as needed
        });

      if (adminError) {
        // Check if it's a "table doesn't exist" error
        if (adminError.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Database feature not yet available. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          return;
        } else {
          throw new Error(adminError.message);
        }
      }

      // Add to local state
      const newRequest = {
        id: adminData?.id || Date.now(),
        email: newAdminData.email,
        name: newAdminData.name,
        status: "approved",
        created_at: new Date().toISOString(),
      };

      setRequests([newRequest, ...requests]);
      setNewAdminData({ email: "", name: "" });

      f7.preloader.hide();
      f7.toast.show({ text: "Admin created successfully" });
    } catch (error) {
      f7.preloader.hide();
      console.error("Error creating admin:", error);
      f7.toast.show({ text: "Error creating admin: " + error.message });
    }
  };

  const handleRequestAdminAccess = async () => {
    if (!requestingUser) {
      f7.toast.show({ text: "Unable to request admin access" });
      return;
    }

    // Check if a school is selected (required for regular users)
    if (!selectedSchoolId) {
      f7.toast.show({ text: "Please select a driving school" });
      return;
    }

    try {

      // Save request to database with school information
      const { data, error } = await adminService.createAdminRequest({
        email: requestingUser.email,
        name: requestingUser.name,
        status: "pending",
        school_id: selectedSchoolId, // Include the selected school ID
      });

      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === "42P01") {
          f7.preloader.hide();
          f7.toast.show({
            text: "Admin requests feature not yet available in database. Please contact support.",
            position: "center",
            closeTimeout: 5000,
          });
          return;
        } else {
          throw new Error(error.message);
        }
      }

      f7.preloader.hide();
      f7.toast.show({
        text: "Admin access request submitted. The admin will review your request.",
      });

      // Note: For the user requesting access, we don't need to update the requests list
      // as they don't see it. The admin will see the new request when they refresh the page.
    } catch (error) {
      f7.preloader.hide();
      console.error("Error requesting admin access:", error);
      f7.toast.show({
        text: "Error requesting admin access: " + error.message,
      });
    }
  };

  const handleBack = () => {
    back();
  };

  if (loading) {
    return (
      <Page>
        <Navbar title={t('admin.adminRequestManagement')} backLink="Back" />
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div className="preloader"></div>
          </div>
        </Block>
      </Page>
    );
  }

  // If user is a super admin, show admin management interface
  if (user && isSuperAdmin(user.email)) {
    return (
      <Page>
        <Navbar title={t('admin.adminRequestManagement')} backLink="Back" />

        <Block style={{ margin: "16px" }}>
          <Card>
            <CardContent>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Icon
                  f7="person_badge_shield"
                  size="60"
                  color="blue"
                  style={{ marginBottom: "20px" }}
                />
                <h2>{t('admin.adminRequestManagement')}</h2>
                <p>{t('admin.manageAdminRequests')}</p>
              </div>
            </CardContent>
          </Card>
        </Block>

        {/* Create New Admin */}
        <BlockTitle style={{ margin: "16px 16px 8px" }}>
          {t('admin.directlyCreateNewAdmin')}
        </BlockTitle>
        <List noHairlinesMd style={{ margin: "0 16px 16px" }}>
          <ListInput
            outline
            label="Name"
            type="text"
            placeholder="Enter admin name"
            value={newAdminData.name}
            onInput={(e) =>
              setNewAdminData({ ...newAdminData, name: e.target.value })
            }
          />
          <ListInput
            outline
            label="Email"
            type="email"
            placeholder="Enter admin email"
            value={newAdminData.email}
            onInput={(e) =>
              setNewAdminData({ ...newAdminData, email: e.target.value })
            }
          />
        </List>
        <Block style={{ margin: "0 16px 16px" }}>
          <Button fill large color="blue" onClick={handleCreateAdmin}>
            <Icon f7="person_badge_plus" slot="start" />
            Create Admin Directly
          </Button>
        </Block>

        {/* Admin Requests */}
        <BlockTitle style={{ margin: "16px 16px 8px" }}>
          Admin Requests
        </BlockTitle>

        {requests.length === 0 ? (
          <Block style={{ margin: "16px", textAlign: "center" }}>
            <Icon
              f7="person_crop_circle_badge_questionmark"
              size="60"
              color="gray"
              style={{ marginBottom: "20px" }}
            />
            <p>{t('admin.noRequests')}</p>
          </Block>
        ) : (
          <List style={{ margin: "0 16px 16px" }}>
            {requests.map((request) => (
              <ListItem key={request.id} noChevron>
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold" }}>{request.name}</div>
                      <div style={{ fontSize: "14px", color: "var(--color-gray-text)" }}>
                        {request.email}
                      </div>
                    </div>
                    <div>
                      {request.status === "pending" && (
                        <span
                          style={{
                            backgroundColor: "var(--color-orange-accent)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          Pending
                        </span>
                      )}
                      {request.status === "approved" && (
                        <span
                          style={{
                            backgroundColor: "var(--color-green-accent)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          Approved
                        </span>
                      )}
                      {request.status === "rejected" && (
                        <span
                          style={{
                            backgroundColor: "var(--color-red-accent)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      Requested:{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        small
                        fill
                        color="green"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        small
                        color="red"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        )}
      </Page>
    );
  }

  // If user is requesting admin access
  if (requestingUser) {
    return (
      <Page>
        <Navbar title="Request Admin Access" backLink="Back" />

        <Block style={{ margin: "16px" }}>
          <Card>
            <CardContent>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Icon
                  f7="person_badge_shield"
                  size="60"
                  color="blue"
                  style={{ marginBottom: "20px" }}
                />
                <h2>Request Admin Access</h2>
                <p>
                  Submit a request to become an admin. Select a driving school
                  you want to manage.
                </p>
              </div>
            </CardContent>
          </Card>
        </Block>

        <List noHairlinesMd style={{ margin: "16px" }}>
          <ListInput
            outline
            label="Name"
            type="text"
            placeholder="Your name"
            value={newAdminData.name}
            onInput={(e) =>
              setNewAdminData({ ...newAdminData, name: e.target.value })
            }
          />
          <ListInput
            outline
            label="Email"
            type="email"
            placeholder="Your email"
            value={newAdminData.email}
            onInput={(e) =>
              setNewAdminData({ ...newAdminData, email: e.target.value })
            }
            disabled
          />
          <ListInput
            outline
            label="Driving School"
            type="select"
            placeholder="Select a school"
            value={selectedSchoolId}
            onInput={(e) => setSelectedSchoolId(e.target.value)}
          >
            <option value="">Select a driving school...</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </ListInput>
        </List>

        <Block style={{ margin: "16px" }}>
          <Button fill large color="blue" onClick={handleRequestAdminAccess}>
            <Icon f7="paperplane" slot="start" />
            Submit Request
          </Button>
        </Block>

        <Block style={{ margin: "16px" }}>
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
                  After submitting your request, the system administrator
                  will review it and either approve or
                  deny your request. You will be notified of the decision.
                </p>
              </div>
            </CardContent>
          </Card>
        </Block>
      </Page>
    );
  }

  // If user is not authenticated or not authorized
  return (
    <Page>
      <Navbar title={t('admin.adminRequestManagement')} backLink="Back" />
      <Block style={{ margin: "16px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon
                f7="person_slash"
                size="60"
                color="red"
                style={{ marginBottom: "20px" }}
              />
              <h2>{t('errors.accessDenied')}</h2>
              <p>{t('admin.noPermission')}</p>
              <Button fill large color="blue" onClick={handleBack}>
                <Icon f7="arrow_left" slot="start" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default AdminRequestPage;
