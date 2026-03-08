// src/services/qaService.js
import trafficRules from "../data/trafficRules.json";

// QA operations using data from trafficRules.json
export const qaService = {
  // Get data from the traffic rules JSON
  getTrafficRulesData: () => {
    return trafficRules;
  },

  // Extract QA entries from the traffic rules JSON
  getQAEntriesFromJson: () => {
    const qaEntries = [];

    // Iterate through categories
    Object.entries(trafficRules.categorieën || {}).forEach(([categoryName, categoryItems]) => {
      // Iterate through questions/answers in each category
      categoryItems.forEach((item) => {
        if (item.id && item.question && item.answer) {
          qaEntries.push({
            id: item.id,
            question: item.question,
            answer: item.answer,
            category: categoryName
          });
        }
      });
    });

    return qaEntries;
  },

  // Get specific QA entry by ID from JSON
  getQAFromJsonById: (id) => {
    const allQA = qaService.getQAEntriesFromJson();
    return allQA.find(item => item.id === id) || null;
  },

  // Get QA entries by category from JSON
  getQAEntriesByCategory: (categoryName) => {
    const allQA = qaService.getQAEntriesFromJson();
    return allQA.filter(item => item.category === categoryName);
  },

  // Compatibility API used by sync/offline services
  getQAEntriesBySchoolId: async (_schoolId) => {
    return {
      data: qaService.getQAEntriesFromJson(),
      error: null,
    };
  },

  getQAEntryById: async (id) => {
    return {
      data: qaService.getQAFromJsonById(id),
      error: null,
    };
  },

  createQAEntry: async () => {
    return {
      data: null,
      error: new Error("QA entries are read-only in JSON mode."),
    };
  },

  updateQAEntry: async () => {
    return {
      data: null,
      error: new Error("QA entries are read-only in JSON mode."),
    };
  },

  deleteQAEntry: async () => {
    return {
      data: null,
      error: new Error("QA entries are read-only in JSON mode."),
    };
  },
};
