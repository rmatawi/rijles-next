// components/EnhancedContentRenderer.jsx - Enhanced content display component with interactive features
import React, { useState, useRef, useEffect } from "react";
import { ContentFormatters } from "../js/ContentFormatters.js";
import { DefinitionsManager } from "../js/DefinitionsManager.js";
import { HighlightManager } from "../js/HighlightManager.js";
import { QuickDefinition } from "./QuickDefinition.jsx";
import { ExpandableSection, InfoSection, TipSection, ExampleSection } from "./ExpandableSection.jsx";

export const EnhancedContentRenderer = ({ 
  content, 
  type = "text", 
  bookId, 
  sectionId, 
  onTextSelection,
  enableInteractions = true 
}) => {
  const [showDefinition, setShowDefinition] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [definitionPosition, setDefinitionPosition] = useState(null);
  const contentRef = useRef(null);

  // Handle text selection for definitions
  const handleTextClick = (event) => {
    if (!enableInteractions) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 1) {
      // Check if it's a clickable term
      const clickedElement = event.target;
      if (clickedElement.classList.contains('definition-term')) {
        const term = clickedElement.textContent.toLowerCase().trim();
        if (DefinitionsManager.hasDefinition(term)) {
          const rect = clickedElement.getBoundingClientRect();
          setSelectedTerm(term);
          setDefinitionPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 10
          });
          setShowDefinition(true);
          return;
        }
      }

      // Handle text selection for highlighting
      if (onTextSelection && selectedText.length > 5) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        onTextSelection(selectedText, {
          x: rect.left + rect.width / 2,
          y: rect.bottom + 10
        });
      }
    }
  };

  // Highlight text that has definitions
  const highlightTerms = (text) => {
    if (!enableInteractions || typeof text !== 'string') return text;

    const terms = DefinitionsManager.extractTerms(text);
    let highlightedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, 
        `<span class="definition-term text-color-blue text-decoration-underline cursor-pointer">${term}</span>`
      );
    });

    return highlightedText;
  };

  // Detect special content types
  const detectSpecialContent = (text) => {
    if (!text || typeof text !== 'string') return null;

    // Info sections (start with "ℹ️" or "Info:")
    if (text.match(/^(ℹ️|Info:|INFORMATIE:|Let op:)/i)) {
      return { type: 'info', content: text.replace(/^(ℹ️|Info:|INFORMATIE:|Let op:)\s*/i, '') };
    }

    // Tips (start with "💡" or "Tip:")
    if (text.match(/^(💡|Tip:|TIPS?:|Handig:)/i)) {
      return { type: 'tip', content: text.replace(/^(💡|Tip:|TIPS?:|Handig:)\s*/i, '') };
    }

    // Examples (start with "📝" or "Voorbeeld:")
    if (text.match(/^(📝|Voorbeeld:|VOORBEELD:|Bijvoorbeeld:)/i)) {
      return { type: 'example', content: text.replace(/^(📝|Voorbeeld:|VOORBEELD:|Bijvoorbeeld:)\s*/i, '') };
    }

    // Expandable sections (contain "..." or "Meer info")
    if (text.includes('...') && text.length > 100) {
      const shortText = text.substring(0, text.indexOf('...'));
      const fullText = text;
      return { type: 'expandable', shortText, fullText };
    }

    return null;
  };

  // Get existing highlights for this section
  const getSectionHighlights = () => {
    if (!bookId || !sectionId) return [];
    return HighlightManager.getSectionHighlights(bookId, sectionId);
  };

  // Apply highlights to text
  const applyHighlights = (text) => {
    if (!enableInteractions || typeof text !== 'string') return text;

    const highlights = getSectionHighlights();
    let highlightedText = text;

    highlights.forEach(highlight => {
      if (highlightedText.includes(highlight.text)) {
        const colorClass = `bg-${highlight.color}-light`;
        highlightedText = highlightedText.replace(
          highlight.text,
          `<span class="highlight ${colorClass} padding-quarter border-radius" title="${highlight.note || 'Geen notitie'}">${highlight.text}</span>`
        );
      }
    });

    return highlightedText;
  };
  if (!content) return null;

  if (Array.isArray(content)) {
    return (
      <div className="enhanced-content">
        {content.map((item, index) => (
          <EnhancedContentRenderer 
            key={index} 
            content={item} 
            type="text" 
            bookId={bookId}
            sectionId={sectionId}
            onTextSelection={onTextSelection}
            enableInteractions={enableInteractions}
          />
        ))}
      </div>
    );
  }

  if (typeof content !== "string") {
    return (
      <div className="content-object">
        <pre className="code-block">{JSON.stringify(content, null, 2)}</pre>
      </div>
    );
  }

  // Check for special content types first
  const specialContent = detectSpecialContent(content);
  if (specialContent) {
    switch (specialContent.type) {
      case 'info':
        return (
          <InfoSection title="Informatie" isExpandedByDefault={true}>
            <div dangerouslySetInnerHTML={{ 
              __html: applyHighlights(highlightTerms(specialContent.content))
            }} />
          </InfoSection>
        );
      
      case 'tip':
        return (
          <TipSection title="Tip" isExpandedByDefault={true}>
            <div dangerouslySetInnerHTML={{ 
              __html: applyHighlights(highlightTerms(specialContent.content))
            }} />
          </TipSection>
        );
      
      case 'example':
        return (
          <ExampleSection title="Voorbeeld" isExpandedByDefault={false}>
            <div dangerouslySetInnerHTML={{ 
              __html: applyHighlights(highlightTerms(specialContent.content))
            }} />
          </ExampleSection>
        );
      
      case 'expandable':
        return (
          <ExpandableSection title="Meer informatie" isExpandedByDefault={false}>
            <div dangerouslySetInnerHTML={{ 
              __html: applyHighlights(highlightTerms(specialContent.fullText))
            }} />
          </ExpandableSection>
        );
    }
  }

  const contentType = ContentFormatters.getContentType(content);

  switch (contentType) {
    case "header":
      const level = ContentFormatters.getHeaderLevel(content);
      const headerText = ContentFormatters.formatHeader(content);
      const HeaderTag = `h${Math.min(level + 1, 6)}`;

      return (
        <div
          className={`content-header content-header-${level} margin-vertical`}
        >
          <HeaderTag
            className={`text-size-${
              24 - level * 2
            } font-weight-bold text-color-black margin-bottom-half`}
            dangerouslySetInnerHTML={{ __html: highlightTerms(headerText) }}
          />
        </div>
      );

    case "formatted":
    case "code":
      return (
        <div 
          className="content-formatted margin-bottom"
          ref={contentRef}
          onClick={handleTextClick}
        >
          <p
            className="text-size-16 line-height-large text-color-black"
            dangerouslySetInnerHTML={{
              __html: applyHighlights(highlightTerms(ContentFormatters.formatText(content))),
            }}
          />
        </div>
      );

    case "paragraph":
      return (
        <div 
          className="content-paragraph margin-bottom"
          ref={contentRef}
          onClick={handleTextClick}
        >
          <p 
            className="text-size-16 line-height-large text-color-black text-justify"
            dangerouslySetInnerHTML={{
              __html: applyHighlights(highlightTerms(content))
            }}
          />
        </div>
      );

    default:
      return (
        <div 
          className="content-text margin-bottom-half"
          ref={contentRef}
          onClick={handleTextClick}
        >
          <p 
            className="text-size-16 line-height-large text-color-black"
            dangerouslySetInnerHTML={{
              __html: applyHighlights(highlightTerms(content))
            }}
          />
          
          {/* Quick Definition Popover */}
          <QuickDefinition
            isOpen={showDefinition}
            onClose={() => setShowDefinition(false)}
            term={selectedTerm}
            position={definitionPosition}
          />
        </div>
      );
  }
};