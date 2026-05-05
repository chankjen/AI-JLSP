import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import db from '../db';
import { logAuditEntry, verifyAuditChain } from '../services/auditService';
import {
  createDPIARecord,
  exportUserData,
  getDPIARecords,
  getUserConsents,
  recordConsent,
  softDeleteCase,
  withdrawConsent
} from '../services/complianceService';
import { sendBreachNotification } from '../services/notificationService';

const router = Router();

const requireUser = (req: AuthRequest, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

// Get compliance dashboard
router.get('/dashboard', requireUser, checkPermission('view_compliance'), async (req: AuthRequest, res) => {
  try {
    const scoreResult = await db.query(`SELECT ROUND(AVG(compliance_score)::numeric, 1) as avg_score FROM compliance_audit`);
    const alertsResult = await db.query(
      `SELECT id, severity, title, description, created_at FROM compliance_alerts
       WHERE resolved_at IS NULL
       ORDER BY created_at DESC
       LIMIT 10`
    );
    const auditsResult = await db.query(
      `SELECT id, audit_type, status, created_at FROM compliance_audit
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      complianceScore: scoreResult.rows[0]?.avg_score || 0,
      activeAlerts: alertsResult.rows.length,
      recentAudits: auditsResult.rows,
      dpaIssues: 0
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    return res.status(500).json({ error: 'Unable to fetch compliance data' });
  }
});

// Get current user consent records
router.get('/consents', requireUser, async (req: AuthRequest, res) => {
  try {
    const consents = await getUserConsents(req.user!.sub);
    return res.status(200).json({ consents });
  } catch (error) {
    console.error('Error fetching consent records:', error);
    return res.status(500).json({ error: 'Unable to fetch consent records' });
  }
});

// Record explicit consent
router.post('/consents', requireUser, async (req: AuthRequest, res) => {
  try {
    const { consentType, consentVersion, consentMethod } = req.body;
    const consent = await recordConsent({
      userId: req.user!.sub,
      userEmail: req.user!.email,
      consentType,
      consentVersion,
      consentMethod,
      ipAddress: typeof req.ip === 'string' ? req.ip : 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'create',
      status: 'success',
      module: 'audit',
      resourceType: 'consent',
      resourceId: consent.id,
      details: {
        consentType,
        consentVersion,
        consentMethod
      },
      consentId: consent.id,
      consentVerified: true,
      severityLevel: 'low'
    });

    return res.status(201).json({ consent });
  } catch (error) {
    console.error('Error recording consent:', error);
    return res.status(500).json({ error: 'Unable to record consent' });
  }
});

// Withdraw consent
router.patch('/consents/:id/withdraw', requireUser, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const consent = await withdrawConsent(req.user!.sub, req.params.id, reason);

    if (!consent) {
      return res.status(404).json({ error: 'Consent record not found' });
    }

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'update',
      status: 'success',
      module: 'audit',
      resourceType: 'consent',
      resourceId: consent.id,
      details: { withdrawalReason: reason },
      consentId: consent.id,
      consentVerified: false,
      severityLevel: 'medium'
    });

    return res.status(200).json({ consent });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    return res.status(500).json({ error: 'Unable to withdraw consent' });
  }
});

// Export own data for portability
router.get('/export-my-data', requireUser, async (req: AuthRequest, res) => {
  try {
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
    const exportData = await exportUserData(req.user!.sub, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user!.sub}.csv"`);
      return res.status(200).send(exportData as string);
    }

    return res.status(200).json({ exportData });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({ error: 'Unable to export user data' });
  }
});

// Soft-delete a case under right to be forgotten
router.delete('/my-data/cases/:caseId', requireUser, async (req: AuthRequest, res) => {
  try {
    const deletion = await softDeleteCase(req.user!.sub, req.params.caseId);

    if (!deletion) {
      return res.status(404).json({ error: 'Case not found or not owned by user' });
    }

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'delete',
      status: 'success',
      module: 'case_management',
      resourceType: 'case',
      resourceId: deletion.id,
      details: { deletedAt: deletion.deleted_at },
      severityLevel: 'high'
    });

    return res.status(200).json({ message: 'Case soft-deleted', deletedCase: deletion });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return res.status(500).json({ error: 'Unable to delete user data' });
  }
});

// Trigger compliance audit
router.post('/audit/trigger', requireUser, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    const { auditType, scope } = req.body;
    const result = await db.query(
      `INSERT INTO compliance_audit (audit_type, scope, status, initiated_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, audit_type, status, created_at`,
      [auditType, scope, 'pending', req.user!.sub]
    );

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'create',
      status: 'success',
      module: 'audit',
      resourceType: 'audit_log',
      resourceId: result.rows[0].id,
      details: { auditType, scope },
      severityLevel: 'medium'
    });

    return res.status(201).json({ message: 'Compliance audit initiated', audit: result.rows[0] });
  } catch (error) {
    console.error('Error initiating audit:', error);
    return res.status(500).json({ error: 'Unable to initiate audit' });
  }
});

