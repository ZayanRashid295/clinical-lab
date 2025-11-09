import { useEffect, useState } from 'react';
import { supabase, Question, AnswerChoice, Explanation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen
} from 'lucide-react';

interface TakeTestProps {
  testId: string;
  onNavigate: (page: string) => void;
}

interface QuestionWithDetails extends Question {
  choices: AnswerChoice[];
  explanation: Explanation | null;
}

export function TakeTest({ testId, onNavigate }: TakeTestProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState<string>('tutor');

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const { data: test } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (test) {
        setTestMode(test.test_mode);
      }

      const { data: testQuestions } = await supabase
        .from('test_questions')
        .select('question_id')
        .eq('test_id', testId)
        .order('order_position');

      if (!testQuestions) return;

      const questionIds = testQuestions.map((tq) => tq.question_id);

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (!questionsData) return;

      const questionsWithDetails = await Promise.all(
        questionsData.map(async (q) => {
          const { data: choices } = await supabase
            .from('answer_choices')
            .select('*')
            .eq('question_id', q.id)
            .order('order_position');

          const { data: explanation } = await supabase
            .from('explanations')
            .select('*')
            .eq('question_id', q.id)
            .maybeSingle();

          return {
            ...q,
            choices: choices || [],
            explanation: explanation || null,
          };
        })
      );

      setQuestions(questionsWithDetails);
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (choiceId: string) => {
    const question = questions[currentIndex];
    setSelectedAnswers({ ...selectedAnswers, [question.id]: choiceId });

    if (testMode === 'tutor') {
      setShowExplanation(true);
    }

    if (user) {
      const selectedChoice = question.choices.find((c) => c.id === choiceId);
      await supabase.from('user_answers').insert({
        user_id: user.id,
        test_id: testId,
        question_id: question.id,
        selected_choice_id: choiceId,
        is_correct: selectedChoice?.is_correct || false,
        time_spent_seconds: 0,
      });
    }
  };

  const toggleMarkForReview = () => {
    const question = questions[currentIndex];
    const newMarked = new Set(markedForReview);
    if (newMarked.has(question.id)) {
      newMarked.delete(question.id);
    } else {
      newMarked.add(question.id);
    }
    setMarkedForReview(newMarked);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
    }
  };

  const finishTest = async () => {
    if (user) {
      const correctAnswers = Object.entries(selectedAnswers).filter(([qId, choiceId]) => {
        const question = questions.find((q) => q.id === qId);
        const choice = question?.choices.find((c) => c.id === choiceId);
        return choice?.is_correct;
      }).length;

      const score = Math.round((correctAnswers / questions.length) * 100);

      await supabase
        .from('tests')
        .update({ completed: true, score, completed_at: new Date().toISOString() })
        .eq('id', testId);

      onNavigate('my-tests');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-slate-600">No questions found for this test.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const isAnswered = !!selectedAnswer;
  const correctChoice = currentQuestion.choices.find((c) => c.is_correct);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div className="h-2 w-64 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMarkForReview}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                markedForReview.has(currentQuestion.id)
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span className="text-sm font-medium">Mark for Review</span>
            </button>
            {testMode === 'timed' && (
              <div className="flex items-center space-x-2 text-slate-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">25:30</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          {currentQuestion.clinical_vignette && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-slate-700 leading-relaxed">
                  {currentQuestion.clinical_vignette}
                </p>
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = selectedAnswer === choice.id;
              const isCorrect = choice.is_correct;
              const showCorrectness = showExplanation && testMode === 'tutor';

              let buttonClass = 'border-2 hover:border-slate-300';
              if (isSelected && !showCorrectness) {
                buttonClass = 'border-blue-600 bg-blue-50';
              } else if (showCorrectness && isSelected && isCorrect) {
                buttonClass = 'border-green-600 bg-green-50';
              } else if (showCorrectness && isSelected && !isCorrect) {
                buttonClass = 'border-red-600 bg-red-50';
              } else if (showCorrectness && !isSelected && isCorrect) {
                buttonClass = 'border-green-600 bg-green-50';
              } else {
                buttonClass = 'border-slate-200';
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => !isAnswered && handleSelectAnswer(choice.id)}
                  disabled={isAnswered}
                  className={`w-full text-left px-6 py-4 rounded-lg transition ${buttonClass} ${
                    isAnswered ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900">{choice.choice_text}</span>
                    {showCorrectness && isSelected && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {showCorrectness && !isSelected && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Explanation</h3>

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                {selectedAnswer === correctChoice?.id ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium text-slate-900">
                  {selectedAnswer === correctChoice?.id ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {currentQuestion.explanation.correct_answer_explanation}
              </p>
            </div>

            {currentQuestion.explanation.educational_objective && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Educational Objective</h4>
                <p className="text-sm text-slate-700">
                  {currentQuestion.explanation.educational_objective}
                </p>
              </div>
            )}

            {currentQuestion.explanation.reference_links && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">References: </span>
                {currentQuestion.explanation.reference_links}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={finishTest}
              className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium"
            >
              Finish Test
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
