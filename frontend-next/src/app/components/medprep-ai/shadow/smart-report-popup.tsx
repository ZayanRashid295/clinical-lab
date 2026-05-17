"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Stethoscope, 
  CheckCircle, 
  X, 
  Loader2,
  Brain,
  TestTube,
  Scan,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectedTest } from '@/lib/medprep-shadow/services/report-detection.service';

interface SmartReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReports: (selectedTests: DetectedTest[]) => void;
  detectedTests: DetectedTest[];
  isGenerating: boolean;
  doctorThought: string;
}

const getTestIcon = (category: string) => {
  switch (category) {
    case 'imaging': return <Scan className="w-4 h-4" />;
    case 'lab': return <TestTube className="w-4 h-4" />;
    case 'special': return <Heart className="w-4 h-4" />;
    default: return <Stethoscope className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'imaging': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
    case 'lab': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300';
    case 'special': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300';
    default: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300';
  }
};

export function SmartReportPopup({
  isOpen,
  onClose,
  onGenerateReports,
  detectedTests,
  isGenerating,
  doctorThought
}: SmartReportPopupProps) {
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-select high confidence tests when popup opens
  useEffect(() => {
    if (!isOpen || detectedTests.length === 0) return;

    const highConfidenceTests = detectedTests
      .filter((test) => test.confidence > 0.7)
      .map((test) => `${test.type}-${test.category}`);

    setSelectedTests(new Set(highConfidenceTests));
  }, [detectedTests, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleTestToggle = (test: DetectedTest) => {
    const testKey = `${test.type}-${test.category}`;
    const newSelected = new Set(selectedTests);
    
    if (newSelected.has(testKey)) {
      newSelected.delete(testKey);
    } else {
      newSelected.add(testKey);
    }
    
    setSelectedTests(newSelected);
  };

  const handleGenerate = () => {
    setIsAnimating(true);
    const selected = detectedTests.filter(test => 
      selectedTests.has(`${test.type}-${test.category}`)
    );
    
    setTimeout(() => {
      onGenerateReports(selected);
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 300);
  };

  const selectedCount = selectedTests.size;
  const totalCount = detectedTests.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Doctor's Recommendation
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Based on the doctor's clinical reasoning
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Doctor's Thought Context */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Doctor's Clinical Reasoning:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{doctorThought}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detected Tests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recommended Tests
                </h3>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                  {selectedCount} of {totalCount} selected
                </Badge>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                <AnimatePresence>
                  {detectedTests.map((test, index) => {
                    const testKey = `${test.type}-${test.category}`;
                    const isSelected = selectedTests.has(testKey);
                    
                    return (
                      <motion.div
                        key={testKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:shadow-slate-800/50 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          }`}
                          onClick={() => handleTestToggle(test)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleTestToggle(test)}
                                className="flex-shrink-0"
                              />
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {getTestIcon(test.category)}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getCategoryColor(test.category)}`}
                                >
                                  {test.category.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {test.type}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Confidence: {Math.round(test.confidence * 100)}%
                                </p>
                              </div>
                              
                              {test.confidence > 0.8 && (
                                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isGenerating || isAnimating}
                className="flex items-center gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
                Skip for Now
              </Button>
              
              <Button
                onClick={handleGenerate}
                disabled={selectedCount === 0 || isGenerating || isAnimating}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Generate Selected Reports ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
