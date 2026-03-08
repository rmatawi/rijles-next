// src/hooks/useBookmarks.js
import { useState, useEffect, useCallback } from "react";
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
} from "../js/bookmarks";

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  const updateBookmarks = useCallback(() => {
    setBookmarks(getBookmarks());
  }, []);

  const handleToggleBookmark = (page, id, title, url) => {
    if (isBookmarked(page, id)) {
      removeBookmark(page, id);
    } else {
      addBookmark(page, id, title, url);
    }
    updateBookmarks();
  };

  useEffect(() => {
    const handleStorageChange = () => {
      updateBookmarks();
    };

    const handleBookmarksUpdated = () => {
      updateBookmarks();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("bookmarksUpdated", handleBookmarksUpdated);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bookmarksUpdated", handleBookmarksUpdated);
    };
  }, [updateBookmarks]);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark: handleToggleBookmark,
    updateBookmarks,
  };
};
