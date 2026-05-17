"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  User, 
  X,
  Scan,
  TestTube,
  Heart,
  Microscope,
  Stethoscope,
  Plus
} from "lucide-react";
import { ReportTypeSelectionModal } from "./report-type-selection-modal";
import { MedicalReportModal } from "./medical-report-modal";
import { useShadowModeStore, Report as ShadowModeReport } from "@/lib/medprep-shadow/shadowModeStore";

// Extended Report interface for this component's needs
interface Report extends ShadowModeReport {
  id?: string;
  reportType?: string;
  patientInfo?: any;
}

interface ReportManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateNew: (reportType: string) => void;
  medicalReport: any;
  isGeneratingReport: boolean;
  patientInfo: any;
  caseId?: string;
}

const reportTypeIcons: { [key: string]: React.ReactNode } = {
  radiology: <Scan className="h-4 w-4" />,
  laboratory: <TestTube className="h-4 w-4" />,
  cardiology: <Heart className="h-4 w-4" />,
  pathology: <Microscope className="h-4 w-4" />,
  clinical: <Stethoscope className="h-4 w-4" />,
};

const reportTypeColors: { [key: string]: string } = {
  radiology: "bg-blue-50 border-blue-200 text-blue-800",
  laboratory: "bg-green-50 border-green-200 text-green-800",
  cardiology: "bg-red-50 border-red-200 text-red-800",
  pathology: "bg-purple-50 border-purple-200 text-purple-800",
  clinical: "bg-yellow-50 border-yellow-200 text-yellow-800",
};

export const ReportManagementModal: React.FC<ReportManagementModalProps> = ({
  isOpen,
  onClose,
  onGenerateNew,
  medicalReport,
  isGeneratingReport,
  patientInfo,
  caseId,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  
  // Get reports from shadow mode store
  const { getAllReports } = useShadowModeStore();

  // Load reports from shadow mode store on component mount
  useEffect(() => {
    if (caseId) {
      const shadowModeReports = getAllReports();
      // Transform shadow mode reports to include id and reportType if missing
      const transformedReports = shadowModeReports.map((report: ShadowModeReport) => ({
        ...report,
        id: report.id || `report-${report.timestamp}`,
        reportType: report.type,
        patientInfo: report.patientInfo || patientInfo
      }));
      setReports(transformedReports);
    }
  }, [caseId, getAllReports, patientInfo]);

  // No need to save to localStorage - reports are managed by shadow mode store

  // Add new report when medicalReport changes
  useEffect(() => {
    if (medicalReport && !isGeneratingReport) {
      const newReport: Report = {
        id: `report-${Date.now()}`,
        type: medicalReport.report_type || medicalReport.type || "Clinical Summary",
        reportType: medicalReport.report_type || medicalReport.type || "Clinical Summary",
        summary: medicalReport.summary || medicalReport.findings || 'Report generated',
        fullReport: medicalReport.fullReport || medicalReport.raw_content,
        findings: medicalReport.findings || medicalReport.summary || 'No findings available',
        impression: medicalReport.impression || medicalReport.summary || 'No impression available',
        recommendations: medicalReport.recommendations || 'Follow-up as clinically indicated',
        timestamp: medicalReport.generated_at || medicalReport.timestamp || new Date().toISOString(),
        patientInfo: patientInfo,
      };
      
      setReports(prev => [newReport, ...prev]);
    }
  }, [medicalReport, isGeneratingReport, patientInfo]);

  const handleGenerateNew = () => {
    setShowTypeSelection(true);
  };

  const handleReportTypeSelected = (reportType: string) => {
    setShowTypeSelection(false);
    onGenerateNew(reportType);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportViewer(true);
  };

  const handleDownloadReport = (report: Report) => {
    const reportType = report.reportType || report.type || "Clinical Summary";
    const reportText = `
${reportType} Report
Generated: ${new Date(report.timestamp).toLocaleString()}
Patient: ${report.patientInfo?.name || "Unknown"}

FINDINGS:
${report.findings || "No findings available"}

IMPRESSION:
${report.impression || "No impression available"}

RECOMMENDATIONS:
${report.recommendations || "Follow-up as clinically indicated"}
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, "-")}-report-${new Date(report.timestamp).toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getReportPreview = (report: Report) => {
    const findings = report.findings || report.summary || "";
    return findings.length > 100 ? findings.substring(0, 100) + "..." : findings;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Management
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Generate New Report Button */}
            <div className="mb-4">
              <Button
                onClick={handleGenerateNew}
                disabled={isGeneratingReport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isGeneratingReport ? "Generating Report..." : "Generate New Report"}
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3">Previous Reports</h3>
              
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-sm">Generate your first report to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const reportType = report.reportType || "Clinical Summary";
                    const reportTypeLower = reportType.toLowerCase();
                    
                    return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {reportTypeIcons[reportTypeLower] || <FileText className="h-4 w-4" />}
                            <div>
                              <CardTitle className="text-base">
                                {reportType} Report
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(report.timestamp)}
                                <User className="h-3 w-3 ml-2" />
                                {report.patientInfo?.name || "Unknown Patient"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={reportTypeColors[reportTypeLower] || "bg-gray-100"}
                            >
                              {reportType}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewReport(report)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {getReportPreview(report)}
                        </p>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Type Selection Modal */}
      <ReportTypeSelectionModal
        isOpen={showTypeSelection}
        onClose={() => setShowTypeSelection(false)}
        onSelectReportType={handleReportTypeSelected}
        isGenerating={isGeneratingReport}
      />

      {/* Report Viewer Modal */}
      {selectedReport && (
        <MedicalReportModal
          isOpen={showReportViewer}
          onClose={() => {
            setShowReportViewer(false);
            setSelectedReport(null);
          }}
          report={{
            report_type: selectedReport.reportType || selectedReport.type || "Clinical Summary",
            patient_name:
              (selectedReport.patientInfo as { name?: string } | undefined)?.name ||
              (patientInfo as { name?: string } | undefined)?.name ||
              "Patient",
            age:
              (selectedReport.patientInfo as { age?: string | number } | undefined)?.age ??
              (patientInfo as { age?: string | number } | undefined)?.age ??
              "—",
            gender:
              (selectedReport.patientInfo as { gender?: string } | undefined)?.gender ||
              (patientInfo as { gender?: string } | undefined)?.gender ||
              "—",
            findings: selectedReport.findings || selectedReport.summary || "",
            impression: selectedReport.impression || "",
            recommendations: selectedReport.recommendations || "",
            generated_at: selectedReport.timestamp || new Date().toISOString(),
            raw_content:
              selectedReport.fullReport ||
              selectedReport.reportContent ||
              selectedReport.summary ||
              selectedReport.findings ||
              "",
            summary: selectedReport.summary,
            fullReport: selectedReport.fullReport,
          }}
          reportType={selectedReport.reportType || selectedReport.type || "Clinical Summary"}
          onResumeConversation={() => {
            setShowReportViewer(false);
            setSelectedReport(null);
            onClose();
          }}
        />
      )}
    </>
  );
};
