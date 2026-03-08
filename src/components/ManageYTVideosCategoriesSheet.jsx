// src/components/ManageYTVideosCategoriesSheet.jsx
import React, { useState, useEffect } from "react";
import {
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  NavLeft,
  Block,
  List,
  ListItem,
  Input,
  Button,
  Icon,
  f7,
  ListInput,
} from "framework7-react";

const ManageYTVideosCategoriesSheet = ({ isAdmin, videoData, onSaveCategories }) => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize categories from videoData
  useEffect(() => {
    if (videoData && videoData.categorieën) {
      const categoryList = Object.entries(videoData.categorieën).map(
        ([key, value]) => ({
          id: key,
          name: key,
          title: key, // For videos, we use the key as title
          videos: value,
        })
      );
      setCategories(categoryList);
    }
  }, [videoData]);

  const handleAddCategory = () => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    if (newCategoryName.trim()) {
      const newCategory = {
        id: newCategoryName.trim(),
        name: newCategoryName.trim(),
        title: newCategoryName.trim(),
        videos: [],
      };

      // Check if category already exists
      if (!categories.some((cat) => cat.name === newCategory.name)) {
        setCategories((prev) => [...prev, newCategory]);
        setNewCategoryName("");
      } else {
        f7.toast.show({
          text: "Category already exists",
          position: "center",
          closeTimeout: 2000,
        });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    setIsLoading(true);
    try {
      // Get the driving school ID
      const drivingSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      if (!drivingSchoolId) {
        throw new Error(
          "No driving school selected. Please select a school first."
        );
      }

      // Prepare the categories data for Supabase
      const categoriesToSave = categories.map((category, index) => ({
        name: category.name,
        display_name: category.title,
        order_index: index, // Preserve the order
        driving_school_id: drivingSchoolId,
      }));

      // Import and use the video categories service
      const { ytVideoCategoriesService } = await import(
        "../services/ytVideoCategoriesService.js"
      );

      // Clear existing categories for this school and add the new ones
      // First, delete existing categories for this school
      const { error: deleteError } =
        await ytVideoCategoriesService.deleteCategoriesBySchoolId(drivingSchoolId);
      if (deleteError) {
        throw new Error(
          `Error deleting existing categories: ${deleteError.message}`
        );
      }

      // Then insert the new categories
      const results = [];
      for (const category of categoriesToSave) {
        const { data, error } = await ytVideoCategoriesService.createCategory({
          driving_school_id: drivingSchoolId,
          name: category.name,
          display_name: category.display_name,
          order_index: category.order_index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(error.message);
        }

        results.push(data);
      }

      if (results.length > 0) {
        f7.toast.show({
          text: `Successfully saved ${results.length} categories to database`,
          position: "center",
          closeTimeout: 2000,
        });
      } else {
        f7.toast.show({
          text: "Categories updated successfully",
          position: "center",
          closeTimeout: 2000,
        });
      }

      // Also call the original save function to update local state
      const updatedCategories = {};
      categories.forEach((category) => {
        updatedCategories[category.name] = category.videos;
      });
      await onSaveCategories(updatedCategories);
    } catch (error) {
      console.error("Error saving categories to database:", error);
      f7.toast.show({
        text: `Error saving categories: ${error.message}`,
        position: "center",
        closeTimeout: 2000,
      });
    } finally {
      setIsLoading(false);
      f7.sheet.close(".sheet-manage-yt-videos-categories");
    }
  };

  const handleRemoveCategory = (id) => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    if (categories.length <= 1) {
      f7.dialog.alert("You cannot remove the last category.");
      return;
    }

    // Check if category has any videos
    const category = categories.find((cat) => cat.id === id);
    if (category && category.videos && category.videos.length > 0) {
      f7.dialog.confirm(
        `This category has ${category.videos.length} videos. Are you sure you want to remove it?`,
        "Confirm Remove",
        () => {
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
        }
      );
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }
  };

  const handleEditCategory = (id, title) => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = () => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === editingId
          ? {
            ...cat,
            title: editTitle,
            name: editTitle.toLowerCase().replace(/\s+/g, "_"),
          }
          : cat
      )
    );
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const moveCategory = (index, direction) => {
    if (!isAdmin) {
      f7.dialog.alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    [newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index],
    ];
    setCategories(newCategories);
  };

  return (
    <Sheet className="sheet-manage-yt-videos-categories sheet-90h">
      <Page>
        <Navbar>
          <NavTitle>Manage Video Categories</NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
              onClick={() => {
                handleSaveChanges();
                setTimeout(() => {
                  f7.sheet.close(".sheet-manage-yt-videos-categories");
                }, 500);
              }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <Block>
          <h3>Add New Category</h3>
          <List mediaList>
            <ListInput
              outline
              type="text"
              placeholder="Category title"
              value={newCategoryName}
              onInput={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1 }}
            >
              <Button
                slot="content-end"
                fill
                onClick={handleAddCategory}
                iconF7="plus"
                text="Add"
                disabled={!isAdmin}
              />
            </ListInput>
          </List>
        </Block>

        <Block style={{ marginTop: "20px" }}>
          <h3>Categories</h3>
          <List dividers mediaList>
            {categories.map((category, index) => (
              <ListItem key={category.id}>
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  {editingId === category.id ? (
                    <Input
                      type="text"
                      value={editTitle}
                      onInput={(e) => setEditTitle(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <span style={{ fontWeight: "bold" }}>{category.title}</span>
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
                  {editingId === category.id ? (
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
                        iconF7="pencil"
                        onClick={() =>
                          handleEditCategory(category.id, category.title)
                        }
                        disabled={!isAdmin}
                      />
                      <Button
                        small
                        iconF7="trash"
                        onClick={() => handleRemoveCategory(category.id)}
                        disabled={!isAdmin}
                      />
                      <Button
                        small
                        iconF7="chevron_up"
                        onClick={() => moveCategory(index, "up")}
                        disabled={!isAdmin || index === 0}
                      />
                      <Button
                        small
                        iconF7="chevron_down"
                        onClick={() => moveCategory(index, "down")}
                        disabled={!isAdmin || index === categories.length - 1}
                      />
                    </>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
          {isAdmin && (
            <Button
              fill
              style={{ flex: 1 }}
              onClick={handleSaveChanges}
              disabled={categories.length === 0 || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </Block>
      </Page>
    </Sheet>
  );
};

export default ManageYTVideosCategoriesSheet;
