import {
  Navbar,
  Page,
  Button,
  Sheet,
  NavTitle,
  NavLeft,
  CardFooter,
  f7,
} from "framework7-react";
import { useState, useEffect, useRef } from "react";
import { useMaquetteGroups } from "../contexts/MaquetteGroupsContext.jsx";
import MaquetteEdit from "../components/MaquetteEdit.jsx";
import { pageStyles } from "../styles/maquetteStyles.js";
import MaquetteCanvas from "../components/MaquetteCanvas.jsx";
import NavHomeButton from "../components/NavHomeButton";

const MaquetteBuilder = () => {
  const debugLog = () => {};
  // Initial maquette data - now as state instead of constant
  const [maquettenData, setMaquettenData] = useState({
    maquette_001: {
      id: "7b28fb32-b609-4383-b868-3eab55e98851",
      title: "Tek. 3",
      answer:
        "<p><strong>Volgorde</strong>: 2-1</p><ul><li>2 rijdt eerst (rechtdoor met LV)</li><li>1 rijdt daarna (buigt af)</li></ul>",
      roadsize: "S/B",
      sequence: "2-1",
      groupName: "WegenVanGelijkeRangorde",
      importantNotes:
        "<p><strong>Regel</strong>: Rechtdoor met LV rijdt eerst.</p>",
      top: {
        vehicles: [
          [
            {
              id: "top_1",
              name: "S1",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_2",
              name: "S2",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_3",
              name: "S3",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "top_4",
              name: "S4",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_5",
              name: "S5",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_6",
              name: "S6",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "top_7",
              name: "S7",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_8",
              name: "S8",
              type: "space",
              direction: "straight",
            },
            {
              id: "top_9",
              name: "S9",
              type: "space",
              direction: "straight",
            },
          ],
        ],
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      left: {
        vehicles: [
          [
            {
              id: "left_1",
              name: "S1",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_2",
              name: "S2",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_3",
              name: "S3",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "left_4",
              name: "S4",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_5",
              name: "S5",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_6",
              name: "S6",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "left_7",
              name: "S7",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_8",
              name: "S8",
              type: "space",
              direction: "straight",
            },
            {
              id: "left_9",
              name: "S9",
              type: "space",
              direction: "straight",
            },
          ],
        ],
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      notes: "",
      right: {
        vehicles: [
          [
            {
              id: "right_1",
              name: "S1",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_2",
              name: "S2",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_3",
              name: "S3",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "right_4",
              name: "S4",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_5",
              name: "S5",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_6",
              name: "S6",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "right_7",
              name: "S7",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_8",
              name: "S8",
              type: "space",
              direction: "straight",
            },
            {
              id: "right_9",
              name: "S9",
              type: "space",
              direction: "straight",
            },
          ],
        ],
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      bottom: {
        vehicles: [
          [
            {
              id: "bottom_1",
              name: "S1",
              type: "space",
              direction: "straight",
            },
            {
              id: "bottom_2",
              name: "S2",
              type: "space",
              direction: "right",
            },
            {
              id: "bottom_3",
              name: "S3",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "bottom_4",
              name: "S4",
              type: "space",
              direction: "straight",
            },
            {
              id: "bottom_5",
              name: "S5",
              type: "space",
              direction: "straight",
            },
            {
              id: "bottom_6",
              name: "S6",
              type: "space",
              direction: "straight",
            },
          ],
          [
            {
              id: "bottom_7",
              name: "S7",
              type: "space",
              direction: "straight",
            },
            {
              id: "bottom_8",
              name: "S8",
              type: "space",
              direction: "straight",
            },
            {
              id: "bottom_9",
              name: "S9",
              type: "space",
              direction: "straight",
            },
          ],
        ],
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
    },
  });

  // Current maquette derived from state
  const maquette = maquettenData.maquette_001;

  const [currentGroup, setCurrentGroup] = useState({});
  const [activeSection, setActiveSection] = useState();
  const { maquetteGroups } = useMaquetteGroups();

  // Ref for canvas to access screenshot functionality
  const maquetteCanvasRef = useRef(null);

  const [maquetteEditData, setmaquetteEditData] = useState({
    groupName: null,
    sequence: null,
    answer: null,
    importantNotes: null,
    maquetteNumber: null,
    onDataUpdate: null,
    pageStyles: null,
    maquettenData: null,
    createDefaultMaquetteVehicles: null,
  });

  useEffect(() => {
    const items = getNavigationItems();
    const currentItem = items.find((item, index) => index === 0);

    if (currentItem) {
      setActiveSection(currentItem.id);
      // Find the actual group object from maquetteGroups based on the active section
      const group = maquetteGroups.find((group) => group.id === currentItem.id);
      setCurrentGroup(group || {});
    }
  }, [maquetteGroups]); // Add maquetteGroups as dependency since we're using it in this effect

  // Handle URL scrolling and bookmark navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToId = urlParams.get("scrollTo");
    const maquetteId = urlParams.get("id"); // Handle direct maquette ID parameter

    // If there's a direct maquette ID parameter but no page parameter (which would go to single-maquette page),
    // this might happen for backward compatibility or direct links - handle appropriately
    if (maquetteId && !scrollToId) {
      // Find the maquette by ID and determine its number for scrolling
      const maquetteEntry = Object.values(maquettenData || {}).find(
        (item) => item.id === maquetteId
      );

      if (maquetteEntry) {
        // Extract the maquette number from the key
        const maquetteKey = Object.keys(maquettenData).find(
          (key) => maquettenData[key].id === maquetteId
        );

        if (maquetteKey) {
          const maquetteNumber = maquetteKey.replace("maquette_", "");
          const scrollToElementId = `maquette-${maquetteNumber}`;

          // Find which group this maquette belongs to
          if (maquetteEntry.groupName) {
            // Activate the correct group section
            setActiveSection(maquetteEntry.groupName);
          }

          // Scroll to the element using requestAnimationFrame to avoid forced reflows
          if (typeof window !== "undefined") {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const element = document.getElementById(scrollToElementId);
                if (element) {
                  // Use immediate scroll to avoid triggering layout thrashing
                  element.scrollIntoView({ behavior: "auto", block: "center" });
                }
              }, 100); // Reduced delay
            });
          }
        }
      }
    } else if (scrollToId) {
      // Check if this is a maquette bookmark
      if (scrollToId.startsWith("maquette-")) {
        const maquetteNumber = scrollToId.replace("maquette-", "");

        // Find which group this maquette belongs to
        const maquetteKey = `maquette_${maquetteNumber}`;
        const maquetteData = maquettenData[maquetteKey];

        if (maquetteData && maquetteData.groupName) {
          // Activate the correct group section
          setActiveSection(maquetteData.groupName);
        }
      }

      // Scroll to the element using requestAnimationFrame to avoid forced reflows
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const element = document.getElementById(scrollToId);
            if (element) {
              // Use immediate scroll to avoid triggering layout thrashing
              element.scrollIntoView({ behavior: "auto", block: "center" });
            }
          }, 100); // Reduced delay
        });
      }
    }
  }, [maquettenData]);

  // Function to handle screenshot capture
  const handleGrabScreenshot = () => {
    if (!maquetteCanvasRef.current) {
      console.warn("Canvas ref not available");
      return;
    }

    try {
      const canvas = maquetteCanvasRef.current.getCanvas();
      if (!canvas) {
        console.warn("Canvas element not available");
        return;
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `maquette-001.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        f7.toast
          .create({
            text: "Screenshot saved!",
            position: "center",
            closeTimeout: 2000,
          })
          .open();
      }, "image/png");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      f7.toast
        .create({
          text: "Failed to capture screenshot",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    }
  };

  // Function to handle data updates from MaquetteEdit
  const handleMaquetteDataUpdate = (updatedData) => {
    debugLog("MaquetteBuilder: Received data update", updatedData);

    // Update the local state with the new data
    // The updatedData should be the full maquettenData object or a function that updates it
    if (typeof updatedData === "function") {
      // If it's a function, call it with current maquettenData and update state
      setMaquettenData((prevData) => {
        const newData = updatedData(prevData);
        debugLog("MaquetteBuilder: Updated data from function", newData);
        return newData;
      });
    } else {
      // If it's direct data, use it to update state
      debugLog("MaquetteBuilder: Updated data directly", updatedData);
      setMaquettenData(updatedData);
    }
  };

  // Function to create default vehicle structure for all directions
  const createDefaultMaquetteVehicles = () => {
    const createSpace = (direction, rowIndex, colIndex) => {
      const positionNumber = rowIndex * 3 + colIndex + 1;
      return {
        type: "space",
        direction: "straight",
        id: `${direction}_${positionNumber}`,
        name: `S${positionNumber}`,
      };
    };

    const createDirectionVehicles = (direction) => {
      return [
        [
          createSpace(direction, 0, 0),
          createSpace(direction, 0, 1),
          createSpace(direction, 0, 2),
        ],
        [
          createSpace(direction, 1, 0),
          createSpace(direction, 1, 1),
          createSpace(direction, 1, 2),
        ],
        [
          createSpace(direction, 2, 0),
          createSpace(direction, 2, 1),
          createSpace(direction, 2, 2),
        ],
      ];
    };

    return {
      top: {
        vehicles: createDirectionVehicles("top"),
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      bottom: {
        vehicles: createDirectionVehicles("bottom"),
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      left: {
        vehicles: createDirectionVehicles("left"),
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
      right: {
        vehicles: createDirectionVehicles("right"),
        trafficsign: null,
        note: null,
        bikelanes: false,
        trafficSignRotate: 0,
      },
    };
  };

  // Get navigation items array
  const getNavigationItems = () => {
    const items = [
      ...maquetteGroups.map((group) => ({
        id: group.id,
        title: group.title,
        icon: group.icon,
      })),
    ];

    return items;
  };

  return (
    <Page name="maquette" id="maquette-page" className="page-neu">
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          Maquette Builder
        </NavTitle>
      </Navbar>

      <CardFooter>
        <div />
        <Button
          fill
          iconF7="pencil"
          text="Edit"
          onClick={() => {
            setmaquetteEditData({
              groupName: maquette?.groupName,
              sequence: maquette?.sequence,
              answer: maquette?.answer,
              importantNotes: maquette?.importantNotes,
              maquettenData: maquettenData,
              maquetteNumber: "001",
              onDataUpdate: handleMaquetteDataUpdate,
              pageStyles: pageStyles,
              createDefaultMaquetteVehicles: createDefaultMaquetteVehicles,
            });
            f7.sheet.open("#maquette-edit-sheet");
          }}
        />
      </CardFooter>
      <div id={`maquette-001`} className="neu-card" style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <MaquetteCanvas
            isPlain={true}
            ref={maquetteCanvasRef}
            maquetteNumber={"001"}
            maquetteData={maquette}
            roadsize={maquette?.roadsize}
            width={350}
            height={350}
          />
        </div>
      </div>

      <CardFooter>
        <Button fill text="Screenshot" onClick={handleGrabScreenshot} />
      </CardFooter>

      <Sheet id="maquette-edit-sheet" style={{ height: "100vh" }}>
        <MaquetteEdit
          isPlain={true}
          groupName={maquetteEditData?.groupName}
          sequence={maquetteEditData?.sequence}
          answer={maquetteEditData?.answer}
          importantNotes={maquetteEditData?.importantNotes}
          maquetteNumber={maquetteEditData?.maquetteNumber}
          onDataUpdate={maquetteEditData?.onDataUpdate}
          pageStyles={maquetteEditData?.pageStyles}
          maquettenData={maquetteEditData?.maquettenData}
          createDefaultMaquetteVehicles={
            maquetteEditData?.createDefaultMaquetteVehicles
          }
        />
      </Sheet>
    </Page>
  );
};

export default MaquetteBuilder;


