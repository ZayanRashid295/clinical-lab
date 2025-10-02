"use client";

import React, { useState, useEffect, useRef } from "react";

export default function RobotFace() {
  const [isTalking, setIsTalking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const [particles, setParticles] = useState([]);
  const story1 = `Hello! I am Synthia.
  
      I'm revolutionizing web development. 
      Describe your dream. I'll build it. 
      Customer facing apps. Admin dashboards. Mobile solutions. 
      AWS deployment. App store launches. 
      The complete stack. One voice command away.

`;
  const story2 = `# The Fox and Yahya

The morning mist clung to the olive grove as Yahya made his way down the hillside path. He was returning from the village market, a cloth bag of supplies slung over his shoulder, when he heard a sharp whimper coming from the bushes beside the trail.

Pushing aside the branches, Yahya discovered a small red fox, its hind leg caught in an old rusted trap that some careless hunter must have left behind. The creature's amber eyes locked onto his, wild with fear and pain.

"Easy now," Yahya whispered, setting down his bag. He'd always had a gentle way with animals, a gift his grandmother said came from his kind heart.

The fox struggled as he approached, but Yahya moved slowly, speaking in soft, rhythmic tones. With careful hands, he pried open the trap's jaws and freed the injured leg. The fox could have fled immediately, but instead it sat there, panting, watching him with those intelligent eyes.

Yahya tore a strip from his own shirt and gently wrapped the fox's leg. "There. You'll heal in time, friend."

The fox touched its nose to his hand—just once—before limping off into the underbrush.

Three days later, Yahya was gathering firewood when he heard rustling behind him. He turned to find the same fox, its leg already much improved, standing at the edge of the clearing. In its mouth was a dead rabbit.

The fox dropped the rabbit at Yahya's feet, then disappeared back into the forest.

This became their pattern. The fox would appear every few days, sometimes bringing small game, sometimes just sitting near Yahya as he worked his small plot of land. Yahya would share his bread, and they would enjoy the comfortable silence of unlikely friends.

Months passed. Then came the night when bandits crept toward Yahya's home, intent on stealing what little he had. But before they could reach his door, an eruption of barking and snarling split the darkness. The fox had returned with its entire family—a vixen and four young cubs—and together they created such a fearsome commotion that the bandits fled in terror.

From his window, Yahya smiled and whispered his thanks into the night.

The fox sat in the moonlight and, if foxes could smile, it surely did.

Kindness, Yahya's grandmother had always told him, never goes unrewarded. And standing there in the silver light, watching his small red friend, he knew she'd been right all along.`;
  const [text, setText] = useState(story1);
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState("prompt"); // 'prompt', 'granted', 'denied'
  const [voiceIntensity, setVoiceIntensity] = useState(0); // For voice-synced radiation
  const intervalRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const waveRef = useRef(null);
  const utteranceRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setText(finalTranscript);
        } else if (interimTranscript) {
          setText(interimTranscript);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) return;

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream, we just needed permission

      setMicPermission("granted");
      setText(""); // Clear text before recording
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone permission error:", error);
      setMicPermission("denied");
      // Show error in the text box instead of alert (since alerts are blocked in sandbox)
      setText(
        "⚠️ Microphone access is not available in this environment. Please type your text manually or copy this code to use in your own environment where microphone permissions can be granted."
      );
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isTalking) {
      // Split text into sentences and speak each with pauses
      const speakWithPauses = async () => {
        // Split text by sentence endings (., !, ?) but keep the punctuation
        const sentences = text
          .split(/([.!?]+)/)
          .filter((part) => part.trim().length > 0);

        for (let i = 0; i < sentences.length; i += 2) {
          const sentence = sentences[i];
          const punctuation = sentences[i + 1] || "";
          const fullSentence = sentence + punctuation;

          if (sentence.trim()) {
            // Speak the sentence
            const utterance = new SpeechSynthesisUtterance(fullSentence);
            utterance.rate = 1.0;
            utterance.pitch = 1.2;

            // Try to find a female US voice
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice =
              voices.find(
                (voice) =>
                  voice.lang.startsWith("en-US") &&
                  voice.name.toLowerCase().includes("female")
              ) ||
              voices.find(
                (voice) =>
                  voice.lang.startsWith("en-US") &&
                  (voice.name.includes("Samantha") ||
                    voice.name.includes("Victoria") ||
                    voice.name.includes("Zira"))
              ) ||
              voices.find((voice) => voice.lang.startsWith("en-US"));

            if (femaleVoice) {
              utterance.voice = femaleVoice;
            }

            utteranceRef.current = utterance;

            // Create a promise to wait for the utterance to complete
            await new Promise((resolve) => {
              utterance.onstart = () => {
                setVoiceIntensity(1.0);
              };
              utterance.onend = () => {
                setVoiceIntensity(0);
                resolve();
              };
              utterance.onerror = () => {
                setVoiceIntensity(0);
                resolve();
              };
              window.speechSynthesis.speak(utterance);
            });

            // Add 1 second pause after each sentence (except the last one)
            if (i < sentences.length - 2) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }

        // Stop talking when all sentences are done
        setIsTalking(false);
      };

      speakWithPauses();

      // Animate mouth while talking
      intervalRef.current = setInterval(() => {
        setMouthOpen(Math.random() * 30 + 10);
      }, 80);

      // Wave animation for radiation pattern
      waveRef.current = setInterval(() => {
        setWavePhase((prev) => (prev + 0.1) % (Math.PI * 2));
      }, 50);

      // Generate particles
      const particleInterval = setInterval(() => {
        const newParticle = {
          id: Math.random(),
          x: Math.random() * 300,
          y: 350,
          opacity: 1,
        };
        setParticles((prev) => [...prev.slice(-20), newParticle]);
      }, 200);

      return () => {
        clearInterval(particleInterval);
      };
    } else {
      // Stop speech if terminated
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      setMouthOpen(0);
      setParticles([]);
      setVoiceIntensity(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isTalking, text]);

  // Separate effect for blinking that works in both talking and listening modes
  useEffect(() => {
    // Eye blinks - more frequent when listening (silent), normal when talking
    blinkIntervalRef.current = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 120);
    }, 2000 + Math.random() * 3000);

    return () => {
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    };
  }, [isTalking]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            animation: "grid-move 20s linear infinite",
          }}
        ></div>
      </div>

      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px #00ffff) drop-shadow(0 0 20px #00ffff); }
          50% { filter: drop-shadow(0 0 20px #00ffff) drop-shadow(0 0 40px #00ffff); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes eye-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 5px #00ffff) drop-shadow(0 0 10px #00ffff);
            opacity: 0.8;
          }
          50% { 
            filter: drop-shadow(0 0 15px #00ffff) drop-shadow(0 0 25px #00ffff);
            opacity: 1;
          }
        }
        @keyframes ear-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 2px #00ffff) drop-shadow(0 0 4px #00ffff);
            opacity: 0.5;
          }
          50% { 
            filter: drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 10px #00ffff);
            opacity: 0.8;
          }
        }
        .glow-effect {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        .float-effect {
          animation: float 3s ease-in-out infinite;
        }
        .eye-glow-effect {
          animation: eye-glow 1.5s ease-in-out infinite;
        }
        .ear-glow-effect {
          animation: ear-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Text Input */}
      <div className="mb-8 w-full max-w-2xl relative z-10">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-cyan-400 font-mono text-sm tracking-wider">
            VOICE INPUT TEXT:
          </label>
          <div className="flex gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isTalking}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-mono text-sm rounded-lg transition-all duration-300 transform hover:scale-105 border border-purple-400/50 disabled:border-gray-500/50 flex items-center gap-2"
              >
                <span className="text-lg">🎤</span>
                <span>START RECORDING</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono text-sm rounded-lg transition-all duration-300 transform hover:scale-105 border border-red-400/50 flex items-center gap-2 animate-pulse"
              >
                <span className="inline-block w-2 h-2 bg-red-300 rounded-full animate-ping"></span>
                <span>RECORDING...</span>
              </button>
            )}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isTalking || isRecording}
          className="w-full px-6 py-4 bg-slate-900 border-2 border-cyan-500/50 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          rows="3"
          placeholder="Enter text for the robot to speak or use voice recording..."
        />
      </div>

      <div className="relative float-effect">
        {/* Holographic outline */}
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl opacity-30 blur-xl animate-pulse"></div>

        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl p-12 shadow-2xl border-2 border-cyan-500/30">
          <svg width="400" height="450" viewBox="0 0 400 450">
            {/* Particle effects */}
            {particles.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y - (Date.now() % 3000) / 10}
                r="2"
                fill="#00ffff"
                opacity={Math.max(0, 1 - (Date.now() % 3000) / 3000)}
              />
            ))}

            {/* Outer glow ring - animated radiation pattern */}
            <circle
              cx="200"
              cy="200"
              r={
                180 +
                (isTalking ? Math.sin(wavePhase) * 10 + mouthOpen * 0.25 : 0)
              }
              fill="none"
              stroke="url(#glowGradient)"
              strokeWidth={
                2 +
                (isTalking
                  ? Math.sin(wavePhase * 1.5) * 1.5 + mouthOpen * 0.05
                  : 0)
              }
              opacity={
                0.3 +
                (isTalking
                  ? Math.sin(wavePhase * 0.8) * 0.2 + mouthOpen * 0.005
                  : 0)
              }
            />

            <defs>
              <linearGradient
                id="glowGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#00ffff" />
                <stop offset="50%" stopColor="#0080ff" />
                <stop offset="100%" stopColor="#00ffff" />
              </linearGradient>
              <linearGradient
                id="foxGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#48FEFF" />
                <stop offset="100%" stopColor="#00BFFF" />
              </linearGradient>
              <radialGradient id="eyeGlow">
                <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#0080ff" stopOpacity="0.3" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Fox SVG - scaled and positioned */}
            <g transform="translate(50, 50) scale(0.35)">
              {/* Fox body - solid color with animated radiation pattern */}
              <path
                d="M266.005 336.957L243.619 271.361L290.616 336.957L176.84 481.704L313.582 582.217L355.286 667.091L390.146 698.691H433.3L468.692 667.091L508.298 583.667L646.917 481.704L535.684 336.976L581.399 269.563L559.068 336.976L671.5 489.072L524.469 594.027L482.625 677.675L437.41 717.731H385.441L340.521 676.13L297.42 593.32L150.977 488.939L266.005 336.957Z"
                fill="#48FEFF"
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.2) * 2 + mouthOpen * 0.1
                    : 0)
                }
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        1.25 +
                        Math.sin(wavePhase * 0.7) * 1.875 +
                        mouthOpen * 0.0375
                      }px #48FEFF) drop-shadow(0 0 ${
                        2.5 +
                        Math.sin(wavePhase * 1.1) * 3.125 +
                        mouthOpen * 0.0625
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        4 + Math.sin(wavePhase * 0.3) * 2
                      }px #48FEFF)`,
                }}
              />

              {/* Fox head - solid color with animated radiation pattern */}
              <path
                d="M176.972 300.151L222.477 393.692L236.838 380.256L193.624 295.975L206.075 182.617L324.605 283.532L316.806 292.398L330.267 304.256L345.945 286.941H474.319L492.658 305.986L506.06 293.289L496.89 282.709L616.8 182.549L626.675 300.151L586.47 378.637L599.871 401.913L647.13 300.151L626.675 150.681L492.658 265.781H332.543L193.624 150.681L176.972 300.151Z"
                fill="#48FEFF"
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.3) * 2 + mouthOpen * 0.1
                    : 0)
                }
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        1.25 +
                        Math.sin(wavePhase * 0.9) * 0.625 +
                        mouthOpen * 0.0375
                      }px #48FEFF) drop-shadow(0 0 ${
                        2.5 +
                        Math.sin(wavePhase * 1.2) * 1.25 +
                        mouthOpen * 0.0625
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        4 + Math.sin(wavePhase * 0.4) * 2
                      }px #48FEFF)`,
                }}
              />

              {/* Fox face - solid color with animated radiation pattern */}
              <path
                d="M326.458 458L258.988 432.189V414.529L326.458 435.359L378.533 490.603L381.25 637.317L398.004 664.033H426.079L445.55 633.694V490.603L493.096 438.076L565.095 417.246V432.189L497.172 458L460.493 496.942V637.317L432.419 678.976H391.665L361.779 637.317V496.942L326.458 458Z"
                fill="#48FEFF"
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.1) * 2 + mouthOpen * 0.1
                    : 0)
                }
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        1.25 +
                        Math.sin(wavePhase * 0.8) * 0.625 +
                        mouthOpen * 0.0375
                      }px #48FEFF) drop-shadow(0 0 ${
                        2.5 +
                        Math.sin(wavePhase * 1.0) * 1.25 +
                        mouthOpen * 0.0625
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        4 + Math.sin(wavePhase * 0.5) * 2
                      }px #48FEFF)`,
                }}
              />

              {/* Fox eyes with solid color and animated radiation pattern */}
              <path
                d="M298.993 499.753L278.461 458.401L295.522 465.631L310.849 488.476L343.525 492.813L349.02 507.272L298.993 499.753Z"
                fill={eyeBlink ? "#48FEFF" : "#48FEFF"}
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.4) * 2 + mouthOpen * 0.1
                    : 0)
                }
                opacity={eyeBlink ? 0.1 : 1.0}
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        0.75 +
                        Math.sin(wavePhase * 1.0) * 1.25 +
                        mouthOpen * 0.025
                      }px #48FEFF) drop-shadow(0 0 ${
                        1.5 +
                        Math.sin(wavePhase * 1.3) * 1.875 +
                        mouthOpen * 0.0375
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        2 + Math.sin(wavePhase * 0.6) * 1
                      }px #48FEFF)`,
                }}
              />
              <path
                d="M525.736 499.753L546.268 458.401L529.206 465.631L513.88 488.476L481.203 492.813L475.709 507.272L525.736 499.753Z"
                fill={eyeBlink ? "#48FEFF" : "#48FEFF"}
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.4) * 2 + mouthOpen * 0.1
                    : 0)
                }
                opacity={eyeBlink ? 0.1 : 1.0}
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        0.75 +
                        Math.sin(wavePhase * 1.0) * 1.25 +
                        mouthOpen * 0.025
                      }px #48FEFF) drop-shadow(0 0 ${
                        1.5 +
                        Math.sin(wavePhase * 1.3) * 1.875 +
                        mouthOpen * 0.0375
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        2 + Math.sin(wavePhase * 0.6) * 1
                      }px #48FEFF)`,
                }}
              />

              {/* Fox mouth with solid color and animated radiation pattern */}
              <path
                d="M445.948 612.175H378.656L378.656 632.212H445.948V612.175Z"
                fill="#48FEFF"
                stroke="#48FEFF"
                strokeWidth={
                  2 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.5) * 2 + mouthOpen * 0.1
                    : 0)
                }
                opacity="1.0"
                style={{
                  filter: isTalking
                    ? `drop-shadow(0 0 ${
                        0.75 + Math.sin(wavePhase * 1.1) * 1 + mouthOpen * 0.025
                      }px #48FEFF) drop-shadow(0 0 ${
                        1.5 +
                        Math.sin(wavePhase * 1.4) * 1.5 +
                        mouthOpen * 0.0375
                      }px #48FEFF)`
                    : `drop-shadow(0 0 ${
                        2 + Math.sin(wavePhase * 0.7) * 1
                      }px #48FEFF)`,
                }}
              />

              {/* Audio wave bars in fox mouth - animated radiation pattern */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const height = isTalking
                  ? 3 + Math.sin(wavePhase + i * 0.5) * 8 + mouthOpen * 0.2
                  : 3;
                return (
                  <rect
                    key={i}
                    x={385 + i * 8}
                    y={620 - height / 2}
                    width="6"
                    height={height}
                    fill="#48FEFF"
                    opacity={
                      0.5 +
                      (isTalking
                        ? Math.sin(wavePhase * 0.8 + i * 0.3) * 0.5 +
                          mouthOpen * 0.01
                        : 0)
                    }
                    rx="1"
                  />
                );
              })}
            </g>

            {/* Cyberpunk tech elements around the fox */}
            {/* Holographic antenna - animated radiation pattern */}
            <line
              x1="200"
              y1="50"
              x2="200"
              y2="20"
              stroke="#48FEFF"
              strokeWidth={
                3 +
                (isTalking
                  ? Math.sin(wavePhase * 1.6) * 2 + mouthOpen * 0.1
                  : 0)
              }
              strokeLinecap="round"
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.5 + Math.sin(wavePhase * 1.2) * 1 + mouthOpen * 0.025
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      2 + Math.sin(wavePhase * 0.8) * 1
                    }px #48FEFF)`,
              }}
            />
            <circle
              cx="200"
              cy="15"
              r="12"
              fill={isTalking ? "#48FEFF" : "#00BFFF"}
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.75 +
                      Math.sin(wavePhase * 1.3) * 1.25 +
                      mouthOpen * 0.0375
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      2 + Math.sin(wavePhase * 0.9) * 1
                    }px #48FEFF)`,
              }}
            />
            <circle cx="200" cy="15" r="8" fill="#000" opacity="0.3" />

            {/* Circuit lines - animated radiation pattern */}
            <line
              x1="50"
              y1="100"
              x2="20"
              y2="100"
              stroke="#48FEFF"
              strokeWidth={
                1.5 +
                (isTalking
                  ? Math.sin(wavePhase * 1.8) * 1 + mouthOpen * 0.05
                  : 0)
              }
              opacity={
                0.5 +
                (isTalking
                  ? Math.sin(wavePhase * 1.4) * 0.5 + mouthOpen * 0.01
                  : 0)
              }
            />
            <line
              x1="350"
              y1="100"
              x2="380"
              y2="100"
              stroke="#48FEFF"
              strokeWidth={
                1.5 +
                (isTalking
                  ? Math.sin(wavePhase * 1.8) * 1 + mouthOpen * 0.05
                  : 0)
              }
              opacity={
                0.5 +
                (isTalking
                  ? Math.sin(wavePhase * 1.4) * 0.5 + mouthOpen * 0.01
                  : 0)
              }
            />
            <circle
              cx="20"
              cy="100"
              r="3"
              fill="#48FEFF"
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.5 + Math.sin(wavePhase * 1.5) * 0.75 + mouthOpen * 0.025
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      2 + Math.sin(wavePhase * 1.0) * 0.6
                    }px #48FEFF)`,
              }}
            />
            <circle
              cx="380"
              cy="100"
              r="3"
              fill="#48FEFF"
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.5 + Math.sin(wavePhase * 1.5) * 0.75 + mouthOpen * 0.025
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      2 + Math.sin(wavePhase * 1.0) * 0.6
                    }px #48FEFF)`,
              }}
            />

            {/* Side processors - animated radiation pattern */}
            <rect
              x="20"
              y="150"
              width="30"
              height="80"
              rx="5"
              fill="#0f172a"
              stroke="#48FEFF"
              strokeWidth={
                1.5 +
                (isTalking
                  ? Math.sin(wavePhase * 2.1) * 1 + mouthOpen * 0.05
                  : 0)
              }
              opacity={
                0.7 +
                (isTalking
                  ? Math.sin(wavePhase * 1.6) * 0.3 + mouthOpen * 0.01
                  : 0)
              }
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.25 +
                      Math.sin(wavePhase * 1.7) * 0.5 +
                      mouthOpen * 0.0125
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      1 + Math.sin(wavePhase * 1.1) * 0.4
                    }px #48FEFF)`,
              }}
            />
            <rect
              x="350"
              y="150"
              width="30"
              height="80"
              rx="5"
              fill="#0f172a"
              stroke="#48FEFF"
              strokeWidth={
                1.5 +
                (isTalking
                  ? Math.sin(wavePhase * 2.1) * 1 + mouthOpen * 0.05
                  : 0)
              }
              opacity={
                0.7 +
                (isTalking
                  ? Math.sin(wavePhase * 1.6) * 0.3 + mouthOpen * 0.01
                  : 0)
              }
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.25 +
                      Math.sin(wavePhase * 1.7) * 0.5 +
                      mouthOpen * 0.0125
                    }px #48FEFF)`
                  : `drop-shadow(0 0 ${
                      1 + Math.sin(wavePhase * 1.1) * 0.4
                    }px #48FEFF)`,
              }}
            />

            {/* Processing indicator lines - animated radiation pattern */}
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1="25"
                y1={165 + i * 20}
                x2="45"
                y2={165 + i * 20}
                stroke="#48FEFF"
                strokeWidth={
                  1 +
                  (isTalking
                    ? Math.sin(wavePhase * 2.2 + i * 0.5) * 0.5 +
                      mouthOpen * 0.02
                    : 0)
                }
                opacity={
                  0.3 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.8 + i * 0.3) * 0.7 +
                      mouthOpen * 0.01
                    : 0)
                }
              />
            ))}
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1="355"
                y1={165 + i * 20}
                x2="375"
                y2={165 + i * 20}
                stroke="#48FEFF"
                strokeWidth={
                  1 +
                  (isTalking
                    ? Math.sin(wavePhase * 2.2 + i * 0.5) * 0.5 +
                      mouthOpen * 0.02
                    : 0)
                }
                opacity={
                  0.3 +
                  (isTalking
                    ? Math.sin(wavePhase * 1.8 + i * 0.3) * 0.7 +
                      mouthOpen * 0.01
                    : 0)
                }
              />
            ))}

            {/* Power indicator - animated radiation pattern */}
            <circle
              cx="200"
              cy="380"
              r="4"
              fill={isTalking ? "#00ff00" : "#48FEFF"}
              style={{
                filter: isTalking
                  ? `drop-shadow(0 0 ${
                      0.5 + Math.sin(wavePhase * 2.0) * 1 + mouthOpen * 0.025
                    }px ${isTalking ? "#00ff00" : "#48FEFF"})`
                  : `drop-shadow(0 0 ${
                      2 + Math.sin(wavePhase * 1.2) * 0.6
                    }px #48FEFF)`,
              }}
            />
          </svg>
        </div>
      </div>

      <div className="mt-12 flex gap-6 relative z-10">
        <button
          onClick={() => setIsTalking(true)}
          disabled={isTalking}
          className="group relative px-10 py-5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-green-500/50 disabled:hover:scale-100 border-2 border-green-400/50 disabled:border-gray-500/50"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="text-2xl">▶</span>
            <span className="text-lg">ACTIVATE</span>
          </span>
          <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
        </button>

        <button
          onClick={() => setIsTalking(false)}
          disabled={!isTalking}
          className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-red-500/50 disabled:hover:scale-100 border-2 border-red-400/50 disabled:border-gray-500/50"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="text-2xl">■</span>
            <span className="text-lg">TERMINATE</span>
          </span>
          <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
}
