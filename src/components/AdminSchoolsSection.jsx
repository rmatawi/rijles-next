import { useEffect, useState } from "react";
import {
  Block,
  BlockTitle,
  List,
  ListItem,
  Button,
  Icon,
  f7,
  Popover,
  useStore,
} from "framework7-react";
import { schoolService } from "../services/schoolService";
import { SUPABASE_CONFIG } from "../services/supabase";
import { isUserAdmin, isSuperAdmin } from "../js/utils";
import { useI18n } from "../i18n/i18n";

const AdminSchoolsSection = ({
  user,
  allSchools: allSchoolsProp,
  setEditingSchool,
  setShowCreateSchoolForm,
  setSelectedSchoolForStudents,
  fetchStudents,
  popoverTarget,
  setPopoverTarget,
  selectedSchool,
  setSelectedSchool,
  profile,
  setProfile,
  onSchoolSelected,
  handleDeleteSchool,
}) => {
  const { t } = useI18n();
  const authUser = useStore("authUser");
  const isDefaultAdmin = user && isSuperAdmin(user.email);
  const [allSchools, setAllSchools] = useState(allSchoolsProp || []);
  const [assignedSchools, setAssignedSchools] = useState([]);
  const [viewOtherSchools, setViewOtherSchools] = useState(false);

  useEffect(() => {
    fetchSchoolsData();
  }, [
    authUser?.id,
    authUser?.isAdmin,
    authUser?.admin_status,
    authUser?.email,
    allSchoolsProp, // Refresh when parent's allSchools prop changes
  ]);

  // Add additional effect to sync with allSchoolsProp when it changes
  useEffect(() => {
    if (allSchoolsProp) {
      setAllSchools(allSchoolsProp);
    }
  }, [allSchoolsProp]);

  const fetchSchoolsData = async () => {
    // Check admin status using authUser properties instead of isAdmin() utility
    const localCanAccessAssignedSchools = isUserAdmin(authUser);

    // Fetch schools from props if available, otherwise fetch from service
    if (allSchoolsProp && allSchoolsProp.length > 0) {
      setAllSchools(allSchoolsProp);
    } else {
      const { data: allData, error: allError } =
        await schoolService.getSchools();
      if (allError) {
        console.error("Error fetching all schools:", allError);
        f7.toast.show({
          text: "Error fetching schools: " + allError.message,
          position: "top",
        });
      } else {
        setAllSchools(allData || []);
      }
    }

    // Fetch assigned schools for approved admins
    if (localCanAccessAssignedSchools && authUser?.schoolIds?.length > 0) {
      const { data: assignedData, error: assignedError } =
        await schoolService.getSchoolsByIds(authUser.schoolIds);
      if (assignedError) {
        console.error("Error fetching assigned schools:", assignedError);
        f7.toast.show({
          text: "Error fetching assigned schools: " + assignedError.message,
          position: "top",
        });
      } else {
        setAssignedSchools(assignedData || []);
      }
    }
  };

  const isAdminStatus = isUserAdmin(authUser);
  const canAccessAssignedSchools = isAdminStatus;

  if (!isDefaultAdmin && !canAccessAssignedSchools) {
    console.log(
      "AdminSchoolsSection - Hiding component - not default admin and can't access assigned schools"
    );
    return null;
  }

  // Function to generate a single-use invite link (similar to the one in AdminProfileSection)
  const generateInviteLink = async (schoolId) => {
    try {
      // Generate a unique token on the client side as an alternative approach
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Insert the new invite record using fetch API
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

      const response = await fetch(`${supabaseUrl}/rest/v1/drv_invite_links`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          school_id: schoolId,
          created_by: user.id || authUser?.id, // Use created_by to match schema
          token: token,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Return the complete invite URL
      const inviteUrl = `${window.location.origin}/?invite_token=${token}`;
      f7.preloader.hide();
      return inviteUrl;
    } catch (error) {
      f7.preloader.hide();
      console.error("Error creating invite link:", error);
      f7.dialog.alert("Error creating invite link: " + error.message);
      return null;
    }
  };

  // Function to request access to a school - uses the centralized schoolService function
  const requestSchoolAccess = async (school) => {
    try {
      // Find the school object in allSchools to get full school data
      const schoolObject = allSchools.find(
        (s) => s.name === school.name || s.id === school.id
      );
      if (!schoolObject) {
        console.error(
          "Error finding school: No school found with the given name or ID"
        );
        f7.toast.show({
          text: "Error finding the school. Please try again.",
          position: "top",
        });
        return;
      }

      // Call the centralized function from schoolService
      await schoolService.requestSchoolAccess(schoolObject, f7);
    } catch (error) {
      console.error("Error in requestSchoolAccess:", error);
      f7.toast.show({
        text: "Error requesting school access: " + error.message,
        position: "top",
      });
    }
  };

  // Method to handle school parameter in URL
  const handleSchoolParameter = async () => {
    // Get URL parameters
    // School name is now handled via background configuration
    const defaultSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    let schoolName = null;
    
    if (defaultSchoolId) {
      try {
        const { data: school } = await schoolService.getSchoolById(defaultSchoolId);
        if (school) {
          schoolName = school.name;
        }
      } catch (err) {
        console.error("Error fetching default school name:", err);
      }
    }

    if (schoolName) {
      try {
        // Get school by name using the schoolService
        const { data: school, error } = await schoolService.getSchoolByName(
          schoolName
        );

        if (error) {
          console.error("Error fetching school by name:", error);
          f7.toast.show({
            text: "Error fetching school: " + error.message,
            position: "top",
          });
          return;
        }

        if (school) {
          // Set school ID in localStorage
          localStorage.setItem("selectedSchoolName", school.name);

          // Refresh to domain without parameters
          window.location.href = window.location.origin;
        } else {
          console.error("School not found with name:", schoolName);
          f7.toast.show({
            text: "School not found",
            position: "top",
          });
        }
      } catch (error) {
        console.error("Error in handleSchoolParameter:", error);
        f7.toast.show({
          text: "Error processing school parameter: " + error.message,
          position: "top",
        });
      }
    }
  };

  // Check for school parameter on component mount or when component updates
  useEffect(() => {
    handleSchoolParameter();
  }, []);

  return (
    <>
      {/* Display assigned schools for approved admins */}
      {canAccessAssignedSchools && assignedSchools.length > 0 && (
        <Block>
          <BlockTitle>{t("admin.assignedSchools")}</BlockTitle>
          <List mediaList style={{ margin: "0 16px 16px" }}>
            {assignedSchools.map((school) => (
              <ListItem
                style={{
                  backgroundColor: "grey",
                  borderRadius: "5px",
                  marginBottom: "8px",
                }}
                key={school.id}
                title={school.name}
              >
                <Button
                  slot="content-end"
                  small
                  iconF7="ellipsis_vertical"
                  onClick={(e) => {
                    setSelectedSchool(school);
                    setPopoverTarget(e.target);
                    f7.popover.open(".school-actions-popover", e.target);
                  }}
                />
              </ListItem>
            ))}
          </List>

          {/* Popover for school actions */}
          <Popover
            closeByOutsideClick
            className="school-actions-popover"
            target={popoverTarget}
            opened={!!selectedSchool}
            onPopoverClose={() => {
              setSelectedSchool(null);
              setPopoverTarget(null);
            }}
          >
            <List mediaList>
              <ListItem
                link="#"
                title="Edit School"
                onClick={() => {
                  // Close the popover first
                  f7.popover.close(".school-actions-popover");

                  // Set timeout before proceeding with the action
                  setTimeout(() => {
                    if (selectedSchool) {
                      setEditingSchool({
                        id: selectedSchool.id,
                        name: selectedSchool.name || "",
                        description: selectedSchool.description || "",
                        logo_url: selectedSchool.logo_url || "",
                        cover_image_url: selectedSchool.cover_image_url || "",
                      });
                      setShowCreateSchoolForm(false);

                      // Open the edit school sheet
                      f7.sheet.open("#editschool-sheet");
                    }
                  }, 500);
                }}
              >
                <Icon slot="media" f7="pencil" />
              </ListItem>
              <ListItem
                link="#"
                title="View Students"
                onClick={async () => {
                  // Close the popover first
                  f7.popover.close(".school-actions-popover");

                  // Set timeout before proceeding with the action
                  setTimeout(async () => {
                    if (selectedSchool) {
                      try {
                        // Set the current school as the one for students view
                        if (setSelectedSchoolForStudents) {
                          setSelectedSchoolForStudents(selectedSchool);
                        }
                        localStorage.setItem(
                          "selectedSchoolId",
                          selectedSchool.id
                        );
                        localStorage.setItem(
                          "selectedSchoolName",
                          selectedSchool.name
                        );

                        if (typeof fetchStudents === "function") {
                          await fetchStudents(selectedSchool.id);
                        }
                        f7.preloader.hide();

                        // Open the students sheet instead of changing the view
                        f7.sheet.open("#students-sheet");
                      } catch (error) {
                        f7.preloader.hide();
                        f7.toast.show({
                          text: "Error loading students: " + error.message,
                          position: "top",
                        });
                      }
                    }
                  }, 500);
                }}
              >
                <Icon slot="media" f7="person_3" />
              </ListItem>
            </List>
          </Popover>
        </Block>
      )}

      {/* List of all schools to request access */}
      {canAccessAssignedSchools && (
        <Block inset>
          <Button
            fill
            large
            text="Create New School"
            iconF7="plus"
            sheetOpen="#editschool-sheet"
          />
        </Block>
      )}
    </>
  );
};

export default AdminSchoolsSection;
