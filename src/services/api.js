// src/services/api.js
// Mock API service for database integration
import { convertTo3x3Grid } from '../js/utils';

// Mock delay to simulate network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (in a real app, this would be handled by the backend)
let mockData = {
  admins: [],
  drivingSchools: [],
  qaEntries: [],
  maquetteChapters: [],
  drv_maquettes: [],
  maquetteVehicles: [],
  students: [],
  studentProgress: []
};

// Helper function to generate UUID-like IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Admin authentication
export const adminSignup = async (email, password) => {
  await delay(500); // Simulate network delay
  
  // Check if admin already exists
  const existingAdmin = mockData.admins.find(admin => admin.email === email);
  if (existingAdmin) {
    throw new Error('Admin with this email already exists');
  }
  
  const newAdmin = {
    id: generateId(),
    email,
    password_hash: btoa(password), // Simple base64 encoding for mock (NOT secure)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockData.admins.push(newAdmin);
  return { success: true, admin: newAdmin };
};

export const adminLogin = async (email, password) => {
  await delay(500); // Simulate network delay
  
  const admin = mockData.admins.find(admin => admin.email === email);
  if (!admin) {
    throw new Error('Admin not found');
  }
  
  // Check password (in a real app, this would use proper hashing)
  if (atob(admin.password_hash) !== password) {
    throw new Error('Invalid password');
  }
  
  return { success: true, admin };
};

// Driving school management
export const createDrivingSchool = async (adminId, schoolData) => {
  await delay(500); // Simulate network delay
  
  const newSchool = {
    id: generateId(),
    admin_id: adminId,
    ...schoolData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockData.drivingSchools.push(newSchool);
  return { success: true, school: newSchool };
};

export const updateDrivingSchool = async (schoolId, schoolData) => {
  await delay(500); // Simulate network delay
  
  const index = mockData.drivingSchools.findIndex(school => school.id === schoolId);
  if (index === -1) {
    throw new Error('Driving school not found');
  }
  
  mockData.drivingSchools[index] = {
    ...mockData.drivingSchools[index],
    ...schoolData,
    updated_at: new Date().toISOString()
  };
  
  return { success: true, school: mockData.drivingSchools[index] };
};

export const getDrivingSchoolByAdmin = async (adminId) => {
  await delay(300); // Simulate network delay
  
  const school = mockData.drivingSchools.find(school => school.admin_id === adminId);
  return { success: true, school };
};

// Q&A management
export const saveQAEntries = async (drivingSchoolId, qaEntries) => {
  await delay(800); // Simulate network delay
  
  // Remove existing entries for this school
  mockData.qaEntries = mockData.qaEntries.filter(entry => entry.driving_school_id !== drivingSchoolId);
  
  // Add new entries using the new schema structure
  const newEntries = qaEntries.map(entry => ({
    id: generateId(),
    driving_school_id: drivingSchoolId,
    // Store the actual QA content in the qa_entry JSONB field
    qa_entry: {
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      // Include any additional fields that might be present
      ...Object.fromEntries(
        Object.entries(entry).filter(([key]) => !['category', 'question', 'answer', 'id', 'driving_school_id', 'created_at', 'updated_at'].includes(key))
      )
    },
    // Use the category as the name field
    name: entry.category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  mockData.qaEntries.push(...newEntries);
  
  return { success: true, entries: newEntries };
};

export const getQAEntries = async (drivingSchoolId) => {
  await delay(500); // Simulate network delay
  
  // Filter entries for the specific school
  const entries = mockData.qaEntries.filter(entry => entry.driving_school_id === drivingSchoolId);
  // Extract the qa_entry content to return the original format expected by the UI
  const qaData = entries.map(entry => ({
    ...entry.qa_entry, // Spread the content from the JSONB field
    id: entry.id
  }));
  
  return { success: true, entries: qaData };
};

// Maquette management
export const saveMaquettes = async (maquettesData) => {
  await delay(1000); // Simulate network delay
  
  // For simplicity in this mock, we'll just replace all maquettes
  // In a real implementation, you'd want more sophisticated handling
  
  // Clear existing maquettes and vehicles
  mockData.drv_maquettes = [];
  mockData.maquetteVehicles = [];
  
  // Process each maquette in the data
  Object.entries(maquettesData).forEach(([key, maquette]) => {
    const maquetteId = generateId();
    const maquetteNumber = key.replace('maquette_', '');
    
    // Create maquette record with the new schema structure
    const newMaquette = {
      id: maquetteId,
      driving_school_id: null, // In a real app, you'd link to actual driving school
      maquette: {
        title: maquette.title || maquetteNumber,
        roadsize: maquette.roadsize || 'S/B',
        sequence: maquette.sequence || '',
        emphasis_text: maquette.answer || '',
        paragraph_text: maquette.importantNotes || '',
        notes: maquette.notes || '',
        top: maquette.top || { vehicles: [] },
        bottom: maquette.bottom || { vehicles: [] },
        left: maquette.left || { vehicles: [] },
        right: maquette.right || { vehicles: [] }
      },
      name: maquette.title || maquetteNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.drv_maquettes.push(newMaquette);
    
    // Process vehicles for each direction (storing separately for compatibility)
    ['top', 'bottom', 'left', 'right'].forEach(direction => {
      if (maquette[direction] && maquette[direction].vehicles) {
        maquette[direction].vehicles.forEach((row, rowIndex) => {
          row.forEach((vehicle, colIndex) => {
            if (vehicle && vehicle.type) {
              mockData.maquetteVehicles.push({
                id: generateId(),
                maquette_id: maquetteId,
                position: direction,
                row_index: rowIndex,
                col_index: colIndex,
                type: vehicle.type,
                direction: vehicle.direction || 'straight',
                name: vehicle.name || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          });
        });
      }
    });
  });
  
  return { success: true, message: `Saved ${Object.keys(maquettesData).length} maquettes` };
};

export const getMaquettes = async () => {
  await delay(800); // Simulate network delay

  // Reconstruct maquettes with vehicles
  const reconstructedMaquettes = {};

  mockData.drv_maquettes.forEach(drvMaquette => {
    const maquetteKey = `maquette_${drvMaquette.name}`;
    reconstructedMaquettes[maquetteKey] = {
      ...drvMaquette.maquette // Spread the maquette object from the new schema
    };

    // Add vehicles to appropriate directions
    mockData.maquetteVehicles
      .filter(vehicle => vehicle.maquette_id === drvMaquette.id)
      .forEach(vehicle => {
        if (!reconstructedMaquettes[maquetteKey][vehicle.position].vehicles[vehicle.row_index]) {
          reconstructedMaquettes[maquetteKey][vehicle.position].vehicles[vehicle.row_index] = [];
        }

        reconstructedMaquettes[maquetteKey][vehicle.position].vehicles[vehicle.row_index][vehicle.col_index] = {
          type: vehicle.type,
          direction: vehicle.direction,
          name: vehicle.name
        };
      });

    // Apply 3x3 grid conversion to ensure proper IDs and structure
    reconstructedMaquettes[maquetteKey] = convertTo3x3Grid(reconstructedMaquettes[maquetteKey]);
  });

  return { success: true, maquettes: reconstructedMaquettes };
};

// Student management
export const studentLogin = async (email) => {
  await delay(500); // Simulate network delay
  
  let student = mockData.students.find(student => student.email === email);
  
  if (!student) {
    // Create new student if not exists
    student = {
      id: generateId(),
      driving_school_id: mockData.drivingSchools[0]?.id || generateId(), // Default to first school
      name: `Student ${mockData.students.length + 1}`,
      email,
      progress: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.students.push(student);
  }
  
  return { success: true, student };
};

export const saveStudentProgress = async (studentId, maquetteId, progress) => {
  await delay(300); // Simulate network delay
  
  const progressId = generateId();
  const newProgress = {
    id: progressId,
    student_id: studentId,
    maquette_id: maquetteId,
    ...progress,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockData.studentProgress.push(newProgress);
  
  return { success: true, progress: newProgress };
};

export const getStudentProgress = async (studentId) => {
  await delay(400); // Simulate network delay
  
  const progress = mockData.studentProgress.filter(p => p.student_id === studentId);
  return { success: true, progress };
};

// Utility function to reset mock data (for testing)
export const resetMockData = () => {
  mockData = {
    admins: [],
    drivingSchools: [],
    qaEntries: [],
    maquetteChapters: [],
    drv_maquettes: [],
    maquetteVehicles: [],
    students: [],
    studentProgress: []
  };
};

// Utility function to get all mock data (for debugging)
export const getAllMockData = () => {
  return mockData;
};