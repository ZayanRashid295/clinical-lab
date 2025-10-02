"use client";

import React, { useState, useEffect, useRef } from "react";

interface DialogueLine {
  speaker: string;
  line: string;
}

interface ZoomSimulationCoreProps {
  onDialogueComplete?: () => void;
  onDialogueProgress?: (currentIndex: number, totalLines: number) => void;
  className?: string;
}

export default function ZoomSimulationCore({
  onDialogueComplete,
  onDialogueProgress,
  className = "",
}: ZoomSimulationCoreProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(
    "Press 'Start Simulation' to begin the consultation."
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  // Load available voices
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    let maleVoice: SpeechSynthesisVoice | null = null;
    let femaleVoice: SpeechSynthesisVoice | null = null;

    for (const voice of voices) {
      const { name, lang } = voice;

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
    }

    // Fallback: If specific genders aren't found, use the first two English voices found.
    if (!maleVoice || !femaleVoice) {
      const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
      if (!maleVoice && englishVoices.length > 0) maleVoice = englishVoices[0];
      if (!femaleVoice && englishVoices.length > 1) {
        femaleVoice = englishVoices[1];
      } else if (!femaleVoice && englishVoices.length > 0) {
        femaleVoice = englishVoices[0];
      }
    }

    doctorVoiceRef.current = maleVoice;
    patientVoiceRef.current = femaleVoice;

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

        // Notify parent of progress
        if (onDialogueProgress) {
          onDialogueProgress(nextIndex, dialog.length);
        }

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
        if (onDialogueComplete) {
          onDialogueComplete();
        }
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
      loadVoices();
    };

    initVoices();
  }, []);

  return (
    <div className={`zoom-simulation-core ${className}`}>
      {/* Video Display Area */}
      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
        {/* Doctor Video Box */}
        <div
          id="doctor-box"
          className={`video-box w-full md:w-1/2 h-64 rounded-xl flex items-center justify-center relative bg-gray-800`}
          style={{
            border: "4px solid transparent",
            transition: "border-color 0.3s ease",
          }}
        >
          {/* Avatar Container (Male Doctor) */}
          <div className="relative w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center border-4 border-white z-10 avatar-container">
            <span className="text-6xl text-white select-none">👨‍⚕️</span>
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          {/* Name Tag */}
          <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-white text-sm font-semibold bg-black bg-opacity-40">
            Doctor
          </div>
        </div>

        {/* Patient Video Box */}
        <div
          id="patient-box"
          className={`video-box w-full md:w-1/2 h-64 rounded-xl flex items-center justify-center relative bg-gray-800`}
          style={{
            border: "4px solid transparent",
            transition: "border-color 0.3s ease",
          }}
        >
          {/* Avatar Container (Female Patient) */}
          <div className="relative w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center border-4 border-white z-10 avatar-container">
            <span className="text-6xl text-white select-none">👩‍🦱</span>
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          {/* Name Tag */}
          <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-white text-sm font-semibold bg-black bg-opacity-40">
            Patient
          </div>
        </div>
      </div>

      {/* Dialog Text Area */}
      <div className="min-h-24 p-4 rounded-lg shadow-inner flex items-center justify-center mb-6 bg-gray-100">
        <p className="text-xl font-medium text-center italic text-gray-700">
          {currentLine}
        </p>
      </div>

      {/* Control Button and Status */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={startSimulation}
            className={`px-8 py-3 text-white font-semibold rounded-full shadow-lg transition duration-150 ease-in-out ${
              isPlaying
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isPlaying ? "Stop Simulation" : "Start Simulation"}
          </button>

          <button
            onClick={() => {
              const testUtterance = new SpeechSynthesisUtterance(
                "Hello, this is a test of the text to speech system."
              );
              testUtterance.volume = 1.0;
              testUtterance.rate = 0.9;
              if (doctorVoiceRef.current) {
                testUtterance.voice = doctorVoiceRef.current;
              }
              window.speechSynthesis.speak(testUtterance);
            }}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition duration-150 ease-in-out"
          >
            Test TTS
          </button>
        </div>

        {showStatus && (
          <p className="mt-4 text-sm text-red-600">
            <span className="font-bold">Loading audio...</span> Please wait.
          </p>
        )}

        {/* Voice Status Display */}
        <div className="text-xs text-center text-gray-600">
          <p>Doctor Voice: {doctorVoiceRef.current?.name || "Not loaded"}</p>
          <p>Patient Voice: {patientVoiceRef.current?.name || "Not loaded"}</p>
          <p>
            Current Line: {currentLineIndex + 1} / {dialog.length}
          </p>
          <p>Is Playing: {isPlaying ? "Yes" : "No"}</p>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        .video-box {
          position: relative;
          background-color: #2d3748;
          border: 4px solid transparent;
          transition: border-color 0.3s ease;
        }

        .active-speaker {
          border-color: #38a169;
        }

        .speaking .avatar-container {
          animation: pulse-speech 0.3s infinite alternate;
        }

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
      `}</style>
    </div>
  );
}
