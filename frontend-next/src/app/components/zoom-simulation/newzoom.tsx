"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../shared/contexts/LanguageContext";

interface DialogueLine {
  speaker: string;
  line: string;
}

export default function NewZoom() {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(
    "Press 'Start Simulation' to begin the consultation."
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Language context
  const { t } = useLanguage();

  // Refs for speech synthesis
  const doctorVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const patientVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const currentIndexRef = useRef<number>(-1);

  // Dialogue Script
  const dialog: DialogueLine[] = [
    {
      speaker: "Doctor",
      line: "Good morning, thanks for joining the video call. How are you feeling today?",
    },
    {
      speaker: "Patient",
      line: "Good morning, doctor. I've been having a persistent dull headache for about a week now.",
    },
    {
      speaker: "Doctor",
      line: "I see. Can you describe the pain? Is it sharp, throbbing, or constant?",
    },
    {
      speaker: "Patient",
      line: "It's mostly a constant, dull pressure, especially behind my eyes. It gets worse in the afternoon.",
    },
    {
      speaker: "Doctor",
      line: "Alright. Any other symptoms? Nausea, fever, or sensitivity to light?",
    },
    {
      speaker: "Patient",
      line: "Just a bit of light sensitivity, but no nausea or fever.",
    },
    {
      speaker: "Doctor",
      line: "We'll run some basic tests, but let's start with a new prescription to manage the pain. I'll send it over.",
    },
    { speaker: "Patient", line: "Thank you, doctor." },
  ];

  // Get current color scheme for dynamic styling
  // Using default blue color scheme
  const currentColorScheme = {
    primary: {
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  };
  const primaryColor = currentColorScheme.primary[600];
  const primaryHoverColor = currentColorScheme.primary[700];

  // Voice Selection Logic
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    let maleVoice: SpeechSynthesisVoice | null = null;
    let femaleVoice: SpeechSynthesisVoice | null = null;

    // Simple keyword search to find distinct English voices
    for (const voice of voices) {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();

      // Prioritize English voices
      if (!lang.startsWith("en")) continue;

      // Look for Male voice
      if (
        !maleVoice &&
        (name.includes("male") ||
          name.includes("man") ||
          name.includes("david") ||
          name.includes("en-us"))
      ) {
        maleVoice = voice;
      }
      // Look for Female voice
      if (
        !femaleVoice &&
        (name.includes("female") ||
          name.includes("woman") ||
          name.includes("girl") ||
          name.includes("susan") ||
          name.includes("en-gb"))
      ) {
        femaleVoice = voice;
      }
      if (maleVoice && femaleVoice) break;
    }

    // Fallback: If specific genders aren't found, use the first two English voices found.
    if (!maleVoice || !femaleVoice) {
      const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
      if (!maleVoice && englishVoices.length > 0) maleVoice = englishVoices[0];
      if (!femaleVoice && englishVoices.length > 1) {
        // Try to ensure the fallback voices are different
        femaleVoice = englishVoices[englishVoices.length - 1];
      }
    }

    doctorVoiceRef.current = maleVoice;
    patientVoiceRef.current = femaleVoice || maleVoice; // Ensure patientVoice is set, even if it defaults to male

    console.log("TTS Voices Loaded:");
    console.log(
      "Doctor Voice:",
      doctorVoiceRef.current
        ? doctorVoiceRef.current.name
        : "Default (No Specific Voice Found)"
    );
    console.log(
      "Patient Voice:",
      patientVoiceRef.current
        ? patientVoiceRef.current.name
        : "Default (No Specific Voice Found)"
    );
  };

  // Browser TTS Function
  const speakLine = (
    text: string,
    speaker: string,
    forceSpeak: boolean = false
  ) => {
    if (!isPlaying && !forceSpeak) {
      console.log(
        `speakLine: isPlaying is false and forceSpeak is false, returning early`
      );
      return; // Only speak if simulation is running or forced
    }

    if (isSpeaking) {
      console.log(`speakLine: Already speaking, skipping to prevent overlap`);
      return; // Prevent multiple simultaneous speech calls
    }

    console.log(`Speaking: ${speaker} - ${text}`);
    console.log(`Doctor voice:`, doctorVoiceRef.current?.name);
    console.log(`Patient voice:`, patientVoiceRef.current?.name);

    const utterance = new SpeechSynthesisUtterance(text);

    // Assign specific voices based on pre-loaded variables
    if (speaker === "Doctor" && doctorVoiceRef.current) {
      utterance.voice = doctorVoiceRef.current;
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
    } else if (speaker === "Patient" && patientVoiceRef.current) {
      utterance.voice = patientVoiceRef.current;
      utterance.pitch = 1.1;
      utterance.rate = 0.9;
    } else {
      // Fallback to pitch/rate adjustments
      if (speaker === "Doctor") {
        utterance.pitch = 1.0;
        utterance.rate = 0.9;
      } else {
        utterance.pitch = 1.1;
        utterance.rate = 0.9;
      }
    }

    // Set volume to ensure it's audible
    utterance.volume = 1.0;

    // Event Handlers for animation control
    utterance.onstart = () => {
      console.log(`Started speaking: ${speaker}`);
      setIsSpeaking(true);
      startTalkingAnimation(speaker);
      setShowStatus(false);
    };

    utterance.onend = () => {
      console.log(`Finished speaking: ${speaker}`);
      setIsSpeaking(false);
      stopTalkingAnimation();

      // Use ref to get the current index value
      const nextIndex = currentIndexRef.current + 1;
      console.log(
        `Moving to next index: ${nextIndex} (was ${currentIndexRef.current})`
      );

      if (nextIndex < dialog.length) {
        // Update both state and ref
        setCurrentLineIndex(nextIndex);
        currentIndexRef.current = nextIndex;

        // Add a small delay before next line
        setTimeout(() => {
          console.log(`Auto-advancing to index: ${nextIndex}`);
          // Use displayDialogue and speakLine directly instead of advanceDialogue
          displayDialogue(nextIndex);
          const nextDialogueLine = dialog[nextIndex];
          speakLine(nextDialogueLine.line, nextDialogueLine.speaker, true);
        }, 500);
      } else {
        // End of dialogue
        console.log("Reached end of dialogue");
        stopSimulation();
        setCurrentLine("Conversation finished. Press Start to restart.");
      }
    };

    utterance.onerror = (event) => {
      console.error("TTS Error:", event);
      setIsSpeaking(false);
      // If an error occurs, stop the simulation to prevent an infinite loop
      stopSimulation();
      setCurrentLine("Error: TTS playback failed. Simulation stopped.");
    };

    // Cancel any existing speech before starting new one
    window.speechSynthesis.cancel();

    // Small delay to ensure cancellation is processed
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // UI Animation/State Management
  const startTalkingAnimation = (speaker: string) => {
    stopTalkingAnimation();
    // Add visual feedback for active speaker
    const doctorBox = document.getElementById("doctor-box");
    const patientBox = document.getElementById("patient-box");

    if (speaker === "Doctor" && doctorBox) {
      doctorBox.classList.add("active-speaker", "speaking");
    } else if (speaker === "Patient" && patientBox) {
      patientBox.classList.add("active-speaker", "speaking");
    }
  };

  const stopTalkingAnimation = () => {
    const doctorBox = document.getElementById("doctor-box");
    const patientBox = document.getElementById("patient-box");

    if (doctorBox) doctorBox.classList.remove("active-speaker", "speaking");
    if (patientBox) patientBox.classList.remove("active-speaker", "speaking");
  };

  // Display dialogue without speaking (for manual advancement)
  const displayDialogue = (index: number) => {
    console.log(`Displaying dialogue index: ${index}`);
    console.log(`Total dialogues: ${dialog.length}`);

    if (index >= dialog.length) {
      console.log("Dialogue finished");
      setCurrentLine("End of dialogue reached.");
      return;
    }

    const currentDialogueLine = dialog[index];
    const displaySpeaker =
      currentDialogueLine.speaker === "Doctor" ? "Doctor:" : "Patient:";

    console.log(`Displaying: ${displaySpeaker} ${currentDialogueLine.line}`);

    // Display the text
    setCurrentLine(`${displaySpeaker} ${currentDialogueLine.line}`);
  };

  // Main Dialogue Flow Control (with speech)
  const advanceDialogue = (index: number) => {
    console.log(
      `advanceDialogue called with index: ${index}, isPlaying: ${isPlaying}`
    );

    if (!isPlaying) {
      console.log("advanceDialogue: isPlaying is false, returning early");
      return; // Guard against running if stopped
    }

    console.log(`Advancing to dialogue index: ${index}`);
    console.log(`Total dialogues: ${dialog.length}`);

    if (index >= dialog.length) {
      console.log("Dialogue finished");
      stopSimulation();
      setCurrentLine("Conversation finished. Press Start to restart.");
      return;
    }

    const currentDialogueLine = dialog[index];
    const displaySpeaker =
      currentDialogueLine.speaker === "Doctor" ? "Doctor:" : "Patient:";

    console.log(`Displaying: ${displaySpeaker} ${currentDialogueLine.line}`);

    // 1. Display the text
    setCurrentLine(`${displaySpeaker} ${currentDialogueLine.line}`);
    console.log("Text should be set now");

    // 2. Speak the line and manage UI state (speakLine handles the automatic increment and next call via onend)
    speakLine(currentDialogueLine.line, currentDialogueLine.speaker);
  };

  const startSimulation = () => {
    if (isPlaying) {
      // If button is pressed while playing, treat it as a stop request
      stopSimulation();
      return;
    }

    if (!("speechSynthesis" in window)) {
      setCurrentLine(
        "Error: Browser TTS not supported. Cannot run simulation."
      );
      return;
    }

    // Ensure voices are loaded before starting
    if (!doctorVoiceRef.current || !patientVoiceRef.current) {
      console.log("Voices not loaded yet, reloading...");
      loadVoices();

      // Wait a bit for voices to load
      setTimeout(() => {
        if (doctorVoiceRef.current && patientVoiceRef.current) {
          console.log("Voices loaded, starting simulation");
          setIsPlaying(true);
          setCurrentLineIndex(0);
          currentIndexRef.current = 0; // Initialize ref
          window.speechSynthesis.cancel();
          stopTalkingAnimation();
          // Small delay to ensure state is updated
          setTimeout(() => {
            // Use displayDialogue first to show text, then speak
            displayDialogue(0);
            // Then speak the line (force speak to bypass isPlaying check)
            const currentDialogueLine = dialog[0];
            speakLine(
              currentDialogueLine.line,
              currentDialogueLine.speaker,
              true
            );
          }, 100);
        } else {
          setCurrentLine("Error: Could not load voices. Please try again.");
        }
      }, 1000);
      return;
    }

    console.log("Starting simulation with voices:");
    console.log("Doctor:", doctorVoiceRef.current.name);
    console.log("Patient:", patientVoiceRef.current.name);

    console.log("Setting isPlaying to true and currentLineIndex to 0");
    setIsPlaying(true);
    setCurrentLineIndex(0); // Start from the beginning
    currentIndexRef.current = 0; // Initialize ref

    window.speechSynthesis.cancel(); // Clear any queued speech before starting
    stopTalkingAnimation(); // Ensure no lingering animations

    // Start the auto-loop with a small delay to ensure state is updated
    setTimeout(() => {
      console.log("About to call advanceDialogue(0)");
      // Use displayDialogue first to show text, then speak
      displayDialogue(0);
      // Then speak the line (force speak to bypass isPlaying check)
      const currentDialogueLine = dialog[0];
      speakLine(currentDialogueLine.line, currentDialogueLine.speaker, true);
    }, 100);
  };

  const stopSimulation = () => {
    setIsPlaying(false);
    setIsSpeaking(false);
    window.speechSynthesis.cancel();
    stopTalkingAnimation();

    setCurrentLineIndex(-1); // Reset to beginning for next start
    currentIndexRef.current = -1; // Reset ref

    // If the text display isn't already the finished message, reset it
    if (!currentLine.includes("finished")) {
      setCurrentLine("Simulation stopped. Press Start to continue.");
    }
  };

  // Initialize voices on component mount
  useEffect(() => {
    const initVoices = () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      loadVoices(); // Call initially in case voices are already loaded
    };

    initVoices();
  }, []);

  return (
    <>
      <div
        className="space-y-3 px-[50px] pb-[50px] pt-[25px]"
        data-testid="page-dashboard"
      >
        <div className="space-y-3 px-[50px] pb-[50px] pt-[25px]">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome to your USMLE preparation
            </p>
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          {/* Main Application Container */}
          <div className="w-full max-w-4xl rounded-xl shadow-2xl p-6 md:p-8 bg-white dark:bg-gray-800">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
              Virtual Consultation Simulation
            </h1>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse-speech {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        .video-box {
          position: relative;
          border: 4px solid transparent;
          transition: border-color 0.3s ease;
        }

        .active-speaker {
          border-color: #38a169 !important;
        }

        .speaking .avatar-container {
          animation: pulse-speech 0.3s infinite alternate;
        }
      `}</style>
    </>
  );
}
