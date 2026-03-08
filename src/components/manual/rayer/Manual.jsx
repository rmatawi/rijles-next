import React, { useEffect, useMemo, useRef, useState } from "react";
import CrossroadDiagram from "../../CrossroadDiagram";
import MaquetteDisplay from "../../MaquetteDisplay";
import { convertTo3x3Grid, getLayout } from "../../../js/utils";
import { manualMaquetteService } from "../../../services/manualMaquetteService";
import { useStudentStatus } from "../../../contexts/StudentStatusContext.jsx";
import { useAdminStatus } from "../../../contexts/AdminStatusContext.jsx";
import {
  manualMaquetteData_1,
  manualMaquetteData_2,
  manualMaquetteData_3,
  manualMaquetteData_4,
  manualMaquetteData_5,
  manualMaquetteData_6,
  manualMaquetteData_7,
  manualMaquetteData_8,
  manualMaquetteData_9,
  manualMaquetteData_10,
  manualMaquetteData_11,
  manualMaquetteData_12,
  manualMaquetteData_13,
  manualMaquetteData_14,
  manualMaquetteData_15,
  manualMaquetteData_16,
  manualMaquetteData_17,
  manualMaquetteData_18,
  manualMaquetteData_19,
  manualMaquetteData_20,
  manualMaquetteData_21,
  manualMaquetteData_22,
  manualMaquetteData_23,
  manualMaquetteData_24,
  manualMaquetteData_25,
  manualMaquetteData_26,
  manualMaquetteData_27,
  manualMaquetteData_28,
  manualMaquetteData_29,
  manualMaquetteData_30,
  manualMaquetteData_31,
  manualMaquetteData_32,
  manualMaquetteData_33,
  manualMaquetteData_34,
  manualMaquetteData_35,
  manualMaquetteData_36,
  manualMaquetteData_37,
  manualMaquetteData_38,
} from "../../../data/maquettes/manualMaquetteDataRayer.js";
import { List, ListItem } from "framework7-react";
import LocalAdPlaceholder from "../../LocalAdPlaceholder";

const MANUAL_STORAGE_KEY = "manualDataSrc";
const MANUAL_SAVE_DEBOUNCE_MS = 800;
const MANUAL_SCROLL_OFFSET = 100;
const MANUAL_SECTIONS = [
  { id: "handleiding", label: "Handleiding" },
  { id: "afkortingen", label: "Afkortingen" },
  { id: "links-rechts", label: "Links en rechts" },
  { id: "voorsorteren", label: "Voorsorteren" },
  { id: "gelijke-rangorde", label: "Wegen van gelijke rangorde" },
  { id: "t-kruising", label: "T-kruising" },
  { id: "sirene", label: "Volgorde van sirene" },
  { id: "tweewieler", label: "Tweewieler naast auto" },
  { id: "inritten", label: "Inritten" },
];
const INLINE_TAGS = new Set([
  "strong",
  "em",
  "span",
  "br",
  "code",
  "u",
  "i",
  "b",
  "small",
  "sup",
  "sub",
  "mark",
  "a",
]);

const MANUAL_MAQUETTE_DEFAULTS = [
  { index: 1, data: manualMaquetteData_1 },
  { index: 2, data: manualMaquetteData_2 },
  { index: 3, data: manualMaquetteData_3 },
  { index: 4, data: manualMaquetteData_4 },
  { index: 5, data: manualMaquetteData_5 },
  { index: 6, data: manualMaquetteData_6 },
  { index: 7, data: manualMaquetteData_7 },
  { index: 8, data: manualMaquetteData_8 },
  { index: 9, data: manualMaquetteData_9 },
  { index: 10, data: manualMaquetteData_10 },
  { index: 11, data: manualMaquetteData_11 },
  { index: 12, data: manualMaquetteData_12 },
  { index: 13, data: manualMaquetteData_13 },
  { index: 14, data: manualMaquetteData_14 },
  { index: 15, data: manualMaquetteData_15 },
  { index: 16, data: manualMaquetteData_16 },
  { index: 17, data: manualMaquetteData_17 },
  { index: 18, data: manualMaquetteData_18 },
  { index: 19, data: manualMaquetteData_19 },
  { index: 20, data: manualMaquetteData_20 },
  { index: 21, data: manualMaquetteData_21 },
  { index: 22, data: manualMaquetteData_22 },
  { index: 23, data: manualMaquetteData_23 },
  { index: 24, data: manualMaquetteData_24 },
  { index: 25, data: manualMaquetteData_25 },
  { index: 26, data: manualMaquetteData_26 },
  { index: 27, data: manualMaquetteData_27 },
  { index: 28, data: manualMaquetteData_28 },
  { index: 29, data: manualMaquetteData_29 },
  { index: 30, data: manualMaquetteData_30 },
  { index: 31, data: manualMaquetteData_31 },
  { index: 32, data: manualMaquetteData_32 },
  { index: 33, data: manualMaquetteData_33 },
  { index: 34, data: manualMaquetteData_34 },
  { index: 35, data: manualMaquetteData_35 },
  { index: 36, data: manualMaquetteData_36 },
  { index: 37, data: manualMaquetteData_37 },
  { index: 38, data: manualMaquetteData_38 },
];

