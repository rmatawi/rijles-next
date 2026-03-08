// utils/ContentFormatters.js - Content formatting utilities
export const ContentFormatters = {
  // Format markdown-like headers
  formatHeader: (text) => {
    if (!text || typeof text !== "string") return text;

    // Remove markdown symbols and return clean text
    return text.replace(/^#+\s*/, "").trim();
  },

  // Format text with basic markdown-like styling
  formatText: (text) => {
    if (!text || typeof text !== "string") return text;

    // Replace **bold** with spans
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Replace *italic* with spans
    formatted = formatted.replace(
      /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g,
      "<em>$1</em>"
    );

    // Replace `code` with spans
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    return formatted;
  },

  // Detect content type
  getContentType: (text) => {
    if (!text || typeof text !== "string") return "text";

    if (text.startsWith("#")) return "header";
    if (text.includes("**") || text.includes("*")) return "formatted";
    if (text.includes("`")) return "code";
    if (text.length > 200) return "paragraph";
    return "text";
  },

  // Get header level
  getHeaderLevel: (text) => {
    if (!text || typeof text !== "string") return 1;

    const match = text.match(/^(#+)/);
    return match ? Math.min(match[1].length, 6) : 1;
  },
};