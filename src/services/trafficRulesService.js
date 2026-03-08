// src/services/trafficRulesService.js

// Traffic Rules operations using data from static component
export const trafficRulesService = {
  // Get rule entries from JSON - no longer used since rules are in JSX component
  getRulesFromJson: () => {
    // Return empty object since this service is no longer used for traffic rules
    return { rules: [] };
  },

  // Get all rule entries
  getRuleEntriesBySchoolId: async (schoolId) => {
    try {
      // Get all rules from JSON file
      const allRules = trafficRulesService.getRulesFromJson();

      return { data: allRules, error: null };
    } catch (error) {
      console.error(`Error fetching rule entries from JSON:`, error);
      return { data: null, error };
    }
  },

  // Get rule entry by ID from JSON
  getRuleEntryById: async (id) => {
    try {
      const allRules = trafficRulesService.getRulesFromJson();
      const rule = allRules.rules.find(r => r.id === id);

      return { data: rule || null, error: null };
    } catch (error) {
      console.error(`Error fetching rule entry with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Create a new rule entry (this function remains for compatibility but doesn't modify JSON)
  createRuleEntry: async (ruleData) => {
    try {
      // For now, this function doesn't actually create rules in JSON file
      // It returns the rule data as if it was created
      console.warn("Creating new rules in maquetteRules.json is not supported through this service.");
      return { data: { ...ruleData, id: ruleData.id || `new_${Date.now()}` }, error: null };
    } catch (error) {
      console.error("Error creating rule entry:", error);
      return { data: null, error };
    }
  },

  // Update a rule entry (this function remains for compatibility but doesn't modify JSON)
  updateRuleEntry: async (id, updates) => {
    try {
      // For now, this function doesn't actually update rules in JSON file
      // It returns the updated data as if it was updated
      console.warn("Updating rules in maquetteRules.json is not supported through this service.");
      return { data: { id, ...updates }, error: null };
    } catch (error) {
      console.error(`Error updating rule entry ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete a rule entry (this function remains for compatibility but doesn't modify JSON)
  deleteRuleEntry: async (id) => {
    try {
      // For now, this function doesn't actually delete rules in JSON file
      // It returns success without actually modifying the JSON
      console.warn("Deleting rules from maquetteRules.json is not supported through this service.");
      return { error: null };
    } catch (error) {
      console.error(`Error deleting rule entry ${id}:`, error);
      return { error };
    }
  }
};