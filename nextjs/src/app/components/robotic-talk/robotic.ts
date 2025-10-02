// import React, { useState, useEffect, useRef } from "react";

// export default function RobotFace() {
//   const [isTalking, setIsTalking] = useState(false);
//   const [mouthOpen, setMouthOpen] = useState(0);
//   const [eyeBlink, setEyeBlink] = useState(false);
//   const [wavePhase, setWavePhase] = useState(0);
//   const [particles, setParticles] = useState([]);
//   const [text, setText] = useState("Hello! I am your AI assistant.");
//   const [soundWaves, setSoundWaves] = useState([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [micPermission, setMicPermission] = useState("prompt"); // 'prompt', 'granted', 'denied'
//   const intervalRef = useRef(null);
//   const blinkIntervalRef = useRef(null);
//   const waveRef = useRef(null);
//   const utteranceRef = useRef(null);
//   const soundWaveInterval = useRef(null);
//   const recognitionRef = useRef(null);

//   useEffect(() => {
//     // Initialize speech recognition
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (SpeechRecognition) {
//       const recognition = new SpeechRecognition();
//       recognition.continuous = false;
//       recognition.interimResults = true;
//       recognition.lang = "en-US";

//       recognition.onresult = (event) => {
//         let interimTranscript = "";
//         let finalTranscript = "";

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript;
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript;
//           } else {
//             interimTranscript += transcript;
//           }
//         }

//         if (finalTranscript) {
//           setText(finalTranscript);
//         } else if (interimTranscript) {
//           setText(interimTranscript);
//         }
//       };

//       recognition.onend = () => {
//         setIsRecording(false);
//       };

//       recognition.onerror = (event) => {
//         console.error("Speech recognition error:", event.error);
//         setIsRecording(false);
//       };

//       recognitionRef.current = recognition;
//     }

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, []);

//   const startRecording = async () => {
//     if (!recognitionRef.current) {
//       console.error("Speech recognition is not supported in your browser.");
//       return;
//     }

//     if (isRecording) return;

//     try {
//       // Request microphone permission
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((track) => track.stop()); // Stop the stream, we just needed permission

//       setMicPermission("granted");
//       setText(""); // Clear text before recording
//       recognitionRef.current.start();
//       setIsRecording(true);
//     } catch (error) {
//       console.error("Microphone permission error:", error);
//       setMicPermission("denied");
//       // Show error in the text box instead of alert (since alerts are blocked in sandbox)
//       setText(
//         "⚠️ Microphone access is not available in this environment. Please type your text manually or copy this code to use in your own environment where microphone permissions can be granted."
//       );
//     }
//   };

//   const stopRecording = () => {
//     if (recognitionRef.current && isRecording) {
//       recognitionRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   useEffect(() => {
//     if (isTalking) {
//       // Speak the text
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate = 1.0;
//       utterance.pitch = 1.2;

//       // Try to find a female US voice
//       const voices = window.speechSynthesis.getVoices();
//       const femaleVoice =
//         voices.find(
//           (voice) =>
//             voice.lang.startsWith("en-US") &&
//             voice.name.toLowerCase().includes("female")
//         ) ||
//         voices.find(
//           (voice) =>
//             voice.lang.startsWith("en-US") &&
//             (voice.name.includes("Samantha") ||
//               voice.name.includes("Victoria") ||
//               voice.name.includes("Zira"))
//         ) ||
//         voices.find((voice) => voice.lang.startsWith("en-US"));

//       if (femaleVoice) {
//         utterance.voice = femaleVoice;
//       }

//       utteranceRef.current = utterance;
//       window.speechSynthesis.speak(utterance);

//       // Stop talking when speech ends
//       utterance.onend = () => {
//         setIsTalking(false);
//       };

//       // Generate sound waves radiating from center
//       let waveId = 0;
//       soundWaveInterval.current = setInterval(() => {
//         setSoundWaves((prev) => [...prev, { id: waveId++ }]);
//       }, 600);

//       // Animate mouth while talking
//       intervalRef.current = setInterval(() => {
//         setMouthOpen(Math.random() * 30 + 10);
//       }, 80);

