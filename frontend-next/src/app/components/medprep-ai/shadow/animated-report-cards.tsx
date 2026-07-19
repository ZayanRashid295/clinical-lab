"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  User, 
  CheckCircle, 
  Download, 
  Copy,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClinicalTestReportView } from '@/lib/medprep-shadow/shadow-ui/clinical-test-report-view';
import { ClinicalMarkdown } from '@/lib/medprep-shadow/shadow-ui/clinical-markdown';
import type { StructuredTestReport } from '@/lib/medprep-shadow/shadow-test-report';

function getReportMarkdownBody(report: GeneratedReport): string {
  return (
    report.reportContent?.reportContent ||
    report.reportContent?.fullReport ||
    report.summary ||
    report.reportContent?.summary ||
    ''
  ).trim();
}

function getReportPreviewMarkdown(report: GeneratedReport, maxLen = 480): string {
  const summary = (report.reportContent?.summary || report.summary || '').trim();
  const full = getReportMarkdownBody(report);
  const source = summary && summary.length < 220 && !/^#{1,6}\s/m.test(summary)
    ? summary
    : full || summary;
  if (!source) return 'No content available';
  return source.length > maxLen ? `${source.slice(0, maxLen)}…` : source;
}

const previewMarkdownClass =
  '[&_h1]:text-sm [&_h1]:font-semibold [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-semibold [&_p]:text-sm [&_p]:mb-1 [&_p]:leading-snug [&_ul]:text-sm [&_li]:text-sm';

interface GeneratedReport {
  id: string;
  summary?: string;
  type?: string; // Alternative to reportType
  reportType: string;
  reportContent: {
    // LLM-generated full report content (new format)
    reportContent?: string; // Full test-specific report with appropriate sections
    fullReport?: string; // Fallback/alternative field
    summary?: string; // Brief summary/impression
    type?: string;
    report_type?: string;
    timestamp?: string;
    generated_at?: string;
    // Legacy fields (may still be used in some places)
    findings?: string;
    impression?: string;
    recommendations?: string;
    structured?: StructuredTestReport;
  };
  structured?: StructuredTestReport;
  patientInfo: any;
  timestamp: string;
  doctorThoughtContext?: string;
}

interface AnimatedReportCardsProps {
  reports: GeneratedReport[];
  onContinueConversation: () => void;
  onReportAction?: (reportId: string, action: 'copy' | 'download') => void;
  onReportClick?: (reportIndex: number) => void; // New prop for clicking on report
  isGenerating?: boolean;
  generationProgress?: { completed: number; total: number };
}

const getReportIcon = (reportType: string) => {
  if (!reportType || typeof reportType !== 'string') {
    console.warn('getReportIcon: Invalid reportType:', reportType);
    return '📋';
  }
  const type = reportType.toLowerCase();
  if (type.includes('ct') || type.includes('mri') || type.includes('x-ray')) return '🩻';
  if (type.includes('blood') || type.includes('lab')) return '🧪';
  if (type.includes('ecg') || type.includes('ekg')) return '❤️';
  if (type.includes('neuro')) return '🧠';
  return '📋';
};

const getReportColor = (reportType: string) => {
  if (!reportType || typeof reportType !== 'string') {
    console.warn('getReportColor: Invalid reportType:', reportType);
    return 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800';
  }
  const type = reportType.toLowerCase();
  if (type.includes('ct') || type.includes('mri') || type.includes('x-ray')) return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20';
  if (type.includes('blood') || type.includes('lab')) return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
  if (type.includes('ecg') || type.includes('ekg')) return 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
  if (type.includes('neuro')) return 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20';
  return 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800';
};

