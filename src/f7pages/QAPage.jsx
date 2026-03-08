// pages/QAPage.jsx - Questions & Answers page for self-testing
import { useState, useEffect, useMemo } from "react";
import {
  Block,
  f7,
  NavLeft,
  NavTitle,
  NavRight,
  Icon,
} from "framework7-react";
import {
  Page,
  Navbar,
  Button,
  Link,
  Toolbar,
  ListInput,
  List,
  Sheet,
  TextEditor,
  Progressbar,
} from "framework7-react";
import { getLayout } from "../js/utils";
import { createGradient } from "../utils/colorUtils";

import { useBookmarks } from "../hooks/useBookmarks";
import trafficRules from "../data/trafficRulesKlassic.json";
import { categoryNames } from "../constants/qaCategories";
import { t } from "../i18n/translate";
import QANavigation from "../components/QANavigation.jsx";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { useStudentStatus } from "../contexts/StudentStatusContext.jsx";
import FreeTrialSignupPromo from "../components/FreeTrialSignupPromo";
import ReferralCard from "../components/ReferralCard";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { SEO } from "../js/seoUtils";
import { buildPagePath } from "../utils/appUrl";
import NavHomeButton from "../components/NavHomeButton";
import LocalAdPlaceholder from "../components/LocalAdPlaceholder";