//       // Random eye blinks
//       blinkIntervalRef.current = setInterval(() => {
//         setEyeBlink(true);
//         setTimeout(() => setEyeBlink(false), 120);
//       }, 2000 + Math.random() * 3000);

//       // Wave animation
//       waveRef.current = setInterval(() => {
//         setWavePhase((prev) => (prev + 0.1) % (Math.PI * 2));
//       }, 50);

//       // Generate particles
//       const particleInterval = setInterval(() => {
//         const newParticle = {
//           id: Math.random(),
//           x: Math.random() * 300,
//           y: 350,
//           opacity: 1,
//         };
//         setParticles((prev) => [...prev.slice(-20), newParticle]);
//       }, 200);

//       return () => {
//         clearInterval(particleInterval);
//         if (soundWaveInterval.current) clearInterval(soundWaveInterval.current);
//       };
//     } else {
//       // Stop speech if terminated
//       if (utteranceRef.current) {
//         window.speechSynthesis.cancel();
//       }

//       if (intervalRef.current) clearInterval(intervalRef.current);
//       if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
//       if (waveRef.current) clearInterval(waveRef.current);
//       if (soundWaveInterval.current) clearInterval(soundWaveInterval.current);
//       setMouthOpen(0);
//       setEyeBlink(false);
//       setParticles([]);
//       setSoundWaves([]);
//     }

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
//       if (waveRef.current) clearInterval(waveRef.current);
//       if (soundWaveInterval.current) clearInterval(soundWaveInterval.current);
//       if (utteranceRef.current) {
//         window.speechSynthesis.cancel();
//       }
//     };
//   }, [isTalking, text]);

//   return (
//     <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
//       {/* Animated background grid */}
//       <div className="absolute inset-0 opacity-20">
//         <div
//           className="absolute inset-0"
//           style={{
//             backgroundImage:
//               "linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)",
//             backgroundSize: "50px 50px",
//             animation: "grid-move 20s linear infinite",
//           }}
//         ></div>
//       </div>

//       <style>{`
//         @keyframes grid-move {
//           0% { transform: translate(0, 0); }
//           100% { transform: translate(50px, 50px); }
//         }
//         @keyframes glow-pulse {
//           0%, 100% { filter: drop-shadow(0 0 10px #00ffff) drop-shadow(0 0 20px #00ffff); }
//           50% { filter: drop-shadow(0 0 20px #00ffff) drop-shadow(0 0 40px #00ffff); }
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-10px); }
//         }
//         @keyframes sound-wave {
//           0% {
//             r: 160;
//             opacity: 0.8;
//           }
//           100% {
//             r: 500;
//             opacity: 0;
//           }
//         }
//         @keyframes sound-wave-2 {
//           0% {
//             r: 180;
//             opacity: 0.5;
//           }
//           100% {
//             r: 520;
//             opacity: 0;
//           }
//         }
//         @keyframes sound-wave-3 {
//           0% {
//             r: 200;
//             opacity: 0.3;
//           }
//           100% {
//             r: 540;
//             opacity: 0;
//           }
//         }
//         .glow-effect {
//           animation: glow-pulse 2s ease-in-out infinite;
//         }
//         .float-effect {
//           animation: float 3s ease-in-out infinite;
//         }
//         .sound-wave-1 {
//           animation: sound-wave 8s ease-out forwards;
//         }
//         .sound-wave-2 {
//           animation: sound-wave-2 8s ease-out forwards;
//         }
//         .sound-wave-3 {
//           animation: sound-wave-3 8s ease-out forwards;
//         }
//       `}</style>

