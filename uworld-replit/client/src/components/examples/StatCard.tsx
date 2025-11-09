import { StatCard } from '../StatCard';
import { CheckCircle2, BookOpen, ClipboardCheck } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-background">
      <StatCard
        title="Question Score"
        value="0%"
        subtitle="Correct"
        icon={CheckCircle2}
        color="success"
      />
      <StatCard
        title="QBank Usage"
        value="1%"
        subtitle="40 / 3639 Used"
        icon={BookOpen}
        progress={1}
        color="primary"
      />
      <StatCard
        title="Test Count"
        value="100%"
        subtitle="1 / 1 Completed"
        icon={ClipboardCheck}
        progress={100}
        color="primary"
      />
    </div>
  );
}
