"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Play, RotateCcw } from "lucide-react";
import { MedicalCase, LearningSession } from "@/lib/medprep-shadow/learning-types";

interface CaseCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueCase: () => void;
  onStartNew: () => void;
  incompleteCase: MedicalCase | null;
  incompleteSession: LearningSession | null;
}

export default function CaseCompletionPopup({
  isOpen,
  onClose,
  onContinueCase,
  onStartNew,
  incompleteCase,
  incompleteSession,
}: CaseCompletionPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Incomplete Case Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You have an incomplete case in progress. Would you like to continue with the previous case or start a new one?
            </p>
            
            {incompleteCase && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Previous Case:</h4>
                <p className="text-sm text-gray-600">{incompleteCase.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {incompleteCase.specialty}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    {incompleteCase.difficulty}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onStartNew}
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start New Case
            </Button>
            <Button
              onClick={onContinueCase}
              className="flex-1 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Continue Previous
            </Button>
          </div>

          <div className="text-center">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


