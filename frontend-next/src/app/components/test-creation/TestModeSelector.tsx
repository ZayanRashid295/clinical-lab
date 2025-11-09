import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Switch } from "@/shared/ui/switch";

interface TestModeSelectorProps {
  mode: "tutor" | "timed";
  isTimed: boolean;
  onModeChange: (mode: "tutor" | "timed") => void;
  onTimedChange: (timed: boolean) => void;
}

export function TestModeSelector({ mode, isTimed, onModeChange, onTimedChange }: TestModeSelectorProps) {
  return (
    <Card data-testid="card-test-mode">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-200">Test Mode</h3>
            <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as "tutor" | "timed")}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <RadioGroupItem value="tutor" id="tutor" data-testid="radio-tutor" />
                <div className="flex-1">
                  <Label htmlFor="tutor" className="font-medium cursor-pointer text-gray-900 dark:text-gray-200">
                    Tutor
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Shows the correct answer and explanation after you answer each question
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <RadioGroupItem value="timed" id="timed" data-testid="radio-timed" />
                <div className="flex-1">
                  <Label htmlFor="timed" className="font-medium cursor-pointer text-gray-900 dark:text-gray-200">
                    Timed
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Sets a time limit on the test
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <Label htmlFor="time-accommodation" className="font-medium text-gray-900 dark:text-gray-200">
                Time Accommodation
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Simulate your test accommodation by adjusting the allotted test time
              </p>
            </div>
            <Switch
              id="time-accommodation"
              checked={isTimed}
              onCheckedChange={onTimedChange}
              data-testid="switch-timed"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
