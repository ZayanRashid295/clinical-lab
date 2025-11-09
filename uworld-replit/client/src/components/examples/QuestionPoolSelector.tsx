import { QuestionPoolSelector } from '../QuestionPoolSelector';
import { useState } from 'react';

export default function QuestionPoolSelectorExample() {
  const [pool, setPool] = useState("unused");

  return (
    <div className="p-6 bg-background max-w-2xl">
      <QuestionPoolSelector
        selectedPool={pool}
        onPoolChange={setPool}
      />
    </div>
  );
}
