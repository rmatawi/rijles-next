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
} from "framework7-react";
import { schoolService } from "../services/schoolService";
import { adminService } from "../services/adminService";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { isSuperAdmin } from "../js/utils";
import useAppNavigation from "../hooks/useAppNavigation";

const AdminAccessPage = () => {
  const { navigate } = useAppNavigation();
  const authUser = useStore("authUser");
  const [user, setUser] = useState(null);
  const [targetEmail, setTargetEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check admin status using authUser properties instead of isAdmin() utility
  const { isAdmin: isAdminStatus } = useAdminStatus();

  useEffect(() => {
    const checkAdminAndParams = async () => {
      try {
        setLoading(true);

        // Get current user from the auth store, which should already have the user info
        if (!authUser || !authUser.email) {
          setError("Please sign in to access this page.");
          setLoading(false);
          return;
        }

        setUser(authUser);

        // Check if current user is a super admin
        if (!isSuperAdmin(authUser.email)) {
          setError(
            "Access denied. Only super admins can access this page."
          );
          setLoading(false);
          return;
        }

        // setIsAdmin(true); // Removed since we now use centralized isAdmin() function

        // Get email parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");

        if (!emailParam) {
          setError("No email parameter provided in URL.");
          setLoading(false);
          return;
        }

        setTargetEmail(emailParam);

        // School name is now handled by background configuration (VITE_REACT_APP_DEFAULTSCHOOL)
        const defaultSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        if (defaultSchoolId) {
          try {
            const { data: school } = await schoolService.getSchoolById(defaultSchoolId);
            if (school) {
              setSchoolName(school.name);
            }
          } catch (err) {
            console.error("Error fetching default school name:", err);
          }
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        setError("An error occurred while checking access.");
      } finally {
        setLoading(false);
      }
    };

    if (isAdminStatus) {
      checkAdminAndParams();
    }
  }, [authUser, isAdminStatus]);

  const handleApprove = async () => {
    if (!targetEmail) {
      f7.toast.show({
        text: "No target email to approve",
        position: "top",
      });
      return;
    }

    try {
      // Use school name from component state
      const schoolNameToUse = schoolName;

      // Find or create admin record using adminService
      let adminRecord;
      const { data: existingAdmin, error: fetchError } =
        await adminService.getAdminByEmail(targetEmail);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!existingAdmin) {
        // Record doesn't exist
        // Add new record with status "approved"
        const { data: newAdmin, error: insertError } =
          await adminService.createAdmin({
            email: targetEmail,
            status: "approved",
            created_at: new Date(),
            updated_at: new Date(),
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
        adminRecord = newAdmin;
      } else {
        // Update existing record's status to "approved" using adminService
        // First get the admin ID since we're updating by ID
        const adminForUpdate = existingAdmin;
        const { data: updatedAdmin, error: updateError } =
          await adminService.updateAdmin(adminForUpdate.id, {
            status: "approved",
            updated_at: new Date(),
          });

        if (updateError) {
          throw new Error(updateError.message);
        }
        adminRecord = updatedAdmin;
      }

      // If school name exists, find or create school record
      let schoolId = null;
      if (schoolNameToUse) {
        const { data: existingSchool, error: schoolFetchError } =
          await schoolService.getSchoolByName(schoolNameToUse);

        if (schoolFetchError) {
          throw new Error(schoolFetchError.message);
        }

        if (!existingSchool) {
          // Record doesn't exist
          // Add new school record with admin_id user email
          const { data: newSchool, error: createError } =
            await schoolService.createSchool({
              name: schoolNameToUse,
              admin_id: adminRecord.id, // Store the admin record ID
              created_at: new Date(),
              updated_at: new Date(),
            });

          if (createError) {
            throw new Error(createError.message);
          }
          schoolId = newSchool.id;
        } else {
          schoolId = existingSchool.id; // Use existing school ID
        }
      }

      // If we have a school ID, update the admin record's school_ids array
      if (schoolId) {
        // Update the admin record to include the new school ID in school_ids array
        // First, get the current admin record to check existing school_ids using adminService
        const { data: currentAdmin, error: getCurrentError } =
          await adminService.getAdminByEmail(targetEmail);

        if (getCurrentError) {
          throw new Error(getCurrentError.message);
        }

        // Create updated school_ids array
        const currentSchoolIds = currentAdmin.school_ids || [];
        const updatedSchoolIds = [...currentSchoolIds, schoolId];

        // Remove duplicates
        const uniqueSchoolIds = [...new Set(updatedSchoolIds)];

        // Update admin record with the new school_ids array
        // Update admin record using adminService - first get the admin ID
        const adminToUpdate = await adminService.getAdminByEmail(targetEmail);
        if (adminToUpdate.error) {
          throw new Error(adminToUpdate.error.message);
        }

        const { data: updatedAdminRecord, error: updateAdminError } =
          await adminService.updateAdmin(adminToUpdate.data.id, {
            school_ids: uniqueSchoolIds,
            updated_at: new Date(),
          });

        if (updateAdminError) {
          throw new Error(updateAdminError.message);
        }
      }

      // Refresh admin status in store after approval
      // Note: In a real implementation, we would call the centralized checkAdminStatus function
      // in app.jsx, but for now we're just reading from the store directly
      console.log(
        "Admin access approved - admin status should be updated by centralized function"
      );

      f7.toast.show({
        text: "Admin access approved successfully!",
        position: "top",
      });

      // Show success dialog with OK button that redirects to home page
      f7.dialog
        .create({
          title: "Success",
          text: "Admin access has been approved successfully!",
          buttons: [
            {
              text: "OK",
              color: "blue",
              onClick: () => {
                navigate("/", { reloadAll: true });
              },
            },
          ],
        })
        .open();
    } catch (error) {
      f7.preloader.hide();
      f7.toast.show({
        text: `Error approving admin access: ${error.message}`,
        position: "top",
      });
    }
  };

  const handleDeny = async () => {
    if (!targetEmail) {
      f7.toast.show({
        text: "No target email to deny",
        position: "top",
      });
      return;
    }

    try {
      // Update the admin status to denied using adminService
      const adminToUpdate = await adminService.getAdminByEmail(targetEmail);
      if (adminToUpdate.error) {
        throw new Error(adminToUpdate.error.message);
      }

      const { data, error } = await adminService.updateAdmin(
        adminToUpdate.data.id,
        {
          status: "denied",
          updated_at: new Date(),
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Refresh admin status in store after denial
      // Note: In a real implementation, we would call the centralized checkAdminStatus function
      // in app.jsx, but for now we're just reading from the store directly
      console.log(
        "Admin access denied - admin status should be updated by centralized function"
      );

      f7.toast.show({
        text: "Admin access denied!",
        position: "top",
      });

      // Wait a moment before redirecting
      setTimeout(() => {
        navigate("/admin-profile", {
          reloadAll: true,
        });
      }, 1500);
    } catch (error) {
      f7.toast.show({
        text: `Error denying admin access: ${error.message}`,
        position: "top",
      });
    }
  };

  if (loading) {
    return (
      <Page>
        <Navbar title="Admin Access" />
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

  if (error) {
    return (
      <Page>
        <Navbar title="Admin Access" backLink="Back" />
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

  if (!isAdminStatus) {
    return (
      <Page>
        <Navbar title="Admin Access" backLink="Back" />
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
      <Navbar title="Admin Access Approval" backLink="Back" />

      <Block style={{ padding: "20px" }}>
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <h3>Admin Access Approval</h3>

              <p>
                <strong>Requesting User:</strong> {targetEmail}
              </p>

              {schoolName && (
                <p>
                  <strong>School:</strong> {schoolName}
                </p>
              )}

              <div style={{ marginTop: "20px" }}>
                <p>Do you want to approve admin access for this user?</p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <Button fill large color="green" onClick={handleApprove}>
                    Approve Access
                  </Button>

                  <Button fill large color="red" onClick={handleDeny}>
                    Deny Access
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default AdminAccessPage;
