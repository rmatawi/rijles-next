// src/utils/imageUpload.js

/**
 * Function to resize image using HTML5 Canvas API
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} - Resized image blob
 */
export const resizeImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      // Adjust dimensions to fit within max bounds while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality
      canvas.toBlob(resolve, "image/jpeg", 0.8); // 80% quality
    };

    // Create a data URL from the file to avoid CSP issues with blob URLs
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Function to upload logo with client-side resize
 * @param {File} file - The logo file to upload
 * @param {string} publicKey - ImageKit public key
 * @returns {Promise<Object>} - Upload response
 */
export const uploadLogoImage = async (file, publicKey) => {
  // First resize the image on client side (max 300x300 for logos)
  const resizedFile = await resizeImage(file, 300, 300);
  // Create a new file with the resized data
  const resizedFileWithName = new File(
    [resizedFile],
    `resized_${file.name}`,
    { type: "image/jpeg" }
  );

  // Prepare form data for ImageKit upload
  const form = new FormData();
  form.append("file", resizedFileWithName);
  form.append("fileName", resizedFileWithName.name);
  form.append("publicKey", publicKey);
  form.append("folder", "/logos");

  // Basic authentication using private key
  const response = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic cHJpdmF0ZV91Um9TQlVMZjJKcFNGM0pYa1hTU0ZEZnUzalE9Og==",
      },
      body: form,
    }
  );

  return response.json();
};

/**
 * Function to upload cover image with client-side resize
 * @param {File} file - The cover image file to upload
 * @param {string} publicKey - ImageKit public key
 * @returns {Promise<Object>} - Upload response
 */
export const uploadCoverImage = async (file, publicKey) => {
  // First resize the image on client side (max 720x720 for covers)
  const resizedFile = await resizeImage(file, 720, 720);
  // Create a new file with the resized data
  const resizedFileWithName = new File(
    [resizedFile],
    `resized_${file.name}`,
    { type: "image/jpeg" }
  );

  // Prepare form data for ImageKit upload
  const form = new FormData();
  form.append("file", resizedFileWithName);
  form.append("fileName", resizedFileWithName.name);
  form.append("publicKey", publicKey);
  form.append("folder", "/covers");

  // Basic authentication using private key
  const response = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization:
          "Basic cHJpdmF0ZV91Um9TQlVMZjJKcFNGM0pYa1hTU0ZEZnUzalE9Og==",
      },
      body: form,
    }
  );

  return response.json();
};

/**
 * Function to upload ad image with client-side resize
 * @param {File} file - The ad image file to upload
 * @param {string} publicKey - ImageKit public key
 * @returns {Promise<Object>} - Upload response
 */
export const uploadAdImage = async (file, publicKey) => {
  // Keep ads lightweight while preserving quality for cards
  const resizedFile = await resizeImage(file, 1200, 675);
  const resizedFileWithName = new File(
    [resizedFile],
    `ad_${Date.now()}_${file.name}`,
    { type: "image/jpeg" }
  );

  const form = new FormData();
  form.append("file", resizedFileWithName);
  form.append("fileName", resizedFileWithName.name);
  form.append("publicKey", publicKey);
  form.append("folder", "/ads");

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Basic cHJpdmF0ZV91Um9TQlVMZjJKcFNGM0pYa1hTU0ZEZnUzalE9Og==",
    },
    body: form,
  });

  return response.json();
};
