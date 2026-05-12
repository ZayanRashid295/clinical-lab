"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { Loader2 } from "lucide-react";

interface SystemItem {
  id: string;
  name: string;
  description?: string;
  count: number;
}

interface SystemSelectorProps {
  selectedSystems: string[];
  onSystemToggle: (systemId: string) => void;
  selectedPool?: string;
  isMarked?: boolean;
}

export function SystemSelector({ selectedSystems, onSystemToggle, selectedPool, isMarked }: SystemSelectorProps) {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        setError(null);
        const questionsService = new QuestionsService();
        const pool = selectedPool ? selectedPool as "unused" | "incorrect" | "correct" | "omitted" : undefined;
        const markedParam = isMarked ? true : undefined;
        const data = await questionsService.getTestCreationData({ pool, marked: markedParam });

        setSystems(data.systems.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          count: s.count
        })));
      } catch (err) {
        console.error("Failed to fetch systems:", err);
        setError("Failed to load systems. Please try again.");
      }
    };

    fetchSystems();
  }, [selectedPool, isMarked]);

  const selectableSystems = systems.filter((system) => system.count > 0);
  const allSelected = selectableSystems.length > 0 && selectableSystems.every((system) => selectedSystems.includes(system.id));
  const someSelected = selectableSystems.some((system) => selectedSystems.includes(system.id)) && !allSelected;

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      selectableSystems.forEach((system) => {
        if (!selectedSystems.includes(system.id)) onSystemToggle(system.id);
      });
    } else {
      systems.forEach((system) => {
        if (selectedSystems.includes(system.id)) onSystemToggle(system.id);
      });
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="card-subjects">
      <div className="shrink-0 border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <Checkbox
                id="select-all-systems"
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={handleSelectAll}
                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              />
            </label>
            <div className="flex items-center gap-2 border-l border-border/50 pl-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Systems</h3>
            </div>
          </div>
        </div>
          </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
            {error ? (
            <p className="text-sm text-destructive text-center py-12">{error}</p>
          ) : (
            <div className="space-y-0">
              {systems.map((system) => {
                const isSelected = selectedSystems.includes(system.id);
                const isDisabled = system.count === 0;
                return (
                  <label
                    key={system.id}
                    htmlFor={system.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-accent dark:hover:bg-accent/50"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox
                      id={system.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => {
                        if (!isDisabled) {
                          onSystemToggle(system.id);
                        }
                      }}
                      data-testid={`checkbox-${system.id}`}
                      className="h-4 w-4"
                    />
                    <span
                      className={`text-sm flex-1 ${isSelected ? "text-foreground dark:text-gray-100 font-medium" : "text-foreground/80 dark:text-gray-300"}`}
                    >
                      {system.name}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-gray-400 tabular-nums">{system.count}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-slate-200/80 bg-muted/30 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs text-muted-foreground dark:text-gray-400">
          <span className="font-medium text-foreground dark:text-gray-100">{selectedSystems.length}</span> of {systems.length} selected
        </p>
      </div>
    </div>
  );
}

