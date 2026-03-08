// src/components/YTVideosSidePanel.jsx
import React from "react";
import { Panel, List, ListItem, Button, f7 } from "framework7-react";
import { useAdminStatus } from "../contexts/AdminStatusContext";

const YTVideosSidePanel = ({
  onScrollToCategory,
  videoData,
  onPushToDatabase
}) => {
  const { canManageCurrentSchool } = useAdminStatus();
  // Get all categories from videoData
  const categories = videoData ? Object.keys(videoData.categorieën || {}) : [];

  return (
    <Panel right id="yt-videos-side-panel">
      <div style={{ padding: "10px" }}>
        {onPushToDatabase && (
          <Button fill onClick={onPushToDatabase}>
            Push Videos to Database
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <List noHairlines>
        {categories.map((categoryKey) => (
          <ListItem
            link="#"
            key={categoryKey}
            title={`${categoryKey} (${videoData.categorieën[categoryKey].length})`}
            iconF7="play_circle_fill"
            onClick={() => {
              f7.panel.close("#yt-videos-side-panel");
              setTimeout(() => {
                if (onScrollToCategory) {
                  onScrollToCategory(categoryKey);
                }
              }, 500);
            }}
          />
        ))}
      </List>

      {canManageCurrentSchool && (
        <div style={{ padding: "10px" }}>
          <Button
            fill
            onClick={() => {
              f7.panel.close("#yt-videos-side-panel");
              setTimeout(() => {
                f7.sheet.open(".sheet-manage-yt-videos-categories");
              }, 500);
            }}
            text="Manage Categories"
            iconF7="pencil"
          />
        </div>
      )}
    </Panel>
  );
};

export default YTVideosSidePanel;
