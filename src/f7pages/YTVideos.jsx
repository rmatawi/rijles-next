// pages/YTVideos.jsx - YouTube Videos page for driving school
import { useState, useMemo, useRef } from "react";
import {
  Block,
  CardFooter,
  f7,
  NavLeft,
  NavTitle,
  useStore,
  Page,
  Navbar,
  BlockTitle,
  Card,
  CardContent,
  Button,
  Segmented,
  Link,
  NavRight,
  Toolbar,
  ListInput,
  List,
  Sheet,
  Icon,
} from "framework7-react";
import ReactPlayer from "react-player";
import { getLayout } from "../js/utils";
import { useYTVideosData } from "../hooks/useYTVideosData.jsx";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import YTVideosSidePanel from "../components/YTVideosSidePanel.jsx";
import ManageYTVideosCategoriesSheet from "../components/ManageYTVideosCategoriesSheet";
import { SEO } from "../js/seoUtils";
import NavHomeButton from "../components/NavHomeButton";
import LocalAdPlaceholder from "../components/LocalAdPlaceholder";

const YTVideos = () => {
  const videoPlayer = useRef();
  const [editingVideo, setEditingVideo] = useState(null);
  const [showVideoList, setShowVideoList] = useState(true);
  const [tempTitle, setTempTitle] = useState("");
  const [tempUrl, setTempUrl] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [currentCategoryForAdd, setCurrentCategoryForAdd] = useState(null);
  const { canManageCurrentSchool, currentSchoolId } = useAdminStatus();
  const {
    videoData,
    handleDataUpdate,
    addNewVideo,
    updateAllVideoData,
    loadVideoData,
  } = useYTVideosData();

  const assertCanManageCurrentSchool = () => {
    if (!canManageCurrentSchool) {
      f7.dialog.alert(
        "Je hebt geen beheertoegang voor de huidige rijschool."
      );
      return false;
    }
    if (!currentSchoolId) {
      f7.dialog.alert("Geen rijschool geselecteerd.");
      return false;
    }
    return true;
  };

  // Get all videos count for display
  const allVideosCount = useMemo(
    () => Object.values(videoData.categorieën).flat().length,
    [videoData]
  );

  // Function to save updated categories
  const saveCategories = async (updatedCategories) => {
    if (!assertCanManageCurrentSchool()) {
      return;
    }

    try {
      // Create new videoData with updated categories
      const newVideoData = {
        ...videoData,
        categorieën: updatedCategories,
      };

      // Update local state using the new function
      updateAllVideoData(newVideoData);

      f7.toast.show({
        text: "Categories saved successfully!",
        position: "center",
        closeTimeout: 2000,
      });
    } catch (error) {
      console.error("Error saving categories:", error);
      f7.toast.show({
        text: "Error saving categories: " + error.message,
        position: "center",
        closeTimeout: 2000,
      });
    }
  };

  // Push video data to database
  const pushToDatabase = async () => {
    if (!assertCanManageCurrentSchool()) {
      return;
    }

    try {
      // Get the driving school ID
      const drivingSchoolId = currentSchoolId;
      if (!drivingSchoolId) {
        f7.dialog.alert(
          "No driving school selected. Please select a school first."
        );
        return;
      }

      // Use localStorage data if available, otherwise use current state
      const localStorageData = localStorage.getItem("videoData");
      const dataToPush = localStorageData
        ? JSON.parse(localStorageData)
        : videoData;

      // Transform the data into the format expected by the API
      const videoEntries = [];
      Object.entries(dataToPush.categorieën).forEach(
        ([category, videos]) => {
          videos.forEach((video) => {
            videoEntries.push({
              category,
              video_entry: {
                title: video.title,
                url: video.url,
                description: video.description,
              },
            });
          });
        }
      );

      // Add the new entries
      const results = [];
      for (const videoEntry of videoEntries) {
        const result = await import("../services/ytVideosService.js").then((mod) =>
          mod.ytVideosService.createVideoEntry({
            driving_school_id: drivingSchoolId,
            video_entry: videoEntry.video_entry,
            category: videoEntry.category,
            name: videoEntry.category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        results.push(result.data);
      }

      if (results.length > 0) {
        // Clear localStorage after successful push
        localStorage.removeItem("videoData");
        f7.toast.show({
          text: `Successfully pushed ${results.length} video entries to database`,
        });
      } else {
        f7.toast.show({ text: "No video entries to push" });
      }
    } catch (error) {
      console.error("Error pushing to database:", error);
      f7.toast.show({
        text: `Error pushing changes to database: ${error.message}`,
      });
    }
  };

  const editVideo = ({ id, title, url, description }) => {
    setEditingVideo(id);
    setTempTitle(title);
    setTempUrl(url);
    setTempDescription(description || "");

    // Find the category for this video
    let categoryKey = "";
    for (const [catKey, category] of Object.entries(videoData.categorieën)) {
      if (category.some((video) => video.id === id)) {
        categoryKey = catKey;
        break;
      }
    }
    setCurrentCategoryForAdd(categoryKey);

    f7.sheet.open("#sheet-edit-video");
    setShowVideoList(false);
  };

  // Handle playing a video
  const handlePlayClick = (url) => {
    setTempUrl(url);
  };

  // Function to scroll to a specific category
  const scrollToCategory = (categoryKey) => {
    const element = document.getElementById(`category-${categoryKey}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <Page name="videos">
      <SEO page="videos" />
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>Video's</NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            onClick={() => {
              loadVideoData();
            }}
          >
            <Icon f7="arrow_clockwise" style={{ fontSize: "18px" }} />
          </div>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            onClick={() => {
              f7.panel.open("#yt-videos-side-panel");
            }}
          >
            <Icon f7="bars" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      <YTVideosSidePanel
        onScrollToCategory={scrollToCategory}
        videoData={videoData}
        onPushToDatabase={canManageCurrentSchool ? pushToDatabase : null}
      />

      <ManageYTVideosCategoriesSheet
        isAdmin={canManageCurrentSchool}
        videoData={videoData}
        onSaveCategories={saveCategories}
      />

      <BlockTitle medium className="text-align-center">
        {allVideosCount} Video's
      </BlockTitle>

      {/* Video Player */}
      <ReactPlayer
        src={tempUrl}
        width="100%"
        height="360px"
        controls={true}
        ref={videoPlayer}
        config={{
          youtube: {
            playerVars: {
              controls: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          },
        }}
      />

      <LocalAdPlaceholder
        adSlot="videos"
        headline="Lokale videopartner"
        description="Gebruik deze positie voor lokale advertenties met hoge zichtbaarheid direct onder de videospeler."
        ctaLabel="Bekijk adverteerpakketten"
      />

      {/* Video Categories and Videos */}
      <div className="video-list">
        {Object.entries(videoData.categorieën).map(([categoryKey, videos]) => {
          return (
            <div key={categoryKey} id={`category-${categoryKey}`}>
              <div
                className="category-header sticky"
                style={{
                  backgroundColor: getLayout()?.colorScheme?.[0],
                  borderRadius: getLayout()?.rounded ? "8px" : "0px",
                }}
              >
                <h3>{categoryKey}</h3>
              </div>
              {videos.map((video) => (
                <Card key={video.id} id={`video-${video.id}`} className="video-card">
                  <CardContent>
                    {(!editingVideo || editingVideo !== video.id) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong className="video-title">{video.title}</strong>
                          {video.description && (
                            <div className="video-description padding">
                              {video.description}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "5px" }}>
                          {canManageCurrentSchool && (
                            <Button
                              fill
                              iconF7="pencil"
                              className="btn-round"
                              iconSize={20}
                              onClick={() => {
                                editVideo({
                                  id: video.id,
                                  title: video.title,
                                  url: video.url,
                                  description: video.description || "",
                                });
                              }}
                              title="Edit video"
                            />
                          )}

                          <Button
                            fill
                            iconF7="play"
                            className="btn-round"
                            iconSize={20}
                            onClick={() => handlePlayClick(video.url)}
                            title="Play video"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {canManageCurrentSchool && (
                <div className="padding-horizontal padding-bottom">
                  <Button
                    iconF7="plus"
                    text="Add Video"
                    onClick={() => {
                      // Set up for adding a new video
                      setEditingVideo(null);
                      setIsAddingNew(true);
                      setCurrentCategoryForAdd(categoryKey);
                      setTempTitle("");
                      setTempUrl("");
                      setTempDescription("");
                      setShowVideoList(false);
                      f7.sheet.open("#sheet-edit-video");
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Video Sheet */}
      <Sheet
        id="sheet-edit-video"
        onSheetClosed={() => {
          setEditingVideo(null);
          setIsAddingNew(false);
          setCurrentCategoryForAdd(null);
          setTempTitle("");
          setTempUrl("");
          setTempDescription("");
          setShowVideoList(true);
        }}
        style={{ height: "70vh" }}
      >
        <Page>
          <Navbar>
            <NavTitle>Add / Edit Video</NavTitle>
            <NavRight>
              <Button sheetClose="#sheet-edit-video" iconF7="xmark" />
            </NavRight>
          </Navbar>

          <Block>
            {!isAddingNew && editingVideo && (
              <List>
                <ListInput
                  outline
                  label="Category:"
                  type="select"
                  defaultValue={currentCategoryForAdd}
                  disabled
                >
                  {Object.entries(videoData.categorieën).map(
                    ([categoryKey]) => (
                      <option key={categoryKey} value={categoryKey}>
                        {categoryKey}
                      </option>
                    )
                  )}
                </ListInput>
              </List>
            )}

            {isAddingNew && (
              <List>
                <ListInput
                  outline
                  label="Category:"
                  type="select"
                  value={currentCategoryForAdd}
                  onChange={(e) => setCurrentCategoryForAdd(e.target.value)}
                >
                  {Object.entries(videoData.categorieën).map(
                    ([categoryKey]) => (
                      <option key={categoryKey} value={categoryKey}>
                        {categoryKey}
                      </option>
                    )
                  )}
                </ListInput>
              </List>
            )}

            <List>
              <ListInput
                outline
                type="text"
                label="Title:"
                value={tempTitle}
                onInput={(e) => setTempTitle(e.target.value)}
              />
            </List>

            <List>
              <ListInput
                outline
                type="url"
                label="URL:"
                value={tempUrl}
                onInput={(e) => setTempUrl(e.target.value)}
              />
            </List>

            <List>
              <ListInput
                outline
                type="textarea"
                label="Description:"
                value={tempDescription}
                onInput={(e) => setTempDescription(e.target.value)}
              />
            </List>

            <CardFooter>
              {!isAddingNew ? (
                <>
                  <Button
                    fill
                    onClick={async () => {
                      if (!assertCanManageCurrentSchool()) {
                        return;
                      }
                      try {
                        // Update local state first
                        if (currentCategoryForAdd) {
                          handleDataUpdate(currentCategoryForAdd, editingVideo, {
                            title: tempTitle,
                            url: tempUrl,
                            description: tempDescription,
                          });
                        }

                        // Try to update in database
                        try {
                          const drivingSchoolId = currentSchoolId;
                          if (drivingSchoolId) {
                            const { ytVideosService } = await import(
                              "../services/ytVideosService"
                            );
                            const result = await ytVideosService.updateVideoEntry(
                              editingVideo,
                              {
                                video_entry: {
                                  title: tempTitle,
                                  url: tempUrl,
                                  description: tempDescription,
                                },
                                updated_at: new Date().toISOString(),
                              }
                            );

                            if (result.error) {
                              // If database update fails, show warning but still proceed
                              console.warn(
                                "Database update failed, but video updated locally:",
                                result.error.message
                              );
                              f7.toast.show({
                                text: "Video updated locally. Sync to database failed.",
                              });
                            } else {
                              f7.toast.show({
                                text: "Video updated successfully",
                              });
                            }
                          } else {
                            // No school ID, just update locally
                            f7.toast.show({
                              text: "Video updated locally",
                            });
                          }
                        } catch (dbError) {
                          // If database operation fails, still show success since it's updated locally
                          console.warn(
                            "Database update failed, but video updated locally:",
                            dbError
                          );
                          f7.toast.show({
                            text: "Video updated locally. Sync to database failed.",
                          });
                        }

                        // Close the sheet and reset editing state
                        f7.sheet.close("#sheet-edit-video");
                        setEditingVideo(null);
                      } catch (error) {
                        console.error("Error updating video entry:", error);
                        f7.toast.show({
                          text: `Error updating video: ${error.message}`,
                        });
                      }
                    }}
                  >
                    Opslaan
                  </Button>

                  <Button
                    onClick={async () => {
                      if (!assertCanManageCurrentSchool()) {
                        return;
                      }
                      f7.dialog.confirm(
                        "Weet je zeker dat je deze video wilt verwijderen?",
                        "Bevestig verwijderen",
                        async () => {
                          try {
                            // Use the current selected category for this video
                            const categoryKey = currentCategoryForAdd;

                            // Remove the entry from local state first
                            const updatedCategorieën = {
                              ...videoData.categorieën,
                            };
                            updatedCategorieën[categoryKey] =
                              updatedCategorieën[categoryKey].filter(
                                (v) => v.id !== editingVideo
                              );
                            // Update the local state
                            handleDataUpdate(categoryKey, editingVideo, {
                              type: "deleteVideo",
                              id: editingVideo,
                            });

                            // Try to delete from database
                            try {
                              const { ytVideosService } = await import(
                                "../services/ytVideosService"
                              );
                              const result = await ytVideosService.deleteVideoEntry(
                                editingVideo
                              );

                              if (result.error) {
                                // If database delete fails, show warning but still proceed
                                console.warn(
                                  "Database delete failed, but video removed locally:",
                                  result.error.message
                                );
                                f7.toast.show({
                                  text: "Video deleted locally. Sync to database failed.",
                                });
                              } else {
                                f7.toast.show({
                                  text: "Video deleted successfully",
                                });
                              }
                            } catch (dbError) {
                              // If database operation fails, still show success since it's removed locally
                              console.warn(
                                "Database delete failed, but video removed locally:",
                                dbError
                              );
                              f7.toast.show({
                                text: "Video deleted locally. Sync to database failed.",
                              });
                            }

                            // Close the sheet and reset editing state
                            f7.sheet.close("#sheet-edit-video");
                            setEditingVideo(null);
                            // Reset temporary state
                            setTempTitle("");
                            setTempUrl("");
                            setTempDescription("");
                          } catch (error) {
                            console.error("Error deleting video entry:", error);
                            f7.toast.show({
                              text: `Error deleting video: ${error.message}`,
                            });
                          }
                        }
                      );
                    }}
                    fill
                    iconF7="trash"
                  />
                </>
              ) : (
                <Button
                  fill
                  onClick={async () => {
                    if (!assertCanManageCurrentSchool()) {
                      return;
                    }

                    if (!currentCategoryForAdd) {
                      f7.dialog.alert(
                        "Please select a category to add a video."
                      );
                      return;
                    }

                    if (tempTitle.trim() === "") {
                      f7.dialog.alert("Title mag niet leeg zijn");
                      return;
                    }

                    if (tempUrl.trim() === "") {
                      f7.dialog.alert("URL mag niet leeg zijn");
                      return;
                    }

                    // Add the new video to the selected category
                    addNewVideo(
                      currentCategoryForAdd,
                      tempTitle,
                      tempUrl,
                      tempDescription
                    );

                    f7.toast.show({
                      text: "Video added successfully",
                    });

                    // Close the sheet and reset adding state
                    f7.sheet.close("#sheet-edit-video");
                    setEditingVideo(null);
                    setIsAddingNew(false);
                    // Reset temporary state
                    setTempTitle("");
                    setTempUrl("");
                    setTempDescription("");
                  }}
                >
                  Video Toevoegen
                </Button>
              )}
            </CardFooter>
          </Block>
        </Page>
      </Sheet>
    </Page>
  );
};

export default YTVideos;
