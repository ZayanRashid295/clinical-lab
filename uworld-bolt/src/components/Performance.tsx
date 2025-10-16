import { useEffect, useState } from 'react';
import { supabase, System, UserPerformance } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

interface PerformanceWithSystem extends UserPerformance {
  system_name?: string;
}

export function Performance() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<PerformanceWithSystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalAnswered: 0,
    totalCorrect: 0,
    averagePercentage: 0,
  });

  useEffect(() => {
    fetchPerformance();
  }, [user]);

  const fetchPerformance = async () => {
    if (!user) return;

    try {
      const { data: systemsData } = await supabase
        .from('systems')
        .select('*')
        .order('name');

      setSystems(systemsData || []);

      const { data: answers } = await supabase
        .from('user_answers')
        .select('*, questions(system_id)')
        .eq('user_id', user.id);

      if (!answers || !systemsData) return;

      const perfBySystem = new Map<string, { correct: number; total: number }>();

      answers.forEach((answer: any) => {
        const systemId = answer.questions?.system_id;
        if (!systemId) return;

        if (!perfBySystem.has(systemId)) {
          perfBySystem.set(systemId, { correct: 0, total: 0 });
        }

        const stats = perfBySystem.get(systemId)!;
        stats.total += 1;
        if (answer.is_correct) stats.correct += 1;
      });

      const performanceData: PerformanceWithSystem[] = [];
      let totalAnswered = 0;
      let totalCorrect = 0;

      systemsData.forEach((system) => {
        const stats = perfBySystem.get(system.id);
        if (stats) {
          const percentage = (stats.correct / stats.total) * 100;
          performanceData.push({
            id: `${system.id}-perf`,
            user_id: user.id,
            system_id: system.id,
            category_id: null,
            total_questions_answered: stats.total,
            correct_answers: stats.correct,
            percentage,
            updated_at: new Date().toISOString(),
            system_name: system.name,
          });
          totalAnswered += stats.total;
          totalCorrect += stats.correct;
        }
      });

      setPerformance(performanceData);
      setOverallStats({
        totalAnswered,
        totalCorrect,
        averagePercentage: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
      });
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Analytics</h1>
        <p className="text-slate-600">Track your progress across all systems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {overallStats.totalAnswered}
          </h3>
          <p className="text-sm text-slate-600">Total Questions Answered</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {overallStats.totalCorrect}
          </h3>
          <p className="text-sm text-slate-600">Correct Answers</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {Math.round(overallStats.averagePercentage)}%
          </h3>
          <p className="text-sm text-slate-600">Overall Accuracy</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Performance by System</h2>
        </div>

        {performance.length === 0 ? (
          <div className="p-12 text-center text-slate-600">
            No performance data yet. Start answering questions to see your progress!
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {performance.map((perf) => {
              const percentage = perf.percentage;
              const isGood = percentage >= 70;

              return (
                <div key={perf.id} className="p-6 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {perf.system_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isGood ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <span
                        className={`text-2xl font-bold ${
                          isGood ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                    <span>
                      {perf.correct_answers} correct out of {perf.total_questions_answered}{' '}
                      questions
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isGood ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
