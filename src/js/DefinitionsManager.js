// utils/DefinitionsManager.js - Quick definitions and content interactions
export const DefinitionsManager = {
  // Built-in driving terms dictionary
  drivingTerms: {
    // Traffic rules and signs
    'voorrang': 'Het recht om als eerste te rijden bij kruispunten of het samenvoegen van verkeer',
    'rotonde': 'Cirkelvormig kruispunt waar verkeer in één richting stroomt',
    'fietspad': 'Speciaal weggedeelte bestemd voor fietsers',
    'stoeprand': 'Verhoogde rand tussen rijbaan en trottoir',
    'verkeerslicht': 'Lichtsignaal dat het verkeer regelt (rood, oranje, groen)',
    'zebra': 'Gemarkeerde oversteekplaats voor voetgangers',
    'busstrook': 'Rijstrook speciaal bestemd voor openbaar vervoer',
    
    // Vehicle controls
    'koppeling': 'Pedaal waarmee de motor wordt los- of aangekoppeld van de versnellingsbak',
    'handrem': 'Extra rem die met de hand wordt bediend, gebruikt bij parkeren',
    'richtingaanwijzer': 'Knipperlicht dat de rijrichting aangeeft',
    'spiegels': 'Reflecterende oppervlakken voor zicht naar achteren en opzij',
    'versnelling': 'Mechanisme om de snelheid en kracht van de auto aan te passen',
    'gas': 'Pedaal om de snelheid te verhogen',
    'rem': 'Pedaal om de auto te vertragen of te stoppen',
    
    // Traffic situations
    'inhalen': 'Een ander voertuig voorbijgaan',
    'invoegen': 'Het verkeer ingaan vanuit een oprit of zijweg',
    'uitvoegen': 'Het verkeer verlaten naar een afrit of zijweg',
    'parkeren': 'De auto stilzetten en achterlaten',
    'keren': 'Richting veranderen en de andere kant op rijden',
    'achteruit': 'In omgekeerde richting rijden',
    
    // Safety
    'dodehoek': 'Gebied rondom voertuig dat niet zichtbaar is via spiegels',
    'volgafstand': 'Ruimte die je houdt achter het voertuig voor je',
    'snelheid': 'Hoe snel je rijdt, gemeten in km/h',
    'gordel': 'Veiligheidssysteem dat je vasthoudt bij een ongeval',
    'airbag': 'Veiligheidskussen dat opblaast bij een botsing'
  },

  // Get definition for a term
  getDefinition: (term) => {
    if (!term) return null;
    
    const normalizedTerm = term.toLowerCase().trim();
    const definition = DefinitionsManager.drivingTerms[normalizedTerm];
    
    if (definition) {
      return {
        term: normalizedTerm,
        definition,
        type: 'built-in',
        source: 'Rijles Woordenboek'
      };
    }
    
    return null;
  },

  // Check if term has definition
  hasDefinition: (term) => {
    if (!term) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return DefinitionsManager.drivingTerms.hasOwnProperty(normalizedTerm);
  },

  // Get all terms that match a search
  searchTerms: (search) => {
    if (!search || search.length < 2) return [];
    
    const searchLower = search.toLowerCase();
    const matches = [];
    
    Object.entries(DefinitionsManager.drivingTerms).forEach(([term, definition]) => {
      if (term.includes(searchLower) || definition.toLowerCase().includes(searchLower)) {
        matches.push({
          term,
          definition,
          relevance: term.startsWith(searchLower) ? 1 : 0.5
        });
      }
    });
    
    return matches.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  },

  // Extract potential terms from text
  extractTerms: (text) => {
    if (!text || typeof text !== 'string') return [];
    
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const foundTerms = [];
    
    words.forEach(word => {
      if (DefinitionsManager.hasDefinition(word)) {
        foundTerms.push(word);
      }
    });
    
    // Also check for compound terms
    const terms = Object.keys(DefinitionsManager.drivingTerms);
    terms.forEach(term => {
      if (term.includes(' ') && text.toLowerCase().includes(term)) {
        foundTerms.push(term);
      }
    });
    
    return [...new Set(foundTerms)]; // Remove duplicates
  },

  // Get custom definitions (user-added)
  getCustomDefinitions: () => {
    try {
      const stored = localStorage.getItem('custom_definitions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn("Error getting custom definitions:", error);
      return {};
    }
  },

  // Save custom definitions
  saveCustomDefinitions: (definitions) => {
    try {
      localStorage.setItem('custom_definitions', JSON.stringify(definitions));
      return true;
    } catch (error) {
      console.warn("Error saving custom definitions:", error);
      return false;
    }
  },

  // Add custom definition
  addCustomDefinition: (term, definition) => {
    const customDefs = DefinitionsManager.getCustomDefinitions();
    customDefs[term.toLowerCase().trim()] = {
      definition: definition.trim(),
      dateAdded: new Date().toISOString(),
      type: 'custom'
    };
    return DefinitionsManager.saveCustomDefinitions(customDefs);
  },

  // Get all available terms (built-in + custom)
  getAllTerms: () => {
    const builtIn = Object.keys(DefinitionsManager.drivingTerms).map(term => ({
      term,
      definition: DefinitionsManager.drivingTerms[term],
      type: 'built-in'
    }));
    
    const custom = Object.entries(DefinitionsManager.getCustomDefinitions()).map(([term, data]) => ({
      term,
      definition: data.definition,
      type: 'custom',
      dateAdded: data.dateAdded
    }));
    
    return [...builtIn, ...custom].sort((a, b) => a.term.localeCompare(b.term));
  },

  // Get statistics
  getStats: () => {
    const customDefs = DefinitionsManager.getCustomDefinitions();
    return {
      builtInTerms: Object.keys(DefinitionsManager.drivingTerms).length,
      customTerms: Object.keys(customDefs).length,
      totalTerms: Object.keys(DefinitionsManager.drivingTerms).length + Object.keys(customDefs).length,
      categories: {
        'Verkeer & Wegen': 15,
        'Voertuig Bediening': 12,
        'Verkeerssituaties': 8,
        'Veiligheid': 7
      }
    };
  }
};