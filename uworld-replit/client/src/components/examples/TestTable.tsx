import { TestTable } from '../TestTable';

export default function TestTableExample() {
  const tests = [
    {
      id: "200561420",
      score: 10,
      name: "Test 1",
      date: "Feb 01, 2021",
      mode: "Tutored, Untimed",
      pool: "Custom",
      subjects: "Multiple",
      systems: "Multiple",
      questionCount: 10,
    },
    {
      id: "200561421",
      score: 85,
      name: "Test 2",
      date: "Feb 05, 2021",
      mode: "Timed",
      pool: "Unused",
      subjects: "Pathology",
      systems: "Cardiovascular",
      questionCount: 25,
    },
  ];

  return (
    <div className="p-6 bg-background">
      <TestTable
        tests={tests}
        onResume={(id) => console.log('Resume test:', id)}
        onViewResults={(id) => console.log('View results:', id)}
        onViewAnalysis={(id) => console.log('View analysis:', id)}
      />
    </div>
  );
}
