import { useState, useEffect } from "react";

export const useQAData = () => {
  const [qaData, setQAData] = useState({ categorieën: {} });
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to load QA data from JSON source only
  const loadQAData = async () => {
    try {
      // Import and use the QA service to get data from trafficRules.json
      const { qaService } = await import("../services/qaService");

      // Get all QA entries from the JSON file
      const allQAEntries = qaService.getQAEntriesFromJson();

      // Group entries by category
      const categories = {};
      allQAEntries.forEach(entry => {
        if (!categories[entry.category]) {
          categories[entry.category] = [];
        }
        categories[entry.category].push({
          id: entry.id,
          question: entry.question,
          answer: entry.answer
        });
      });

      const jsonData = { categorieën: categories };
      setQAData(jsonData);
      return jsonData;
    } catch (error) {
      console.error("Error loading QA data:", error);
      // Return empty data if there's an error
      const emptyData = { categorieën: {} };
      setQAData(emptyData);
      return emptyData;
    }
  };

  // Load data from JSON on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      loadQAData().finally(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  return {
    qaData,
    loadQAData,
  };
};