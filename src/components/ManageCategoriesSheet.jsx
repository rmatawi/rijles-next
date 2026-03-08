import {
  Sheet,
  Page,
  Navbar,
  NavRight,
  List,
  ListItem,
  Input,
  Button,
  Icon,
  Block,
  f7,
  NavTitle,
  NavLeft,
  ListInput,
} from "framework7-react";
import { useState, useEffect } from "react";
import { useMaquetteGroups } from "../contexts/MaquetteGroupsContext";
import { useI18n } from "../i18n/i18n";

const ManageCategoriesSheet = ({ isAdmin }) => {
  const { t } = useI18n();
  const { maquetteGroups, updateMaquetteGroups, refreshMaquetteGroups } =
    useMaquetteGroups();
  const [groups, setGroups] = useState([]);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize groups from maquetteGroups
  useEffect(() => {
    if (maquetteGroups && Array.isArray(maquetteGroups)) {
      setGroups(
        [...maquetteGroups].sort((a, b) => a.order.localeCompare(b.order))
      );
    }
  }, [maquetteGroups]);

  const handleAddGroup = () => {
    if (newGroupTitle.trim()) {
      const newGroup = {
        id: `group-${Date.now()}`,
        title: newGroupTitle.trim(),
        order: String((groups.length + 1) * 100).padStart(4, "0"), // Generate order like "0100", "0200", etc.
      };
      setGroups((prev) => [...prev, newGroup]);
      setNewGroupTitle("");
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Prepare the updated data following the required format
      const updatedData = {
        groups: groups.map((group, index) => ({
          ...group,
          order: String((index + 1) * 100).padStart(4, "0"),
        })),
      };

      await updateMaquetteGroups(updatedData);
      f7.toast.show({
        text: "Categories saved successfully!",
        position: "center",
        closeTimeout: 2000,
      });
    } catch (error) {
      console.error("Error saving categories:", error);
      f7.toast.show({
        text: "Error saving categories",
        position: "center",
        closeTimeout: 2000,
      });
    } finally {
      setIsLoading(false);
      f7.sheet.close(".sheet-managecategories");
    }
  };

  const handleRemoveGroup = (id) => {
    if (groups.length <= 1) {
      f7.dialog.alert("You cannot remove the last category.");
      return;
    }
    setGroups((prev) => prev.filter((group) => group.id !== id));
  };

  const handleEditGroup = (id, title) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = () => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === editingId ? { ...group, title: editTitle } : group
      )
    );
    setTimeout(() => {
      handleSaveChanges();
    }, 500);
    setTimeout(() => {
      setEditingId(null);
      setEditTitle("");
    }, 1000);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const moveGroup = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === groups.length - 1)
    ) {
      return;
    }

    const newGroups = [...groups];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newGroups[index], newGroups[targetIndex]] = [
      newGroups[targetIndex],
      newGroups[index],
    ];
    setGroups(newGroups);
  };

  return (
    <Sheet className="sheet-managecategories sheet-90h">
      <Page>
        <Navbar>
          <NavTitle>{t("common.manageCategories")}</NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
              onClick={() => {
                handleSaveChanges();
                setTimeout(() => {
                  f7.sheet.close(".sheet-managecategories");
                }, 500);
              }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <Block>
          <h3>{t("categories.addNewCategory")}</h3>
          <List mediaList>
            <ListInput
              type="text"
              placeholder="Category title"
              value={newGroupTitle}
              onInput={(e) => setNewGroupTitle(e.target.value)}
              style={{ flex: 1 }}
            >
              <Button
                slot="content-end"
                fill
                onClick={handleAddGroup}
                iconF7="plus"
                text={t("common.add")}
              />
            </ListInput>
          </List>
        </Block>

        <Block style={{ marginTop: "20px" }}>
          <h3>{t("categories.categories")}</h3>
          <List dividers mediaList>
            {groups.map((group, index) => (
              <ListItem key={group.id}>
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  {editingId === group.id ? (
                    <Input
                      type="text"
                      value={editTitle}
                      onInput={(e) => setEditTitle(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <span style={{ fontWeight: "bold" }}>{group.title}</span>
                  )}
                </div>

                <div
                  content="text"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                    gap: "5px",
                  }}
                >
                  {editingId === group.id ? (
                    <>
                      <Button small onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button small onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        small
                        iconMaterial="edit"
                        onClick={() => handleEditGroup(group.id, group.title)}
                      />
                      <Button
                        small
                        iconMaterial="delete"
                        onClick={() => handleRemoveGroup(group.id)}
                      />
                      <Button
                        small
                        iconMaterial="arrow_upward"
                        disabled={index === 0}
                        onClick={() => moveGroup(index, "up")}
                      />
                      <Button
                        small
                        iconMaterial="arrow_downward"
                        disabled={index === groups.length - 1}
                        onClick={() => moveGroup(index, "down")}
                      />
                    </>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        </Block>
      </Page>
    </Sheet>
  );
};

export default ManageCategoriesSheet;
