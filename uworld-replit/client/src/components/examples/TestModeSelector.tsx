import { TestModeSelector } from '../TestModeSelector';
import { useState } from 'react';

export default function TestModeSelectorExample() {
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [isTimed, setIsTimed] = useState(false);

  return (
    <div className="p-6 bg-background max-w-2xl">
      <TestModeSelector
        mode={mode}
        isTimed={isTimed}
        onModeChange={setMode}
        onTimedChange={setIsTimed}
      />
    </div>
  );
}
