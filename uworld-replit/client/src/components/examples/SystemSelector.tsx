import { SystemSelector } from '../SystemSelector';
import { useState } from 'react';

export default function SystemSelectorExample() {
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const handleToggle = (systemId: string) => {
    setSelectedSystems(prev =>
      prev.includes(systemId)
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };

  return (
    <div className="p-6 bg-background max-w-md">
      <SystemSelector
        selectedSystems={selectedSystems}
        onSystemToggle={handleToggle}
      />
    </div>
  );
}
