import { useEffect, useState } from 'react';
import { supabase, System, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Play, Settings } from 'lucide-react';

interface CreateTestProps {
  onNavigate: (page: string, testId?: string) => void;
}

export function CreateTest({ onNavigate }: CreateTestProps) {
  const { user } = useAuth();
  const [systems, setSystems] = useState<System[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [testMode, setTestMode] = useState<'tutor' | 'timed' | 'unused'>('tutor');
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSystemsAndCategories();
  }, []);

  const fetchSystemsAndCategories = async () => {
    try {
      const { data: systemsData } = await supabase
        .from('systems')
        .select('*')
        .order('name');

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setSystems(systemsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystem = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulty((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const createTest = async () => {
    if (!user) return;

    setCreating(true);
    try {
      let query = supabase.from('questions').select('id');

      if (selectedSystems.length > 0) {
        query = query.in('system_id', selectedSystems);
      }

      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      if (selectedDifficulty.length > 0) {
        query = query.in('difficulty', selectedDifficulty);
      }

      const { data: questions } = await query.limit(numQuestions);

      if (!questions || questions.length === 0) {
        alert('No questions found matching your criteria. Try adjusting filters.');
        return;
      }

      const { data: newTest, error: testError } = await supabase
        .from('tests')
        .insert({
          user_id: user.id,
          title: `Test - ${new Date().toLocaleDateString()}`,
          test_mode: testMode,
          total_questions: questions.length,
          time_limit_minutes: testMode === 'timed' ? timeLimit : null,
        })
        .select()
        .single();

      if (testError) throw testError;

      const testQuestions = questions.map((q, index) => ({
        test_id: newTest.id,
        question_id: q.id,
        order_position: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(testQuestions);

      if (questionsError) throw questionsError;

      onNavigate('take-test', newTest.id);
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Failed to create test. Please try again.');
    } finally {
      setCreating(false);
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

  const filteredCategories = selectedSystems.length > 0
    ? categories.filter((c) => selectedSystems.includes(c.system_id))
    : categories;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Test</h1>
        <p className="text-slate-600">Customize your practice test with filters and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Filter by System</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {systems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => toggleSystem(system.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition text-left ${
                    selectedSystems.includes(system.id)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium">{system.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{system.description}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedSystems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Filter by Category</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition text-sm ${
                      selectedCategories.includes(category.id)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Difficulty Level</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['easy', 'medium', 'hard'].map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className={`px-4 py-2 rounded-lg border-2 transition capitalize ${
                    selectedDifficulty.includes(difficulty)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Mode
                </label>
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="tutor">Tutor Mode</option>
                  <option value="timed">Timed Mode</option>
                  <option value="unused">Unused Only</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {testMode === 'tutor' && 'See explanations immediately'}
                  {testMode === 'timed' && 'Race against the clock'}
                  {testMode === 'unused' && 'Only new questions'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Questions: {numQuestions}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {testMode === 'timed' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Time Limit: {timeLimit} minutes
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="5"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Systems:</span>
                    <span className="font-medium">
                      {selectedSystems.length || 'All'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Categories:</span>
                    <span className="font-medium">
                      {selectedCategories.length || 'All'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-medium">
                      {selectedDifficulty.length || 'All'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={createTest}
                disabled={creating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>{creating ? 'Creating...' : 'Start Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
