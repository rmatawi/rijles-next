// utils/BookmarkManager.js - Bookmarks and favorites management
export const BookmarkManager = {
  // Get all bookmarks for a book
  getBookmarks: (bookId) => {
    try {
      const stored = localStorage.getItem(`bookmarks_${bookId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Error getting bookmarks:", error);
      return [];
    }
  },

  // Save bookmarks for a book
  saveBookmarks: (bookId, bookmarks) => {
    try {
      localStorage.setItem(`bookmarks_${bookId}`, JSON.stringify(bookmarks));
      return true;
    } catch (error) {
      console.warn("Error saving bookmarks:", error);
      return false;
    }
  },

  // Add a bookmark
  addBookmark: (bookId, bookmark) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    const newBookmark = {
      id: Date.now().toString(),
      sectionId: bookmark.sectionId,
      sectionTitle: bookmark.sectionTitle,
      position: bookmark.position || 0,
      note: bookmark.note || '',
      timestamp: new Date().toISOString(),
      type: bookmark.type || 'bookmark', // bookmark, favorite, important
      ...bookmark
    };
    
    bookmarks.push(newBookmark);
    BookmarkManager.saveBookmarks(bookId, bookmarks);
    return newBookmark;
  },

  // Remove a bookmark
  removeBookmark: (bookId, bookmarkId) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    const filtered = bookmarks.filter(b => b.id !== bookmarkId);
    BookmarkManager.saveBookmarks(bookId, filtered);
    return filtered;
  },

  // Check if section is bookmarked
  isBookmarked: (bookId, sectionId) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    return bookmarks.some(b => b.sectionId === sectionId);
  },

  // Toggle bookmark
  toggleBookmark: (bookId, sectionId, sectionTitle) => {
    if (BookmarkManager.isBookmarked(bookId, sectionId)) {
      const bookmarks = BookmarkManager.getBookmarks(bookId);
      const bookmark = bookmarks.find(b => b.sectionId === sectionId);
      if (bookmark) {
        BookmarkManager.removeBookmark(bookId, bookmark.id);
        return false;
      }
    } else {
      BookmarkManager.addBookmark(bookId, {
        sectionId,
        sectionTitle,
        type: 'bookmark'
      });
      return true;
    }
  },

  // Get favorites
  getFavorites: (bookId) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    return bookmarks.filter(b => b.type === 'favorite');
  },

  // Toggle favorite
  toggleFavorite: (bookId, sectionId, sectionTitle) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    const existingFavorite = bookmarks.find(b => 
      b.sectionId === sectionId && b.type === 'favorite'
    );
    
    if (existingFavorite) {
      BookmarkManager.removeBookmark(bookId, existingFavorite.id);
      return false;
    } else {
      BookmarkManager.addBookmark(bookId, {
        sectionId,
        sectionTitle,
        type: 'favorite'
      });
      return true;
    }
  },

  // Check if section is favorite
  isFavorite: (bookId, sectionId) => {
    const favorites = BookmarkManager.getFavorites(bookId);
    return favorites.some(f => f.sectionId === sectionId);
  },

  // Get bookmark stats
  getStats: (bookId) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    return {
      total: bookmarks.length,
      bookmarks: bookmarks.filter(b => b.type === 'bookmark').length,
      favorites: bookmarks.filter(b => b.type === 'favorite').length,
      important: bookmarks.filter(b => b.type === 'important').length,
      recent: bookmarks.slice(-5).reverse()
    };
  },

  // Export bookmarks
  exportBookmarks: (bookId) => {
    const bookmarks = BookmarkManager.getBookmarks(bookId);
    return {
      bookId,
      exportDate: new Date().toISOString(),
      bookmarks
    };
  }
};