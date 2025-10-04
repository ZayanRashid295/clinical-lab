import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, conversation } = body;

    // Mock AI response - in real app, this would call an AI service
    const mockResponses = [
      "That's a great question! Based on the patient's presentation, I would consider...",
      "Excellent observation. The key clinical points to focus on are...",
      "Good thinking! In this case, we need to prioritize...",
      "That's an important consideration. The differential diagnosis should include...",
      "You're on the right track. The next step would be to...",
      "Great question! The patient's symptoms suggest we should...",
      "That's a valid point. We should also consider...",
      "Good clinical reasoning! The most likely diagnosis based on the presentation is...",
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return NextResponse.json({
      response: randomResponse,
    });
  } catch (error) {
    console.error("Error generating doctor response:", error);
    return NextResponse.json(
      { error: "Failed to generate doctor response" },
      { status: 500 }
    );
  }
}
