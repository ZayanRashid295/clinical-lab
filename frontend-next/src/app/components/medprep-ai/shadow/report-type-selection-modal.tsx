"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Scan, 
  TestTube, 
  Heart, 
  Microscope, 
  Stethoscope,
  X,
  Loader2
} from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ReportTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReportType: (reportType: string) => void;
  isGenerating: boolean;
}

const reportTypes: ReportType[] = [
  {
    id: 'radiology',
    name: 'Radiology Report',
    description: 'X-ray, CT, MRI, and imaging findings',
    icon: <Scan className="h-6 w-6" />,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    id: 'laboratory',
    name: 'Laboratory Report',
    description: 'Blood tests, urine analysis, and lab values',
    icon: <TestTube className="h-6 w-6" />,
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    id: 'cardiology',
    name: 'Cardiology Report',
    description: 'ECG, Echo, and cardiovascular findings',
    icon: <Heart className="h-6 w-6" />,
    color: 'bg-red-50 border-red-200 hover:bg-red-100'
  },
  {
    id: 'pathology',
    name: 'Pathology Report',
    description: 'Biopsy, histopathology, and microscopic findings',
    icon: <Microscope className="h-6 w-6" />,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  },
  {
    id: 'clinical',
    name: 'Clinical Summary',
    description: 'Comprehensive case overview and assessment',
    icon: <Stethoscope className="h-6 w-6" />,
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }
];

export function ReportTypeSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectReportType,
  isGenerating 
}: ReportTypeSelectionModalProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [lastSelectedType, setLastSelectedType] = useState<string>('');

  // Load last selected type from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastSelectedReportType');
    if (saved) {
      setLastSelectedType(saved);
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && selectedType) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedType, onClose]);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleConfirm = () => {
    if (selectedType) {
      // Save selection for next time
      localStorage.setItem('lastSelectedReportType', selectedType);
      onSelectReportType(selectedType);
    }
  };

  const handleQuickSelect = (typeId: string) => {
    setSelectedType(typeId);
    localStorage.setItem('lastSelectedReportType', typeId);
    onSelectReportType(typeId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-black">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            Select Report Type
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Access for Last Selected Type */}
          {lastSelectedType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Access</h3>
              <Button
                onClick={() => handleQuickSelect(lastSelectedType)}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Generate {reportTypes.find(t => t.id === lastSelectedType)?.name}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : `${type.color} border-gray-200`
                }`}
                onClick={() => handleSelectType(type.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${
                      selectedType === type.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-black">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedType ? `Selected: ${reportTypes.find(t => t.id === selectedType)?.name}` : 'Please select a report type'}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-400 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedType || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
