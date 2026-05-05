import axios from 'axios';

const aiServiceURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function validateDocumentWithAI(documentPath: string, documentType: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/validate/document`, {
      documentPath,
      documentType,
    });

    return response.data;
  } catch (error) {
    console.error('AI validation error:', error);
    throw error;
  }
}

export async function checkCivilProcedureCompliance(filingData: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/validate/civil-procedure`, filingData);
    return response.data;
  } catch (error) {
    console.error('Civil procedure check error:', error);
    throw error;
  }
}

export async function validateTDRObjection(objectionData: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/validate/tdr-objection`, objectionData);
    return response.data;
  } catch (error) {
    console.error('TDR validation error:', error);
    throw error;
  }
}

export async function generateDocumentAnalysis(documentId: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/analyze/document`, { documentId });
    return response.data;
  } catch (error) {
    console.error('Document analysis error:', error);
    throw error;
  }
}

export async function predictCaseOutcome(caseData: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/predict/case-outcome`, caseData);
    return response.data;
  } catch (error) {
    console.error('Case prediction error:', error);
    throw error;
  }
}
export async function triageCase(caseData: { title: string; description: string; case_type: string }) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/triage`, caseData);
    return response.data;
  } catch (error) {
    console.error('Case triage error:', error);
    // Fallback to manual triage if AI service is down
    return {
      complexity: 'medium',
      priority: 'medium',
      assigned_division: 'General',
      rationale: 'Manual triage required (AI service unavailable)',
      confidence: 0
    };
  }
}
export async function generateBoardAgenda(meetingData: { title: string; current_agenda: any[] }) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/board/generate-agenda`, meetingData);
    return response.data;
  } catch (error) {
    console.error('Board agenda generation error:', error);
    return {
      prioritized_agenda: meetingData.current_agenda.map((item, i) => ({ priority: i + 1, item })),
      rationale: 'Manual prioritization applied (AI service unavailable)'
    };
  }
}
export async function suggestHearingDate(schedulingData: { case_type: string; filed_date: string; statutory_deadline_days: number }) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/schedule/suggest`, schedulingData);
    return response.data;
  } catch (error) {
    console.error('Scheduling suggestion error:', error);
    return {
      suggested_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alternative_dates: [],
      rationale: 'Manual scheduling required (AI service unavailable)'
    };
  }
}
export async function analyzeADRSuitability(adrData: { title: string; description: string; amount: number }) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/analyze/adr-suitability`, adrData);
    return response.data;
  } catch (error) {
    console.error('ADR analysis error:', error);
    return {
      suitability_score: 0,
      recommended_path: 'Litigation',
      rationale: 'Manual ADR assessment required (AI service unavailable)',
      confidence: 0
    };
  }
}

export async function extractMeetingMinutes(meetingNotes: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/board/extract-minutes`, { meeting_notes: meetingNotes });
    return response.data;
  } catch (error) {
    console.error('Minute extraction error:', error);
    return {
      summary: 'Manual summary required (AI service unavailable)',
      action_items: [],
      rationale: 'AI service unavailable'
    };
  }
}
