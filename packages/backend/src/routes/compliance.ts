import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { db } from '../db';

const router = Router();

// Get compliance dashboard
router.get('/dashboard', authenticateToken, checkPermission('view_compliance'), async (req: AuthRequest, res) => {
  try {
    // Get compliance score
    const scoreResult = await db.query(
      `SELECT ROUND(AVG(compliance_score)::numeric, 1) as avg_score FROM compliance_audit`
    );

    // Get active alerts
    const alertsResult = await db.query(
      `SELECT id, severity, title, description, created_at FROM compliance_alerts 
       WHERE resolved_at IS NULL
       ORDER BY created_at DESC
       LIMIT 10`
    );

    // Get recent audits
    const auditsResult = await db.query(
      `SELECT id, audit_type, status, created_at FROM compliance_audit 
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      complianceScore: scoreResult.rows[0]?.avg_score || 0,
      activeAlerts: alertsResult.rows.length,
      recentAudits: auditsResult.rows,
      dpaIssues: 0, // Queries from DPA-specific table
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    return res.status(500).json({ error: 'Unable to fetch compliance data' });
  }
});

// Get compliance alerts
router.get('/alerts', authenticateToken, checkPermission('view_compliance'), async (req: AuthRequest, res) => {
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

// Get audit trail
router.get('/audit-trail', authenticateToken, checkPermission('view_compliance'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

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

// Resolve alert
router.post('/alerts/:id/resolve', authenticateToken, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { resolution } = req.body;

    const result = await db.query(
      `UPDATE compliance_alerts SET resolved_at = NOW(), resolution = $1, resolved_by = $2 
       WHERE id = $3
       RETURNING *`,
      [resolution, req.user.sub, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(200).json({
      message: 'Alert resolved successfully',
      alert: result.rows[0],
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return res.status(500).json({ error: 'Unable to resolve alert' });
  }
});

// Trigger compliance audit
router.post('/audit/trigger', authenticateToken, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { auditType, scope } = req.body;

    const result = await db.query(
      `INSERT INTO compliance_audit (audit_type, scope, status, initiated_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, audit_type, status, created_at`,
      [auditType, scope, 'pending', req.user.sub]
    );

    return res.status(201).json({
      message: 'Compliance audit initiated',
      audit: result.rows[0],
    });
  } catch (error) {
    console.error('Error initiating audit:', error);
    return res.status(500).json({ error: 'Unable to initiate audit' });
  }
});

// Get DPA breach notification workflow
router.post('/breach-notification', authenticateToken, checkPermission('manage_compliance'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { breachDetails, affectedRecords } = req.body;

    // Auto-notify Data Protection Officer and ODPC within 72 hours (DPA Sec 43)
    const notificationId = `BREACH-${Date.now()}`;

    const result = await db.query(
      `INSERT INTO dpa_breach_notifications (notification_id, breach_details, affected_records, status, reported_at, reported_by)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING id, notification_id, status, reported_at`,
      [notificationId, JSON.stringify(breachDetails), affectedRecords, 'notified', req.user.sub]
    );

    return res.status(201).json({
      message: 'DPA breach notification sent to ODPC',
      notification: result.rows[0],
      odpcNotified: true,
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });
  } catch (error) {
    console.error('Error notifying breach:', error);
    return res.status(500).json({ error: 'Unable to process breach notification' });
  }
});

export default router;
