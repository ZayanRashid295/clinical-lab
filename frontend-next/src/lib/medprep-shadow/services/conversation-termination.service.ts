import { safeClientFetch } from "@/lib/api/safe-client-fetch"

export interface TerminationDecision {
  shouldTerminate: boolean;
  diagnosticClarity: "insufficient" | "sufficient" | "complete";
  reasoning: string;
  confidence: number;
}

function trimHistoryForTerminationCheck(
  history: unknown[] | undefined,
  maxMessages = 14,
): unknown[] {
  if (!Array.isArray(history)) return []
  return history.slice(-maxMessages)
}

export class ConversationTerminationService {
  async shouldTerminateConversation(
    context: any
  ): Promise<TerminationDecision> {
    try {
      const fetched = await safeClientFetch("/api/learning/check-termination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: context.caseId,
          disease: context.disease,
          symptoms: context.symptoms,
          patientProfile: context.patientProfile,
          conversationHistory: trimHistoryForTerminationCheck(
            context.conversationHistory,
          ),
          mode: context.mode,
          isFollowUp: context.isFollowUp,
        }),
        timeoutMs: 12_000,
      })

      if (!fetched.ok) {
        throw new Error(`Termination check unavailable (${fetched.error})`)
      }

      const response = fetched.response
      if (!response.ok) {
        throw new Error("Failed to check conversation termination")
      }

      const data = await response.json()
      
      if (data.success) {
        return {
          shouldTerminate: data.shouldTerminate,
          diagnosticClarity: data.diagnosticClarity,
          reasoning: data.reasoning,
          confidence: data.confidence
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch {
      // Fallback to conservative estimate - don't terminate prematurely
      const conversationLength = context.conversationHistory?.length || 0;
      return {
        shouldTerminate: false,
        diagnosticClarity: "insufficient",
        reasoning: `AI evaluation failed - continuing conversation (${conversationLength} exchanges so far)`,
        confidence: 0.5,
      };
    }
  }
}

export const conversationTerminationService =
  new ConversationTerminationService();
