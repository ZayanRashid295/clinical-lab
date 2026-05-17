/**
 * Service to parse the Plan section of a SOAP note and extract test names
 */

export interface ParsedPlan {
  allTests: string[];
  diagnosticTests: string[];
  treatments: string[];
  followUp: string[];
}

export class SoapPlanParserService {
  /**
   * Extract test names from the Plan section of a SOAP note
   */
  parseTestsFromPlan(soapNote: string): string[] {
    try {
      // Extract the Plan section
      const planSection = this.extractPlanSection(soapNote);
      if (!planSection) {
        return [];
      }

      // Extract test names from the plan section
      const tests = this.extractTestNames(planSection);

      return tests;
    } catch (error) {
      console.error('❌ [PLAN PARSER] Error parsing SOAP note:', error);
      return [];
    }
  }

  /**
   * Parse the full Plan section into categories
   */
  parseFullPlan(soapNote: string): ParsedPlan {
    const planSection = this.extractPlanSection(soapNote);
    if (!planSection) {
      return {
        allTests: [],
        diagnosticTests: [],
        treatments: [],
        followUp: []
      };
    }

    return {
      allTests: this.extractTestNames(planSection),
      diagnosticTests: this.extractDiagnosticTests(planSection),
      treatments: this.extractTreatments(planSection),
      followUp: this.extractFollowUp(planSection)
    };
  }

