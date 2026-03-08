import React, { useState } from "react";
import {
  Page,
  Navbar,
  NavTitle,
  Block,
  NavRight,
  Button,
  Icon,
  f7,
} from "framework7-react";
import TrafficRules from "./TrafficRules";

const TrafficRulesSheet = () => {
  // State to track which items are expanded
  const [expandedItems, setExpandedItems] = useState({});

  // Toggle expanded state for a specific item
  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const listItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const expandStyle = {
    marginTop: "5px",
    marginBottom: "20px",
    paddingLeft: "20px",
    fontStyle: "italic",
  };

  return (
    <Page>
      <Navbar>
        <NavTitle>🚦 Maquette Regels</NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{
              width: "36px",
              height: "36px",
              marginRight: "8px",
              cursor: "pointer",
            }}
            onClick={() => {
              setExpandedItems({});
              f7.sheet.close("#sheet-traffic-rules");
            }}
          >
            <Icon f7="xmark" style={{ fontSize: "18px" }} />
          </div>
        </NavRight>
      </Navbar>

      <TrafficRules />
    </Page>
  );
};

export default TrafficRulesSheet;
