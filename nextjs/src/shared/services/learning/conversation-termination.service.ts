export interface TerminationDecision {
  shouldTerminate: boolean;
  diagnosticClarity: "insufficient" | "sufficient" | "complete";
  reasoning: string;
  confidence: number;
}

export class ConversationTerminationService {
  async shouldTerminateConversation(
    context: any
  ): Promise<TerminationDecision> {
    // Mock implementation - in real app, this would use AI to analyze conversation completeness
    const conversationLength = context.conversationHistory?.length || 0;

    // Simple heuristic: terminate after 6+ exchanges or if we have enough information
    const shouldTerminate = conversationLength >= 6;

    return {
      shouldTerminate,
      diagnosticClarity: shouldTerminate ? "sufficient" : "insufficient",
      reasoning: shouldTerminate
        ? "Sufficient clinical information gathered for diagnosis"
        : "More information needed for accurate diagnosis",
      confidence: shouldTerminate ? 0.85 : 0.3,
    };
  }
}

export const conversationTerminationService =
  new ConversationTerminationService();
