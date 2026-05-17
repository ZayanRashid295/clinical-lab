/**
 * Service to generate multiple medical test reports in parallel
 */

export interface ReportGenerationResult {
  success: boolean;
  testType: string;
  report?: any;
  error?: string;
}

export interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
  percentage: number;
}

export class ParallelReportGenerationService {
  /**
   * Generate multiple reports in parallel using the existing generate-report API
   */
  async generateReportsFromTests(
    testNames: string[],
    patientInfo: any,
    conversation: any[],
    doctorThoughts: any[],
    differentialDiagnosis: any[],
    soapNote: string,
    currentCase: any,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ReportGenerationResult[]> {
    try {
      if (testNames.length === 0) {
        return [];
      }

      const total = testNames.length;
      let completed = 0;

      // Generate all reports in parallel
      const reportPromises = testNames.map(async (testType) => {
        try {
          const response = await fetch('/api/learning/generate-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requestedReports: [testType],
              currentCase: currentCase,
              patientInfo: patientInfo,
              doctorThought: doctorThoughts?.[doctorThoughts.length - 1]?.thought || '',
              conversationContext: conversation,
              soapNote: soapNote,
              differentialDiagnosis: differentialDiagnosis
            }),
          });

          completed++;
          if (onProgress) {
            onProgress({
              total,
              completed,
              current: testType,
              percentage: (completed / total) * 100
            });
          }

          if (!response.ok) {
            throw new Error(`Failed to generate ${testType} report`);
          }

          const data = await response.json();
          
          if (data.success && data.reports && data.reports.length > 0) {
            return {
              success: true,
              testType: testType,
              report: data.reports[0]
            };
          } else {
            throw new Error(`No report data received for ${testType}`);
          }
        } catch (error) {
          console.error(`❌ [PARALLEL REPORTS] Error generating ${testType}:`, error);
          completed++;
          if (onProgress) {
            onProgress({
              total,
              completed,
              current: testType,
              percentage: (completed / total) * 100
            });
          }
          
          return {
            success: false,
            testType: testType,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      // Wait for all reports to complete
      const results = await Promise.all(reportPromises);
      
      return results;
    } catch (error) {
      console.error('❌ [PARALLEL REPORTS] Fatal error in parallel generation:', error);
      return [];
    }
  }

  /**
   * Legacy method for backward compatibility with existing code
   */
  async generateReports(
    detectedTests: Array<{ type: string; category?: string; confidence?: number }>,
    patientInfo: any,
    conversation: any[],
    currentDoctorThought: string,
    caseId: string,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ReportGenerationResult[]> {
    const testNames = detectedTests.map(test => test.type);
    
    return this.generateReportsFromTests(
      testNames,
      patientInfo,
      conversation,
      [{ thought: currentDoctorThought }],
      [],
      '',
      { id: caseId },
      onProgress
    );
  }
}

export const parallelReportGenerationService = new ParallelReportGenerationService();



