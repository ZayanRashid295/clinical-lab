import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, conversation, currentCase, patientInfo, instruction } =
      body;

    // Mock AI response - in real app, this would call an AI service
    const mockThoughts = [
      "Patient presents with acute symptoms requiring immediate assessment.",
      "Need to rule out serious conditions based on presentation.",
      "Vital signs are within normal limits, good sign.",
      "Patient's description suggests possible cardiac involvement.",
      "History of similar episodes is important to establish.",
      "Current medications may be contributing to symptoms.",
      "Physical examination findings will guide next steps.",
      "Consider differential diagnosis based on age and symptoms.",
    ];

    const randomThought =
      mockThoughts[Math.floor(Math.random() * mockThoughts.length)];

    return NextResponse.json({
      thought: randomThought,
    });
  } catch (error) {
    console.error("Error generating doctor thought:", error);
    return NextResponse.json(
      { error: "Failed to generate doctor thought" },
      { status: 500 }
    );
  }
}
