import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  totalTests: number;
  completedTests: number;
  questionsAnswered: number;
  averageScore: number;
  streak: number;
  todayProgress: number;
  dailyGoal: number;
}

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    completedTests: 0,
    questionsAnswered: 0,
    averageScore: 0,
    streak: 0,
    todayProgress: 0,
    dailyGoal: 50,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id);

      const { data: answers } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', user.id);

      const { data: studyPlan } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const completedTests = tests?.filter((t) => t.completed) || [];
      const totalScore = completedTests.reduce((sum, t) => sum + (t.score || 0), 0);
      const avgScore = completedTests.length > 0 ? totalScore / completedTests.length : 0;

      const today = new Date().toISOString().split('T')[0];
      const todayAnswers = answers?.filter(
        (a) => a.answered_at.startsWith(today)
      ) || [];

      setStats({
        totalTests: tests?.length || 0,
        completedTests: completedTests.length,
        questionsAnswered: answers?.length || 0,
        averageScore: Math.round(avgScore),
        streak: 5,
        todayProgress: todayAnswers.length,
        dailyGoal: studyPlan?.daily_question_goal || 50,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tests',
      value: stats.totalTests,
      icon: BookOpen,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: stats.completedTests,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Questions Answered',
      value: stats.questionsAnswered,
      icon: Target,
      color: 'slate',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'amber',
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Current Streak',
      value: `${stats.streak} days`,
      icon: Calendar,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Today Progress',
      value: `${stats.todayProgress}/${stats.dailyGoal}`,
      icon: Clock,
      color: 'cyan',
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
  ];

  const progressPercentage = (stats.todayProgress / stats.dailyGoal) * 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Track your learning progress and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Today's Goal</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress</span>
              <span>{Math.min(Math.round(progressPercentage), 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {stats.todayProgress >= stats.dailyGoal
              ? 'Great job! You reached your daily goal!'
              : `${stats.dailyGoal - stats.todayProgress} questions to go`}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('create-test')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition text-left"
            >
              Create New Test
            </button>
            <button
              onClick={() => onNavigate('my-tests')}
              className="w-full bg-slate-100 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-200 transition text-left"
            >
              Continue Last Test
            </button>
            <button
              onClick={() => onNavigate('study-plan')}
              className="w-full bg-slate-100 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-200 transition text-left"
            >
              View Study Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
