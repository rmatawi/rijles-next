// src/js/bookmarks.js

const BOOKMARKS_KEY = "rijles_app_bookmarks";
const BOOKMARKS_UPDATED_EVENT = "bookmarksUpdated";

/**
 * Retrieves all bookmarks from localStorage.
 * @returns {object} An object with pages as keys and arrays of bookmarks as values.
 */
export const getBookmarks = () => {
  try {
    const bookmarksJSON = localStorage.getItem(BOOKMARKS_KEY);
    return bookmarksJSON ? JSON.parse(bookmarksJSON) : {};
  } catch (error) {
    console.error("Error reading bookmarks from localStorage:", error);
    return {};
  }
};

/**
 * Saves bookmarks to localStorage.
 * @param {object} bookmarks - The bookmarks object to save.
 */
const saveBookmarks = (bookmarks) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    // Dispatch a custom event to notify all components that bookmarks have changed
    window.dispatchEvent(new CustomEvent(BOOKMARKS_UPDATED_EVENT));
  } catch (error) {
    console.error("Error saving bookmarks to localStorage:", error);
  }
};

/**
 * Adds a bookmark for a specific page.
 * @param {string} page - The page identifier (e.g., 'maquette', 'verkeersborden').
 * @param {string|number} id - The unique identifier for the item.
 * @param {string} title - The title of the bookmark.
 * @param {string} url - The URL to navigate to.
 */
export const addBookmark = (page, id, title, url) => {
  const bookmarks = getBookmarks();
  if (!bookmarks[page]) {
    bookmarks[page] = [];
  }
  if (!bookmarks[page].some((b) => b.id === id)) {
    bookmarks[page].push({ id, title, url });
    saveBookmarks(bookmarks);
  }
};

/**
 * Removes a bookmark for a specific page.
 * @param {string} page - The page identifier.
 * @param {string|number} id - The unique identifier for the item.
 */
export const removeBookmark = (page, id) => {
  const bookmarks = getBookmarks();
  if (bookmarks[page]) {
    bookmarks[page] = bookmarks[page].filter((b) => b.id !== id);
    if (bookmarks[page].length === 0) {
      delete bookmarks[page];
    }
    saveBookmarks(bookmarks);
  }
};

/**
 * Checks if an item is bookmarked.
 * @param {string} page - The page identifier.
 * @param {string|number} id - The unique identifier for the item.
 * @returns {boolean} - True if the item is bookmarked, false otherwise.
 */
export const isBookmarked = (page, id) => {
  const bookmarks = getBookmarks();
  return bookmarks[page]?.some((b) => b.id === id) || false;
};