const getManualStorageId = (data, index) => data?.id || `manual_${index}`;

const buildManualDataSource = () => {
  const source = {};

  MANUAL_MAQUETTE_DEFAULTS.forEach(({ data, index }) => {
    const storageId = getManualStorageId(data, index);
    source[`maquette_${storageId}`] = convertTo3x3Grid(data);
  });

  return source;
};

const normalizeManualData = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const normalized = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === "object") {
      normalized[key] = convertTo3x3Grid(value);
    } else {
      normalized[key] = value;
    }
  });

  return normalized;
};

const createSpace = (rowIndex, colIndex, quadrant) => {
  const positionNumber = rowIndex * 4 + colIndex + 1;
  return {
    type: "space",
    direction: "straight",
    id: `${quadrant}_${positionNumber}`,
    name: `S${positionNumber}`,
  };
};

const createEmptyQuadrant = (quadrant) => ({
  vehicles: [
    [
      createSpace(0, 0, quadrant),
      createSpace(0, 1, quadrant),
      createSpace(0, 2, quadrant),
      createSpace(0, 3, quadrant),
    ],
    [
      createSpace(1, 0, quadrant),
      createSpace(1, 1, quadrant),
      createSpace(1, 2, quadrant),
      createSpace(1, 3, quadrant),
    ],
    [
      createSpace(2, 0, quadrant),
      createSpace(2, 1, quadrant),
      createSpace(2, 2, quadrant),
      createSpace(2, 3, quadrant),
    ],
  ],
});

const isInlineNode = (node) => {
  if (typeof node === "string" || typeof node === "number") {
    return true;
  }

  if (!React.isValidElement(node)) {
    return false;
  }

  if (node.type === React.Fragment) {
    return React.Children.toArray(node.props.children).every(isInlineNode);
  }

  if (typeof node.type === "string") {
    if (!INLINE_TAGS.has(node.type)) {
      return false;
    }
    return React.Children.toArray(node.props.children).every(isInlineNode);
  }

  return false;
};

const hasSameNonChildProps = (first, second) => {
  const firstKeys = Object.keys(first.props).filter(
    (key) => key !== "children",
  );
  const secondKeys = Object.keys(second.props).filter(
    (key) => key !== "children",
  );

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  for (const key of firstKeys) {
    if (!secondKeys.includes(key)) {
      return false;
    }

    if (key === "style") {
      if (first.props.style !== second.props.style) {
        return false;
      }
      continue;
    }

    if (first.props[key] !== second.props[key]) {
      return false;
    }
  }

  return true;
};

const canMergeParagraphs = (first, second) => {
  if (!React.isValidElement(first) || !React.isValidElement(second)) {
    return false;
  }

  if (first.type !== "p" || second.type !== "p") {
    return false;
  }

  if (!hasSameNonChildProps(first, second)) {
    return false;
  }

  if (
    first.props.dangerouslySetInnerHTML ||
    second.props.dangerouslySetInnerHTML
  ) {
    return false;
  }

  return (
    React.Children.toArray(first.props.children).every(isInlineNode) &&
    React.Children.toArray(second.props.children).every(isInlineNode)
  );
};

const mergeParagraphsWithLineBreaks = (children) => {
  const items = React.Children.toArray(children);
  const merged = [];

  for (let i = 0; i < items.length; i += 1) {
    const current = items[i];
    const next = items[i + 1];

    if (next && canMergeParagraphs(current, next)) {
      const key = current.key ?? `merged-${i}`;
      merged.push(
        React.cloneElement(current, { key }, [
          current.props.children,
          <br key={`${key}-br`} />,
          next.props.children,
        ]),
      );
      i += 1;
      continue;
    }

    merged.push(current);
  }

  return merged;
};

