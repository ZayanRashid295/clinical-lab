import { useEffect, useState } from 'react';
import { supabase, Test } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Play, CheckCircle2, Clock, Calendar, Trash2 } from 'lucide-react';

interface MyTestsProps {
  onNavigate: (page: string, testId?: string) => void;
}

export function MyTests({ onNavigate }: MyTestsProps) {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  useEffect(() => {
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await supabase.from('tests').delete().eq('id', testId);
      setTests(tests.filter((t) => t.id !== testId));
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const filteredTests = tests.filter((test) => {
    if (filter === 'completed') return test.completed;
    if (filter === 'incomplete') return !test.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-3">
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Tests</h1>
        <p className="text-slate-600">View and manage your practice tests</p>
      </div>

      <div className="mb-6 flex items-center space-x-2">
        {['all', 'completed', 'incomplete'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-600 mb-4">No tests found</p>
          <button
            onClick={() => onNavigate('create-test')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                    {test.completed && (
                      <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(test.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{test.test_mode} Mode</span>
                    </div>
                    <div>
                      <span className="font-medium">{test.total_questions}</span> Questions
                    </div>
                    {test.completed && test.score !== null && (
                      <div>
                        Score: <span className="font-medium">{test.score}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!test.completed && (
                    <button
                      onClick={() => onNavigate('take-test', test.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Play className="w-4 h-4" />
                      <span>Continue</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteTest(test.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
