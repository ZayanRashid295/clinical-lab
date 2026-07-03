import type { PrismaService } from "../prisma/prisma.service";

export type QuestionPaperAuditOption = {
  label: string;
  text: string;
  isCorrect: boolean;
};

export type QuestionPaperAuditQuestion = {
  order: number;
  questionPaperQuestionId: string;
  questionId: string;
  title: string | null;
  system: string | null;
  topic: string | null;
  stem: string;
  options: QuestionPaperAuditOption[];
  userAnswer: string | null;
  userAnswerLabel: string | null;
  userAnswerText: string | null;
  userAnswerDisplay: string | null;
  correctAnswer: string | null;
  correctAnswerLabel: string | null;
  correctAnswerText: string | null;
  correctAnswerDisplay: string | null;
  isCorrect: boolean | null;
  markedForReview: boolean;
  timeSpentSeconds: number | null;
};

function toPlainText(htmlOrText: string): string {
  return htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchSelectedOption(
  userAnswer: string | null,
  options: QuestionPaperAuditOption[],
): QuestionPaperAuditOption | null {
  if (!userAnswer?.trim()) return null;
  const trimmed = userAnswer.trim();
  const upper = trimmed.toUpperCase();

  const byLabel = options.find((o) => o.label.toUpperCase() === upper);
  if (byLabel) return byLabel;

  const byExactText = options.find((o) => o.text === trimmed);
  if (byExactText) return byExactText;

  const byContains = options.find(
    (o) =>
      o.text.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(o.text.toLowerCase()),
  );
  if (byContains) return byContains;

  return null;
}

function formatChoiceDisplay(option: QuestionPaperAuditOption | null): string | null {
  if (!option) return null;
  return `${option.label}. ${option.text}`;
}

function resolveAnswerFields(
  userAnswer: string | null,
  options: QuestionPaperAuditOption[],
) {
  const correct = options.find((o) => o.isCorrect) ?? null;
  const selected = matchSelectedOption(userAnswer, options);

  return {
    userAnswerLabel: selected?.label ?? null,
    userAnswerText: selected?.text ?? (userAnswer?.trim() || null),
    userAnswerDisplay: selected
      ? formatChoiceDisplay(selected)
      : userAnswer?.trim() || null,
    correctAnswerLabel: correct?.label ?? null,
    correctAnswerText: correct?.text ?? null,
    correctAnswerDisplay: formatChoiceDisplay(correct),
    correctAnswer: correct?.text ?? null,
  };
}

export async function buildQuestionPaperAuditSnapshot(
  prisma: PrismaService,
  questionPaperId: string,
) {
  const questionPaper = await prisma.questionPaper.findUnique({
    where: { id: questionPaperId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!questionPaper) {
    return null;
  }

  const questionPaperQuestions = await prisma.questionPaperQuestion.findMany({
    where: { questionPaperId },
    include: {
      question: {
        include: {
          choices: { orderBy: { order: "asc" } },
          system: { select: { name: true } },
          topic: { select: { name: true } },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const questions: QuestionPaperAuditQuestion[] = questionPaperQuestions.map(
    (qpq, idx) => {
      const options: QuestionPaperAuditOption[] = qpq.question.choices.map(
        (choice, choiceIdx) => ({
          label: String.fromCharCode(65 + choiceIdx),
          text: choice.text,
          isCorrect: choice.isCorrect,
        }),
      );

      const answers = resolveAnswerFields(qpq.userAnswer, options);

      return {
        order: qpq.order || idx + 1,
        questionPaperQuestionId: qpq.id,
        questionId: qpq.questionId,
        title: qpq.question.title,
        system: qpq.question.system?.name ?? null,
        topic: qpq.question.topic?.name ?? null,
        stem: toPlainText(qpq.question.question),
        options,
        userAnswer: qpq.userAnswer,
        ...answers,
        isCorrect: qpq.isCorrect,
        markedForReview: qpq.markedForReview,
        timeSpentSeconds: qpq.timeSpent,
      };
    },
  );

  return {
    questionPaper: {
      id: questionPaper.id,
      name: questionPaper.name,
      description: questionPaper.description,
      type: questionPaper.type,
      timeLimitMinutes: questionPaper.timeLimit,
      totalQuestions: questionPaper.totalQuestions,
      createdAt: questionPaper.createdAt.toISOString(),
    },
    student: questionPaper.user
      ? {
          id: questionPaper.user.id,
          email: questionPaper.user.email,
          name: `${questionPaper.user.firstName} ${questionPaper.user.lastName}`.trim(),
        }
      : null,
    questions,
    summary: {
      totalQuestions: questions.length,
      answered: questions.filter((q) => q.userAnswer).length,
      correct: questions.filter((q) => q.isCorrect === true).length,
      incorrect: questions.filter((q) => q.isCorrect === false).length,
      marked: questions.filter((q) => q.markedForReview).length,
    },
  };
}
