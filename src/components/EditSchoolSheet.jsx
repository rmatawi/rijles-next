import {
  Block,
  Button,
  CardFooter,
  List,
  ListInput,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  Sheet,
  Icon,
  NavRight,
} from "framework7-react";
import { useI18n } from "../i18n/i18n";

const EditSchoolSheet = ({
  editingSchool,
  setEditingSchool,
  handleCreateSchool,
  handleUpdateSchool,
  uploadLogoImage,
  uploadCoverImage,
  showUploadOptions = false, // Whether to show upload options
  showFloppyDiskIcon = false, // Whether to show floppy disk icon
}) => {
  const { t } = useI18n();
  const handleSubmit = () => {
    if (editingSchool?.id) {
      handleUpdateSchool();
    } else {
      handleCreateSchool();
    }
  };

  const handleCoverImageUpload = async () => {
    // Only proceed if upload functions are provided
    if (!uploadCoverImage) return;

    // Create file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Show loading message
        const loadingToast = window.f7?.toast.show({
          text: "Uploading cover image...",
          closeTimeout: 0, // Don't auto-close
        });

        const result = await uploadCoverImage(file);

        if (result && result.url) {
          // Update the cover_image_url in the editingSchool state
          // The image was already resized on the client side before upload
          setEditingSchool({
            ...editingSchool,
            cover_image_url: result.url,
          });

          window.f7?.toast.show({
            text: "Cover image uploaded successfully!",
            closeTimeout: 2000,
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }

        loadingToast.close();
      } catch (error) {
        console.error("Error uploading cover image:", error);
        window.f7?.dialog.alert(
          "Error uploading cover image: " + error.message
        );
      }
    };
    input.click();
  };

  const handleLogoUpload = async () => {
    // Only proceed if upload functions are provided
    if (!uploadLogoImage) return;

    // Create file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Show loading message
        const loadingToast = window.f7?.toast.show({
          text: "Uploading logo...",
          closeTimeout: 0, // Don't auto-close
        });

        const result = await uploadLogoImage(file);

        if (result && result.url) {
          // Update the logo_url in the editingSchool state
          // The image was already resized on the client side before upload
          setEditingSchool({
            ...editingSchool,
            logo_url: result.url,
          });

          window.f7?.toast.show({
            text: "Logo uploaded successfully!",
            closeTimeout: 2000,
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }

        loadingToast.close();
      } catch (error) {
        console.error("Error uploading logo:", error);
        window.f7?.dialog.alert("Error uploading logo: " + error.message);
      }
    };
    input.click();
  };

  return (
    <Page>
      <Navbar>
        <NavTitle>
          {editingSchool?.id
            ? t("school.updateSchool")
            : t("school.createSchool")}
        </NavTitle>
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
            label="School Name"
            type="text"
            placeholder="Enter school name"
            value={editingSchool?.name || ""}
            onInput={(e) =>
              setEditingSchool({
                ...editingSchool,
                name: e.target.value,
              })
            }
          />
          <ListInput
            outline
            label="Description"
            type="textarea"
            placeholder="Enter school description"
            value={editingSchool?.description || ""}
            onInput={(e) =>
              setEditingSchool({
                ...editingSchool,
                description: e.target.value,
              })
            }
          />
          {showUploadOptions ? (
            <ListInput
              outline
              label="Cover Image URL"
              type="text"
              placeholder="Enter cover image URL"
              value={editingSchool?.cover_image_url || ""}
              onInput={(e) =>
                setEditingSchool({
                  ...editingSchool,
                  cover_image_url: e.target.value,
                })
              }
            >
              <Button
                slot="content-end"
                text="Upload"
                onClick={handleCoverImageUpload}
              />
            </ListInput>
          ) : (
            <ListInput
              outline
              label="Cover Image URL"
              type="text"
              placeholder="Enter cover image URL"
              value={editingSchool?.cover_image_url || ""}
              onInput={(e) =>
                setEditingSchool({
                  ...editingSchool,
                  cover_image_url: e.target.value,
                })
              }
            />
          )}
          {showUploadOptions ? (
            <ListInput
              outline
              label="Logo URL"
              type="text"
              placeholder="Enter logo URL"
              value={editingSchool?.logo_url || ""}
              onInput={(e) =>
                setEditingSchool({
                  ...editingSchool,
                  logo_url: e.target.value,
                })
              }
            >
              <Button
                slot="content-end"
                text="Upload"
                onClick={handleLogoUpload}
              />
            </ListInput>
          ) : (
            <ListInput
              outline
              label="Logo URL"
              type="text"
              placeholder="Enter logo URL"
              value={editingSchool?.logo_url || ""}
              onInput={(e) =>
                setEditingSchool({
                  ...editingSchool,
                  logo_url: e.target.value,
                })
              }
            />
          )}
          <ListInput
            outline
            label="Address"
            type="text"
            placeholder="Enter school address"
            value={editingSchool?.address || ""}
            onInput={(e) =>
              setEditingSchool({
                ...editingSchool,
                address: e.target.value,
              })
            }
          />
          <ListInput
            outline
            label="Area"
            type="text"
            placeholder="Enter school area"
            value={editingSchool?.area || ""}
            onInput={(e) =>
              setEditingSchool({
                ...editingSchool,
                area: e.target.value,
              })
            }
          />
          <ListInput
            outline
            label="District"
            type="text"
            placeholder="Enter school district"
            value={editingSchool?.district || ""}
            onInput={(e) =>
              setEditingSchool({
                ...editingSchool,
                district: e.target.value,
              })
            }
          />
          <CardFooter>
            <Button
              fill
              large
              color="blue"
              onClick={handleSubmit}
              iconF7={showFloppyDiskIcon ? "floppy_disk" : "plus"}
              text={editingSchool?.id ? "Update School" : "Create School"}
            />
          </CardFooter>
        </List>
      </div>
    </Page>
  );
};

export default EditSchoolSheet;
