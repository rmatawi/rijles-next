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
} from "../../../data/maquettes/manualMaquetteDataAmelia.js";
import { Block, List, ListItem } from "framework7-react";
import LocalAdPlaceholder from "../../LocalAdPlaceholder";
import MaquetteIntro from "../../MaquetteIntro.jsx";

const MANUAL_STORAGE_KEY = "manualDataSrc";
const MANUAL_SAVE_DEBOUNCE_MS = 800;
const MANUAL_SCROLL_OFFSET = 100;
const BASE_MANUAL_SECTIONS = [
  { id: "stappenplan", label: "Stappenplan" },
  { id: "afkortingen", label: "Afkortingen" },
  { id: "links-rechts", label: "Links Rechts" },
  { id: "bevoorrechte-weggebruikers", label: "Bevoorrechte Weggebruikers" },
  { id: "gelijke-rangorde-regel", label: "Gelijke Rangorde Regel" },
  { id: "verhard-onverhard", label: "Verhard Onverhard" },
];
const EXTENDED_MANUAL_SECTIONS = [
  { id: "t-kruising-regel", label: "T Kruising Regel" },
  { id: "linksaffer", label: "Linksaffer" },
  { id: "rechtsaffer", label: "Rechtsaffer" },
  { id: "rechtdoor-links-vrij", label: "Rechtdoor Links Vrij" },
  { id: "inritten-regel", label: "Inritten Regel" },
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
  { index: 14, data: manualMaquetteData_14 }
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
      canViewExtendedManual
        ? [...BASE_MANUAL_SECTIONS, ...EXTENDED_MANUAL_SECTIONS]
        : BASE_MANUAL_SECTIONS,
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
      <Block>
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
      </Block>

      <section id="stappenplan" style={styles.introContainer}>
        <IntroContainer>
          <MaquetteIntro />
        </IntroContainer>
      </section>

      <section id="afkortingen" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>Afkortingen</h2>
        <Block>
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
        </Block>
      </section>

      <section id="links-rechts" style={styles.section}>
        <IntroContainer>
          <h2 style={styles.sectionTitle}>Links en rechts</h2>
          <p style={styles.paragraph}>
            <em>
              <strong>Belangrijk:</strong> Met links en rechts bedoelen we de
              kanten <strong>van de bestuurder in de auto</strong>. Dus niet de
              kanten van de persoon die naar de auto kijkt.
            </em>
          </p>
          <p style={styles.paragraph}>
            Klik op een auto. Dan zie je wat voor die auto links en rechts is.
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
            In Suriname rijden we <em>links</em>. Denk daarom altijd vanuit de
            bestuurder.
          </p>
        </IntroContainer>
      </section>
      {renderChapterAd("links-rechts", "Links en rechts")}

      <section id="bevoorrechte-weggebruikers" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>1. Bevoorrechte weggebruikers</h2>
        <ul>
          <li>
            <span>Gaan altijd eerst</span>
          </li>
          <div>
            <strong>Bevoorrechte weggebruikers</strong> zijn weggebruikers die
            voorrang krijgen. Dat zijn politie <b>met sirene</b>, brandweer{" "}
            <b>met sirene</b> en ambulance <b>met sirene</b>.
            <br />
            Let op: ze zijn pas <strong>bevoorrecht</strong> als de sirene aan
            staat.
          </div>
          <li>
            <span>Altijd een voor een: PS-BS-AS</span>
          </li>
          <div>
            Deze weggebruikers mogen niet tegelijk oprijden. Ze gaan{" "}
            <strong>een voor een</strong> in deze volgorde:{" "}
            <strong>PS-BS-AS</strong>.
            <br />
            Het streepje betekent: <b>daarna komt</b>.
          </div>
        </ul>
        {renderManualMaquette(manualMaquetteData_1, 1)}
      </section>

      <section id="gelijke-rangorde-regel" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>2. Kruising - gelijke rangorde</h2>
        <ul>
          <li>
            <span>Links aankomend verkeer heeft voorrang</span>
          </li>
          <div>
            De bestuurder kijkt naar <b>zijn links</b>. Komt daar verkeer aan,
            dan is er <b>geen links vrij (LV)</b>. <strong>LV</strong>{" "}
            betekent: links is leeg en veilig. Dan moet de bestuurder wachten.
          </div>
          <li>
            <span>
              <b>LA</b> (linksaf) + <b>LV</b> (links vrij) mogen rijden
            </span>
          </li>
          <div>
            <strong>LA</strong> betekent <b>linksaffer</b>: iemand die linksaf
            wil gaan. <strong>LV</strong> betekent <b>links vrij</b>: er komt
            niets van links.
            <br />
            Gaat de bestuurder linksaf of is links vrij, dan mag hij meestal
            oprijden. Maar staat er links een <b>rechtdoorgaande</b>{" "}
            (brom)fietser, dan gaat de fietser eerst.
          </div>
          <li>
            <span>Geen LA & geen LV? Dan VF toepassen</span>
          </li>
          <div>
            Heeft niemand <b>LA</b> en niemand <b>LV</b>? Dan gebruik je{" "}
            <strong>Verkeersfatsoen (VF)</strong>. Dat betekent: goed kijken,
            rustig blijven en met een teken laten zien wie eerst mag gaan.
            Meestal kijk je dan naar <b>rechts</b>.
          </div>
        </ul>
        {renderManualMaquette(manualMaquetteData_2, 2)}
      </section>

      <section id="verhard-onverhard" style={styles.introContainer}>
        <h2 style={styles.sectionTitle}>3. Verhard vs. onverhard</h2>
        <ul>
          <li>
            <span>Verhard heeft altijd voorrang</span>
          </li>
          <div>
            <strong>Verhard</strong> betekent een weg met asfalt of beton.
            <strong>Onverhard</strong> betekent bijvoorbeeld een zandweg. Op
            een gewone kruising gaat verkeer op de <b>verharde weg</b> eerst.
            Verkeer op de <b>onverharde weg</b> wacht.
          </div>
          <li>
            <span>
              Behalve bij een T-kruizing waarbij de{" "}
              <b>doorgaande weg onverhard</b> is
            </span>
          </li>
          <div>
            Bij een <strong>T-kruising</strong> is er een uitzondering. Is de{" "}
            <b>doorgaande weg</b> onverhard, dan heeft die weg{" "}
            <b>toch voorrang</b>. De doorgaande weg is de weg die doorloopt.
          </div>
        </ul>
        {renderManualMaquette(manualMaquetteData_3, 3)}
      </section>
      {renderChapterAd("handleiding", "Handleiding")}

      {canViewExtendedManual && (
        <>
          <section id="t-kruising-regel" style={styles.introContainer}>
            <h2 style={styles.sectionTitle}>4. T-kruising</h2>
            <ul>
              <li>
                <span>
                  Doorgaande weg heeft voorrang, <b>zelf wanneer onverhard</b>
                </span>
              </li>
              <div>
                Het verkeer op de <strong>doorgaande weg</strong> gaat eerst.
                Dat blijft zo, ook als deze weg onverhard is. De{" "}
                <strong>zijweg</strong> verleent voorrang.
              </div>
              <li>
                <span>Zijweg wacht</span>
              </li>
              <div>
                De zijweg mag pas gaan als de hoofdweg of doorgaande weg vrij
                is.
              </div>
            </ul>
            {renderManualMaquette(manualMaquetteData_4, 4)}
            {renderManualMaquette(manualMaquetteData_5, 5)}
          </section>

          <section id="linksaffer" style={styles.introContainer}>
            <h2 style={styles.sectionTitle}>5. Linksaffer (LA)</h2>
            <ul>
              <li>
                <span>LA (Linksaffer) heeft bijna altijd voorrang</span>
              </li>
              <div>
                <strong>LA</strong> betekent <b>linksaffer</b>: een bestuurder
                die linksaf gaat. Bij wegen van gelijke rangorde kijk je eerst
                naar <b>LA</b> en daarna naar <b>LV</b>. Is er geen
                rechtdoorgaande fietser met <b>LV</b> naast de auto, dan mag de
                linksaffer meestal gaan.
              </div>
              <li>
                <span>
                  Twee LA (fiets en auto) {"->"} langzaam verkeer met korte bocht gaat
                  eerst{" "}
                </span>
              </li>
              <div>
                Gaan een fietser en een auto allebei linksaf, dan gaat de
                fietser eerst. De fietser is <strong>langzaam verkeer</strong>{" "}
                en heeft de <b>korte bocht</b>. Dat betekent: de fietser maakt
                een kortere draai.
              </div>
              <li>
                <span>Naar weg met rijwielpad {"->"} beide gaan samen</span>
              </li>
              <div>
                Gaan een fietser en een auto linksaf naar een weg{" "}
                <b>met rijwielpad</b>, dan mogen ze samen oprijden.
              </div>
            </ul>
            {renderManualMaquette(manualMaquetteData_6, 6)}
            {renderManualMaquette(manualMaquetteData_7, 7)}
          </section>

          <section id="rechtsaffer" style={styles.introContainer}>
            <h2 style={styles.sectionTitle}>6. Rechtsaffer (RA)</h2>
            <ul>
              <li>
                <span>Wanneer mag een rechtsaffer rijden?</span>
              </li>
              <div>
                <ul>
                  <li>Als zijn links vrij is</li>
                  <li>Als hij geen tegenligger heeft</li>
                </ul>
              </div>
              <li>
                <span>Wat is een tegenligger van een rechtsaffer?</span>
              </li>
              <div>
                <ul>
                  <li>Een linksaffer </li>
                  <li>Een rechtdoorgaande met LV </li>
                  <li>Iemand op een voorrangsweg of voorrangskruising </li>
                </ul>
              </div>
              <li>
                <span>Naar zijweg {"->"} voorrang aan tegenliggers</span>
              </li>
              <div>
                <strong>RA</strong> betekent <b>rechtsaffer</b>: iemand die
                rechtsaf gaat. Wil een rechtsaffer vanaf de hoofdweg een zijweg
                inrijden en is er een tegenligger, dan moet hij wachten en
                voorrang geven.
              </div>
              <li>
                <span>
                  Twee RA {"->"} snel verkeer met korte bocht voor langzaam verkeer
                </span>
              </li>
              <div>
                Gaan een auto en een fietser allebei rechtsaf, dan gaat zonder
                rijwielpad meestal de auto eerst. De auto is hier het{" "}
                <strong>snel verkeer</strong>.
              </div>
              <li>
                <span>Naar weg met rijwielpad {"->"} beide gaan samen</span>
              </li>
              <div>
                Gaan een auto en een fietser rechtsaf naar een weg{" "}
                <b>met een rijwielpad</b>, dan mogen ze samen oprijden.
              </div>
            </ul>
            {renderManualMaquette(manualMaquetteData_8, 8)}
            {renderManualMaquette(manualMaquetteData_9, 9)}
          </section>
          {renderChapterAd("handleiding", "Handleiding")}

          <section id="rechtdoor-links-vrij" style={styles.introContainer}>
            <h2 style={styles.sectionTitle}>
              7. Rechtdoor met links vrij (LV)
            </h2>
            <ul>
              <li>
                <span>Rechtdoor met niemand links = voorrang</span>
              </li>
              <div>
                Een bestuurder die rechtdoor wil, kijkt eerst naar links. Is
                links leeg en veilig, dan heeft hij <strong>LV</strong>{" "}
                (<b>links vrij</b>) en mag hij oprijden.
              </div>
            </ul>
            {renderManualMaquette(manualMaquetteData_10, 10)}
          </section>

          <section
            id="verkeersfatsoen-voorbeelden"
            style={styles.introContainer}
          >
            <h2 style={styles.sectionTitle}>
              8. Voorbeelden Verkeersfatsoen (VF) situaties
            </h2>
            <ul>
              <li>
                <span>Twee RA tegenover elkaar op smalle weg</span>
              </li>
              <li>
                <span>Twee inhalers</span>
              </li>
              <li>
                <span>Geen LA & geen LV</span>
              </li>
              <li>
                <span>Iemand moet wenken wie mag oprijden</span>
              </li>
            </ul>
            <p style={styles.paragraph}>
              <strong>VF</strong> betekent <b>verkeersfatsoen</b>. Dat is
              netjes verkeersgedrag: goed kijken, rustig blijven en met een
              teken laten zien wie eerst mag gaan.
            </p>
            {renderManualMaquette(manualMaquetteData_11, 11)}
            {renderManualMaquette(manualMaquetteData_12, 12)}
          </section>

          <section id="inritten-regel" style={styles.introContainer}>
            <h2 style={styles.sectionTitle}>9. Inritten</h2>
            <Block>
              <ul>
                <li>
                  <span>
                    Verkeer <b>NIET naar de inrit</b> eerst afhandelen.
                    <ul>
                      <li>Hoofdweg eerst</li>
                      <li>dan Zijweg</li>
                    </ul>
                  </span>
                </li>
                <div>
                  Verkeer dat <b>wel naar de inrit</b> wil, wacht eerst.
                  Verkeer dat <b>niet naar de inrit</b> gaat, gaat voor. Eerst
                  handel je de <b>hoofdweg</b> af en daarna de <b>zijweg</b>.
                </div>
                <li>
                  <span>Inrit S {"->"} eerst volledig vrij</span>
                </li>
                <div>
                  Een <strong>smalle inrit (Inrit S)</strong> moet eerst
                  helemaal vrij zijn. Er mag dus niets in de weg staan.
                </div>
                <li>
                  <span>Inrit B {"->"} direct inrijden toegestaan</span>
                </li>
                <div>
                  Een <strong>brede inrit (Inrit B)</strong> heeft meer ruimte.
                  Daarom mag je daar meestal direct inrijden als het veilig is.
                </div>
                <li>
                  <span>
                    Overig Verkeer afhandelen.
                    <ul>
                      <li>Hoofdweg eerst</li>
                      <li>dan Zijweg</li>
                    </ul>
                  </span>
                </li>
                <div>
                  Daarna komt het verkeer dat <b>wel naar de inrit</b> moet.
                  Ook dan ga je in volgorde: eerst de <b>hoofdweg</b> en daarna
                  de <b>zijweg</b>.
                </div>
              </ul>
            </Block>
            {renderManualMaquette(manualMaquetteData_13, 13)}
            {renderManualMaquette(manualMaquetteData_14, 14)}
          </section>
          {renderChapterAd("handleiding", "Handleiding")}
        </>
      )}
    </div>
  );
};

export default Manual;
