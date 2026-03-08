import { useState, useEffect } from "react";

export const useTrafficRulesData = () => {
  // Using empty rules data since rules are now in static JSX component
  const [rulesData, setRulesData] = useState({ rules: [] });
  const [isInitialized, setIsInitialized] = useState(false);

  // For now, we'll keep the handleDataUpdate function but it won't save to localStorage
  // In a real implementation, you'd want to persist changes in a database
  const handleDataUpdate = (ruleId, updatedData) => {
    setRulesData((prevData) => {
      let newData = prevData;

      // Handle delete operation
      if (updatedData && updatedData.type === "deleteRule") {
        const updatedRules = prevData.rules.filter((q) => q.id !== ruleId);
        newData = {
          ...prevData,
          rules: updatedRules,
        };
      }

      // Handle normal update operation
      else {
        const updatedRules = prevData.rules.map((r) => {
          if (r.id === ruleId) {
            return { ...r, ...updatedData };
          }
          return r;
        });

        newData = {
          ...prevData,
          rules: updatedRules,
        };
      }

      return newData;
    });
  };

  // Function to update the entire rules data structure
  const updateAllRulesData = (newRulesData) => {
    setRulesData(newRulesData);
  };

  // For now, we'll keep the addNewRule function but it won't save to localStorage
  const addNewRule = (title, description, priority = "normaal") => {
    const newRuleId = `new_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    setRulesData((prevData) => {
      const newRule = {
        id: newRuleId,
        title: title,
        description: description,
        priority: priority,
      };

      const updatedRules = [...prevData.rules, newRule];

      const newData = {
        ...prevData,
        rules: updatedRules,
      };

      return newData;
    });

    return newRuleId;
  };

  // Simple load function that just sets the rules data from JSON
  const loadRulesData = async () => {
    try {
      // Return empty rules since they're now in static component
      const emptyRules = { rules: [] };
      setRulesData(emptyRules);
      return emptyRules;
    } catch (error) {
      console.error("Error loading rules data:", error);
      // Use empty data
      const emptyRules = { rules: [] };
      setRulesData(emptyRules);
      return emptyRules;
    }
  };

  // Initialize with empty data since rules are now in static component
  useEffect(() => {
    if (!isInitialized) {
      loadRulesData().finally(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  return {
    rulesData,
    handleDataUpdate,
    addNewRule,
    updateAllRulesData,
    loadRulesData,
  };
};
