"use client";

import React, { useState, useEffect } from 'react';
import { useShadowModeStore, ReplayState, type Report } from '@/lib/medprep-shadow/shadowModeStore';
import type { DifferentialDiagnosisItem } from '@/lib/medprep-shadow/services/differential-diagnosis.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  FileText,
  Brain,
  Stethoscope,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Lightbulb,
  ClipboardList,
  Pill,
  FlaskConical,
  X,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ReplayModeInterfaceProps {
  onExitReplay: () => void;
}

export default function ReplayModeInterface({ onExitReplay }: ReplayModeInterfaceProps) {
  const {
    replayStates,
    currentReplayStep,
    isReplayMode,
    nextReplayState,
    prevReplayState,
    getCurrentReplayState,
    getCurrentStateReports,
    getFilteredReplayStates,
    exitReplayMode,
    sessionPhase,
    getInitialSessionData,
    getFollowUpSessionData
  } = useShadowModeStore();
  
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const AUTO_PLAY_MS = 5000;
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [selectedSession, setSelectedSession] = useState<'initial' | 'follow-up'>('initial');

  // Get both session data
  const initialSessionData = getInitialSessionData?.()
  const followUpSessionData = getFollowUpSessionData?.()
  const hasFollowUp = !!followUpSessionData;

  // Get filtered replay states based on current mode
  const filteredReplayStates = getFilteredReplayStates();

  const currentState = getCurrentReplayState();
  const currentReports = getCurrentStateReports();
  const canGoBack = currentReplayStep > 0;
  const canGoForward = currentReplayStep < filteredReplayStates.length - 1;

  // Auto-play: advance every 5s after each step change
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (!canGoForward) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      nextReplayState();
    }, AUTO_PLAY_MS);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentReplayStep, canGoForward, nextReplayState]);

  const handleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleExitReplay = () => {
    exitReplayMode();
    onExitReplay();
  };

  const toggleReportExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  // Reset expanded reports when changing states
  useEffect(() => {
    setExpandedReports(new Set());
  }, [currentReplayStep]);

  const getStateIcon = (state: ReplayState) => {
    switch (state.type) {
      case 'doctor-turn':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'patient-turn':
        return <User className="w-5 h-5 text-green-600" />;
      case 'reports-generated':
        return <FileText className="w-5 h-5 text-gray-600" />;
      case 'soap-note':
        return <ClipboardList className="w-5 h-5 text-purple-600" />;
      case 'prescription':
        return <Pill className="w-5 h-5 text-pink-600" />;
      case 'report':
        return <FlaskConical className="w-5 h-5 text-indigo-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStateColor = (state: ReplayState) => {
    switch (state.type) {
      case 'doctor-turn':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'patient-turn':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reports-generated':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'soap-note':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'prescription':
        return 'bg-pink-50 border-pink-200 text-pink-800';
      case 'report':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStateTitle = (state: ReplayState) => {
    switch (state.type) {
      case 'doctor-turn':
        return 'Doctor Turn';
      case 'patient-turn':
        return 'Patient Turn';
      case 'reports-generated':
        return 'Reports Generated';
      case 'soap-note':
        return 'SOAP Note';
      case 'prescription':
        return 'Patient Prescription';
      case 'report':
        return `Test Report: ${state.reportType || 'Medical Test'}`;
      default:
        return 'Unknown State';
    }
  };

  if (!isReplayMode || !currentState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No replay states available</p>
          <Button onClick={handleExitReplay} className="mt-4">
            Exit Replay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Phase Toggle - Only show if follow-up session exists */}
      {hasFollowUp && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Consultation Session View</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between initial and follow-up consultations</p>
                </div>
              </div>
              
              {/* Session Toggle Slider */}
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setSelectedSession('initial')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedSession === 'initial'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Initial Consultation
                  </div>
                </button>
                <button
                  onClick={() => setSelectedSession('follow-up')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedSession === 'follow-up'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Follow-Up Consultation
                  </div>
                </button>
              </div>
            </div>
            
            {/* Session Summary Info */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Initial Consultation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <MessageCircle className="w-3 h-3" />
                    {initialSessionData?.conversation.length || 0} messages
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FlaskConical className="w-3 h-3" />
                    {initialSessionData?.reports.length || 0} reports
                  </div>
                </div>
              </div>
              
              {followUpSessionData && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Follow-Up Consultation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MessageCircle className="w-3 h-3" />
                      {followUpSessionData.conversation.length} messages
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FlaskConical className="w-3 h-3" />
                      {followUpSessionData.reports.length} reports
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    
      {/* Header with navigation controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedSession === 'follow-up' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600'
              }`}>
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {selectedSession === 'follow-up' ? 'Follow-Up Session Replay' : 'Initial Session Replay'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  State {currentReplayStep + 1} of {filteredReplayStates.length}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitReplay}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Replay
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevReplayState}
                disabled={!canGoBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextReplayState}
                disabled={!canGoForward}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isAutoPlaying ? "default" : "outline"}
                size="sm"
                onClick={handleAutoPlay}
                disabled={!canGoForward}
                className="flex items-center gap-2"
              >
                {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAutoPlaying ? 'Pause' : 'Auto Play'}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentReplayStep + 1) / filteredReplayStates.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current State Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentState.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStateIcon(currentState)}
                <div>
                  <CardTitle className="text-lg">
                    {getStateTitle(currentState)}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    State {currentState.stateNumber} • {new Date(currentState.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Doctor Turn State - shows Question + Thought + Differential Diagnosis */}
              {currentState.type === 'doctor-turn' && (
                <>
                  {/* Doctor Question */}
                  {currentState.doctorQuestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Doctor's Question</h4>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200">{currentState.doctorQuestion}</p>
                    </div>
                  )}

                  {/* Doctor Thought */}
                  {currentState.doctorThought && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">Doctor's Clinical Reasoning</h4>
                      </div>
                      <p className="text-purple-800 dark:text-purple-200 italic">{currentState.doctorThought}</p>
                    </div>
                  )}

                  {/* Doctor Differential Diagnosis */}
                  {currentState.doctorDifferentialDiagnosis && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-600" />
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100">Doctor's Differential Diagnosis</h4>
                      </div>
                      <div className="space-y-1">
                        {currentState.doctorDifferentialDiagnosis.map((diagnosis: DifferentialDiagnosisItem, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {diagnosis.probability}%
                            </Badge>
                            <span className="text-sm text-orange-700 dark:text-orange-300">
                              {diagnosis.condition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Patient Turn State - shows Response + Post-Response Differential Diagnosis */}
              {currentState.type === 'patient-turn' && (
                <>
                  {/* Patient Response */}
                  {currentState.patientResponse && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-green-600" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Patient's Response</h4>
                      </div>
                      <p className="text-green-800 dark:text-green-200">{currentState.patientResponse}</p>
                    </div>
                  )}

                  {/* Post-Response Differential Diagnosis */}
                  {currentState.postResponseDifferentialDiagnosis && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-600" />
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100">Updated Differential Diagnosis</h4>
                      </div>
                      <div className="space-y-1">
                        {currentState.postResponseDifferentialDiagnosis.map((diagnosis: DifferentialDiagnosisItem, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {diagnosis.probability}%
                            </Badge>
                            <span className="text-sm text-orange-700 dark:text-orange-300">
                              {diagnosis.condition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Reports Generated State */}
              {currentState.type === 'reports-generated' && currentReports.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Reports Generated ({currentReports.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {currentReports.map((report: Report, index: number) => {
                      const reportId = `${report.type}-${report.timestamp}-${index}`;
                      const isExpanded = expandedReports.has(reportId);
                      
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                          {/* Report Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                                {report.type}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {new Date(report.timestamp).toLocaleTimeString()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {report.summary}
                            </p>
                            
                            {/* Expand/Collapse Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleReportExpanded(reportId)}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Collapse Report
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  View Full Report
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Expanded Report Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-gray-200 dark:border-gray-700"
                              >
                                <ScrollArea className="max-h-96">
                                  <div className="p-4 space-y-4">
                                    {/* Clinical Findings */}
                                    {report.findings && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-blue-600" />
                                          Clinical Findings
                                        </h5>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                          <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>
                                              {report.findings}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Clinical Impression */}
                                    {report.impression && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                          Clinical Impression
                                        </h5>
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                                          <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>
                                              {report.impression}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Recommendations */}
                                    {report.recommendations && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                          <Lightbulb className="w-4 h-4 text-amber-600" />
                                          Recommendations
                                        </h5>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                                          <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>
                                              {report.recommendations}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SOAP Note State */}
              {currentState.type === 'soap-note' && currentState.soapNote && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-lg">
                      SOAP Note (Subjective, Objective, Assessment, Plan)
                    </h4>
                  </div>
                  <ScrollArea className="max-h-[600px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white dark:bg-gray-800 rounded-lg p-4">
                      <ReactMarkdown>
                        {currentState.soapNote}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Prescription State */}
              {currentState.type === 'prescription' && currentState.prescription && (
                <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="w-5 h-5 text-pink-600" />
                    <h4 className="font-semibold text-pink-900 dark:text-pink-100 text-lg">
                      Patient Prescription
                    </h4>
                  </div>
                  <ScrollArea className="max-h-[600px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white dark:bg-gray-800 rounded-lg p-4">
                      <ReactMarkdown>
                        {currentState.prescription}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Individual Report State (Final Reports from SOAP Plan) */}
              {currentState.type === 'report' && currentState.reportContent && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg">
                      {currentState.reportType || 'Medical Test Report'}
                    </h4>
                  </div>
                  <ScrollArea className="max-h-[600px]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                      {/* If we have a report in the reports array, show structured view */}
                      {currentReports.length > 0 && currentReports[0].findings && (
                        <>
                          {/* Clinical Findings */}
                          <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              Clinical Findings
                            </h5>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>
                                  {currentReports[0].findings}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>

                          {/* Clinical Impression */}
                          {currentReports[0].impression && (
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                Clinical Impression
                              </h5>
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>
                                    {currentReports[0].impression}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {currentReports[0].recommendations && (
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                Recommendations
                              </h5>
                              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>
                                    {currentReports[0].recommendations}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Fallback to reportContent if no structured report */}
                      {(!currentReports.length || !currentReports[0].findings) && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>
                            {currentState.reportContent}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
