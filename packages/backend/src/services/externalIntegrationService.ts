import axios from 'axios';

// Mock external URLs from TRD
const ITAX_API_URL = process.env.ITAX_API_URL || 'https://api.itax.kra.go.ke/mock';
const EKLR_API_URL = process.env.EKLR_API_URL || 'http://kenyalaw.org/mock';

export interface TaxAssessment {
  assessmentNumber: string;
  pin: string;
  taxHead: string;
  amount: number;
  undisputedAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  issueDate: string;
}

export class ExternalIntegrationService {
  /**
   * Fetches tax assessment details from iTax (Mock)
   */
  static async fetchTaxAssessment(assessmentNumber: string): Promise<TaxAssessment | null> {
    try {
      console.log(`[iTax] Fetching assessment: ${assessmentNumber}`);
      
      // Mock response for simulation
      return {
        assessmentNumber,
        pin: 'A001234567Z',
        taxHead: 'Income Tax - Individual',
        amount: 1500000.00,
        undisputedAmount: 500000.00,
        paymentStatus: 'partial',
        issueDate: new Date().toISOString()
      };
      
      // Real implementation would use:
      // const response = await axios.get(`${ITAX_API_URL}/assessments/${assessmentNumber}`);
      // return response.data;
    } catch (error) {
      console.error('Error fetching from iTax:', error);
      return null;
    }
  }

  /**
   * Verifies if undisputed tax has been paid per Sec 51(3) TPA
   */
  static async verifyUndisputedTaxPayment(assessmentNumber: string): Promise<boolean> {
    const assessment = await this.fetchTaxAssessment(assessmentNumber);
    if (!assessment) return false;
    
    // Logic: If undisputed > 0 and status is not 'paid', it might be a violation
    // But for the mock, we assume it's verified.
    return assessment.paymentStatus === 'paid' || assessment.undisputedAmount === 0;
  }

  /**
   * Syncs new legal precedents from eKLR to the AI research engine
   */
  static async syncPrecedentsFromEKLR() {
    try {
      console.log('[eKLR] Syncing latest precedents...');
      
      // Mock data fetched from eKLR
      const mockEklrData = [
        { title: 'KRA v ABC Ltd [2024]', content: 'Case regarding VAT assessment...', court: 'High Court', year: 2024, citation: '2024 eKLR 1' },
        { title: 'Republic v Commissioner [2022]', content: 'Precedent on Section 51(3)...', court: 'Supreme Court', year: 2022, citation: '2022 eKLR 56' }
      ];

      const aiServiceURL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.post(`${aiServiceURL}/api/ingest/eklr`, { records: mockEklrData });
      
      return {
        syncedCount: response.data.synced_count,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error syncing from eKLR:', error);
      throw error;
    }
  }

  /**
   * Pushes a validated case to the Judiciary E-Filing system
   */
  static async pushToJudiciaryEFiling(caseId: string, payload: any) {
    try {
      console.log(`[e-Filing] Pushing case ${caseId} to Judiciary system...`);
      
      // Mock response
      return {
        externalCaseId: `JUD-${Date.now()}`,
        status: 'received',
        filingDate: new Date()
      };
    } catch (error) {
      console.error('Error pushing to e-Filing:', error);
      throw error;
    }
  }

  /**
   * Processes status updates received from Judiciary webhooks
   */
  static async handleJudiciaryWebhook(payload: any) {
    const { externalCaseId, status, nextHearingDate } = payload;
    console.log(`[e-Filing Webhook] Updating case ${externalCaseId} to status ${status}`);
    
    // In real implementation: update DB status
    return { success: true };
  }

  /**
   * Pushes projected revenue from TDR settlements to the IFMIS dashboard
   */
  static async reportRevenueImpact(tdrId: string, amount: number) {
    try {
      console.log(`[IFMIS] Reporting revenue impact of KES ${amount} from TDR ${tdrId}`);
      return { success: true, trackingId: `IFMIS-REV-${Date.now()}` };
    } catch (error) {
      console.error('Error reporting to IFMIS:', error);
      return { success: false };
    }
  }

  /**
   * Verifies court fee payment status via G-Pay/M-Pesa
   */
  static async verifyFeePayment(referenceNumber: string): Promise<boolean> {
    try {
      console.log(`[Finance] Verifying payment for reference: ${referenceNumber}`);
      return true; // Mock: always paid
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }
}
