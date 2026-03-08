// components/HighlightPopover.jsx - Interactive highlighting popover
import React, { useState, useEffect } from "react";
import { Popover, Block, Button, Icon, TextEditor } from "framework7-react";
import { HighlightManager } from "../js/HighlightManager.js";

export const HighlightPopover = ({
  isOpen,
  onClose,
  selectedText,
  position,
  bookId,
  sectionId,
  sectionTitle,
  onHighlightAdded,
}) => {
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [note, setNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const colors = HighlightManager.getHighlightColors();

  const handleAddHighlight = () => {
    if (!selectedText || !bookId || !sectionId) return;

    const highlight = HighlightManager.addHighlight(bookId, {
      text: selectedText,
      sectionId,
      sectionTitle,
      color: selectedColor,
      note: note.trim(),
      startOffset: 0, // Would be calculated from selection in real implementation
      endOffset: selectedText.length,
    });

    if (onHighlightAdded) {
      onHighlightAdded(highlight);
    }

    // Reset state
    setNote("");
    setIsAddingNote(false);
    setSelectedColor("yellow");
    onClose();
  };

  const handleAddNote = () => {
    setIsAddingNote(true);
  };

  useEffect(() => {
    if (!isOpen) {
      setNote("");
      setIsAddingNote(false);
      setSelectedColor("yellow");
    }
  }, [isOpen]);

  return (
    <Popover
      closeByOutsideClick
      opened={isOpen}
      onPopoverClosed={onClose}
      style={
        position
          ? {
              position: "absolute",
              top: position.y,
              left: position.x,
            }
          : {}
      }
    >
      <Block className="highlight-popover padding">
        {/* Selected text preview */}
        <div className="margin-bottom">
          <div className="text-size-12 text-color-gray margin-bottom-half">
            Geselecteerde tekst:
          </div>
          <div className="padding-half border-radius bg-gray-light text-size-14">
            "{selectedText}"
          </div>
        </div>

        {/* Color selection */}
        <div className="margin-bottom">
          <div className="text-size-14 font-weight-medium margin-bottom-half">
            Markeerkleur:
          </div>
          <div className="display-flex justify-content-space-between">
            {colors.map((color) => (
              <Button
                key={color.value}
                className={`width-40 height-40 margin-right-quarter ${
                  color.class
                } ${
                  selectedColor === color.value ? "border-2 border-blue" : ""
                }`}
                onClick={() => setSelectedColor(color.value)}
                style={{
                  minWidth: "40px",
                  opacity: selectedColor === color.value ? 1 : 0.7,
                }}
              >
                {selectedColor === color.value && (
                  <Icon f7="checkmark" size="16" className="text-color-white" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Note section */}
        {!isAddingNote ? (
          <div className="margin-bottom">
            <Button
              small
              outline
              iconF7="note_text"
              onClick={handleAddNote}
              className="width-100"
            >
              Notitie toevoegen
            </Button>
          </div>
        ) : (
          <div className="margin-bottom">
            <div className="text-size-14 font-weight-medium margin-bottom-half">
              Notitie (optioneel):
            </div>
            <TextEditor
              placeholder="Voeg een notitie toe..."
              value={note}
              onTextEditorChange={(value) => setNote(value)}
              className="margin-bottom-half"
              style={{ minHeight: "60px" }}
              buttons={[["bold"], ["orderedList", "unorderedList"]]}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 grid-gap">
          <Button outline onClick={onClose}>
            <Icon f7="xmark" size="16" />
          </Button>
          <Button fill color="blue" onClick={handleAddHighlight}>
            <Icon f7="highlighter" size="16" className="margin-right-half" />
            Markeren
          </Button>
        </div>
      </Block>
    </Popover>
  );
};