export function AnimatedReportCards({
  reports,
  onContinueConversation,
  onReportAction,
  onReportClick,
  isGenerating = false,
  generationProgress
}: AnimatedReportCardsProps) {
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [isSliding, setIsSliding] = useState(false);

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const handleContinue = () => {
    setIsSliding(true);
    setTimeout(() => {
      onContinueConversation();
      setIsSliding(false);
    }, 500);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyReport = (report: GeneratedReport) => {
    const reportType = report.type || report.reportType || 'Unknown Report';
    const reportId = report.id || `${report.type}-${report.timestamp}`;
    
    // Get the full report content
    const reportContent = report.reportContent?.reportContent || 
                         report.reportContent?.fullReport || 
                         report.summary || 
                         'Report content not available';
    
    const reportText = `
${reportType} Report
Generated: ${formatTimestamp(report.timestamp)}
Patient: ${report.patientInfo?.name || 'Unknown'}

${reportContent}
    `.trim();
    
    // Use clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        onReportAction?.(reportId, 'copy');
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        // Fallback to text selection
        fallbackCopyTextToClipboard(reportText);
      });
    } else {
      // Fallback for older browsers
      fallbackCopyTextToClipboard(reportText);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  };

  const downloadReport = (report: GeneratedReport) => {
    const reportType = report.type || report.reportType || 'Unknown Report';
    const reportId = report.id || `${report.type}-${report.timestamp}`;
    
    // Get the full report content
    const reportContent = report.reportContent?.reportContent || 
                         report.reportContent?.fullReport || 
                         report.summary || 
                         'Report content not available';
    
    const reportText = `
${reportType} Report
Generated: ${formatTimestamp(report.timestamp)}
Patient: ${report.patientInfo?.name || 'Unknown'}

${reportContent}
    `.trim();
    
    // Create and download the file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, '-')}-report-${new Date(report.timestamp).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onReportAction?.(reportId, 'download');
  };

  return (
    <div className="space-y-4">
      {/* Generation Progress */}
      {isGenerating && generationProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700 dark:border-blue-500 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400 dark:text-blue-300" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Generating Reports...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(generationProgress.completed / generationProgress.total) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {generationProgress.completed} of {generationProgress.total} reports completed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Report Cards */}
      <AnimatePresence>
        {reports.map((report, index) => {
          const reportId = report.id || `${report.type}-${report.timestamp}-${index}`;
          const isExpanded = expandedReports.has(reportId);
          const reportType = report.type || report.reportType || 'Unknown Report';
          const icon = getReportIcon(reportType);
          const colorClass = getReportColor(reportType);
          
          return (
            <motion.div
              key={reportId}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { delay: index * 0.1 }
              }}
              exit={{ 
                opacity: 0, 
                y: -50, 
                scale: 0.95,
                transition: { duration: 0.3 }
              }}
              className={`transition-all duration-300 ${isSliding ? 'transform -translate-x-full opacity-0' : ''}`}
            >
              <Card 
                className={`border-2 ${colorClass} hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-200 ${onReportClick ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                  // Only trigger if clicking on the card itself, not buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    return;
                  }
                  onReportClick?.(index);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{icon}</div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {reportType}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(report.timestamp)}
                          <User className="w-3 h-3 ml-2" />
                          {report.patientInfo?.name || 'Unknown Patient'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(reportId)}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {isExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ScrollArea className="h-80 w-full">
                        <div className="space-y-4 pr-4">
                          <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-blue-950">
                            {report.structured || report.reportContent?.structured ? (
                              <ClinicalTestReportView
                                report={
                                  report.structured ||
                                  report.reportContent!.structured!
                                }
                              />
                            ) : getReportMarkdownBody(report) ? (
                              <ClinicalMarkdown className="text-slate-800 dark:text-slate-200">
                                {getReportMarkdownBody(report)}
                              </ClinicalMarkdown>
                            ) : (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Structured report data is not available for this
                                entry.
                              </p>
                            )}
                          </div>

                          {/* Doctor's Context */}
                          {report.doctorThoughtContext && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                Doctor's Clinical Reasoning
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                                "{report.doctorThoughtContext}"
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* Action Buttons */}
                      <motion.div className="flex items-center justify-between pt-4 border-t mt-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyReport(report)}
                            className="flex items-center gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="flex items-center gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Preview
                      </p>
                      <motion.div
                        className={`max-h-[4.5rem] overflow-hidden text-gray-700 dark:text-gray-200 ${previewMarkdownClass}`}
                      >
                        <ClinicalMarkdown className={previewMarkdownClass}>
                          {getReportPreviewMarkdown(report)}
                        </ClinicalMarkdown>
                      </motion.div>
                      <motion.div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                          {report.reportContent?.report_type || report.reportContent?.type || reportType}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Click to expand for full report
                        </span>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Continue Conversation Button */}
      {reports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reports.length * 0.1 + 0.3 }}
          className="flex justify-center pt-6"
        >
          <Button
            onClick={handleContinue}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Continue Conversation
          </Button>
        </motion.div>
      )}
    </div>
  );
}

