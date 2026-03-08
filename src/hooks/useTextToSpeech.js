// src/hooks/useTextToSpeech.js
import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for text-to-speech functionality with Dutch (Netherlands) voice
 * Handles sentence-by-sentence speaking with proper pauses
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Function to find the best Dutch (Netherlands) voice
  const findDutchVoice = useCallback((voices) => {
    console.log("=== Available voices ===");
    voices.forEach(v => console.log(`${v.name} (${v.lang}) - ${v.localService ? 'local' : 'remote'}`));
    console.log("=======================");

    // Detect if we're on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      console.log("iOS device detected, looking for iOS Dutch voices");

      // For iOS, look for Dutch Netherlands voices - particularly female voices
      // Common iOS Dutch Netherlands voice names that tend to be higher quality and often female
      const iosPriority = [
        name => name === "com.apple.ttsbundle.Ellen-Synthesis-Voice", // Specific Dutch Netherlands female voice
        name => name.toLowerCase().includes("ellen") && name.toLowerCase().includes("nl"), // iOS Dutch female voice
        name => name.toLowerCase().includes("mariska"), // iOS Dutch Netherlands female voice
        name => name.toLowerCase().includes("nl") && name.toLowerCase().includes("female") && !name.toLowerCase().includes("male"), // Female Dutch, not male
        name => name.toLowerCase().includes("nl-nl") && !name.toLowerCase().includes("male"), // Dutch Netherlands female voices
        name => name.toLowerCase().includes("dutch") && name.toLowerCase().includes("female"), // Female Dutch in name
        name => name.toLowerCase().includes("dutch") && name.toLowerCase().includes("netherlands"), // Dutch Netherlands voices
        name => name.includes("nl-NL"), // Any Dutch Netherlands voice
        name => name.toLowerCase().includes("dutch") // General Dutch voices
      ];

      for (const predicate of iosPriority) {
        const voice = voices.find(v => predicate(v.name));
        if (voice) {
          console.log("Found iOS Dutch Netherlands voice:", voice.name);
          return voice;
        }
      }
    }

    // For non-iOS, keep the original priority order for Dutch (Netherlands) voices:
    // 1. Exact nl-NL voices (Netherlands Dutch)
    // 2. Generic nl voices
    // 3. nl-BE voices (Belgian Dutch) as fallback

    // First priority: nl-NL voices (Netherlands)
    let dutchVoice = voices.find(voice => voice.lang === "nl-NL");

    if (!dutchVoice) {
      // Second priority: generic nl voices
      dutchVoice = voices.find(voice => voice.lang === "nl");
    }

    if (!dutchVoice) {
      // Third priority: any voice starting with nl (including nl-BE)
      dutchVoice = voices.find(voice => voice.lang.startsWith("nl-"));
    }

    if (!dutchVoice) {
      // Fourth priority: voices with "dutch" or "nederland" in name
      dutchVoice = voices.find(voice =>
        voice.name.toLowerCase().includes("dutch") ||
        voice.name.toLowerCase().includes("nederland")
      );
    }

    return dutchVoice;
  }, []);

  // Main speak function
  const speak = useCallback((htmlContent) => {
    if (!htmlContent) return;

    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Detect iOS devices
    const isIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    const iOS = isIOS();

    // If already speaking, stop it
    if (isSpeaking) {
      if (window.currentSpeechCancel) {
        window.currentSpeechCancel();
      } else {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return;
    }

    // Extract plain text from HTML, preserving structure for pauses
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Replace list items and line breaks with special markers for pausing
    const processedHTML = htmlContent
      .replace(/<\/li>/gi, '</li>|||PAUSE|||')  // Add pause marker after each list item
      .replace(/<br\s*\/?>/gi, '|||PAUSE|||')    // Add pause marker for line breaks
      .replace(/<\/p>/gi, '</p>|||PAUSE|||')     // Add pause marker after paragraphs
      .replace(/<\/div>/gi, '</div>|||PAUSE|||'); // Add pause marker after divs

    tempDiv.innerHTML = processedHTML;
    let plainText = tempDiv.textContent || tempDiv.innerText || "";

    // Add pause markers after specific symbols and line breaks
    // Note: \r\n must be replaced before \n and \r to avoid double-pauses
    plainText = plainText
      .replace(/\r\n/g, '|||PAUSE|||')          // Windows-style line breaks (must be first!)
      .replace(/\n/g, '|||PAUSE|||')            // Newline characters (Unix/Mac line breaks)
      .replace(/\r/g, '|||PAUSE|||')            // Old Mac-style line breaks
      .replace(/→/g, '→|||PAUSE|||')            // Arrow symbol (commonly used in sequences)
      .replace(/[:;.)\]]/g, '$&|||PAUSE|||')    // Add pauses after colon, semicolon, closing parenthesis, and bracket
      .replace(/[—–]/g, '$&|||PAUSE|||');       // Add pauses after em dash and en dash

    if (!plainText.trim()) {
      console.warn("No text found to speak");
      return;
    }

    // Function to start speaking with Dutch voice
    const startSpeaking = () => {
      // iOS Safari workaround: cancel any pending speech first
      window.speechSynthesis.cancel();

      // First, split by pause markers (list items, line breaks, paragraphs, divs)
      // Then clean up the markers from the text
      let segments = plainText
        .split('|||PAUSE|||')
        .map(s => s.replace(/\|\|\|PAUSE\|\|\|/g, '').trim()) // Remove any remaining markers
        .filter(s => s.length > 0);

      // Then, further split each segment by sentence punctuation
      const sentences = segments.flatMap(segment => {
        // Split by periods, exclamation marks, question marks, but keep the punctuation
        const parts = segment
          .split(/([.!?]+\s+)/)
          .filter(s => s.trim().length > 0)
          .reduce((acc, part, index, array) => {
            // Combine sentence with its punctuation
            if (index % 2 === 0) {
              const sentence = part + (array[index + 1] || '');
              const cleanSentence = sentence.trim();
              if (cleanSentence.length > 0) {
                acc.push(cleanSentence);
              }
            }
            return acc;
          }, []);

        // If no sentence punctuation was found, return the segment as-is
        return parts.length > 0 ? parts : [segment.trim()];
      });

      console.log("Split into", sentences.length, "segments (including list items, line breaks, and sentences)");
      console.log("Sample segments:", sentences.slice(0, 3));

      // Get the Dutch voice
      const voices = window.speechSynthesis.getVoices();
      const dutchVoice = findDutchVoice(voices);

      if (dutchVoice) {
        console.log("✓ Using Dutch voice:", dutchVoice.name, `(${dutchVoice.lang})`);
      } else {
        console.warn("⚠ No Dutch voice found, using default with nl-NL lang");
      }

      let currentSentenceIndex = 0;
      let isCancelled = false;

      // Function to speak the next sentence
      const speakNextSentence = () => {
        if (isCancelled || currentSentenceIndex >= sentences.length) {
          setIsSpeaking(false);
          console.log("Speech synthesis finished");
          return;
        }

        const sentence = sentences[currentSentenceIndex];
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = "nl-NL"; // Default to Dutch (Netherlands)

        // Use different rates for iOS vs other platforms
        utterance.rate = iOS ? 0.85 : 1.2; // Slower for iOS, faster for other platforms
        utterance.pitch = 1.0;

        if (dutchVoice) {
          utterance.voice = dutchVoice;
          utterance.lang = dutchVoice.lang;
        }

        // Handle speech end - speak next sentence after a pause
        utterance.onend = () => {
          currentSentenceIndex++;

          // Use different pauses for iOS vs other platforms
          const pauseTime = iOS ? 300 : 50; // Longer pause for iOS
          setTimeout(() => {
            if (!isCancelled) {
              speakNextSentence();
            }
          }, pauseTime);
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event.error);
          isCancelled = true;
          setIsSpeaking(false);
        };

        // Speak this sentence
        window.speechSynthesis.speak(utterance);
      };

      // Start speaking the first sentence
      setIsSpeaking(true);
      console.log("Speech synthesis started");
      speakNextSentence();

      // Store cancel handler for stopping speech
      window.currentSpeechCancel = () => {
        isCancelled = true;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      };
    };

    // iOS Safari/Chrome: voices may not be loaded immediately
    // Multiple strategies to ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      console.log("Voices not loaded yet, waiting...");

      // Strategy 1: Use onvoiceschanged event
      let voicesLoaded = false;
      window.speechSynthesis.onvoiceschanged = () => {
        if (!voicesLoaded) {
          voicesLoaded = true;
          console.log("Voices loaded via onvoiceschanged event");
          startSpeaking();
        }
      };

      // Strategy 2: Fallback timeout for iOS Safari (event may not fire)
      setTimeout(() => {
        if (!voicesLoaded) {
          const retryVoices = window.speechSynthesis.getVoices();
          if (retryVoices.length > 0) {
            voicesLoaded = true;
            console.log("Voices loaded via timeout fallback");
            startSpeaking();
          } else {
            console.warn("Still no voices after timeout, attempting anyway");
            voicesLoaded = true;
            startSpeaking();
          }
        }
      }, 100);
    } else {
      // Voices already loaded
      console.log("Voices already loaded");
      startSpeaking();
    }
  }, [isSpeaking, findDutchVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.currentSpeechCancel) {
        window.currentSpeechCancel();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    isSpeaking,
    stopSpeaking: useCallback(() => {
      if (window.currentSpeechCancel) {
        window.currentSpeechCancel();
      } else {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }, [])
  };
};