const styles = {
  introContainer: {
    padding: "8px 16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  intro: {
    margin: 0,
    lineHeight: 1.65,
    opacity: 0.85,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: {
    margin: "4px 0 0",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  subTitle: {
    margin: "8px 0 0",
    fontWeight: 600,
  },
  paragraph: {
    margin: 0,
    lineHeight: 1.6,
    opacity: 0.88,
    marginLeft: "8px",
  },
  list: {
    margin: "0 0 0 28px",
    padding: 0,
    lineHeight: 1.6,
  },
  rulesList: {
    margin: "0 0 0 18px",
    padding: 0,
    lineHeight: 1.6,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  ruleItem: {
    listStylePosition: "outside",
    padding: "10px 12px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
  },
  ruleCard: {
    padding: "10px 12px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
  },
  ruleQuestion: {
    fontWeight: 700,
    marginBottom: "6px",
  },
  ruleAnswers: {
    margin: "0 0 0 18px",
    padding: 0,
    lineHeight: 1.6,
  },
  abbreviationsList: {
    margin: 0,
    padding: 0,
    lineHeight: 1.6,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "24px",
    rowGap: "6px",
    listStylePosition: "inside",
  },
  maquetteBlock: {
    marginTop: "6px",
  },
  note: {
    margin: 0,
    padding: "10px 12px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "10px",
  },
  legend: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginLeft: "8px",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
  },
  legendSwatch: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "1px solid rgba(0, 0, 0, 0.15)",
  },
  imageRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "12px",
    marginBottom: "8px",
  },
  figure: {
    margin: 0,
    padding: "10px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  figureImage: {
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    display: "block",
  },
  figureCaption: {
    margin: 0,
    fontSize: "0.9rem",
    opacity: 0.75,
    textAlign: "center",
  },
  backToTopWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 10px",
  },
  backToTopButton: {
    border: "1px solid rgba(0, 0, 0, 0.22)",
    background: "rgba(255, 255, 255, 0.96)",
    borderRadius: "999px",
    padding: "6px 12px",
    fontWeight: 600,
    color: "#005a9c",
    cursor: "pointer",
    width: "50%",
    WebkitTextFillColor: "#005a9c",
  },
  navCard: {
    padding: "12px 14px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navHeading: {
    margin: 0,
    fontWeight: 700,
  },
  navSelect: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid rgba(0, 0, 0, 0.2)",
    background: "#fff",
    fontSize: "0.95rem",
  },
};

const IntroContainer = ({ children }) => (
  <div style={styles.introContainer}>
    {mergeParagraphsWithLineBreaks(children)}
  </div>
);

