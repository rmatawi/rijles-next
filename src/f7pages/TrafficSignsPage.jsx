import { useState, useEffect } from "react";
import {
  Page,
  Navbar,
  BlockTitle,
  Button,
  Link,
  NavLeft,
  NavTitle,
  NavRight,
  Toolbar,
  Progressbar,
  Icon,
} from "framework7-react";
import { f7 } from "framework7-react";
import { trafficSignsData } from "../js/trafficSignsData.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { t } from "../i18n/translate.js";
import { getLayout, isLocalhost } from "../js/utils.js";
import { useAdminStatus } from "../contexts/AdminStatusContext.jsx";
import { useStudentStatus } from "../contexts/StudentStatusContext.jsx";
import { createGradient } from "../utils/colorUtils.js";
import FreeTrialSignupPromo from "../components/FreeTrialSignupPromo";
import ReferralCard from "../components/ReferralCard";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { SEO } from "../js/seoUtils";
import NavHomeButton from "../components/NavHomeButton";
import { buildPagePath } from "../utils/appUrl";
import LocalAdPlaceholder from "../components/LocalAdPlaceholder";

const TrafficSignsPage = () => {
  // Check admin and student status using context
  const { isAdmin } = useAdminStatus();
  const { isStudent } = useStudentStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSigns, setFilteredSigns] = useState(trafficSignsData);
  const [visibleRules, setVisibleRules] = useState({});
  const [speakingSignId, setSpeakingSignId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();

  // State to track if we've logged the status once for the non-admin/non-student case
  const [hasLoggedNonUserStatus, setHasLoggedNonUserStatus] = useState(false);

  const baseColor = getLayout()?.colorScheme?.[0];
  const gradient = createGradient(baseColor, 40, "135deg");

  // Effect to handle scroll progress using Framework7 page events
  useEffect(() => {
    console.log("[TRAFFICSIGNS-SCROLL] Initializing scroll progress effect");

    let scrollContainer = null;
    let isPageMounted = true;
    let scrollCheckInterval = null;
    let handleScroll = null; // Declare handleScroll outside to make it accessible for cleanup

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

    // Try to set up after a delay to ensure page is fully loaded
    const initialSetupTimeout = setTimeout(() => {
      if (isPageMounted) {
        setupScrollListener();
      }
    }, 1000);

    // Also try again after the data has had a chance to load
    const retrySetupTimeout = setTimeout(() => {
      if (isPageMounted && !scrollContainer) {
        console.log("[TRAFFICSIGNS-SCROLL] Trying again after data load delay");
        setupScrollListener();
      }
    }, 2000); // 2 seconds after mount

    return () => {
      console.log("[TRAFFICSIGNS-SCROLL] Cleaning up scroll listeners");
      isPageMounted = false;

      // Clear any pending timeouts
      clearTimeout(initialSetupTimeout);
      clearTimeout(retrySetupTimeout);
      if (scrollCheckInterval) {
        clearTimeout(scrollCheckInterval);
      }

      if (scrollContainer && handleScroll) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else if (handleScroll) {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []); // Run only once when component mounts

  // Limit traffic signs to first 5 when user is neither admin nor student
  useEffect(() => {
    // Only log once when the status is first determined for non-admin/non-student users
    if (!hasLoggedNonUserStatus && !isAdmin && !isStudent) {
      setHasLoggedNonUserStatus(true);
    }

    if (!isAdmin && !isStudent) {
      // Limit to first 5 traffic signs
      setFilteredSigns(trafficSignsData.slice(0, 5));
    } else {
      // Show all traffic signs for admins and students
      setFilteredSigns(trafficSignsData);
    }
  }, [isAdmin, isStudent, hasLoggedNonUserStatus, setHasLoggedNonUserStatus]);

  // Handle scrollTo query parameter
  useEffect(() => {
    // Check for page parameter to see if we should handle this page
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get("page");
    const scrollToId = urlParams.get("scrollTo");

    // Only handle if this is the correct page or if no page param is specified (default behavior)
    if (!pageParam || pageParam === "verkeersborden") {
      if (scrollToId) {
        // Scroll to the element after a delay to ensure page is loaded
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);
      }
    }
  }, []);



  // Toggle rule visibility for a specific sign (test mode)
  const toggleRule = (id) => {
    setVisibleRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };



  useEffect(() => {
    if (searchQuery === "") {
      setFilteredSigns(trafficSignsData);
    } else {
      const filtered = trafficSignsData.filter(
        (sign) =>
          sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sign.description &&
            sign.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredSigns(filtered);
    }
  }, [searchQuery]);

  // Function to toggle zoom levels
  const toggleZoom = () => {
    setZoomLevel((prevZoom) => {
      if (prevZoom === 1) return 1.25;
      if (prevZoom === 1.25) return 1.5;
      return 1; // Reset to 100%
    });
  };



  // Handle text-to-speech for traffic sign rules
  const handleSpeakRule = (signId, rule) => {
    // If currently speaking this sign, stop it
    if (isSpeaking && speakingSignId === signId) {
      stopSpeaking();
      setSpeakingSignId(null);
      return;
    }

    // If speaking a different sign, stop that and start this one
    if (isSpeaking) {
      stopSpeaking();
    }

    // Start speaking this sign's rule
    setSpeakingSignId(signId);
    speak(rule);
  };

  // Update speaking state when speech ends
  useEffect(() => {
    if (!isSpeaking && speakingSignId) {
      setSpeakingSignId(null);
    }
  }, [isSpeaking, speakingSignId]);

  return (
    <Page name="verkeersborden" className="page-neu">
      <SEO page="verkeersborden" />
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
          {t("nav.verkeersborden")}
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

        {/* Traffic Signs Count */}
        <div className="neu-section-title">
          {filteredSigns.length} {t("verkeersborden.count")}
        </div>

        {/* Traffic Signs List */}
        <div style={{
          padding: "0 16px",
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top center",
          transition: "transform 0.2s ease-in-out"
        }}>
          {filteredSigns.map((sign, index) => {
            const bookmarked = isBookmarked("verkeersborden", sign.id);
            return (
              <div key={`sign-block-${sign.id}`}>
                <div
                  id={`sign-${sign.id}`}
                  className="neu-card"
                  style={{ marginBottom: "8px", padding: "12px" }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    {/* Sign Image */}
                    <div
                      className="neu-card-inset"
                      style={{
                        width: "80px",
                        minWidth: "80px",
                        height: "80px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderRadius: "8px",
                        padding: "6px",
                        backgroundColor: "white",
                        position: "relative",
                      }}
                      onClick={() => {
                        const closeText = t("common.close");
                        f7.dialog
                          .create({
                            content: `
                        <div style="display: flex; background-color: white; justify-content: center; align-items: center; height: 100%; padding: 20px;">
                          <img src="${sign.image}" alt="${sign.name}" style="max-width: 100%; max-height: 80vh; object-fit: contain;" />
                        </div>
                      `,
                            cssClass: "image-popup",
                            buttons: [
                              {
                                text: closeText,
                                color: "gray",
                              },
                            ],
                          })
                          .open();
                      }}
                    >
                      <img
                        src={sign.image}
                        alt={sign.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          zIndex: 1,
                        }}
                      />
                      {isLocalhost() && (
                        <button
                          className="neu-btn-circle"
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            width: "20px",
                            height: "20px",
                            zIndex: 2,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--app-primary-color, #007bff)",
                            color: "white",
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "9px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the image click
                            navigator.clipboard.writeText(sign.image)
                              .then(() => {
                                console.log(`Image URL copied to clipboard: ${sign.image}`);
                                // Optionally show a success message to the user
                              })
                              .catch(err => {
                                console.error('Failed to copy image URL: ', err);
                              });
                          }}
                          title="Copy image URL"
                        >
                          <i className="f7-icons" style={{ fontSize: "10px" }}>
                            square_arrow_up
                          </i>
                        </button>
                      )}
                    </div>

                    {/* Sign Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "6px" }}>
                        <h3
                          className="neu-text-primary"
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 600,
                            flex: 1,
                            lineHeight: 1.3,
                          }}
                        >
                          {sign.name}
                        </h3>
                        <div
                          className="neu-btn-circle"
                          style={{
                            width: "26px",
                            height: "26px",
                            background: bookmarked ? gradient : undefined,
                            flexShrink: 0,
                          }}
                          onClick={() => {
                            const bookmarkUrl = buildPagePath("verkeersborden", {
                              scrollTo: `sign-${sign.id}`,
                            });
                            toggleBookmark(
                              "verkeersborden",
                              sign.id,
                              sign.name,
                              bookmarkUrl
                            );
                          }}
                        >
                          <i
                            className="f7-icons"
                            style={{
                              fontSize: "13px",
                              color: bookmarked ? "white" : baseColor,
                            }}
                          >
                            {bookmarked ? "bookmark_fill" : "bookmark"}
                          </i>
                        </div>
                      </div>

                      {sign?.description && (
                        <p
                          className="neu-text-secondary"
                          style={{ margin: "0 0 8px 0", fontSize: "13px", lineHeight: 1.4 }}
                        >
                          {sign.description}
                        </p>
                      )}

                      {visibleRules[sign.id] ? (
                        <div style={{ marginBottom: "6px" }}>
                          <p
                            className="neu-text-primary"
                            style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}
                          >
                            {sign.rule}
                          </p>
                          {/* Action buttons - show when rules are visible */}
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              marginTop: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            {/* Text-to-Speech Button */}
                            <div
                              className="neu-btn-circle"
                              style={{
                                width: "30px",
                                height: "30px",
                                background: isSpeaking && speakingSignId === sign.id ? gradient : undefined,
                              }}
                              onClick={() => handleSpeakRule(sign.id, sign.rule)}
                            >
                              <i
                                className="f7-icons"
                                style={{
                                  fontSize: "13px",
                                  color: isSpeaking && speakingSignId === sign.id ? "white" : baseColor,
                                }}
                              >
                                {isSpeaking && speakingSignId === sign.id ? "speaker_wave_2_fill" : "speaker_wave_2"}
                              </i>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="neu-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "7px 11px",
                            fontSize: "12px",
                            color: baseColor,
                            fontWeight: 600,
                          }}
                          onClick={() => toggleRule(sign.id)}
                        >
                          <i className="f7-icons" style={{ fontSize: "11px" }}>
                            eye
                          </i>
                          Antwoord
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(index + 1) % 10 === 0 && index < filteredSigns.length - 1 && (
                  <LocalAdPlaceholder
                    adSlot="verkeersborden"
                    headline="Lokale advertentie"
                    description="Advertentieplek na elke 10 verkeersborden."
                    ctaLabel="Bekijk adverteerpakketten"
                    style={{ marginTop: "8px", marginBottom: "14px" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <LocalAdPlaceholder
          adSlot="verkeersborden"
          headline="Lokale partner voor verkeerskennis"
          description="Placeholder voor een lokale advertentie, bijvoorbeeld een rijlesdeal, opticien of voertuigservice in de buurt."
          ctaLabel="Bekijk adverteerpakketten"
        />

        {/* Promotional cards for non-admin/non-student users - always at the bottom */}
        {(() => {
          const shouldShowPromoSection = !isAdmin;

          return shouldShowPromoSection ? (
            <div style={{ padding: "0 16px", marginBottom: "16px" }}>
              {(() => {
                if (!isStudent) {
                  // Show free trial signup promotion for visitors
                  return (
                    <FreeTrialSignupPromo
                      description="Start vandaag met leren voor je rijexamen. Krijg direct toegang tot alle verkeersborden en meer."
                    />
                  );
                } else {
                  // Show share & earn promotion for all students
                  return (
                    <ReferralCard
                      variant="pink"
                      subtitle="Deel deze app met vrienden en krijg extra dagen gratis toegang! Voor elke vriend die zich aanmeldt, krijg jij meer leertijd."
                      onClick="/referral"
                      style={{ textAlign: "center" }}
                    />
                  );
                }
              })()}
            </div>
          ) : null;
        })()}

        <br />
        <br />
        <br />
      </div>


    </Page>
  );
};

export default TrafficSignsPage;
