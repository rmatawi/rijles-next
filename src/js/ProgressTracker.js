// utils/ProgressTracker.js - Reading progress tracking utilities
export const ProgressTracker = {
  getProgress: (bookId) => {
    try {
      const stored = localStorage.getItem(`reading_progress_${bookId}`);
      return stored
        ? JSON.parse(stored)
        : {
            sectionsRead: [],
            totalSections: 0,
            percentage: 0,
            lastRead: null,
            readingTime: 0,
          };
    } catch (error) {
      console.warn("Error getting progress:", error);
      return {
        sectionsRead: [],
        totalSections: 0,
        percentage: 0,
        lastRead: null,
        readingTime: 0,
      };
    }
  },

  saveProgress: (bookId, progress) => {
    try {
      localStorage.setItem(
        `reading_progress_${bookId}`,
        JSON.stringify(progress)
      );
      return true;
    } catch (error) {
      console.warn("Error saving progress:", error);
      return false;
    }
  },

  markSectionRead: (bookId, sectionId, sectionTitle) => {
    const progress = ProgressTracker.getProgress(bookId);

    if (!progress.sectionsRead.includes(sectionId)) {
      progress.sectionsRead.push(sectionId);
      progress.lastRead = {
        sectionId,
        sectionTitle,
        timestamp: new Date().toISOString(),
      };

      if (progress.totalSections > 0) {
        progress.percentage = Math.round(
          (progress.sectionsRead.length / progress.totalSections) * 100
        );
      }

      ProgressTracker.saveProgress(bookId, progress);
      return true;
    }
    return false;
  },

  initializeTotalSections: (bookId, bookData) => {
    const progress = ProgressTracker.getProgress(bookId);

    let totalSections = 0;
    if (Array.isArray(bookData)) {
      totalSections = bookData.length;
    } else if (typeof bookData === "object") {
      totalSections = Object.keys(bookData).filter(
        (key) =>
          !["title", "subtitle", "author", "year", "isbn", "approval"].includes(
            key
          )
      ).length;
    }

    if (progress.totalSections !== totalSections) {
      progress.totalSections = totalSections;
      progress.percentage =
        totalSections > 0
          ? Math.round((progress.sectionsRead.length / totalSections) * 100)
          : 0;
      ProgressTracker.saveProgress(bookId, progress);
    }

    return progress;
  },

  getStats: (bookId) => {
    const progress = ProgressTracker.getProgress(bookId);
    return {
      sectionsRead: progress.sectionsRead.length,
      totalSections: progress.totalSections,
      percentage: progress.percentage,
      lastRead: progress.lastRead,
      isComplete: progress.percentage >= 100,
    };
  },
};