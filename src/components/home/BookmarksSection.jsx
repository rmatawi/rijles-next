// src/components/home/BookmarksSection.jsx
import { useEffect } from "react";
import { f7 } from "framework7-react";
import { IonIcon } from "@ionic/react";
import { bookmark as bookmarkIcon } from "ionicons/icons";
import { useBookmarks } from "../../hooks/useBookmarks";
import { getLayout } from "../../js/utils";

const BookmarksSection = () => {
  const { bookmarks, updateBookmarks, toggleBookmark } = useBookmarks();
  const f7Router = f7.views.main.router;

  useEffect(() => {
    const handlePageFocus = () => {
      updateBookmarks();
    };
    window.addEventListener("focus", handlePageFocus);

    // Also update when component mounts
    updateBookmarks();

    return () => {
      window.removeEventListener("focus", handlePageFocus);
    };
  }, [updateBookmarks]);

  const bookmarkPages = Object.keys(bookmarks);

  if (bookmarkPages.length === 0) {
    return (
      <>
        <div className="neu-section-title">Bookmarks</div>
        <div
          // className="neu-card-inset"
          style={{ margin: "0 16px", padding: "20px", textAlign: "center" }}
        >
          <p className="neu-text-secondary" style={{ margin: 0 }}>
            Je hebt nog geen Bookmarks opgeslagen.
          </p>
        </div>
      </>
    );
  }

  // Translations for page names
  const pageTranslations = {
    maquette: "Maquettes",
    verkeersborden: "Verkeersborden",
    qa: "Verkeersregels",
    rijscholen: "Rijscholen",
    community: "Community",
    services: "Auto Services",
    insurance: "Verzekeringen",
    emergency: "Noodcontacten",
  };

  // Function to handle bookmark navigation with proper scrolling
  const handleBookmarkClick = (url) => {
    // Navigate to the page using the router
    f7Router.navigate(url);

    // If there's a hash, scroll to the element after a delay
    const urlParams = new URLSearchParams(url.replace(/^\?/, ""));
    const scrollToId = urlParams.get("scrollTo");

    if (scrollToId) {
      // Use requestAnimationFrame to avoid forced reflows
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
  };

  const titleMapping = {
    Verkeersborden: "Borden",
    Verkeersregels: "Regels",
    Maquettes: "Maquettes",
  };

  return (
    <>
      <div className="neu-section-title">Bookmarks</div>
      <div style={{ padding: "0 16px" }}>
        {bookmarkPages.map((page) => (
          <div
            key={page}
            className="neu-card"
            style={{ marginBottom: "16px", padding: "16px" }}
          >
            <div
              // className="neu-badge"
              style={{
                marginBottom: "12px",
                color: getLayout()?.colorScheme?.[0],
              }}
            >
              {titleMapping?.[pageTranslations[page]] || pageTranslations[page]}
            </div>
            {bookmarks[page]?.map((bookmark) => (
              <div
                key={bookmark.id}
                className="neu-list-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  <IonIcon
                    icon={bookmarkIcon}
                    style={{
                      fontSize: "20px",
                      color: getLayout()?.colorScheme?.[0],
                    }}
                  />
                  <span
                    className="neu-text-primary"
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  >
                    {bookmark.title}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div
                    className="neu-btn-circle"
                    style={{ width: "36px", height: "36px" }}
                    onClick={() =>
                      toggleBookmark(
                        page,
                        bookmark.id,
                        bookmark.title,
                        bookmark.url
                      )
                    }
                  >
                    <i
                      className="f7-icons"
                      style={{ fontSize: "16px", color: "#ff3b30" }}
                    >
                      trash
                    </i>
                  </div>
                  <div
                    className="neu-btn-circle"
                    style={{
                      width: "36px",
                      height: "36px",
                      marginLeft: "20px",
                    }}
                    onClick={() => handleBookmarkClick(bookmark.url)}
                  >
                    <i
                      className="f7-icons"
                      style={{
                        fontSize: "16px",
                        color: getLayout()?.colorScheme?.[0],
                      }}
                    >
                      chevron_right
                    </i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default BookmarksSection;
