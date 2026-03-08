// utils/HighlightManager.js - Text highlighting and notes management
export const HighlightManager = {
  // Get all highlights for a book
  getHighlights: (bookId) => {
    try {
      const stored = localStorage.getItem(`highlights_${bookId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Error getting highlights:", error);
      return [];
    }
  },

  // Save highlights for a book
  saveHighlights: (bookId, highlights) => {
    try {
      localStorage.setItem(`highlights_${bookId}`, JSON.stringify(highlights));
      return true;
    } catch (error) {
      console.warn("Error saving highlights:", error);
      return false;
    }
  },

  // Add a new highlight
  addHighlight: (bookId, highlight) => {
    const highlights = HighlightManager.getHighlights(bookId);
    const newHighlight = {
      id: Date.now().toString(),
      text: highlight.text,
      sectionId: highlight.sectionId,
      sectionTitle: highlight.sectionTitle,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      color: highlight.color || 'yellow',
      note: highlight.note || '',
      timestamp: new Date().toISOString(),
      ...highlight
    };
    
    highlights.push(newHighlight);
    HighlightManager.saveHighlights(bookId, highlights);
    return newHighlight;
  },

  // Update highlight note
  updateHighlight: (bookId, highlightId, updates) => {
    const highlights = HighlightManager.getHighlights(bookId);
    const index = highlights.findIndex(h => h.id === highlightId);
    
    if (index !== -1) {
      highlights[index] = { ...highlights[index], ...updates };
      HighlightManager.saveHighlights(bookId, highlights);
      return highlights[index];
    }
    return null;
  },

  // Remove a highlight
  removeHighlight: (bookId, highlightId) => {
    const highlights = HighlightManager.getHighlights(bookId);
    const filtered = highlights.filter(h => h.id !== highlightId);
    HighlightManager.saveHighlights(bookId, filtered);
    return filtered;
  },

  // Get highlights for specific section
  getSectionHighlights: (bookId, sectionId) => {
    const highlights = HighlightManager.getHighlights(bookId);
    return highlights.filter(h => h.sectionId === sectionId);
  },

  // Get highlight colors
  getHighlightColors: () => [
    { name: 'Geel', value: 'yellow', class: 'bg-yellow' },
    { name: 'Groen', value: 'green', class: 'bg-green-light' },
    { name: 'Blauw', value: 'blue', class: 'bg-blue-light' },
    { name: 'Roze', value: 'pink', class: 'bg-pink-light' },
    { name: 'Oranje', value: 'orange', class: 'bg-orange-light' }
  ],

  // Get stats
  getStats: (bookId) => {
    const highlights = HighlightManager.getHighlights(bookId);
    return {
      total: highlights.length,
      withNotes: highlights.filter(h => h.note && h.note.trim()).length,
      byColor: highlights.reduce((acc, h) => {
        acc[h.color] = (acc[h.color] || 0) + 1;
        return acc;
      }, {}),
      recent: highlights.slice(-5).reverse()
    };
  }
};