import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';

const router = Router();

// Get all tax dispute objections
router.get('/', authenticateToken, checkPermission('view_tdr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.query(
      `SELECT id, objection_id, taxpayer_name, status, amount_disputed, filed_date, deadline, created_by
       FROM tax_disputes
       WHERE created_by = $1 OR assigned_to = $1
       ORDER BY filed_date DESC`,
      [req.user.sub]
    );

    return res.status(200).json({ objections: result.rows });
  } catch (error) {
    console.error('Error fetching tax disputes:', error);
    return res.status(500).json({ error: 'Unable to fetch tax disputes' });
  }
});

// Get TDR details
router.get('/:id', authenticateToken, checkPermission('view_tdr'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, objection_id, taxpayer_name, tax_year, amount_disputed, status, 
              filed_date, deadline, description, assigned_to, validity_score
       FROM tax_disputes
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tax dispute not found' });
    }

    // Get documents
    const docsResult = await db.query(
      `SELECT id, name, type, uploaded_at FROM tdr_documents WHERE tax_dispute_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({
      tdr: result.rows[0],
      documents: docsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching tax dispute:', error);
    return res.status(500).json({ error: 'Unable to fetch tax dispute' });
  }
});

// Create new objection
router.post('/', authenticateToken, checkPermission('manage_tdr'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { taxpayerName, taxYear, amountDisputed, description } = req.body;

    if (!taxpayerName || !taxYear || !amountDisputed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const objectionId = `TDR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14); // 14-day filing deadline per TPA Sec 51

    const result = await db.query(
      `INSERT INTO tax_disputes (objection_id, taxpayer_name, tax_year, amount_disputed, description, status, filed_date, deadline, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
       RETURNING id, objection_id, taxpayer_name, status, filed_date`,
      [objectionId, taxpayerName, taxYear, amountDisputed, description, 'filed', deadline, req.user.sub]
    );

    return res.status(201).json({
      message: 'Tax dispute objection filed successfully',
      tdr: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating tax dispute:', error);
    return res.status(500).json({ error: 'Unable to file tax dispute' });
  }
});

import { validateTDRObjection } from '../services/aiValidationService';

// Validate objection (check TPA Sec 51 compliance)
router.post('/:id/validate', authenticateToken, checkPermission('validate_objections'), async (req: AuthRequest, res) => {
  try {
    const tdrResult = await db.query('SELECT * FROM tax_disputes WHERE id = $1', [req.params.id]);
    if (tdrResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tax dispute not found' });
    }

    const tdr = tdrResult.rows[0];

    // Integration: Fetch real-time data from iTax
    const { ExternalIntegrationService } = await import('../services/externalIntegrationService');
    const taxData = await ExternalIntegrationService.fetchTaxAssessment(tdr.objection_id);
    const paymentVerified = await ExternalIntegrationService.verifyUndisputedTaxPayment(tdr.objection_id);

    // Call AI Validation (TPA Sec 51(3))
    const validationResults = await validateTDRObjection({
      objection_grounds: tdr.description || '',
      taxpayer_type: 'individual', 
      amount: tdr.amount_disputed,
      itax_data: taxData,
      payment_verified: paymentVerified
    });

    const updateResult = await db.query(
      `UPDATE tax_disputes 
       SET status = $1, validity_score = $2, ai_rationale = $3 
       WHERE id = $4 RETURNING *`,
      [
        validationResults.is_valid ? 'under_review' : 'invalid', 
        validationResults.confidence * 100, 
        validationResults.rationale,
        req.params.id
      ]
    );

    return res.status(200).json({
      message: validationResults.is_valid ? 'Objection is valid' : 'Objection is invalid',
      tdr: updateResult.rows[0],
      validation: validationResults
    });
  } catch (error) {
    console.error('Error validating tax dispute:', error);
    return res.status(500).json({ error: 'Unable to validate tax dispute' });
  }
});

// Generate CRF (Case Registration Form)
router.post('/:id/generate-crf', authenticateToken, checkPermission('generate_crf'), async (req: AuthRequest, res) => {
  try {
    const tdr = await db.query('SELECT * FROM tax_disputes WHERE id = $1', [req.params.id]);
    if (tdr.rows.length === 0) {
      return res.status(404).json({ error: 'Tax dispute not found' });
    }

    // Generate CRF with categorization (technical vs non-technical)
    const crfData = {
      caseRegistrationFormId: `CRF-${Date.now()}`,
      category: 'technical', // or 'non-technical'
      facilitatorAssigned: null,
      status: 'pending_assignment',
    };

    const result = await db.query(
      `UPDATE tax_disputes SET status = $1 WHERE id = $2 RETURNING *`,
      ['crf_generated', req.params.id]
    );

    return res.status(200).json({
      message: 'CRF generated successfully',
      crf: crfData,
      tdr: result.rows[0],
    });
  } catch (error) {
    console.error('Error generating CRF:', error);
    return res.status(500).json({ error: 'Unable to generate CRF' });
  }
});

// Assess ADR Suitability
router.post('/:id/assess-adr', authenticateToken, checkPermission('view_tdr'), async (req: AuthRequest, res) => {
  try {
    const tdrResult = await db.query('SELECT * FROM tax_disputes WHERE id = $1', [req.params.id]);
    if (tdrResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tax dispute not found' });
    }

    const tdr = tdrResult.rows[0];

    // Assuming we have an assessADRSuitability function in aiValidationService
    const { assessADRSuitability } = await import('../services/aiValidationService');
    const adrResult = await assessADRSuitability(
      `Objection ${tdr.objection_id}`, 
      tdr.description || '', 
      tdr.amount_disputed
    );

    return res.status(200).json({
      message: 'ADR suitability assessed',
      assessment: adrResult
    });
  } catch (error) {
    console.error('Error assessing ADR suitability:', error);
    return res.status(500).json({ error: 'Unable to assess ADR suitability' });
  }
});

// Model Settlement Scenario
router.post('/:id/scenario-model', authenticateToken, checkPermission('manage_tdr'), async (req: AuthRequest, res) => {
  try {
    const { settlementPercentage } = req.body;
    if (settlementPercentage === undefined) {
      return res.status(400).json({ error: 'Missing settlementPercentage' });
    }

    const tdrResult = await db.query('SELECT * FROM tax_disputes WHERE id = $1', [req.params.id]);
    if (tdrResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tax dispute not found' });
    }

    const tdr = tdrResult.rows[0];

    const { modelSettlementScenario } = await import('../services/aiValidationService');
    const scenarioResult = await modelSettlementScenario(tdr.amount_disputed, parseFloat(settlementPercentage));

    // Integration: Report projected revenue impact to IFMIS
    const { ExternalIntegrationService } = await import('../services/externalIntegrationService');
    await ExternalIntegrationService.reportRevenueImpact(req.params.id, scenarioResult.projected_immediate_revenue);

    return res.status(200).json({
      message: 'Settlement scenario modeled and reported to IFMIS',
      scenario: scenarioResult
    });
  } catch (error) {
    console.error('Error modeling scenario:', error);
    return res.status(500).json({ error: 'Unable to model scenario' });
  }
});

export default router;
