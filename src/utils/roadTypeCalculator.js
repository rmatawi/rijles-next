/**
 * Road Type Calculator for Suriname Traffic System
 * 
 * This utility determines the type of road a vehicle is on based on Suriname's
 * traffic rules and road classification system.
 * 
 * Road Types in Suriname:
 * 1. INRIT - Entry road (priority must be yielded to main roads)
 * 2. ZANDWEG - Unpaved road (lower priority in most situations)
 * 3. DOORGAANDE WEG - Through road (main road with continuous flow)
 * 4. EINDIGENDE WEG - Ending road (road that terminates at intersection)
 * 5. TCROSS - T-intersection (special case of ending road)
 */

/**
 * Determines the road type for a vehicle based on road data and intersection context
 * 
 * @param {Object} roadData - The road data containing note and other properties
 * @param {Object} intersectionData - The complete intersection data for context
 * @param {string} vehicleDirection - The direction the vehicle is traveling
 * @param {Object} vehicle - The vehicle object
 * @returns {string} The road type: 'inrit', 'zandweg', 'doorgaande', 'eindigende', 'tcross', or 'unknown'
 */
export const calculateRoadType = (roadData, intersectionData, vehicleDirection, vehicle) => {
  // Get road note and normalize it
  const roadNote = roadData?.note?.toUpperCase() || '';
  
  // Check for INRIT roads (entry roads that must yield)
  if (roadNote.includes('INRIT')) {
    // Differentiate between INRIT S (special) and INRIT B (different rules)
    if (roadNote.includes('INRIT S')) {
      return 'inrit-s';
    } else if (roadNote.includes('INRIT B')) {
      return 'inrit-b';
    }
    return 'inrit';
  }
  
  // Check for ZANDWEG (unpaved roads with lower priority)
  if (roadNote.includes('ZANDWEG') || roadNote.includes('●')) {
    return 'zandweg';
  }
  
  // Check for TCROSS (T-intersection roads)
  if (roadNote.includes('TCROSS')) {
    return 'tcross';
  }
  
  // Determine if it's a doorgaande weg (through road) or eindigende weg (ending road)
  // This requires analyzing the intersection context
  if (intersectionData) {
    // Count how many roads connect to this intersection
    const connectedRoads = countConnectedRoads(intersectionData, roadData);
    
    // Doorgaande wegen (through roads) typically connect to multiple roads
    // and allow continuous flow
    if (connectedRoads >= 3) {
      // Additional checks for doorgaande wegen
      // These are typically main roads in Suriname
      if (isMainRoad(roadNote)) {
        return 'doorgaande';
      }
    }
    
    // Eindigende wegen (ending roads) typically terminate at the intersection
    if (connectedRoads < 3) {
      return 'eindigende';
    }
  }
  
  // Default case - if we can't determine the type
  return 'unknown';
};

/**
 * Counts how many roads are connected to the intersection from this road's perspective
 * 
 * @param {Object} intersectionData - The complete intersection data
 * @param {Object} roadData - The current road data
 * @returns {number} Number of connected roads
 */
const countConnectedRoads = (intersectionData, roadData) => {
  let connectedCount = 0;
  
  // Check each direction in the intersection
  ['top', 'right', 'bottom', 'left'].forEach(direction => {
    const directionData = intersectionData[direction];
    if (directionData && Object.keys(directionData).length > 0) {
      // Don't count empty roads
      if (directionData.vehicles || directionData.note) {
        connectedCount++;
      }
    }
  });
  
  return connectedCount;
};

/**
 * Determines if a road is a main road based on its characteristics
 * 
 * @param {string} roadNote - The road note text
 * @returns {boolean} True if it's considered a main road
 */
const isMainRoad = (roadNote) => {
  // Main roads in Suriname often don't have special designations
  // They're typically the roads without INRIT, ZANDWEG, or TCROSS markings
  const hasSpecialDesignation = 
    roadNote.includes('INRIT') || 
    roadNote.includes('ZANDWEG') || 
    roadNote.includes('●') ||
    roadNote.includes('TCROSS');
    
  // If it doesn't have a special designation, it's likely a main road
  return !hasSpecialDesignation;
};

/**
 * Gets detailed information about the road type for display purposes
 * 
 * @param {string} roadType - The calculated road type
 * @returns {Object} Detailed information about the road type
 */
export const getRoadTypeInfo = (roadType) => {
  const roadTypeInfo = {
    'inrit': {
      name: 'Inrit',
      description: 'Entry road - must yield to main road traffic',
      priority: 'low',
      color: '#ff9800' // Orange
    },
    'inrit-s': {
      name: 'Inrit S',
      description: 'Special entry road with specific yielding rules',
      priority: 'low',
      color: '#f57c00' // Darker orange
    },
    'inrit-b': {
      name: 'Inrit B',
      description: 'Secondary entry road with different rules',
      priority: 'low',
      color: '#ff9800' // Orange
    },
    'zandweg': {
      name: 'Zandweg',
      description: 'Unpaved road - generally lower priority',
      priority: 'low',
      color: '#795548' // Brown
    },
    'doorgaande': {
      name: 'Doorgaande Weg',
      description: 'Through road - main road with continuous flow',
      priority: 'high',
      color: '#4caf50' // Green
    },
    'eindigende': {
      name: 'Eindigende Weg',
      description: 'Ending road - terminates at intersection',
      priority: 'medium',
      color: '#2196f3' // Blue
    },
    'tcross': {
      name: 'T-Cross',
      description: 'T-intersection - special case of ending road',
      priority: 'low',
      color: '#9c27b0' // Purple
    },
    'unknown': {
      name: 'Onbekend',
      description: 'Unknown road type',
      priority: 'medium',
      color: '#9e9e9e' // Gray
    }
  };
  
  return roadTypeInfo[roadType] || roadTypeInfo['unknown'];
};

/**
 * Determines if a vehicle should yield based on road type and traffic rules
 * 
 * @param {string} roadType - The calculated road type
 * @param {string} vehicleDirection - The direction the vehicle is traveling
 * @param {string} destinationRoadType - The type of road the vehicle is turning into (if applicable)
 * @returns {boolean} True if the vehicle should yield
 */
export const shouldYield = (roadType, vehicleDirection, destinationRoadType = null) => {
  // Vehicles on INRIT roads must always yield
  if (roadType.includes('inrit')) {
    return true;
  }
  
  // Vehicles on TCROSS roads must yield
  if (roadType === 'tcross') {
    return true;
  }
  
  // Left turners from ZANDWEG must yield
  if (roadType === 'zandweg' && vehicleDirection === 'left') {
    return true;
  }
  
  // Right turners from ZANDWEG must yield
  if (roadType === 'zandweg' && vehicleDirection === 'right') {
    return true;
  }
  
  // Vehicles entering INRIT roads must yield
  if (destinationRoadType && destinationRoadType.includes('inrit')) {
    return true;
  }
  
  // Default - no need to yield
  return false;
};

export default {
  calculateRoadType,
  getRoadTypeInfo,
  shouldYield
};