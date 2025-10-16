import { SubjectSelector } from '../SubjectSelector';
import { useState } from 'react';

export default function SubjectSelectorExample() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const handleToggle = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  return (
    <div className="p-6 bg-background max-w-md">
      <SubjectSelector
        selectedSubjects={selectedSubjects}
        onSubjectToggle={handleToggle}
      />
    </div>
  );
}