// Get audit trail
router.get('/audit-trail', requireUser, checkPermission('view_compliance'), async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, action, performed_by, resource_id, timestamp, status FROM audit_logs
       ORDER BY timestamp DESC
       LIMIT 100`
    );

    return res.status(200).json({ auditTrail: result.rows });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return res.status(500).json({ error: 'Unable to fetch audit trail' });
  }
});

// Verify immutable audit chain
router.get('/audit/verify', requireUser, checkPermission('view_compliance'), async (_req: AuthRequest, res) => {
  try {
    const report = await verifyAuditChain();
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error verifying audit chain:', error);
    return res.status(500).json({ error: 'Unable to verify audit chain' });
  }
});

// Get DPIA records
router.get('/dpia', requireUser, checkPermission('view_compliance'), async (_req: AuthRequest, res) => {
  try {
    const dpiaRecords = await getDPIARecords();
    return res.status(200).json({ dpiaRecords });
  } catch (error) {
    console.error('Error fetching DPIA records:', error);
    return res.status(500).json({ error: 'Unable to fetch DPIA records' });
  }
});

// Create DPIA record
router.post('/dpia', requireUser, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    const { title, description, dataCategories, riskLevel, measuresTaken, mitigationScore, findings, approved, approvedBy } = req.body;
    const dpia = await createDPIARecord({
      createdBy: req.user!.sub,
      title,
      description,
      dataCategories,
      riskLevel,
      measuresTaken,
      mitigationScore,
      findings,
      approved,
      approvedBy
    });

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'create',
      status: 'success',
      module: 'audit',
      resourceType: 'dpia',
      resourceId: dpia.id,
      details: { title, riskLevel, approved },
      dpiaId: dpia.id,
      severityLevel: riskLevel === 'high' || riskLevel === 'critical' ? 'high' : 'medium'
    });

    return res.status(201).json({ dpia });
  } catch (error) {
    console.error('Error creating DPIA record:', error);
    return res.status(500).json({ error: 'Unable to create DPIA record' });
  }
});

// Get compliance alerts
router.get('/alerts', requireUser, checkPermission('view_compliance'), async (_req: AuthRequest, res) => {
  try {
    const result = await db.query(
      `SELECT id, severity, title, description, created_at, resolved_at FROM compliance_alerts
       ORDER BY severity DESC, created_at DESC`
    );

    return res.status(200).json({ alerts: result.rows });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ error: 'Unable to fetch alerts' });
  }
});

// Resolve alert
router.post('/alerts/:id/resolve', requireUser, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    const { resolution } = req.body;
    const result = await db.query(
      `UPDATE compliance_alerts SET resolved_at = NOW(), resolution = $1, resolved_by = $2
       WHERE id = $3
       RETURNING *`,
      [resolution, req.user!.sub, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'update',
      status: 'success',
      module: 'audit',
      resourceType: 'audit_log',
      resourceId: result.rows[0].id,
      details: { resolution },
      severityLevel: 'medium'
    });

    return res.status(200).json({ message: 'Alert resolved successfully', alert: result.rows[0] });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return res.status(500).json({ error: 'Unable to resolve alert' });
  }
});

// Get DPA breach notification workflow
router.post('/breach-notification', requireUser, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    const { breachDetails, affectedRecords, affectedPersonEmail, organizationName, contactEmail, contactPhone } = req.body;
    const notificationId = `BREACH-${Date.now()}`;

    const result = await db.query(
      `INSERT INTO dpa_breach_notifications (notification_id, breach_details, affected_records, status, reported_at, reported_by, organization_name, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
       RETURNING id, notification_id, status, reported_at`,
      [notificationId, JSON.stringify(breachDetails), affectedRecords, 'notified', req.user!.sub, organizationName, contactEmail, contactPhone]
    );

    const notificationResult = await sendBreachNotification({
      breachDate: new Date(),
      numberOfAffected: affectedRecords,
      natureOfBreach: typeof breachDetails === 'string' ? breachDetails : JSON.stringify(breachDetails),
      affectedPersonEmail,
      organizationName,
      contactEmail,
      contactPhone
    });

    await logAuditEntry({
      userId: req.user!.sub,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: 'breach_notification',
      status: 'success',
      module: 'audit',
      resourceType: 'breach',
      resourceId: result.rows[0].id,
      details: { affectedRecords, notificationId, notificationResult },
      severityLevel: 'critical'
    });

    return res.status(201).json({
      message: 'DPA breach notification sent to ODPC',
      notification: result.rows[0],
      odpcNotified: true,
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error notifying breach:', error);
    return res.status(500).json({ error: 'Unable to process breach notification' });
  }
});

export default router;
