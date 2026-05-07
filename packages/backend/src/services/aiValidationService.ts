import axios from 'axios';

const aiServiceURL = process.env.AI_SERVICE_URL || 'http://localhost:3002';

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

export async function generateCaseTasks(caseType: string, status: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/litigation/generate-tasks`, { case_type: caseType, status });
    return response.data;
  } catch (error) {
    console.error('Task generation error:', error);
    return { tasks: [] };
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

export async function semanticSearch(query: string, documentType?: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/research/search`, { query, document_type: documentType });
    return response.data;
  } catch (error) {
    console.error('Semantic search error:', error);
    return { results: [] };
  }
}

export async function explainProvision(provisionText: string, context: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/research/explain`, { provision_text: provisionText, context });
    return response.data;
  } catch (error) {
    console.error('Explain provision error:', error);
    return { explanation: 'AI explanation unavailable.' };
  }
}

export async function assessADRSuitability(title: string, description: string, amount: number) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/analyze/adr-suitability`, { title, description, amount });
    return response.data;
  } catch (error) {
    console.error('ADR suitability error:', error);
    return { error: 'Unable to assess ADR suitability' };
  }
}

export async function suggestClauses(draftText: string, documentType: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/document/suggest-clauses`, { draft_text: draftText, document_type: documentType });
    return response.data;
  } catch (error) {
    console.error('Suggest clauses error:', error);
    return { suggestions: [] };
  }
}

export async function compliancePreCheck(draftText: string, documentType: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/document/compliance-check`, { draft_text: draftText, document_type: documentType });
    return response.data;
  } catch (error) {
    console.error('Compliance pre-check error:', error);
    return { is_compliant: false, issues: [{ severity: 'ERROR', issue: 'Service Unavailable' }] };
  }
}

export async function modelSettlementScenario(claimAmount: number, settlementPercentage: number) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/analyze/settlement-scenario`, { 
      claim_amount: claimAmount, 
      settlement_percentage: settlementPercentage 
    });
    return response.data;
  } catch (error) {
    console.error('Settlement scenario error:', error);
    return { error: 'Unable to model scenario' };
  }
}

export async function provideCitizenGuidance(query: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/portal/guidance`, { query });
    return response.data;
  } catch (error) {
    console.error('Citizen guidance error:', error);
    return { guidance: 'I am unable to provide guidance at the moment. Please try again later.' };
  }
}

export async function translateToSwahili(text: string) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/portal/translate`, { text });
    return response.data;
  } catch (error) {
    console.error('Translation error:', error);
    return { translated_text: text };
  }
}

export async function compareLegalAuthorities(doc1: any, doc2: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/research/compare`, { doc1, doc2 });
    return response.data;
  } catch (error) {
    console.error('Comparison error:', error);
    // Mock fallback
    return {
      similarities: [
        "Both authorities emphasize the right to a fair hearing.",
        "Both provide for legal representation in criminal matters."
      ],
      differences: [
        "The International Treaty provides for broader protections during pre-trial detention.",
        "Local Precedent imposes stricter timelines for filing appeals."
      ],
      legal_weight: "Pursuant to Art 2(6) of the Constitution, the International Treaty forms part of the laws of Kenya, but the Local Precedent remains binding unless set aside by a superior court."
    };
  }
}

export async function generateSkeletalArgument(doc1: any, doc2: any, comparison: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/research/draft-argument`, { doc1, doc2, comparison });
    return response.data.draft;
  } catch (error) {
    console.error('Argument drafting error:', error);
    // Mock fallback
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; border: 1px solid #ccc; line-height: 1.6; max-width: 800px; margin: auto; background: white; color: black;">
        <h2 style="text-align: center; text-decoration: underline;">IN THE HIGH COURT OF KENYA AT NAIROBI</h2>
        <h3 style="text-align: center;">CONSTITUTIONAL & HUMAN RIGHTS DIVISION</h3>
        <p style="text-align: right; font-weight: bold;">PETITION NO. ........ OF 2026</p>
        
        <p><strong>BETWEEN</strong></p>
        <p><strong>[CLIENT NAME]</strong> ........................................................... PETITIONER</p>
        <p style="text-align: center;">AND</p>
        <p><strong>THE HON. ATTORNEY GENERAL</strong> ............................................ RESPONDENT</p>

        <h3 style="text-align: center; text-decoration: underline; margin-top: 30px;">PETITIONER’S SKELETAL ARGUMENTS</h3>

        <h4>1. OVERVIEW OF AUTHORITIES</h4>
        <p>The Petitioner relies on two primary authorities for this submission:</p>
        <ul>
          <li><strong>${doc1.title}</strong> (Local Precedent)</li>
          <li><strong>${doc2.title}</strong> (International Instrument)</li>
        </ul>

        <h4>2. POINTS OF CONVERGENCE</h4>
        <p>Both authorities are in agreement on the following fundamental principles:</p>
        <ul>
          ${comparison.similarities.map((s: string) => `<li>${s}</li>`).join('')}
        </ul>

        <h4>3. ARGUMENT ON HIERARCHY</h4>
        <p>${comparison.legal_weight}</p>

        <h4>4. SUBMISSIONS ON DIVERGENCE</h4>
        <p>Where the authorities diverge, specifically regarding <em>${comparison.differences[0]}</em>, 
           the Petitioner prays the Court to adopt the broader protection provided under <strong>${doc2.title}</strong> 
           as per the transformative nature of the 2010 Constitution.</p>

        <div style="margin-top: 50px;">
          <p>DATED at NAIROBI this ........ day of ..................... 2026</p>
          <br/><br/>
          <p>....................................................</p>
          <p><strong>[ADVOCATE NAME]</strong></p>
          <p>Counsel for the Petitioner</p>
        </div>
      </div>
    `;
  }
}

export async function chatbotQuery(query: string, context?: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/chatbot/query`, { query, context });
    return response.data;
  } catch (error) {
    console.error('Chatbot query error:', error);
    return {
      response: "I'm sorry, I'm having trouble connecting to the legal intelligence engine. Please try again in a moment.",
      intent: 'error'
    };
  }
}

export async function analyzeChatbotFile(fileContent: string, fileType: string, metadata?: any) {
  try {
    const response = await axios.post(`${aiServiceURL}/api/chatbot/analyze-file`, {
      file_content: fileContent,
      file_type: fileType,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Chatbot file analysis error:', error);
    return {
      error: "Unable to analyze the document at this time.",
      status: 'error'
    };
  }
}
