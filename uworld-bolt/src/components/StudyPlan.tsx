import { useEffect, useState } from 'react';
import { supabase, StudyPlan as StudyPlanType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Target, TrendingUp, Save } from 'lucide-react';

export function StudyPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StudyPlanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [dailyGoal, setDailyGoal] = useState(50);
  const [totalQuestions, setTotalQuestions] = useState(3000);

  useEffect(() => {
    fetchStudyPlan();
  }, [user]);

  const fetchStudyPlan = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPlan(data);
        setTargetDate(data.target_exam_date || '');
        setDailyGoal(data.daily_question_goal);
        setTotalQuestions(data.total_questions_to_complete);
      }
    } catch (error) {
      console.error('Error fetching study plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const planData = {
        user_id: user.id,
        target_exam_date: targetDate || null,
        daily_question_goal: dailyGoal,
        total_questions_to_complete: totalQuestions,
        questions_completed: plan?.questions_completed || 0,
        updated_at: new Date().toISOString(),
      };

      if (plan) {
        const { data } = await supabase
          .from('study_plans')
          .update(planData)
          .eq('id', plan.id)
          .select()
          .single();
        setPlan(data);
      } else {
        const { data } = await supabase
          .from('study_plans')
          .insert(planData)
          .select()
          .single();
        setPlan(data);
      }

      alert('Study plan saved successfully!');
    } catch (error) {
      console.error('Error saving study plan:', error);
      alert('Failed to save study plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const daysUntilExam = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const questionsRemaining = totalQuestions - (plan?.questions_completed || 0);
  const recommendedDailyGoal = daysUntilExam > 0 ? Math.ceil(questionsRemaining / daysUntilExam) : 0;
  const progressPercentage = ((plan?.questions_completed || 0) / totalQuestions) * 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Study Plan</h1>
        <p className="text-slate-600">Plan your study schedule and track progress toward your goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {plan?.questions_completed || 0}
          </h3>
          <p className="text-sm text-slate-600">Questions Completed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {daysUntilExam > 0 ? daysUntilExam : '-'}
          </h3>
          <p className="text-sm text-slate-600">Days Until Exam</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {Math.round(progressPercentage)}%
          </h3>
          <p className="text-sm text-slate-600">Overall Progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Study Plan Settings</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Exam Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Daily Question Goal: {dailyGoal}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10</span>
                <span>200</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Questions to Complete: {totalQuestions}
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>500</span>
                <span>5000</span>
              </div>
            </div>

            <button
              onClick={savePlan}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Study Plan'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Progress Overview</h2>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Completion</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Questions Completed</span>
                <span className="font-medium text-slate-900">
                  {plan?.questions_completed || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Questions Remaining</span>
                <span className="font-medium text-slate-900">{questionsRemaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Daily Goal</span>
                <span className="font-medium text-slate-900">{dailyGoal} questions</span>
              </div>
            </div>
          </div>

          {targetDate && daysUntilExam > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-2">Recommendation</h3>
              <p className="text-sm text-amber-800">
                To complete {questionsRemaining} remaining questions in {daysUntilExam} days, you
                should answer approximately{' '}
                <span className="font-bold">{recommendedDailyGoal} questions per day</span>.
              </p>
              {recommendedDailyGoal > dailyGoal && (
                <p className="text-sm text-amber-800 mt-2">
                  Consider increasing your daily goal to stay on track!
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Study Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Review explanations for all questions, even correct ones</li>
              <li>• Focus on your weak areas using performance analytics</li>
              <li>• Create flashcards for important concepts</li>
              <li>• Take regular breaks to maintain focus</li>
              <li>• Practice with timed tests to build stamina</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