//       {/* Text Input */}
//       <div className="mb-8 w-full max-w-2xl relative z-10">
//         <div className="flex items-center justify-between mb-2">
//           <label className="block text-cyan-400 font-mono text-sm tracking-wider">
//             VOICE INPUT TEXT:
//           </label>
//           <div className="flex gap-3">
//             {!isRecording ? (
//               <button
//                 onClick={startRecording}
//                 disabled={isTalking}
//                 className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-mono text-sm rounded-lg transition-all duration-300 transform hover:scale-105 border border-purple-400/50 disabled:border-gray-500/50 flex items-center gap-2"
//               >
//                 <span className="text-lg">🎤</span>
//                 <span>START RECORDING</span>
//               </button>
//             ) : (
//               <button
//                 onClick={stopRecording}
//                 className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-mono text-sm rounded-lg transition-all duration-300 transform hover:scale-105 border border-red-400/50 flex items-center gap-2 animate-pulse"
//               >
//                 <span className="inline-block w-2 h-2 bg-red-300 rounded-full animate-ping"></span>
//                 <span>RECORDING...</span>
//               </button>
//             )}
//           </div>
//         </div>
//         <textarea
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           disabled={isTalking || isRecording}
//           className="w-full px-6 py-4 bg-slate-900 border-2 border-cyan-500/50 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
//           rows="3"
//           placeholder="Enter text for the robot to speak or use voice recording..."
//         />
//       </div>

//       <div className="relative float-effect">
//         {/* Holographic outline */}
//         <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl opacity-30 blur-xl animate-pulse"></div>

//         <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl p-12 shadow-2xl border-2 border-cyan-500/30">
//           <svg width="400" height="450" viewBox="0 0 400 450">
//             {/* Sound waves radiating from center - using CSS animations */}
//             {soundWaves.map((wave) => (
//               <g key={wave.id}>
//                 <circle
//                   cx="200"
//                   cy="180"
//                   r="160"
//                   fill="none"
//                   stroke="#00ffff"
//                   strokeWidth="3"
//                   className="sound-wave-1"
//                 />
//                 <circle
//                   cx="200"
//                   cy="180"
//                   r="180"
//                   fill="none"
//                   stroke="#00ffff"
//                   strokeWidth="2"
//                   className="sound-wave-2"
//                 />
//                 <circle
//                   cx="200"
//                   cy="180"
//                   r="200"
//                   fill="none"
//                   stroke="#00ffff"
//                   strokeWidth="1"
//                   className="sound-wave-3"
//                 />
//               </g>
//             ))}

//             {/* Particle effects */}
//             {particles.map((p) => (
//               <circle
//                 key={p.id}
//                 cx={p.x}
//                 cy={p.y - (Date.now() % 3000) / 10}
//                 r="2"
//                 fill="#00ffff"
//                 opacity={Math.max(0, 1 - (Date.now() % 3000) / 3000)}
//               />
//             ))}

//             {/* Outer glow ring */}
//             <circle
//               cx="200"
//               cy="180"
//               r="160"
//               fill="none"
//               stroke="url(#glowGradient)"
//               strokeWidth="2"
//               opacity="0.3"
//               className={isTalking ? "glow-effect" : ""}
//             />

//             <defs>
//               <linearGradient
//                 id="glowGradient"
//                 x1="0%"
//                 y1="0%"
//                 x2="100%"
//                 y2="100%"
//               >
//                 <stop offset="0%" stopColor="#00ffff" />
//                 <stop offset="50%" stopColor="#0080ff" />
//                 <stop offset="100%" stopColor="#00ffff" />
//               </linearGradient>
//               <linearGradient
//                 id="headGradient"
//                 x1="0%"
//                 y1="0%"
//                 x2="0%"
//                 y2="100%"
//               >
//                 <stop offset="0%" stopColor="#1e293b" />
//                 <stop offset="100%" stopColor="#0f172a" />
//               </linearGradient>
//               <radialGradient id="eyeGlow">
//                 <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
//                 <stop offset="100%" stopColor="#0080ff" stopOpacity="0.3" />
//               </radialGradient>
//               <filter id="glow">
//                 <feGaussianBlur stdDeviation="4" result="coloredBlur" />
//                 <feMerge>
//                   <feMergeNode in="coloredBlur" />
//                   <feMergeNode in="SourceGraphic" />
//                 </feMerge>
//               </filter>
//             </defs>

//             {/* Head with gradient */}
//             <path
//               d="M 80 80 L 320 80 L 320 260 Q 320 280 300 280 L 100 280 Q 80 280 80 260 Z"
//               fill="url(#headGradient)"
//               stroke="#00ffff"
//               strokeWidth="2"
//               opacity="0.9"
//             />

