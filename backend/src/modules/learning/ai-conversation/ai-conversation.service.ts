import { Injectable } from "@nestjs/common";
import { DoctorQuestionDto } from "./doctor-question.dto";
import { PatientResponseDto } from "./patient-response.dto";
import { DoctorThoughtDto } from "./doctor-thought.dto";
import { AskDoctorDto } from "./ask-doctor.dto";

@Injectable()
export class AIConversationService {
  async generateDoctorQuestion(doctorQuestionDto: DoctorQuestionDto) {
    // Mock implementation - in real app, this would call an AI service
    const mockQuestions = [
      "Can you tell me more about the pain you're experiencing?",
      "When did the symptoms first start?",
      "Have you experienced anything like this before?",
      "Are you taking any medications currently?",
      "Do you have any allergies?",
      "Can you describe the pain in more detail?",
      "Have you noticed any other symptoms?",
      "What makes the pain better or worse?",
    ];

    const randomQuestion =
      mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
    const explanation =
      "This question helps gather essential clinical information to narrow down the differential diagnosis.";

    return {
      question: randomQuestion,
      explanation,
      timestamp: new Date().toISOString(),
    };
  }

  async generatePatientResponse(patientResponseDto: PatientResponseDto) {
    // Mock implementation - in real app, this would call an AI service
    const mockResponses = [
      "The pain started about 2 hours ago and it's getting worse.",
      "I've never had this type of pain before.",
      "I'm not taking any medications right now.",
      "I don't have any known allergies.",
      "The pain is sharp and comes in waves.",
      "I feel nauseous and dizzy.",
      "It hurts more when I move or breathe deeply.",
      "I've been feeling tired and weak lately.",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    // Random delay between 1-3 seconds
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      response: randomResponse,
      timestamp: new Date().toISOString(),
    };
  }

  async generateDoctorThought(doctorThoughtDto: DoctorThoughtDto) {
    // Mock implementation - in real app, this would call an AI service
    const mockThoughts = [
      "Patient presents with acute symptoms requiring immediate assessment.",
      "Need to rule out serious conditions based on presentation.",
      "Vital signs are within normal limits, good sign.",
      "Patient's description suggests possible cardiac involvement.",
      "History of similar episodes is important to establish.",
      "Current medications may be contributing to symptoms.",
      "Physical examination findings will guide next steps.",
      "Consider differential diagnosis based on symptoms.",
    ];

    const randomThought =
      mockThoughts[Math.floor(Math.random() * mockThoughts.length)];
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

    return {
      thought: randomThought,
      confidence,
      timestamp: new Date().toISOString(),
    };
  }

  async askDoctor(askDoctorDto: AskDoctorDto) {
    // Mock implementation - in real app, this would call an AI service
    const mockResponses = [
      "That's a great question! Based on the patient's presentation, I would consider...",
      "Excellent observation. The key clinical points to focus on are...",
      "Good thinking! In this case, we need to prioritize...",
      "That's an important consideration. The differential diagnosis should include...",
      "You're on the right track. The next step would be to...",
      "Great question! The patient's symptoms suggest we should...",
      "That's a valid point. We should also consider...",
      "Good clinical reasoning. The most likely diagnosis is...",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      answer: randomResponse,
      timestamp: new Date().toISOString(),
    };
  }
}
