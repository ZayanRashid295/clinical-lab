"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface TestModeSelectorProps {
  isTutor: boolean;
  isTimed: boolean;
  onTutorChange: (tutor: boolean) => void;
  onTimedChange: (timed: boolean) => void;
}

export function TestModeSelector({
  isTutor,
  isTimed,
  onTutorChange,
  onTimedChange,
}: TestModeSelectorProps) {
  return (
    <Card data-testid="card-test-mode">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-200">
              Test Mode
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="block mb-1">Tutor</strong>
                    <p className="text-xs opacity-90">
                      Shows the correct answer and explanation after you answer
                      each question
                    </p>
                  </div>
                  <div>
                    <strong className="block mb-1">Timed</strong>
                    <p className="text-xs opacity-90">
                      Sets a time limit on the test
                    </p>
                  </div>
                  <div>
                    <strong className="block mb-1">Time Accommodation</strong>
                    <p className="text-xs opacity-90">
                      Simulate your test accommodation by adjusting the allotted
                      test time.
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="tutor"
                checked={isTutor}
                onCheckedChange={onTutorChange}
                data-testid="switch-tutor"
              />
              <Label
                htmlFor="tutor"
                className="font-medium cursor-pointer text-gray-900 dark:text-gray-200"
              >
                Tutor
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="timed"
                checked={isTimed}
                onCheckedChange={onTimedChange}
                data-testid="switch-timed"
              />
              <Label
                htmlFor="timed"
                className="font-medium cursor-pointer text-gray-900 dark:text-gray-200"
              >
                Timed
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






