const QAPage = () => {
  const [visibleAnswers, setVisibleAnswers] = useState({});
  const [showQAList, setShowQAList] = useState(true);
  const [speakingQAId, setSpeakingQAId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();

  // Use trafficRules data instead of QA data
  const trafficRulesData = useMemo(() => trafficRules, []);

  // Check admin and student status using context
  const { isAdmin } = useAdminStatus();
  const { isStudent } = useStudentStatus();

  // State to track if we've logged the status once for the non-admin/non-student case
  const [hasLoggedNonUserStatus, setHasLoggedNonUserStatus] = useState(false);

  const baseColor = getLayout()?.colorScheme?.[0];
  const gradient = createGradient(baseColor, 40, "135deg");

  // State to hold the filtered QA data (using trafficRules)
  const [filteredQAData, setFilteredQAData] = useState(() => trafficRulesData);

  // Effect to handle scroll progress using Framework7 page events
  useEffect(() => {
    console.log("[QAPAGE-SCROLL] Initializing scroll progress effect");

    let scrollContainer = null;
    let isPageMounted = true;
    let scrollCheckInterval = null;

    const handleScroll = () => {
      if (!isPageMounted) {
        console.log(
          "[QAPAGE-SCROLL] Scroll handler called but component is not mounted"
        );
        return;
      }

      let progress = 0;
      if (scrollContainer) {
        // For Framework7 Page component, we need to track scroll within the page container
        const scrollTop = scrollContainer.scrollTop;
        // Use Math.max to prevent division by zero
        const scrollHeight = Math.max(
          1,
          scrollContainer.scrollHeight - scrollContainer.clientHeight
        );
        progress = (scrollTop / scrollHeight) * 100;
        console.log(
          `[QAPAGE-SCROLL] Container scroll: scrollTop=${scrollTop}, scrollHeight=${scrollHeight}, progress=${progress}`
        );
      } else {
        // Fallback to window scroll if no specific container is found
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;
        const scrollHeight = Math.max(1, documentHeight - windowHeight);
        progress = (scrollTop / scrollHeight) * 100;
        console.log(
          `[QAPAGE-SCROLL] Window scroll: scrollTop=${scrollTop}, scrollHeight=${scrollHeight}, progress=${progress}`
        );
      }
      // Ensure progress is between 0 and 100
      const clampedProgress = Math.min(100, Math.max(0, progress));
      console.log(`[QAPAGE-SCROLL] Clamped progress: ${clampedProgress}`);
      setScrollProgress(clampedProgress);
    };

    // Function to add scroll event listener once we have a valid container
    const setupScrollListener = () => {
      if (!isPageMounted) return false;

      // Try to find the Framework7 page content container
      // In Framework7, the scrollable element is .page-content
      const foundContainer = document.querySelector(".page-current .page-content") ||
        document.querySelector(".page-content");

      if (foundContainer) {
        scrollContainer = foundContainer;

        const onScroll = () => {
          if (!isPageMounted) return;
          const scrollTop = scrollContainer.scrollTop;
          const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          setScrollProgress(Math.min(100, Math.max(0, progress)));
        };

        scrollContainer.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // Initial check

        return () => {
          scrollContainer.removeEventListener("scroll", onScroll);
        };
      } else {
        // Fallback to window scroll
        const onScroll = () => {
          if (!isPageMounted) return;
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          setScrollProgress(Math.min(100, Math.max(0, progress)));
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // Initial check

        return () => {
          window.removeEventListener("scroll", onScroll);
        };
      }
    };

    // Continuously check for the page container until it's found or component unmounts
    const attemptSetup = () => {
      if (!isPageMounted) return;

      const success = setupScrollListener();
      if (!success && isPageMounted) {
        // If setup failed, continue checking
        scrollCheckInterval = setTimeout(attemptSetup, 150);
      }
    };

    // Try to set up immediately
    const immediateSuccess = setupScrollListener();
    if (!immediateSuccess && isPageMounted) {
      // If immediate setup failed, schedule retries
      scrollCheckInterval = setTimeout(attemptSetup, 150);
    }

    // Also try again after the data has had a chance to load
    setTimeout(() => {
      if (isPageMounted && !scrollContainer) {
        console.log("[QAPAGE-SCROLL] Trying again after data load delay");
        setupScrollListener();
      }
    }, 500);

    return () => {
      console.log("[QAPAGE-SCROLL] Cleaning up scroll listeners");
      isPageMounted = false;

      // Clear any pending intervals
      if (scrollCheckInterval) {
        clearTimeout(scrollCheckInterval);
      }

      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [filteredQAData]); // Update dependency to filteredQAData

  // Limit QA entries to first 5 when user is neither admin nor student
  useEffect(() => {
    // Only log once when the status is first determined for non-admin/non-student users
    if (!hasLoggedNonUserStatus && !isAdmin && !isStudent) {
      setHasLoggedNonUserStatus(true);
    }

    // If user is admin or student, show all data
    if (isAdmin || isStudent) {
      setFilteredQAData(trafficRulesData);
    } else {
      // Limit to first 5 QA entries across all categories for non-admin/non-student users
      const allQuestions = [];

      // Collect all questions from all categories in trafficRules structure
      trafficRulesData.categories.forEach((category) => {
        if (Array.isArray(category.questions)) {
          category.questions.forEach((question) => {
            allQuestions.push({ ...question, categoryName: category.name });
          });
        }
      });

      // Get first 5 questions
      const firstFiveQuestions = allQuestions.slice(0, 5);

      // Group them back by category
      const limitedCategories = [];
      const categoryMap = {};

      firstFiveQuestions.forEach((qa) => {
        if (!categoryMap[qa.categoryName]) {
          categoryMap[qa.categoryName] = {
            name: qa.categoryName,
            count: 0,
            questions: []
          };
          limitedCategories.push(categoryMap[qa.categoryName]);
        }
        categoryMap[qa.categoryName].questions.push(qa);
        categoryMap[qa.categoryName].count = categoryMap[qa.categoryName].questions.length;
      });

      const limitedData = { categories: limitedCategories };
      setFilteredQAData(limitedData);
    }
  }, [isAdmin, isStudent, hasLoggedNonUserStatus, trafficRulesData]);

  const [hasScrolledToBookmark, setHasScrolledToBookmark] = useState(false);

  useEffect(() => {
    if (hasScrolledToBookmark) return;

    const urlParams = new URLSearchParams(window.location.search);
    const scrollToId = urlParams.get("scrollTo");

    if (scrollToId && trafficRulesData?.categories) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            setHasScrolledToBookmark(true);
          }
        }, 100);
      });
    }
  }, [trafficRulesData, hasScrolledToBookmark]);

  // Function to toggle zoom levels
  const toggleZoom = () => {
    setZoomLevel((prevZoom) => {
      if (prevZoom === 1) return 1.25;
      if (prevZoom === 1.25) return 1.5;
      return 1; // Reset to 100%
    });
  };

  const scrollToCategory = (categoryIndex) => {
    const element = document.getElementById(`category-${categoryIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const allQuestionsCount = useMemo(
    () => filteredQAData.categories.reduce((total, category) => total + category.questions.length, 0),
    [filteredQAData]
  );

  const toggleAnswer = (id) => {
    setVisibleAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };



  // Handle text-to-speech for Q&A - question first, then answer
  const handleSpeakQuestionAndAnswer = (qaId, question, answer) => {
    // If currently speaking this Q&A, stop it
    if (isSpeaking && speakingQAId === qaId) {
      stopSpeaking();
      setSpeakingQAId(null);
      return;
    }

    // If speaking a different Q&A, stop that and start this one
    if (isSpeaking) {
      stopSpeaking();
    }

    // Start speaking this Q&A - first question, then answer
    setSpeakingQAId(qaId);
    speak(question + ". " + answer);
  };

  // Update speaking state when speech ends
  useEffect(() => {
    if (!isSpeaking && speakingQAId) {
      setSpeakingQAId(null);
    }
  }, [isSpeaking, speakingQAId]);

  return (
    <Page className="page-neu">
      <SEO page="qa" />
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
          {/*
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginLeft: "8px" }}
            onClick={() => f7.views.main.router.navigate("/")}
          >
            <i
              className="f7-icons"
              style={{ fontSize: "18px", color: baseColor }}
            >
              arrow_left
            </i>
          </div>
          */}
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          {t("qa.questionsAndAnswers")}
        </NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            onClick={toggleZoom}
          >
            <Icon
              f7={zoomLevel === 1 ? "plus_circle" : zoomLevel === 1.25 ? "plus_circle_fill" : "minus_circle_fill"}
              style={{ fontSize: "18px", color: baseColor }}
            />
          </div>
          <div
            className="neu-btn-circle"
            style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            onClick={() => f7.sheet.open("#qa-side-sheet")}
          >
            <Icon f7="bars" style={{ fontSize: "18px", color: baseColor }} />
          </div>
        </NavRight>
        {/* Standardized Scroll Progress Bar using F7 component */}
        <Progressbar
          progress={scrollProgress}
          style={{
            position: "absolute",
            bottom: "-4px",
            left: 0,
            width: "100%",
            height: "4px",
            zIndex: 500,
            "--f7-progressbar-bg-color": "transparent",
            "--f7-progressbar-progress-color": baseColor,
          }}
        />
      </Navbar>

      <div>
        {/* Side Sheet for Navigation */}
        <Sheet
          id="qa-side-sheet"
          className="neu-sheet"
          style={{ height: "50vh" }}
          swipeToClose
          backdrop
        >
          <div style={{ background: "var(--neu-bg)", height: "100%" }}>
            <Navbar className="neu-navbar">
              <NavTitle className="neu-text-primary">Navigation</NavTitle>
              <NavRight>
                <div
                  className="neu-btn-circle"
                  style={{ width: "32px", height: "32px", cursor: "pointer" }}
                  onClick={() => f7.sheet.close("#qa-side-sheet")}
                >
                  <Icon f7="xmark" style={{ fontSize: "16px" }} />
                </div>
              </NavRight>
            </Navbar>
            <QANavigation
              onScrollToCategory={(categoryIndex) => {
                scrollToCategory(categoryIndex);
                f7.sheet.close("#qa-side-sheet");
              }}
              qaData={trafficRulesData}
            />
          </div>
        </Sheet>

        <div className="neu-section-title" style={{ textAlign: "center" }}>
          {allQuestionsCount} Verkeersregels
        </div>

        <div style={{
          padding: "0 16px",
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top center",
          transition: "transform 0.2s ease-in-out"
        }}>
          {filteredQAData.categories.map((category, index) => (
            <div key={index} id={`category-${index}`}>
              {/* Category Header */}
              <div
                className="neu-card"
                style={{
                  background: gradient,
                  padding: "12px 16px",
                  marginBottom: "12px",
                  position: "sticky",
                  top: "10px",
                  zIndex: 10,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {category.name}
                </h3>
              </div>

              {/* Questions */}
              {category.questions.map((qa) => {
                const bookmarked = isBookmarked("qa", qa.id);
                if (!showQAList) {
                  return (
                    <div
                      key={qa.id}
                      id={`qa-${qa.id}`}
                      className="neu-card"
                      style={{ height: "160px", marginBottom: "12px" }}
                    />
                  );
                }
                return (
                  <div
                    key={qa.id}
                    id={`qa-${qa.id}`}
                    className="neu-card"
                    style={{ marginBottom: "8px", padding: "12px" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <h3
                        className="neu-text-primary"
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 600,
                          flex: 1,
                        }}
                      >
                        {qa.question}
                      </h3>
                      <div
                        className="neu-btn-circle"
                        style={{
                          width: "28px",
                          height: "28px",
                          background: bookmarked ? gradient : undefined,
                          flexShrink: 0,
                        }}
                        onClick={() => {
                          const bookmarkUrl = buildPagePath("qa", {
                            scrollTo: `qa-${qa.id}`,
                          });
                          toggleBookmark(
                            "qa",
                            qa.id,
                            qa.question,
                            bookmarkUrl
                          );
                        }}
                      >
                        <i
                          className="f7-icons"
                          style={{
                            fontSize: "14px",
                            color: bookmarked ? "white" : baseColor,
                          }}
                        >
                          {bookmarked ? "bookmark_fill" : "bookmark"}
                        </i>
                      </div>
                    </div>

                    {visibleAnswers[qa.id] ? (
                      <div style={{ marginBottom: "8px" }}>
                        <div
                          className="neu-text-primary"
                          style={{ fontSize: "14px", lineHeight: 1.6 }}
                        >
                          <div
                            dangerouslySetInnerHTML={{ __html: qa.answer }}
                          />
                        </div>
                        {/* Action buttons - show when answer is visible */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* Text-to-Speech Button */}
                          {qa.answer !== "table_speedlimit" && (
                            <div
                              className="neu-btn-circle"
                              style={{
                                width: "32px",
                                height: "32px",
                                background:
                                  isSpeaking && speakingQAId === qa.id
                                    ? gradient
                                    : undefined,
                              }}
                              onClick={() =>
                                handleSpeakQuestionAndAnswer(
                                  qa.id,
                                  qa.question,
                                  qa.answer
                                )
                              }
                            >
                              <i
                                className="f7-icons"
                                style={{
                                  fontSize: "14px",
                                  color:
                                    isSpeaking && speakingQAId === qa.id
                                      ? "white"
                                      : baseColor,
                                }}
                              >
                                {isSpeaking && speakingQAId === qa.id
                                  ? "speaker_wave_2_fill"
                                  : "speaker_wave_2"}
                              </i>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="neu-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          fontSize: "13px",
                          color: baseColor,
                          fontWeight: 600,
                        }}
                        onClick={() => toggleAnswer(qa.id)}
                      >
                        <i className="f7-icons" style={{ fontSize: "12px" }}>
                          eye
                        </i>
                        Antwoord
                      </div>
                    )}
                  </div>
                );
              })}

              {index < filteredQAData.categories.length - 1 && (
                <LocalAdPlaceholder
                  adSlot="qa"
                  headline="Lokale advertentie"
                  description="Advertentieplek tussen hoofdstukken."
                  ctaLabel="Bekijk adverteerpakketten"
                />
              )}
            </div>
          ))}
        </div>

        {/* Promotional cards for non-admin/non-student users - always at the bottom */}
        {(() => {
          const shouldShowPromoSection = !isAdmin;
          return shouldShowPromoSection ? (
            <div style={{ padding: "0 16px", marginBottom: "16px" }}>
              {!isStudent ? (
                <FreeTrialSignupPromo description="Start vandaag met leren voor je rijexamen. Krijg direct toegang tot alle verkeersregels en meer." />
              ) : (
                <ReferralCard
                  variant="pink"
                  subtitle="Nodig vrienden uit en verdien extra dagen toegang. Deel je referral code en groei je leertijd."
                  onClick="/referral"
                  style={{ textAlign: "center" }}
                />
              )}
            </div>
          ) : null;
        })()}
      </div>


    </Page>
  );
};

export default QAPage;
