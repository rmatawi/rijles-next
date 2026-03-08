import { useState, useEffect } from "react";

// Sample YTVideos data structure
const sampleVideoData = {
  categorieën: {
    parking: [
      {
        id: "sample-1",
        title: "Parallel Parking Demonstration",
        url: "https://www.youtube.com/watch?v=1Rdc0q_m2yY",
        description: "Learn how to park in tight spaces"
      }
    ]
  }
};

export const useYTVideosData = () => {
  const [videoData, setVideoData] = useState(sampleVideoData);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleDataUpdate = (categoryId, videoId, updatedData) => {
    setVideoData((prevData) => {
      let newData = prevData;

      // Handle delete operation
      if (updatedData && updatedData.type === 'deleteVideo') {
        const updatedCategories = { ...prevData.categorieën };
        if (updatedCategories[categoryId]) {
          updatedCategories[categoryId] = updatedCategories[categoryId].filter(q => q.id !== videoId);
          newData = {
            ...prevData,
            categorieën: updatedCategories,
          };
        } else {
          return prevData; // If category doesn't exist, return unchanged
        }
      }

      // Handle normal update operation
      else {
        const category = prevData.categorieën[categoryId];
        if (!category) return prevData;

        const updatedCategory = category.map((v) => {
          if (v.id === videoId) {
            return { ...v, ...updatedData };
          }
          return v;
        });

        newData = {
          ...prevData,
          categorieën: {
            ...prevData.categorieën,
            [categoryId]: updatedCategory,
          },
        };
      }

      // Save to localStorage
      try {
        localStorage.setItem("videoData", JSON.stringify(newData));
      } catch (error) {
        console.error("Failed to save videoData to localStorage:", error);
      }

      return newData;
    });
  };

  // Function to update the entire video data structure
  const updateAllVideoData = (newVideoData) => {
    setVideoData(newVideoData);
    // Save to localStorage
    try {
      localStorage.setItem("videoData", JSON.stringify(newVideoData));
    } catch (error) {
      console.error("Failed to save videoData to localStorage:", error);
    }
  };

  const addNewVideo = (categoryId, title, url, description = "") => {
    const newVideoId = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setVideoData((prevData) => {
      const category = prevData.categorieën[categoryId];
      if (!category) return prevData;

      const newVideo = {
        id: newVideoId,
        title: title,
        url: url,
        description: description,
      };

      const updatedCategory = [...category, newVideo];

      const newData = {
        ...prevData,
        categorieën: {
          ...prevData.categorieën,
          [categoryId]: updatedCategory,
        },
      };

      // Save to localStorage
      try {
        localStorage.setItem("videoData", JSON.stringify(newData));
      } catch (error) {
        console.error("Failed to save videoData to localStorage:", error);
      }

      return newData;
    });

    return newVideoId;
  };

  // Function to load video data from the database
  const loadVideoDataFromDB = async (drivingSchoolId) => {
    try {
      // Import and use the video service
      const { ytVideosService } = await import("../services/ytVideosService");

      const { data: dbEntries, error } = await ytVideosService.getVideoEntriesBySchoolId(drivingSchoolId);

      if (error) {
        console.error("Error fetching video entries from database:", error);
        return null;
      }

      // Also load custom categories from the database if available
      let categoriesFromDB = {};
      try {
        const { ytVideoCategoriesService } = await import("../services/ytVideoCategoriesService.js");
        const { data: dbCategories, error: categoriesError } = await ytVideoCategoriesService.getCategoriesBySchoolId(drivingSchoolId);

        if (!categoriesError && dbCategories) {
          // Create empty arrays for each custom category
          dbCategories.forEach(category => {
            categoriesFromDB[category.name] = [];
          });
        }
      } catch (categoriesError) {
        console.error("Error fetching video categories from database:", categoriesError);
        // Continue without custom categories
      }

      if (!dbEntries || dbEntries.length === 0) {
        // If no entries in database, return default data with potential custom categories
        return {
          categorieën: {
            ...sampleVideoData.categorieën,
            ...categoriesFromDB
          }
        };
      }

      // Transform database entries to the expected format
      const transformedData = { categorieën: { ...categoriesFromDB } }; // Start with custom categories

      dbEntries.forEach(entry => {
        const { title, url, description } = entry.video_entry;
        const categoryId = entry.category; // Use category field as category

        if (!transformedData.categorieën[categoryId]) {
          transformedData.categorieën[categoryId] = [];
        }

        transformedData.categorieën[categoryId].push({
          id: entry.id, // Use database ID
          title: title,
          url: url,
          description: description || ""
        });
      });

      // Add default categories that don't have custom videos
      for (const [defaultCatKey, defaultCatVideos] of Object.entries(sampleVideoData.categorieën)) {
        if (!transformedData.categorieën[defaultCatKey]) {
          transformedData.categorieën[defaultCatKey] = defaultCatVideos;
        }
      }

      return transformedData;
    } catch (error) {
      console.error("Error loading video data from database:", error);
      return null;
    }
  };

  // Function to load video data (database first, merge with localStorage, then fallback to localStorage, then default)
  const loadVideoData = async () => {
    try {
      // Get the driving school ID
      const drivingSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      if (drivingSchoolId) {
        // Try to load from database first
        const dbData = await loadVideoDataFromDB(drivingSchoolId);

        if (dbData) {
          // Check if we have local changes in localStorage that haven't been pushed to the database
          const localStorageData = localStorage.getItem("videoData");
          if (localStorageData) {
            try {
              const localData = JSON.parse(localStorageData);

              // Merge database data with local changes
              // This preserves local additions, edits, and deletions
              const mergedData = mergeVideoData(dbData, localData);

              setVideoData(mergedData);
              localStorage.setItem("videoData", JSON.stringify(mergedData));
              return mergedData;
            } catch (parseError) {
              console.error("Error parsing localStorage data for merge:", parseError);
              // If parsing fails, just use the database data
              setVideoData(dbData);
              localStorage.setItem("videoData", JSON.stringify(dbData));
              return dbData;
            }
          } else {
            // No local changes, just use database data
            setVideoData(dbData);
            localStorage.setItem("videoData", JSON.stringify(dbData));
            return dbData;
          }
        }
      }

      // Fallback to localStorage
      const localStorageData = localStorage.getItem("videoData");
      if (localStorageData) {
        const parsedData = JSON.parse(localStorageData);
        setVideoData(parsedData);
        return parsedData;
      }

      // Use default data as last resort
      setVideoData(sampleVideoData);
      return sampleVideoData;
    } catch (error) {
      console.error("Error loading video data:", error);
      // Use default data if everything fails
      setVideoData(sampleVideoData);
      return sampleVideoData;
    }
  };

  // Helper function to merge database data with local data, preserving local changes
  const mergeVideoData = (dbData, localData) => {
    if (!dbData || !localData) {
      return dbData || localData || sampleVideoData;
    }

    const mergedData = { categorieën: { ...dbData.categorieën } };

    // Process each category in local data
    for (const [categoryKey, localVideos] of Object.entries(localData.categorieën)) {
      if (!mergedData.categorieën[categoryKey]) {
        mergedData.categorieën[categoryKey] = [];
      }

      const dbVideos = dbData.categorieën[categoryKey] || [];
      const localVideoIds = new Set(localVideos.map(v => v.id));

      // Add videos from DB that aren't in local data (new additions since last sync)
      for (const dbVideo of dbVideos) {
        if (!localVideoIds.has(dbVideo.id)) {
          // Only add if it doesn't already exist in merged data
          const existingIndex = mergedData.categorieën[categoryKey].findIndex(q => q.id === dbVideo.id);
          if (existingIndex === -1) {
            mergedData.categorieën[categoryKey].push(dbVideo);
          }
        }
      }

      // Add/update videos from local data (includes new additions, edits, and preserves deletions)
      for (const localVideo of localVideos) {
        const existingIndex = mergedData.categorieën[categoryKey].findIndex(q => q.id === localVideo.id);
        if (existingIndex !== -1) {
          // Update existing video with local version
          mergedData.categorieën[categoryKey][existingIndex] = localVideo;
        } else {
          // Add new video from local
          mergedData.categorieën[categoryKey].push(localVideo);
        }
      }
    }

    // Add any categories that exist in DB but not processed from local
    for (const [categoryKey, dbVideos] of Object.entries(dbData.categorieën)) {
      if (!mergedData.categorieën[categoryKey]) {
        mergedData.categorieën[categoryKey] = [...dbVideos];
      }
    }

    return mergedData;
  };

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      loadVideoData().finally(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  return {
    videoData,
    handleDataUpdate,
    addNewVideo,
    loadVideoDataFromDB,
    updateAllVideoData,
    loadVideoData,
  };
};