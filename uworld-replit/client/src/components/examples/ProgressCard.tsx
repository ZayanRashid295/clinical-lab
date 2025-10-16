import { ProgressCard } from '../ProgressCard';

export default function ProgressCardExample() {
  return (
    <div className="p-6 bg-background max-w-md">
      <ProgressCard
        title="Study Plan Progress"
        progress={76.19}
        current={1}
        total={10}
        daysRemaining={10}
        stats={{
          completed: 16,
          overdue: 2,
          incomplete: 3,
        }}
      />
    </div>
  );
}