//             {/* Tech panels */}
//             <rect
//               x="90"
//               y="90"
//               width="40"
//               height="30"
//               fill="#0f172a"
//               stroke="#00ffff"
//               strokeWidth="1"
//               opacity="0.6"
//             />
//             <rect
//               x="270"
//               y="90"
//               width="40"
//               height="30"
//               fill="#0f172a"
//               stroke="#00ffff"
//               strokeWidth="1"
//               opacity="0.6"
//             />

//             {/* Circuit lines */}
//             <line
//               x1="90"
//               y1="105"
//               x2="60"
//               y2="105"
//               stroke="#00ffff"
//               strokeWidth="1.5"
//               opacity="0.5"
//             />
//             <line
//               x1="310"
//               y1="105"
//               x2="340"
//               y2="105"
//               stroke="#00ffff"
//               strokeWidth="1.5"
//               opacity="0.5"
//             />
//             <circle
//               cx="60"
//               cy="105"
//               r="3"
//               fill="#00ffff"
//               className={isTalking ? "animate-pulse" : ""}
//             />
//             <circle
//               cx="340"
//               cy="105"
//               r="3"
//               fill="#00ffff"
//               className={isTalking ? "animate-pulse" : ""}
//             />

//             {/* Holographic antenna */}
//             <line
//               x1="200"
//               y1="80"
//               x2="200"
//               y2="40"
//               stroke="#00ffff"
//               strokeWidth="3"
//               strokeLinecap="round"
//               filter="url(#glow)"
//             />
//             <circle
//               cx="200"
//               cy="35"
//               r="12"
//               fill={isTalking ? "#00ffff" : "#0080ff"}
//               filter="url(#glow)"
//               className={isTalking ? "animate-pulse" : ""}
//             />
//             <circle cx="200" cy="35" r="8" fill="#000" opacity="0.3" />

//             {/* Advanced eyes with hexagonal design */}
//             <g>
//               {/* Left eye */}
//               <polygon
//                 points="120,150 145,140 170,150 170,170 145,180 120,170"
//                 fill="url(#eyeGlow)"
//                 stroke="#00ffff"
//                 strokeWidth="2"
//                 opacity={eyeBlink ? 0.1 : 0.9}
//                 className="transition-all duration-150"
//                 filter="url(#glow)"
//               />
//               {!eyeBlink && (
//                 <>
//                   <circle
//                     cx="145"
//                     cy="160"
//                     r="8"
//                     fill="#00ffff"
//                     opacity="0.8"
//                   />
//                   <circle cx="145" cy="160" r="3" fill="#fff" />
//                 </>
//               )}

//               {/* Right eye */}
//               <polygon
//                 points="230,150 255,140 280,150 280,170 255,180 230,170"
//                 fill="url(#eyeGlow)"
//                 stroke="#00ffff"
//                 strokeWidth="2"
//                 opacity={eyeBlink ? 0.1 : 0.9}
//                 className="transition-all duration-150"
//                 filter="url(#glow)"
//               />
//               {!eyeBlink && (
//                 <>
//                   <circle
//                     cx="255"
//                     cy="160"
//                     r="8"
//                     fill="#00ffff"
//                     opacity="0.8"
//                   />
//                   <circle cx="255" cy="160" r="3" fill="#fff" />
//                 </>
//               )}
//             </g>

//             {/* Holographic visor line */}
//             <line
//               x1="100"
//               y1="145"
//               x2="300"
//               y2="145"
//               stroke="#00ffff"
//               strokeWidth="1"
//               opacity="0.3"
//             />

//             {/* Advanced mouth with audio wave visualization */}
//             <rect
//               x="140"
//               y="210"
//               width="120"
//               height="40"
//               rx="8"
//               fill="#000"
//               stroke="#00ffff"
//               strokeWidth="2"
//               opacity="0.8"
//             />

