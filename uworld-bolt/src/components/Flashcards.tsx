import { useEffect, useState } from 'react';
import { supabase, Flashcard } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Plus, Trash2, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

export function Flashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  useEffect(() => {
    fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFlashcard = async () => {
    if (!user || !frontText.trim() || !backText.trim()) return;

    try {
      const { data } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          question_id: null,
          front_text: frontText,
          back_text: backText,
        })
        .select()
        .single();

      if (data) {
        setFlashcards([data, ...flashcards]);
        setFrontText('');
        setBackText('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
    }
  };

  const deleteFlashcard = async (id: string) => {
    if (!confirm('Delete this flashcard?')) return;

    try {
      await supabase.from('flashcards').delete().eq('id', id);
      setFlashcards(flashcards.filter((f) => f.id !== id));
      if (currentIndex >= flashcards.length - 1) {
        setCurrentIndex(Math.max(0, flashcards.length - 2));
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error);
    }
  };

  const markReviewed = async (id: string) => {
    try {
      await supabase
        .from('flashcards')
        .update({ last_reviewed: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking flashcard as reviewed:', error);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && flashcards[currentIndex]) {
      markReviewed(flashcards[currentIndex].id);
    }
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Flashcards</h1>
          <p className="text-slate-600">Review key concepts with flashcards</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Flashcard</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create New Flashcard</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Front (Question)
                </label>
                <textarea
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Enter the question or term..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Back (Answer)
                </label>
                <textarea
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Enter the answer or definition..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createFlashcard}
                  disabled={!frontText.trim() || !backText.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFrontText('');
                    setBackText('');
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No flashcards yet</h3>
          <p className="text-slate-600 mb-4">
            Create your first flashcard to start reviewing key concepts
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Flashcard
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 text-center text-slate-600">
            Card {currentIndex + 1} of {flashcards.length}
          </div>

          <div
            className="relative h-96 cursor-pointer mb-6"
            onClick={handleFlip}
            style={{ perspective: '1000px' }}
          >
            <div
              className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}
            >
              <div
                className="absolute w-full h-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-sm text-slate-500 mb-4">FRONT</div>
                <p className="text-xl text-slate-900 text-center">{currentCard?.front_text}</p>
                <div className="absolute bottom-4 text-sm text-slate-400">Click to flip</div>
              </div>

              <div
                className="absolute w-full h-full bg-blue-50 rounded-xl shadow-lg border border-blue-200 p-8 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-sm text-blue-600 mb-4">BACK</div>
                <p className="text-xl text-slate-900 text-center">{currentCard?.back_text}</p>
                <div className="absolute bottom-4 text-sm text-blue-400">Click to flip</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <RotateCw className="w-5 h-5" />
              <span>Flip Card</span>
            </button>

            <button
              onClick={goToNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => currentCard && deleteFlashcard(currentCard.id)}
              className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete this flashcard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