const Manual = ({ setmaquetteEditData, onActiveSectionChange }) => {
  const [manualMaquettes, setManualMaquettes] = useState(buildManualDataSource);
  const [isManualDataReady, setIsManualDataReady] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [activeSubsectionLabel, setActiveSubsectionLabel] = useState("");
  const lastManualStorageValueRef = useRef(null);
  const { isStudent: isStudentStatus, loading: isStudentLoading } =
    useStudentStatus();
  // `isAdmin` is coarse/global. Writes are guarded by canManageCurrentSchool.
  const { isAdmin: isAdminStatus, canManageCurrentSchool } = useAdminStatus();
  const canViewExtendedManual = isStudentStatus || isAdminStatus;
  const visibleManualSections = useMemo(
    () =>
      canViewExtendedManual ? MANUAL_SECTIONS : MANUAL_SECTIONS.slice(0, 4),
    [canViewExtendedManual],
  );
  const topRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadManualData = async () => {
      const defaultSource = buildManualDataSource();
      let mergedSource = defaultSource;

      try {
        const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        if (schoolId) {
          const { data, error } =
            await manualMaquetteService.getManualMaquettesBySchoolId(schoolId);
          if (!error && data?.manual_data) {
            mergedSource = {
              ...mergedSource,
              ...normalizeManualData(data.manual_data),
            };
          }
        }
      } catch (error) {
        console.warn(
          "Failed to load manual maquette data from database:",
          error,
        );
      }

      try {
        const savedData = localStorage.getItem(MANUAL_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData && typeof parsedData === "object") {
            mergedSource = {
              ...mergedSource,
              ...normalizeManualData(parsedData),
            };
          }
        }
      } catch (error) {
        console.warn(
          "Failed to load manual maquette data from local storage:",
          error,
        );
      }

      if (!isMounted) return;
      setManualMaquettes(mergedSource);
      const serializedSource = JSON.stringify(mergedSource);
      localStorage.setItem(MANUAL_STORAGE_KEY, serializedSource);
      lastManualStorageValueRef.current = serializedSource;
      setIsManualDataReady(true);
    };

    loadManualData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isManualDataReady) return;
    const serializedManualData = JSON.stringify(manualMaquettes);
    localStorage.setItem(MANUAL_STORAGE_KEY, serializedManualData);
    lastManualStorageValueRef.current = serializedManualData;

    if (isStudentLoading || isStudentStatus) {
      return;
    }

    if (!canManageCurrentSchool) {
      return;
    }

    const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    if (!schoolId) return;

    const saveTimer = setTimeout(() => {
      manualMaquetteService.upsertManualMaquettes(schoolId, manualMaquettes);
    }, MANUAL_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(saveTimer);
  }, [
    manualMaquettes,
    isManualDataReady,
    isStudentLoading,
    isStudentStatus,
    canManageCurrentSchool,
  ]);

  useEffect(() => {
    if (!isManualDataReady) return;

    const syncFromStorage = () => {
      try {
        const storedValue = localStorage.getItem(MANUAL_STORAGE_KEY);
        if (storedValue === lastManualStorageValueRef.current) {
          return;
        }

        if (!storedValue) {
          const resetSource = buildManualDataSource();
          setManualMaquettes(resetSource);
          lastManualStorageValueRef.current = null;
          return;
        }

        const parsedData = JSON.parse(storedValue);
        if (!parsedData || typeof parsedData !== "object") {
          return;
        }

        const mergedSource = {
          ...buildManualDataSource(),
          ...normalizeManualData(parsedData),
        };
        setManualMaquettes(mergedSource);
        lastManualStorageValueRef.current = storedValue;
      } catch (error) {
        console.warn(
          "Failed to sync manual maquette data from local storage:",
          error,
        );
      }
    };

    const intervalId = setInterval(syncFromStorage, 1000);
    return () => clearInterval(intervalId);
  }, [isManualDataReady]);

  const handleCriteriaShow = (criteriaDetail) => {
    if (criteriaDetail && typeof criteriaDetail.onConfirm === "function") {
      criteriaDetail.onConfirm();
    }
  };

  const getScrollParent = (node) => {
    let current = node?.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        current.scrollHeight > current.clientHeight
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  };

  const scrollToWithOffset = (target, offset = MANUAL_SCROLL_OFFSET) => {
    if (!target) return;
    const scrollParent = getScrollParent(target);

    if (scrollParent === window) {
      const top =
        target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
      return;
    }

    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top =
      targetRect.top - parentRect.top + scrollParent.scrollTop - offset;
    scrollParent.scrollTo({ top, behavior: "smooth" });
  };

  const handleJumpToSection = (event) => {
    const targetId = event.target.value;
    if (!targetId) return;
    const target = document.getElementById(targetId);
    scrollToWithOffset(target);
  };

  useEffect(() => {
    if (!visibleManualSections.length) {
      setActiveSectionId("");
      setActiveSubsectionLabel("");
      return;
    }

    setActiveSectionId((previous) => {
      const isStillVisible = visibleManualSections.some(
        (section) => section.id === previous,
      );
      return isStillVisible ? previous : visibleManualSections[0].id;
    });
  }, [visibleManualSections]);

  useEffect(() => {
    if (!visibleManualSections.length) return;

    const sectionElements = visibleManualSections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (!sectionElements.length) return;

    const scrollParent = getScrollParent(sectionElements[0]);
    const updateActiveSection = () => {
      const isWindowScroll = scrollParent === window;
      const parentTop = isWindowScroll
        ? 0
        : scrollParent.getBoundingClientRect().top;
      const activationLine = parentTop + MANUAL_SCROLL_OFFSET + 20;

      let nextActiveId = visibleManualSections[0].id;
      for (const section of sectionElements) {
        if (section.getBoundingClientRect().top <= activationLine) {
          nextActiveId = section.id;
          continue;
        }
        break;
      }

      let nextSubsectionLabel = "";
      const activeSectionElement = document.getElementById(nextActiveId);
      if (activeSectionElement) {
        const subHeadings = Array.from(
          activeSectionElement.querySelectorAll("h3"),
        );
        for (const heading of subHeadings) {
          if (heading.getBoundingClientRect().top <= activationLine) {
            nextSubsectionLabel = heading.textContent?.trim() || "";
            continue;
          }
          break;
        }
      }

      setActiveSectionId((previous) =>
        previous === nextActiveId ? previous : nextActiveId,
      );
      setActiveSubsectionLabel((previous) =>
        previous === nextSubsectionLabel ? previous : nextSubsectionLabel,
      );
    };

    updateActiveSection();

    const scrollTarget = scrollParent === window ? window : scrollParent;
    scrollTarget.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      scrollTarget.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [visibleManualSections]);

  const handleBackToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getManualEntry = (fallbackData, index) => {
    const storageId = getManualStorageId(fallbackData, index);
    const key = `maquette_${storageId}`;
    return {
      entry: manualMaquettes[key] || fallbackData,
      storageId,
    };
  };

  const handleManualDataUpdate = (updatedData, maquetteNumber) => {
    const maquetteKey = `maquette_${maquetteNumber}`;

    if (typeof updatedData === "function") {
      setManualMaquettes((prevData) => updatedData(prevData));
      return;
    }

    if (
      updatedData &&
      typeof updatedData === "object" &&
      updatedData.type === "deleteMaquette"
    ) {
      setManualMaquettes((prevData) => {
        const nextData = { ...prevData };
        delete nextData[maquetteKey];
        return nextData;
      });
      return;
    }

    if (
      updatedData &&
      typeof updatedData === "object" &&
      maquetteNumber === null
    ) {
      setManualMaquettes(updatedData);
      return;
    }

    if (updatedData && typeof updatedData === "object") {
      setManualMaquettes((prevData) => ({
        ...prevData,
        [maquetteKey]: {
          ...prevData[maquetteKey],
          ...updatedData,
        },
      }));
    }
  };

  const createDefaultMaquetteVehicles = () => ({
    top: createEmptyQuadrant("top"),
    right: createEmptyQuadrant("right"),
    bottom: createEmptyQuadrant("bottom"),
    left: createEmptyQuadrant("left"),
  });

  const renderManualMaquette = (fallbackData, index) => {
    const { entry, storageId } = getManualEntry(fallbackData, index);

    return (
      <MaquetteDisplay
        getLayout={getLayout}
        title={entry.title}
        groupName={entry.groupName || "manual"}
        sequence={entry.sequence || ""}
        answer={entry.answer || ""}
        importantNotes={entry.importantNotes || ""}
        maquetteId={entry.id || null}
        maquetteNumber={storageId}
        indexMaquette={0}
        mode="study"
        isBookmarked={() => false}
        toggleBookmark={() => {}}
        setEditMode={() => {}}
        onDataUpdate={(updatedData) =>
          handleManualDataUpdate(updatedData, storageId)
        }
        maquettenData={manualMaquettes}
        pageStyles={{}}
        createDefaultMaquetteVehicles={createDefaultMaquetteVehicles}
        setmaquetteEditData={setmaquetteEditData || (() => {})}
        onCriteriaShow={handleCriteriaShow}
        showCardFooter={false}
      />
    );
  };
  const activeSectionLabel =
    visibleManualSections.find((section) => section.id === activeSectionId)
      ?.label ||
    visibleManualSections[0]?.label ||
    "";

  useEffect(() => {
    if (typeof onActiveSectionChange === "function") {
      onActiveSectionChange(activeSectionLabel, activeSubsectionLabel);
    }
  }, [activeSectionLabel, activeSubsectionLabel, onActiveSectionChange]);

  const renderChapterAd = (adSlot, chapterLabel) => (
    <div style={{ margin: "20px 16px 28px" }}>
      <LocalAdPlaceholder
        adSlot={`manual-${adSlot}`}
        headline="Lokale advertentie"
        description={`Sponsorvermelding na hoofdstuk: ${chapterLabel}.`}
        ctaLabel="Bekijk adverteerpakketten"
      />
    </div>
  );

  return (
    <div ref={topRef} style={styles.container}>
      <section id="handleiding" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>Handleiding</h2>
        <IntroContainer>
          <p className="neu-text-primary" style={styles.intro}>
            De basisregels helpen om het verkeer <strong>vlot</strong> en{" "}
            <strong>veilig</strong> te houden. Om de maquette goed op te lossen,
            moet je de regels <strong>begrijpen</strong> en{" "}
            <strong>gebruiken</strong>.
          </p>

          <h3 style={styles.subTitle}>Hoofdstukken</h3>
          <List dividers mediaList>
            {visibleManualSections.map((section) => (
              <ListItem
                key={section.id}
                link="#"
                onClick={() =>
                  handleJumpToSection({ target: { value: section.id } })
                }
              >
                {section.label}
              </ListItem>
            ))}
          </List>
        </IntroContainer>
      </section>
      {renderChapterAd("handleiding", "Handleiding")}

      <section id="afkortingen" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>Afkortingen</h2>
        <ul style={styles.abbreviationsList}>
          <li>
            <strong>S</strong>: Smalle weg
          </li>
          <li>
            <strong>B</strong>: Brede weg
          </li>
          <li>
            <strong>BF</strong>: Bromfiets
          </li>
          <li>
            <strong>F</strong>: Fiets
          </li>
          <li>
            <strong>MF</strong>: Motorfiets
          </li>
          <li>
            <strong>LA</strong>: Linksaffer
          </li>
          <li>
            <strong>LV</strong>: Links vrij
          </li>
          <li>
            <strong>V.F.</strong>: Verkeersfatsoen
          </li>
          <li>
            <strong>V.F.O.A.H.</strong>: Verkeersfatsoen op alle hoeken
          </li>
          <li>
            <strong>PS</strong>: Politie met Sirene
          </li>
          <li>
            <strong>BS</strong>: Brandweer met Sirene
          </li>
          <li>
            <strong>AS</strong>: Ambulance met Sirene
          </li>
          <li>
            <strong>LS</strong>: Lijkstoet
          </li>
        </ul>
      </section>
      {renderChapterAd("afkortingen", "Afkortingen")}

      <section id="links-rechts" style={styles.section}>
        <IntroContainer>
          <h2 style={styles.sectionTitle}>Links en rechts</h2>
          <p style={styles.paragraph}>
            <em>
              <strong>Belangrijk:</strong> Met links en rechts bedoelen we
              links en rechts <strong>van de bestuurder in de auto</strong>,
              niet van de persoon die kijkt.
            </em>
          </p>
          <p style={styles.paragraph}>
            Klik op een auto. Dan zie je wat links en rechts is voor die auto.
          </p>
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendSwatch, background: "#8dc63f" }} />
              Links
            </span>
            <span style={styles.legendItem}>
              <span
                style={{ ...styles.legendSwatch, background: "#ff0101ff" }}
              />
              Rechts
            </span>
          </div>
        </IntroContainer>
        <div style={styles.maquetteBlock}>
          <CrossroadDiagram />
        </div>
        <IntroContainer>
          <p style={styles.paragraph}>
            Bij een auto is links meestal de kant waar de auto rijdt. In
            Suriname rijden we <em>links</em>.
          </p>
        </IntroContainer>
      </section>
      {renderChapterAd("links-rechts", "Links en rechts")}

      <section id="voorsorteren" style={styles.section}>
        <IntroContainer>
          <h2 style={styles.sectionTitle}>Voorsorteren</h2>
          <h3 style={styles.subTitle}>Smalle weg</h3>
          <p style={styles.paragraph}>
            <em>
              Op een smalle weg ga je <strong>zo ver mogelijk links</strong>{" "}
              staan.
            </em>
          </p>
          <p style={styles.paragraph}>
            <em>
              Er passen naast elkaar maximaal{" "}
              <strong>een fiets en een auto</strong>.
            </em>
          </p>
        </IntroContainer>
        <div style={styles.maquetteBlock}>
          {renderManualMaquette(manualMaquetteData_1, 1)}
        </div>
        <IntroContainer>
          <h3 style={styles.subTitle}>Brede weg</h3>
          <p style={styles.paragraph}>
            <em>
              Op een brede weg mogen <strong>twee auto's</strong> tegelijk
              voorsorteren.
            </em>
          </p>
          <p style={styles.paragraph}>
            <em>Met daarbij maximaal <strong>een fiets</strong>.</em>
          </p>
        </IntroContainer>
        <div style={styles.maquetteBlock}>
          {renderManualMaquette(manualMaquetteData_2, 2)}
        </div>
      </section>
      {renderChapterAd("voorsorteren", "Voorsorteren")}

      {canViewExtendedManual && (
        <>
          <section id="gelijke-rangorde" style={styles.section}>
            <IntroContainer>
              <h2 style={styles.sectionTitle}>Wegen van gelijke rangorde</h2>
              <p style={styles.paragraph}>
                Wegen van gelijke rangorde zijn twee wegen die even belangrijk
                zijn en elkaar kruisen. Er staan daar <strong>geen</strong>{" "}
                stop- of voorrangsborden.
              </p>
              <p style={{ ...styles.paragraph, marginTop: "16px" }}>
                <strong>Op deze kruisingen hebben voorrang:</strong>
              </p>
              <ol style={styles.list}>
                <li>
                  LinksAffers (<strong>LA</strong>)
                  <figure style={styles.figure}>
                    <img
                      src="/img/linksaffers.svg"
                      alt="Doorkruis situatie met voorrang"
                      style={styles.figureImage}
                      loading="lazy"
                    />
                  </figure>
                </li>
                <li>
                  LinksVrij (<strong>LV</strong>)
                  <figure style={styles.figure}>
                    <img
                      src="/img/linksvrij.svg"
                      alt="Doorkruis situatie met voorrang"
                      style={styles.figureImage}
                      loading="lazy"
                    />
                  </figure>
                </li>
                <li>
                  Verkeersfatsoen op alle hoeken (<strong>V.F.O.A.H.</strong>)
                  <br />
                  <p style={styles.paragraph}>
                    Dit heb je als er <strong>geen linksaffer (LA)</strong> is
                    en niemand <strong>LinksVrij (LV)</strong> heeft. Dan moet
                    je <strong>naar rechts wenken</strong>.
                  </p>
                  <p style={styles.paragraph}>
                    Wie wenkt, rijdt <em>meestal als laatste</em>.
                  </p>
                </li>
                <li>
                  Verkeersfatsoen (<strong>V.F.</strong>)
                  <br />
                  <p style={styles.paragraph}>
                    Dit gebeurt als{" "}
                    <strong>een auto en een fietser elkaar kruisen</strong> en
                    allebei <strong>LinksVrij (LV)</strong> hebben.
                  </p>
                  <figure style={styles.figure}>
                    <img
                      src="/img/doorkruis.svg"
                      alt="Doorkruis situatie met voorrang"
                      style={styles.figureImage}
                      loading="lazy"
                    />
                  </figure>
                  <p style={styles.paragraph}>
                    Dit kan ook bij{" "}
                    <strong>twee auto's die tegenover elkaar staan</strong> op
                    een <strong>smalle weg</strong> en allebei{" "}
                    <strong>LinksVrij (LV)</strong> hebben.
                  </p>
                  <figure style={styles.figure}>
                    <img
                      src="/img/vf-situatie.svg"
                      alt="Situatie voor verkeersfatsoen"
                      style={styles.figureImage}
                      loading="lazy"
                    />
                  </figure>
                </li>
              </ol>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              <h3
                style={{
                  ...styles.subTitle,
                  paddingLeft: "16px",
                  marginTop: "28px",
                  marginBottom: "16px",
                }}
              >
                LinksAffers (LA) en LinksVrij (LV)
              </h3>
              {renderManualMaquette(manualMaquetteData_3, 3)}
              {renderManualMaquette(manualMaquetteData_5, 5)}
              <h3
                style={{
                  ...styles.subTitle,
                  paddingLeft: "16px",
                  marginTop: "28px",
                  marginBottom: "16px",
                }}
              >
                Verkeersfatsoen op alle hoeken (V.F.O.A.H.)
              </h3>
              {renderManualMaquette(manualMaquetteData_4, 4)}
              {renderManualMaquette(manualMaquetteData_8, 8)}
              <h3
                style={{
                  ...styles.subTitle,
                  paddingLeft: "16px",
                  marginTop: "28px",
                  marginBottom: "16px",
                }}
              >
                Verkeersfatsoen (V.F.)
              </h3>
              {renderManualMaquette(manualMaquetteData_6, 6)}
              {renderManualMaquette(manualMaquetteData_7, 7)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                Staan twee auto's met <strong>meer dan twee wielen</strong>{" "}
                tegenover elkaar op een <strong>smalle weg</strong> en gaan ze
                allebei <strong>rechtsaf</strong>? Dan gebruik je{" "}
                <em>verkeersfatsoen</em>.
              </p>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_9, 9)}
              {renderManualMaquette(manualMaquetteData_10, 10)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                Staan een auto en een fiets naast elkaar op een smalle of brede
                weg en hebben ze allebei <strong>LinksVrij</strong>? Dan mogen
                ze allebei rijden. De fiets gaat <strong>rechtsaf</strong> en de
                auto <strong>linksaf</strong>. Rijden ze tegelijk, dan botsen
                ze. Daarom gebruik je <em>verkeersfatsoen</em>.
              </p>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_11, 11)}
              {renderManualMaquette(manualMaquetteData_12, 12)}
              {renderManualMaquette(manualMaquetteData_13, 13)}
              {renderManualMaquette(manualMaquetteData_14, 14)}
            </div>

            <IntroContainer>
              <h3 style={styles.subTitle}>Belangrijke regels</h3>
              <div style={styles.ruleCard}>
                <div style={styles.ruleQuestion}>
                  Wanneer mag een rechtdoorder rijden?
                </div>
                <ol style={styles.ruleAnswers}>
                  <li>Als hij LinksVrij (LV) heeft.</li>
                  <li>Als hij op een voorrangsweg staat.</li>
                </ol>
              </div>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_15, 15)}
              {renderManualMaquette(manualMaquetteData_16, 16)}
            </div>

            <IntroContainer>
              <h3 style={styles.subTitle}>Belangrijke regel</h3>
              <div style={styles.ruleCard}>
                <div style={styles.ruleQuestion}>
                  Wanneer mag een rechtsaffer rijden?
                </div>
                <ol style={styles.ruleAnswers}>
                  <li>Als hij LinksVrij (LV) heeft.</li>
                  <li>Als hij geen tegenligger heeft.</li>
                </ol>
              </div>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_17, 17)}
              {renderManualMaquette(manualMaquetteData_18, 18)}
            </div>

            <IntroContainer>
              <h3 style={styles.subTitle}>Belangrijke regel</h3>
              <div style={styles.ruleCard}>
                <div style={styles.ruleQuestion}>
                  De tegenligger van een rechtsaffer is:
                </div>
                <ol style={styles.ruleAnswers}>
                  <li>Een linksaffer.</li>
                  <li>Een rechtdoorder met LinksVrij (LV).</li>
                </ol>
              </div>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_19, 19)}
              {renderManualMaquette(manualMaquetteData_20, 20)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                <strong>LinksVrij</strong> krijg je door:
              </p>
              <ol style={styles.list}>
                <li>Een zandweg</li>
                <li>Stopborden</li>
                <li>Als de weg helemaal vrij is</li>
              </ol>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_21, 21)}
              {renderManualMaquette(manualMaquetteData_22, 22)}
              {renderManualMaquette(manualMaquetteData_23, 23)}
            </div>
          </section>
          {renderChapterAd("gelijke-rangorde", "Wegen van gelijke rangorde")}

          <section id="t-kruising" style={styles.section}>
            <IntroContainer>
              <h2 style={styles.sectionTitle}>T-kruising</h2>
              <p style={styles.paragraph}>
                Een T-kruising is een kruising waar een weg eindigt op een
                andere weg.
              </p>
              <p style={styles.paragraph}>
                De <strong>doorgaande weg</strong> is de hoofdweg, ook als dat
                een zandweg is.
              </p>
            </IntroContainer>

            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_24, 24)}
              {renderManualMaquette(manualMaquetteData_25, 25)}
            </div>
          </section>
          {renderChapterAd("t-kruising", "T-kruising")}

          <section id="sirene" style={styles.section}>
            <IntroContainer>
              <h2 style={styles.sectionTitle}>Volgorde van sirene</h2>
              <ol style={styles.list}>
                <li>P.S. = politie met sirene</li>
                <li>B.S. = brandweer met sirene</li>
                <li>A.S. = ambulance met sirene</li>
                <li>L.S. = lijkstoet</li>
              </ol>
              <p style={styles.paragraph}>
                Ze mogen <strong>nooit tegelijk rijden</strong>, ook niet als ze
                elkaar niet hinderen.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_26, 26)}
            </div>
          </section>
          {renderChapterAd("sirene", "Volgorde van sirene")}

          <section id="tweewieler" style={styles.section}>
            <IntroContainer>
              <h2 style={styles.sectionTitle}>Tweewieler naast auto</h2>
            </IntroContainer>

            <IntroContainer>
              <p style={styles.paragraph}>
                Rijden een auto en fietser naast elkaar en gaan ze allebei{" "}
                <strong>rechtsaf</strong> op een smalle of brede weg{" "}
                <strong>zonder fietspad</strong>? Laat eerst de{" "}
                <strong>auto</strong> gaan, daarna de fietser.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_27, 27)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                Rijden een auto en fietser naast elkaar en gaan ze allebei{" "}
                <strong>rechtsaf</strong> op een smalle of brede weg{" "}
                <strong>met fietspad</strong>? Dan mogen ze{" "}
                <strong>samen oprijden</strong>.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_28, 28)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                Rijden een auto en fietser naast elkaar en gaan ze allebei{" "}
                <strong>linksaf</strong> op een smalle of brede weg{" "}
                <strong>zonder fietspad</strong>? Laat eerst de{" "}
                <strong>fietser</strong> gaan, daarna de auto.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_29, 29)}
            </div>

            <IntroContainer>
              <p style={styles.paragraph}>
                Rijden een auto en fietser naast elkaar en gaan ze allebei{" "}
                <strong>linksaf</strong> op een smalle of brede weg{" "}
                <strong>met fietspad</strong>? Dan mogen ze{" "}
                <strong>samen oprijden</strong>.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_30, 30)}
            </div>
          </section>
          {renderChapterAd("tweewieler", "Tweewieler naast auto")}

          <section id="inritten" style={styles.section}>
            <IntroContainer>
              <h2 style={styles.sectionTitle}>Inritten</h2>
              <p style={styles.paragraph}>
                Een <strong>inritsituatie</strong> lijkt op een{" "}
                <strong>T-kruising</strong>.
              </p>
              <p style={styles.paragraph}>
                <strong>Let op:</strong> al het verkeer dat de inrit in wil,
                wacht aan de zijkant. Is de inrit <strong>smal</strong>, dan mag
                er <strong>geen verkeer</strong> in als die nog bezet is.
              </p>
              <p style={styles.paragraph}>
                Laat eerst verkeer van de <strong>hoofdweg</strong> door dat
                niet de inrit in gaat.
              </p>
              <p style={styles.paragraph}>
                Daarna laat je verkeer van de <strong>zijweg</strong> door, op
                dezelfde manier.
              </p>
              <p style={styles.note}>
                <strong>Kort gezegd:</strong> laat op de weg alleen verkeer over
                dat de inrit in moet. Maak daarna de inrit vrij: eerst de
                hoofdweg, daarna de zijweg.
              </p>
            </IntroContainer>
            <IntroContainer>
              <h3 style={styles.subTitle}>Inrit smal</h3>
              <p style={styles.paragraph}>
                <strong>Wegsituatie: smal.</strong>
              </p>
              <p style={styles.paragraph}>
                Als een rechtdoorder en linksaffer elkaar kruisen, krijg je{" "}
                <strong>V.F.</strong>. Als ze allebei vooraan stonden, mochten
                ze <em>samen rijden</em>.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_31, 31)}
              {renderManualMaquette(manualMaquetteData_32, 32)}
            </div>
          </section>

          <section style={styles.section}>
            <IntroContainer>
              <h3 style={styles.subTitle}>Inrit breed</h3>
              <p style={styles.paragraph}>
                Inrit <strong>breed</strong> en inrit <strong>smal</strong>{" "}
                lijken veel op elkaar. Ook hier moet al het verkeer dat de inrit
                in wil <strong>aan de zijkant sorteren</strong>.
              </p>
              <p style={styles.paragraph}>
                Is de inrit <strong>breed</strong>, dan mag er wel verkeer in de
                inrit staan.
              </p>
              <p style={styles.paragraph}>
                Maak eerst de <strong>hoofdweg vrij</strong>, daarna de zijweg
                en <strong>als laatste</strong> de inrit.
              </p>
              <p style={styles.paragraph}>
                Alleen als je twee rechtsaffers op de hoofdweg hebt en een van
                hen de inrit in gaat, moet je de andere{" "}
                <strong>voorrang</strong> geven. Ze mogen{" "}
                <strong>nooit samen rijden</strong>, ook niet bij snel of
                langzaam verkeer.
              </p>
            </IntroContainer>
            <div style={styles.maquetteBlock}>
              {renderManualMaquette(manualMaquetteData_33, 33)}
              {renderManualMaquette(manualMaquetteData_34, 34)}
            </div>
          </section>
          {renderChapterAd("inritten", "Inritten")}
        </>
      )}

    </div>
  );
};

export default Manual;

