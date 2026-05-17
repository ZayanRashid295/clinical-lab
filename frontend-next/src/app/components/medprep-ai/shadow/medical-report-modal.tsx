"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, FileText, CheckCircle, X } from 'lucide-react';
import { ShadowModalShell } from '@/lib/medprep-shadow/shadow-ui/shadow-modal-shell';
import { formatClinicalText } from '@/lib/medprep-shadow/shadow-ui/format-clinical-text';
import { ClinicalTestReportView } from '@/lib/medprep-shadow/shadow-ui/clinical-test-report-view';
import type { StructuredTestReport } from '@/lib/medprep-shadow/shadow-test-report';
// Simple toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
};

interface MedicalReport {
  report_type: string;
  patient_name: string;
  age: string | number;
  gender: string;
  findings: string;
  impression: string;
  recommendations: string;
  generated_at: string;
  raw_content?: string;
  summary?: string;
  fullReport?: string;
  structured?: StructuredTestReport;
}

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport | null;
  onResumeConversation: () => void;
  reportType?: string;
}

export function MedicalReportModal({ 
  isOpen, 
  onClose, 
  report, 
  onResumeConversation,
  reportType = 'Clinical Summary'
}: MedicalReportModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyReport = async () => {
    if (!report) return;
    
    setIsCopying(true);
    try {
      // Use raw_content if available (full LLM-generated report), otherwise fall back to findings
      const reportContent = formatClinicalText(
        report.structured?.fullReportMarkdown ??
          report.raw_content ??
          report.findings ??
          "",
      );
      
      const reportText = `
MEDICAL REPORT
==============

Patient: ${report.patient_name}
Age: ${report.age}
Gender: ${report.gender}
Report Type: ${report.report_type}
Generated: ${new Date(report.generated_at).toLocaleString()}

${reportContent}
      `.trim();

      await navigator.clipboard.writeText(reportText);
      showToast('Report copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy report', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    
    setIsDownloading(true);
    try {
      // Use raw_content if available (full LLM-generated report), otherwise fall back to findings
      const reportContent = formatClinicalText(
        report.structured?.fullReportMarkdown ??
          report.raw_content ??
          report.findings ??
          "",
      );
      
      // Convert markdown to HTML for better display
      const formattedContent = reportContent
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      
      // Create a simple HTML document for PDF generation
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medical Report - ${report.patient_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .timestamp { color: #6b7280; font-size: 0.9em; }
            .report-content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Report</h1>
            <div class="patient-info">
              <strong>Patient:</strong> ${report.patient_name}<br>
              <strong>Age:</strong> ${report.age}<br>
              <strong>Gender:</strong> ${report.gender}<br>
              <strong>Report Type:</strong> ${report.report_type}
            </div>
            <div class="timestamp">Generated: ${new Date(report.generated_at).toLocaleString()}</div>
          </div>
          
          <div class="section">
            <div class="report-content">${formattedContent}</div>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical-report-${report.patient_name}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Report downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to download report', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseAndResume = () => {
    onClose();
    onResumeConversation();
  };

  if (!report) return null;

  return (
    <ShadowModalShell
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={`${reportType} Report`}
      icon={<FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
      badge={
        <Badge variant="secondary" className="ml-1">
          {report.report_type}
        </Badge>
      }
    >
        <div className="space-y-6">
          {report.generated_at ? (
            <p className="text-sm text-gray-500">
              Generated: {new Date(report.generated_at).toLocaleString()}
            </p>
          ) : null}

          {/* Full Report Content - LLM Generated with Test-Specific Sections */}
          <Card className="border border-gray-300 shadow-sm bg-white">
            <CardHeader className="pb-4 bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-xl text-black font-semibold">
                <FileText className="h-5 w-5 text-black" />
                Medical Report
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-gray-300 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                {report.structured ? (
                  <ClinicalTestReportView report={report.structured} />
                ) : (
                  <p className="text-sm text-slate-600">
                    Structured report data is not available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyReport}
                  disabled={isCopying}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-400 text-black hover:text-black"
                >
                  <Copy className="h-4 w-4" />
                  {isCopying ? 'Copying...' : 'Copy Report'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-400 text-black hover:text-black"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex items-center gap-2 border-gray-400 text-white bg-gray-600 hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
                <Button
                  onClick={handleCloseAndResume}
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold px-6"
                >
                  <CheckCircle className="h-4 w-4" />
                  Continue Conversation
                </Button>
              </div>
            </div>
          </div>
        </div>
    </ShadowModalShell>
  );
}
