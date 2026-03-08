import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  List,
  ListItem,
  Button,
  Icon,
  Searchbar,
  Preloader,
  f7,
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  ListInput,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import { person, people } from "ionicons/icons";
import { useI18n } from "../i18n/i18n";
import { adminService } from "../services/adminService";
import { studentSchoolService } from "../services/studentSchoolService";

const AdminManagementSection = ({ selectedSchool }) => {
  const { t } = useI18n();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentCounts, setStudentCounts] = useState({});
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminShareUrl, setAdminShareUrl] = useState("");
  const [isGeneratingShareUrl, setIsGeneratingShareUrl] = useState(false);

  const fetchAdminsAndStudentCounts = async () => {
    try {
      setLoading(true);

      // Fetch all admins for the current school
      const { data: adminsData, error: adminsError } = await adminService.getAdminsBySchoolId(selectedSchool.id);

      if (adminsError) {
        f7.toast.show({
          text: `Error fetching admins: ${adminsError.message}`,
          position: "top",
        });
        return;
      }

      if (adminsData && adminsData.length > 0) {
        setAdmins(adminsData);

        // Fetch student counts for each admin
        const counts = {};
        for (const admin of adminsData) {
          const { data: studentsData, error: studentsError } =
            await studentSchoolService.getStudentsByAdminId(admin.id, selectedSchool.id);

          if (!studentsError && studentsData) {
            counts[admin.id] = studentsData.length;
          } else {
            counts[admin.id] = 0;
          }
        }

        setStudentCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching admins and student counts:", error);
      f7.toast.show({
        text: "Error loading admin data",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchool?.id) {
      fetchAdminsAndStudentCounts();
    }
  }, [selectedSchool]);

  const openEditSheet = (admin) => {
    setEditingAdmin({ ...admin });
    setAdminShareUrl("");
    setIsEditSheetOpen(true);
  };

  const handleEditFieldChange = (field, value) => {
    setEditingAdmin((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin?.id) return;
    setIsSaving(true);

    const updatePayload = {
      name: editingAdmin.name,
      alias: editingAdmin.alias,
      email: editingAdmin.email,
      phone: editingAdmin.phone,
      address: editingAdmin.address,
    };

    const { error } = await adminService.updateAdmin(
      editingAdmin.id,
      updatePayload
    );

    if (error) {
      f7.toast.show({
        text: `Error updating admin: ${error.message}`,
        position: "top",
      });
    } else {
      f7.toast.show({
        text: "Administrator updated successfully",
        position: "top",
      });
      setIsEditSheetOpen(false);
      setEditingAdmin(null);
      await fetchAdminsAndStudentCounts();
    }

    setIsSaving(false);
  };

  const generateAdminShareUrl = async () => {
    if (!editingAdmin?.id) return;
    setIsGeneratingShareUrl(true);

    try {
      const alias = String(editingAdmin?.alias || "")
        .trim()
        .replace(/^@+/, "")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase();

      if (!alias) {
        throw new Error("Alias is required. Add an alias first.");
      }

      const adminUrl = `${window.location.origin}/admin?${encodeURIComponent(
        alias
      )}`;

      setAdminShareUrl(adminUrl);
      await navigator.clipboard.writeText(adminUrl);

      f7.toast.show({
        text: "Admin URL generated and copied to clipboard",
        position: "top",
      });
    } catch (error) {
      console.error("Error generating admin URL:", error);
      f7.toast.show({
        text: error?.message || "Failed to generate admin URL",
        position: "top",
      });
    } finally {
      setIsGeneratingShareUrl(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedSchool) {
    return (
      <Block style={{ textAlign: "center", paddingTop: "50px" }}>
        <p>{t("adminRequest.noSchoolSelected")}</p>
      </Block>
    );
  }

  return (
    <div>
      <BlockTitle>{t("adminManagement.title")}</BlockTitle>

      <Searchbar
        placeholder={t("adminManagement.searchPlaceholder")}
        value={searchQuery}
        onSearchbarInput={(e) => setSearchQuery(e.target.value)}
        clearButton
      />

      {loading ? (
        <Block style={{ textAlign: "center", padding: "20px" }}>
          <Preloader />
          <p>{t("common.loading")}</p>
        </Block>
      ) : (
        <List>
          {filteredAdmins.length === 0 ? (
            <ListItem title={t("adminManagement.noAdminsFound")} />
          ) : (
            filteredAdmins.map((admin) => (
              <ListItem
                key={admin.id}
                title={admin.name || admin.email}
                subtitle={admin.email}
                after={t("adminManagement.studentCount", {
                  count: studentCounts[admin.id] || 0,
                })}
                link="#"
                onClick={() => openEditSheet(admin)}
              >
                <IonIcon
                  icon={people}
                  slot="media"
                  style={{ color: "var(--f7-color-primary)" }}
                />
                <div slot="after">
                  <span style={{
                    backgroundColor: "var(--f7-color-primary)",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {studentCounts[admin.id] || 0}
                  </span>
                </div>
              </ListItem>
            ))
          )}
        </List>
      )}

      <Block>
        <Button
          fill
          onClick={fetchAdminsAndStudentCounts}
          style={{ marginTop: "16px" }}
        >
          <IonIcon icon={person} style={{ marginRight: "8px" }} />
          {t("adminManagement.refreshButton")}
        </Button>
      </Block>

      <Sheet
        id="admin-edit-sheet"
        opened={isEditSheetOpen}
        onSheetClosed={() => {
          setIsEditSheetOpen(false);
          setEditingAdmin(null);
        }}
        swipeToClose
        backdrop
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavTitle>{t("adminManagement.editTitle")}</NavTitle>
            <NavRight>
              <div
                className="neu-btn-circle sheet-close"
                style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
              >
                <Icon f7="xmark" style={{ fontSize: "18px" }} />
              </div>
            </NavRight>
          </Navbar>
          <div style={{ paddingTop: "80px" }}>
            <List noHairlinesMd>
              <ListInput
                outline
                label={t("profile.fullName")}
                type="text"
                placeholder={t("profile.fullName")}
                value={editingAdmin?.name ?? ""}
                onInput={(e) => handleEditFieldChange("name", e.target.value)}
              />
              <ListInput
                outline
                label={t("profile.email")}
                type="email"
                placeholder={t("profile.email")}
                value={editingAdmin?.email ?? ""}
                onInput={(e) => handleEditFieldChange("email", e.target.value)}
              />
              <ListInput
                outline
                label="Alias"
                type="text"
                placeholder="Alias (e.g. rianmatawi)"
                value={editingAdmin?.alias ?? ""}
                onInput={(e) => handleEditFieldChange("alias", e.target.value)}
              />
              <ListInput
                outline
                label={t("profile.phone")}
                type="tel"
                placeholder={t("profile.phone")}
                value={editingAdmin?.phone ?? ""}
                onInput={(e) => handleEditFieldChange("phone", e.target.value)}
              />
              <ListInput
                outline
                label={t("profile.address")}
                type="text"
                placeholder={t("profile.address")}
                value={editingAdmin?.address ?? ""}
                onInput={(e) => handleEditFieldChange("address", e.target.value)}
              />
            </List>

            <Block style={{ margin: "16px" }}>
              <Button
                fill
                large
                onClick={handleSaveAdmin}
                disabled={isSaving || !editingAdmin?.id}
              >
                <Icon f7="floppy_disk" slot="start" />
                {isSaving ? "Saving..." : t("common.save")}
              </Button>
            </Block>

            <Block style={{ margin: "16px" }}>
              <Button
                fill
                large
                color="green"
                onClick={generateAdminShareUrl}
                disabled={isGeneratingShareUrl || !editingAdmin?.id}
              >
                <Icon f7="link" slot="start" />
                {isGeneratingShareUrl ? t("common.loading") : "Generate Admin URL"}
              </Button>
              {adminShareUrl && (
                <div style={{ marginTop: "12px", wordBreak: "break-all" }}>
                  <small>{adminShareUrl}</small>
                </div>
              )}
            </Block>
          </div>
        </Page>
      </Sheet>
    </div>
  );
};

export default AdminManagementSection;
