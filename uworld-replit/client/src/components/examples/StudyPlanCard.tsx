import { StudyPlanCard } from '../StudyPlanCard';

export default function StudyPlanCardExample() {
  const tasks = [
    {
      id: "1",
      title: "Learn the Basics: How to Use your Study Plan",
      type: "Tutorial",
      duration: "07 mins",
      status: "upcoming" as const,
    },
    {
      id: "2",
      title: "Review Flashcards",
      type: "Review Flashcards",
      duration: "3 hrs, 42 mins",
      status: "overdue" as const,
    },
    {
      id: "3",
      title: "Practice Questions",
      type: "Practice Questions",
      duration: "12 hrs, 18 mins",
      status: "overdue" as const,
    },
  ];

  return (
    <div className="p-6 bg-background max-w-2xl">
      <StudyPlanCard 
        tasks={tasks} 
        onViewPlan={() => console.log('View plan clicked')} 
      />
    </div>
  );
}