//             {/* Audio wave bars */}
//             {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
//               const height = isTalking
//                 ? 10 + Math.sin(wavePhase + i * 0.5) * 10 + mouthOpen * 0.3
//                 : 5;
//               return (
//                 <rect
//                   key={i}
//                   x={150 + i * 13}
//                   y={230 - height / 2}
//                   width="8"
//                   height={height}
//                   fill="#00ffff"
//                   opacity="0.8"
//                   rx="2"
//                 />
//               );
//             })}

//             {/* Jaw detail */}
//             <path
//               d="M 120 280 L 200 300 L 280 280"
//               fill="none"
//               stroke="#00ffff"
//               strokeWidth="2"
//               opacity="0.4"
//             />

//             {/* Side processors */}
//             <rect
//               x="40"
//               y="140"
//               width="30"
//               height="80"
//               rx="5"
//               fill="#0f172a"
//               stroke="#00ffff"
//               strokeWidth="1.5"
//               opacity="0.7"
//             />
//             <rect
//               x="330"
//               y="140"
//               width="30"
//               height="80"
//               rx="5"
//               fill="#0f172a"
//               stroke="#00ffff"
//               strokeWidth="1.5"
//               opacity="0.7"
//             />

//             {/* Processing indicator lines */}
//             {[0, 1, 2].map((i) => (
//               <line
//                 key={i}
//                 x1="45"
//                 y1={155 + i * 20}
//                 x2="65"
//                 y2={155 + i * 20}
//                 stroke="#00ffff"
//                 strokeWidth="1"
//                 opacity={isTalking ? 0.8 : 0.3}
//                 className={isTalking ? "animate-pulse" : ""}
//               />
//             ))}
//             {[0, 1, 2].map((i) => (
//               <line
//                 key={i}
//                 x1="335"
//                 y1={155 + i * 20}
//                 x2="355"
//                 y2={155 + i * 20}
//                 stroke="#00ffff"
//                 strokeWidth="1"
//                 opacity={isTalking ? 0.8 : 0.3}
//                 className={isTalking ? "animate-pulse" : ""}
//               />
//             ))}

//             {/* Neck connector */}
//             <rect
//               x="160"
//               y="300"
//               width="80"
//               height="60"
//               rx="5"
//               fill="url(#headGradient)"
//               stroke="#00ffff"
//               strokeWidth="2"
//               opacity="0.8"
//             />
//             <line
//               x1="180"
//               y1="310"
//               x2="220"
//               y2="310"
//               stroke="#00ffff"
//               strokeWidth="1"
//               opacity="0.5"
//             />
//             <line
//               x1="180"
//               y1="320"
//               x2="220"
//               y2="320"
//               stroke="#00ffff"
//               strokeWidth="1"
//               opacity="0.5"
//             />

//             {/* Power indicator */}
//             <circle
//               cx="200"
//               cy="270"
//               r="4"
//               fill={isTalking ? "#00ff00" : "#00ffff"}
//               filter="url(#glow)"
//               className={isTalking ? "animate-pulse" : ""}
//             />
//           </svg>
//         </div>
//       </div>

//       <div className="mt-12 flex gap-6 relative z-10">
//         <button
//           onClick={() => setIsTalking(true)}
//           disabled={isTalking}
//           className="group relative px-10 py-5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-green-500/50 disabled:hover:scale-100 border-2 border-green-400/50 disabled:border-gray-500/50"
//         >
//           <span className="relative z-10 flex items-center gap-3">
//             <span className="text-2xl">▶</span>
//             <span className="text-lg">ACTIVATE</span>
//           </span>
//           <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
//         </button>

//         <button
//           onClick={() => setIsTalking(false)}
//           disabled={!isTalking}
//           className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-red-500/50 disabled:hover:scale-100 border-2 border-red-400/50 disabled:border-gray-500/50"
//         >
//           <span className="relative z-10 flex items-center gap-3">
//             <span className="text-2xl">■</span>
//             <span className="text-lg">TERMINATE</span>
//           </span>
//           <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
//         </button>
//       </div>

//       {isTalking && (
//         <div className="mt-8 relative z-10">
//           <div className="text-cyan-400 font-mono text-xl tracking-wider animate-pulse flex items-center gap-3">
//             <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
//             <span>NEURAL INTERFACE ACTIVE</span>
//             <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
