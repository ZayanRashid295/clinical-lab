import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, instruction } = body;

    // Mock AI response - in real app, this would call an AI service
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

    // Randomly determine if conversation should be complete
    const isComplete = Math.random() > 0.7; // 30% chance of completion

    return NextResponse.json({
      response: randomResponse,
      isComplete: isComplete,
    });
  } catch (error) {
    console.error("Error generating patient response:", error);
    return NextResponse.json(
      { error: "Failed to generate patient response" },
      { status: 500 }
    );
  }
}
