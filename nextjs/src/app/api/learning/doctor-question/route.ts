import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, conversation } = body;

    // Mock AI response - in real app, this would call an AI service
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
      "This question helps gather important clinical information for diagnosis.";

    return NextResponse.json({
      question: randomQuestion,
      explanation: explanation,
    });
  } catch (error) {
    console.error("Error generating doctor question:", error);
    return NextResponse.json(
      { error: "Failed to generate doctor question" },
      { status: 500 }
    );
  }
}
