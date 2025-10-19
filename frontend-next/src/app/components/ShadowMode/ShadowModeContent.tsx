import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ZoomComm } from "./components/ZoomComm";
import { ChatBox } from "./components/ChatBox";
import { DoctorsThoughts } from "./components/DoctorsThoughts";
import { DiffDiag } from "./components/DiffDiag";
import { StatsBar } from "./components/StatsBar";
import { MemoryManager } from "./components/MemoryManager";
import { LabComponent } from "./components/LabComponent";

interface ShadowModeContentProps {
  className?: string;
}

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

interface Diagnosis {
  name: string;
  percentage: number;
}

interface LabResult {
  id: string;
  orderedAt: string;
  tests: Array<{
    type: "urine" | "blood" | "LDL" | "HDL";
    status: "pending" | "completed";
    results?: any; // specific structure per test type
  }>;
}

interface TimelineStep {
  chat: Message[];
  thoughts: string[];
  diagnoses: Diagnosis[];
  labResults: LabResult[];
  stats: {
    totalMessages: number;
    patientMessages: number;
    doctorMessages: number;
    doctorThoughts: number;
    activeDiagnoses: number;
  };
}

const ShadowModeContent: React.FC<ShadowModeContentProps> = ({
  className = "",
}) => {
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);

  // Navigation state
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = timeline.length;

  // Mock data generator for lab results
  const generateLabResults = (labType: string) => {
    switch (labType) {
      case "blood":
        return {
          rbc: (4.2 + Math.random() * 1.6).toFixed(1),
          wbc: (4.5 + Math.random() * 5.5).toFixed(1),
          hemoglobin: (12.0 + Math.random() * 4.0).toFixed(1),
          platelets: (150 + Math.random() * 200).toFixed(0),
          hematocrit: (36 + Math.random() * 12).toFixed(1),
        };
      case "urine":
        return {
          pH: (5.0 + Math.random() * 3.0).toFixed(1),
          glucose: Math.floor(Math.random() * 20),
          protein: Math.floor(Math.random() * 30),
          rbc: Math.floor(Math.random() * 5),
          wbc: Math.floor(Math.random() * 5),
          specificGravity: (1.005 + Math.random() * 0.025).toFixed(3),
        };
      case "LDL":
        return {
          ldl: Math.floor(70 + Math.random() * 120),
        };
      case "HDL":
        return {
          hdl: Math.floor(30 + Math.random() * 50),
        };
      default:
        return {};
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToLatestStep = () => {
    setCurrentStep(totalSteps);
  };

  // Get filtered data for current step
  const getFilteredData = () => {
    if (currentStep === 0 || timeline.length === 0) {
      // Initial state - empty everything
      return {
        chat: [],
        thoughts: [],
        diagnoses: [],
        labResults: [],
        stats: {
          totalMessages: 0,
          patientMessages: 0,
          doctorMessages: 0,
          doctorThoughts: 0,
          activeDiagnoses: 0,
        },
      };
    }

    const currentTimelineStep = timeline[currentStep - 1];

    // Chat, thoughts, and lab results show up to current step
    const allChat = [];
    const allThoughts = [];
    const allLabResults = [];

    for (let i = 0; i < currentStep; i++) {
      allChat.push(...timeline[i].chat);
      allThoughts.push(...timeline[i].thoughts);
      allLabResults.push(...timeline[i].labResults);
    }

    // Calculate stats based on accumulated chat up to current step
    const calculatedStats = {
      totalMessages: allChat.length,
      patientMessages: allChat.filter((m) => m.sender === "patient").length,
      doctorMessages: allChat.filter((m) => m.sender === "doctor").length,
      doctorThoughts: allThoughts.length,
      activeDiagnoses: currentTimelineStep.diagnoses.length,
    };

    // Stats and diagnoses show the nth step's data
    return {
      chat: allChat,
      thoughts: allThoughts,
      diagnoses: currentTimelineStep.diagnoses,
      labResults: allLabResults || [],
      stats: calculatedStats,
    };
  };

  const filteredData = getFilteredData();

  const handleSendMessage = (message: Message) => {
    // Get the current state (last timeline step or initial state)
    const currentState =
      timeline.length > 0
        ? timeline[timeline.length - 1]
        : {
            chat: [],
            thoughts: [],
            diagnoses: [],
            labResults: [],
            stats: {
              totalMessages: 0,
              patientMessages: 0,
              doctorMessages: 0,
              doctorThoughts: 0,
              activeDiagnoses: 0,
            },
          };

    // Add the new message
    const newChat = [...currentState.chat, message];

    // Generate thoughts
    let newThoughts = [...currentState.thoughts];
    if (message.sender === "patient") {
      const thoughtTemplates = [
        `Patient mentions: "${message.text.substring(
          0,
          30
        )}..." - Need to investigate further.`,
        `Symptom noted: Consider differential diagnoses.`,
        `Patient communication suggests potential concern. Monitoring closely.`,
        `Clinical observation: Requires follow-up questions.`,
        `Important detail from patient. Cross-referencing with known conditions.`,
      ];
      const randomThought =
        thoughtTemplates[Math.floor(Math.random() * thoughtTemplates.length)];
      newThoughts = [...newThoughts, randomThought];
    } else if (message.sender === "doctor") {
      const doctorThoughtTemplates = [
        `Provided diagnosis suggestion: "${message.text.substring(0, 30)}..."`,
        `Explained condition to patient. Monitoring response.`,
        `Clinical decision made. Documenting reasoning.`,
        `Patient education provided. Assessing understanding.`,
        `Treatment plan discussed. Following up on compliance.`,
      ];
      const randomThought =
        doctorThoughtTemplates[
          Math.floor(Math.random() * doctorThoughtTemplates.length)
        ];
      newThoughts = [...newThoughts, randomThought];
    }

    // Generate diagnoses (every patient message after the first one)
    let newDiagnoses = [...currentState.diagnoses];
    const patientMessageCount = newChat.filter(
      (m) => m.sender === "patient"
    ).length;
    if (patientMessageCount >= 1) {
      const possibleDiagnoses = [
        "Common Cold",
        "Seasonal Allergies",
        "Migraine",
        "Anxiety Disorder",
        "Gastritis",
        "Viral Infection",
        "Sinusitis",
        "Tension Headache",
      ];

      const unusedDiagnoses = possibleDiagnoses.filter(
        (d) => !newDiagnoses.find((nd) => nd.name === d)
      );

      if (unusedDiagnoses.length > 0) {
        const newDiag =
          unusedDiagnoses[Math.floor(Math.random() * unusedDiagnoses.length)];
        newDiagnoses = [
          ...newDiagnoses,
          {
            name: newDiag,
            percentage: Math.floor(Math.random() * 30) + 10,
          },
        ];
      }
    }

    // Update diagnosis percentages (only when adding new diagnosis)
    if (newDiagnoses.length > currentState.diagnoses.length) {
      newDiagnoses = newDiagnoses.map((d) => ({
        ...d,
        percentage: Math.min(
          100,
          Math.max(5, d.percentage + Math.floor(Math.random() * 21) - 10)
        ),
      }));
    }

    newDiagnoses.sort((a, b) => b.percentage - a.percentage);

    // Calculate stats
    const newStats = {
      totalMessages: newChat.length,
      patientMessages: newChat.filter((m) => m.sender === "patient").length,
      doctorMessages: newChat.filter((m) => m.sender === "doctor").length,
      doctorThoughts: newThoughts.length,
      activeDiagnoses: newDiagnoses.length,
    };

    // Create new timeline step
    const newTimelineStep: TimelineStep = {
      chat: [message], // Only the new message for this step
      thoughts: newThoughts.slice(currentState.thoughts.length), // Only new thoughts
      diagnoses: newDiagnoses,
      labResults: [], // No new lab results in this step
      stats: newStats,
    };

    // Add to timeline
    setTimeline([...timeline, newTimelineStep]);

    // Automatically go to the latest step when a new message is sent
    setTimeout(() => {
      setCurrentStep(timeline.length + 1);
    }, 100);
  };

  const handleOrderLabs = (labTypes: string[]) => {
    // Get the current state
    const currentState =
      timeline.length > 0
        ? timeline[timeline.length - 1]
        : {
            chat: [],
            thoughts: [],
            diagnoses: [],
            labResults: [],
            stats: {
              totalMessages: 0,
              patientMessages: 0,
              doctorMessages: 0,
              doctorThoughts: 0,
              activeDiagnoses: 0,
            },
          };

    // Create new lab order
    const newLabOrder: LabResult = {
      id: `lab-${Date.now()}`,
      orderedAt: new Date().toISOString(),
      tests: labTypes.map((type) => ({
        type: type as "urine" | "blood" | "LDL" | "HDL",
        status: "pending" as const,
      })),
    };

    // Create new timeline step with lab order
    const newTimelineStep: TimelineStep = {
      chat: [],
      thoughts: [],
      diagnoses: [],
      labResults: [newLabOrder],
      stats: currentState.stats,
    };

    // Add to timeline
    setTimeline([...timeline, newTimelineStep]);

    // After 3 seconds, generate results and update the lab order
    setTimeout(() => {
      const updatedLabOrder: LabResult = {
        ...newLabOrder,
        tests: newLabOrder.tests.map((test) => ({
          ...test,
          status: "completed" as const,
          results: generateLabResults(test.type),
        })),
      };

      // Update the timeline with completed results
      setTimeline((prevTimeline) => {
        const updatedTimeline = [...prevTimeline];
        const lastStep = updatedTimeline[updatedTimeline.length - 1];
        updatedTimeline[updatedTimeline.length - 1] = {
          ...lastStep,
          labResults: [updatedLabOrder],
        };
        return updatedTimeline;
      });
    }, 3000);

    // Automatically go to the latest step
    setTimeout(() => {
      setCurrentStep(timeline.length + 1);
    }, 100);
  };

  return (
    <div
      className={`h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-hidden ${className}`}
    >
      <div className="h-full max-w-7xl mx-auto flex flex-col gap-3">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Medical Consultation
          </h1>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
            </div>

            <button
              onClick={goToNextStep}
              disabled={currentStep === totalSteps}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === totalSteps
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>

            {currentStep < totalSteps && (
              <button
                onClick={goToLatestStep}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Latest
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Top row with main components */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            <div className="flex flex-col gap-3">
              <div className="h-1/2">
                <ZoomComm
                  onSendMessage={handleSendMessage}
                  onOrderLabs={handleOrderLabs}
                />
              </div>
              <div className="h-1/2">
                <ChatBox messages={filteredData.chat} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-1/2">
                <DoctorsThoughts thoughts={filteredData.thoughts} />
              </div>
              <div className="h-1/2">
                <DiffDiag diagnoses={filteredData.diagnoses} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <StatsBar stats={filteredData.stats} />
              <div className="flex-1">
                <LabComponent labResults={filteredData.labResults} />
              </div>
            </div>
          </div>

          {/* Memory window at the bottom */}
          <div className="h-64">
            <MemoryManager data={timeline} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShadowModeContent;
