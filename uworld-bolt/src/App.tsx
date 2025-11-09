import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CreateTest } from './components/CreateTest';
import { TakeTest } from './components/TakeTest';
import { MyTests } from './components/MyTests';
import { Performance } from './components/Performance';
import { StudyPlan } from './components/StudyPlan';
import { Flashcards } from './components/Flashcards';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>();

  const handleNavigate = (page: string, testId?: string) => {
    setCurrentPage(page);
    if (testId) {
      setSelectedTestId(testId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {currentPage === 'create-test' && <CreateTest onNavigate={handleNavigate} />}
      {currentPage === 'take-test' && selectedTestId && (
        <TakeTest testId={selectedTestId} onNavigate={handleNavigate} />
      )}
      {currentPage === 'my-tests' && <MyTests onNavigate={handleNavigate} />}
      {currentPage === 'performance' && <Performance />}
      {currentPage === 'study-plan' && <StudyPlan />}
      {currentPage === 'flashcards' && <Flashcards />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