  private extractPlanSection(soapNote: string): string | null {
    // Try multiple patterns to find the Plan section
    const patterns = [
      /\*\*PLAN:\*\*([\s\S]*?)(?=\*\*[A-Z]+:|$)/i,
      /\*\*Plan:\*\*([\s\S]*?)(?=\*\*[A-Z]+:|$)/i,
      /PLAN:([\s\S]*?)(?=\n\n[A-Z]+:|$)/i,
      /Plan:([\s\S]*?)(?=\n\n[A-Z]+:|$)/i,
    ];

    for (const pattern of patterns) {
      const match = soapNote.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractTestNames(planText: string): string[] {
    const tests: string[] = [];
    
    // Common medical test patterns
    const testPatterns = [
      // Specific test names (case-insensitive)
      /\b(ECG|EKG|Electrocardiogram)\b/gi,
      /\b(Chest X-?Ray|CXR)\b/gi,
      /\b(CT Scan|Computed Tomography|CAT Scan)\b/gi,
      /\b(MRI|Magnetic Resonance Imaging)\b/gi,
      /\b(Ultrasound|Sonography|Echo)\b/gi,
      /\b(Complete Blood Count|CBC)\b/gi,
      /\b(Comprehensive Metabolic Panel|CMP|Basic Metabolic Panel|BMP)\b/gi,
      /\b(Lipid Profile|Lipid Panel|Cholesterol Panel)\b/gi,
      /\b(Liver Function Test|LFT|Hepatic Panel)\b/gi,
      /\b(Renal Function Test|RFT|Kidney Function)\b/gi,
      /\b(Thyroid Function Test|TFT|Thyroid Panel)\b/gi,
      /\b(Urinalysis|UA|Urine Analysis)\b/gi,
      /\b(Blood Glucose|Fasting Glucose|Random Glucose)\b/gi,
      /\b(HbA1c|Hemoglobin A1c|Glycated Hemoglobin)\b/gi,
      /\b(Troponin|Cardiac Enzymes|Cardiac Markers)\b/gi,
      /\b(D-Dimer)\b/gi,
      /\b(Prothrombin Time|PT|INR)\b/gi,
      /\b(Partial Thromboplastin Time|PTT|aPTT)\b/gi,
      /\b(Stool Analysis|Stool Test|Fecal Test)\b/gi,
      /\b(Blood Culture|Culture and Sensitivity)\b/gi,
      /\b(Sputum Culture|Sputum Test)\b/gi,
      /\b(Arterial Blood Gas|ABG)\b/gi,
      /\b(Pulmonary Function Test|PFT|Spirometry)\b/gi,
      /\b(Stress Test|Exercise Tolerance Test|ETT)\b/gi,
      /\b(Echocardiogram|2D Echo)\b/gi,
      /\b(Colonoscopy|Endoscopy|Gastroscopy)\b/gi,
      /\b(Mammography|Mammogram)\b/gi,
      /\b(Bone Density|DEXA Scan)\b/gi,
      /\b(PSA|Prostate-Specific Antigen)\b/gi,
      /\b(Pregnancy Test|hCG|Beta-hCG)\b/gi,
      /\b(HIV Test|HIV Screening)\b/gi,
      /\b(Hepatitis Panel|Hepatitis Screening)\b/gi,
      /\b(Vitamin [BD]|Vitamin B12)\b/gi,
      /\b(Serum Electrolytes|Electrolyte Panel)\b/gi,
      /\b(Coagulation Profile|Clotting Profile)\b/gi,
      /\b(C-Reactive Protein|CRP)\b/gi,
      /\b(Erythrocyte Sedimentation Rate|ESR)\b/gi,
    ];

    // Normalize test names
    const testNormalizations: Record<string, string> = {
      'ekg': 'ECG',
      'electrocardiogram': 'ECG',
      'chest x-ray': 'Chest X-Ray',
      'cxr': 'Chest X-Ray',
      'ct scan': 'CT Scan',
      'cat scan': 'CT Scan',
      'computed tomography': 'CT Scan',
      'mri': 'MRI',
      'magnetic resonance imaging': 'MRI',
      'ultrasound': 'Ultrasound',
      'sonography': 'Ultrasound',
      'echo': 'Echocardiogram',
      'cbc': 'Complete Blood Count',
      'complete blood count': 'Complete Blood Count',
      'cmp': 'Comprehensive Metabolic Panel',
      'bmp': 'Basic Metabolic Panel',
      'comprehensive metabolic panel': 'Comprehensive Metabolic Panel',
      'basic metabolic panel': 'Basic Metabolic Panel',
      'lipid profile': 'Lipid Profile',
      'lipid panel': 'Lipid Profile',
      'cholesterol panel': 'Lipid Profile',
      'lft': 'Liver Function Test',
      'liver function test': 'Liver Function Test',
      'hepatic panel': 'Liver Function Test',
      'rft': 'Renal Function Test',
      'renal function test': 'Renal Function Test',
      'kidney function': 'Renal Function Test',
      'tft': 'Thyroid Function Test',
      'thyroid function test': 'Thyroid Function Test',
      'thyroid panel': 'Thyroid Function Test',
      'ua': 'Urinalysis',
      'urinalysis': 'Urinalysis',
      'urine analysis': 'Urinalysis',
      'hba1c': 'HbA1c',
      'hemoglobin a1c': 'HbA1c',
      'glycated hemoglobin': 'HbA1c',
      'troponin': 'Troponin',
      'cardiac enzymes': 'Troponin',
      'cardiac markers': 'Troponin',
      'd-dimer': 'D-Dimer',
      'abg': 'Arterial Blood Gas',
      'arterial blood gas': 'Arterial Blood Gas',
      'pft': 'Pulmonary Function Test',
      'pulmonary function test': 'Pulmonary Function Test',
      'spirometry': 'Pulmonary Function Test',
      '2d echo': 'Echocardiogram',
      'echocardiogram': 'Echocardiogram',
      'crp': 'C-Reactive Protein',
      'c-reactive protein': 'C-Reactive Protein',
      'esr': 'Erythrocyte Sedimentation Rate',
      'erythrocyte sedimentation rate': 'Erythrocyte Sedimentation Rate',
    };

    // Extract tests using patterns
    const foundTests = new Set<string>();
    
    for (const pattern of testPatterns) {
      const matches = planText.matchAll(pattern);
      for (const match of matches) {
        const testName = match[0].toLowerCase().trim();
        const normalized = testNormalizations[testName] || this.capitalizeTestName(match[0]);
        foundTests.add(normalized);
      }
    }

    return Array.from(foundTests);
  }

  private extractDiagnosticTests(planText: string): string[] {
    // Extract lines that mention diagnostic tests
    const lines = planText.split('\n');
    const diagnosticLines = lines.filter(line => 
      /test|scan|x-ray|imaging|lab|blood|urine|screen/i.test(line)
    );
    
    return diagnosticLines.map(line => line.replace(/^[-*\s]+/, '').trim());
  }

  private extractTreatments(planText: string): string[] {
    const lines = planText.split('\n');
    const treatmentLines = lines.filter(line => 
      /medication|prescribe|treatment|therapy|drug|dose/i.test(line) &&
      !/test|scan|x-ray|imaging|lab/i.test(line)
    );
    
    return treatmentLines.map(line => line.replace(/^[-*\s]+/, '').trim());
  }

  private extractFollowUp(planText: string): string[] {
    const lines = planText.split('\n');
    const followUpLines = lines.filter(line => 
      /follow.?up|return|revisit|appointment|monitor/i.test(line)
    );
    
    return followUpLines.map(line => line.replace(/^[-*\s]+/, '').trim());
  }

  private capitalizeTestName(testName: string): string {
    // Simple capitalization for test names
    return testName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const soapPlanParserService = new SoapPlanParserService();



