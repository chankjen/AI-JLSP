import crypto from 'crypto';
import db from '../db';
import { DPAConsentRecord, DPIARecord } from '../../../shared';

export async function getUserConsents(userId: string): Promise<DPAConsentRecord[]> {
  const result = await db.query(
    `SELECT id, user_id, user_email, consent_type, consent_given, consent_timestamp, consent_version,
      consent_expiry, withdrawn_at, withdrawal_reason, consent_method, consent_proof, ip_address,
      user_agent, recorded_by
     FROM dpa_consent_records
     WHERE user_id = $1
     ORDER BY consent_timestamp DESC`,
    [userId]
  );

  return result.rows;
}

export async function recordConsent(params: {
  userId: string;
  userEmail: string;
  consentType: DPAConsentRecord['consentType'];
  consentMethod: DPAConsentRecord['consentMethod'];
  consentVersion: string;
  ipAddress: string;
  userAgent: string;
}) {
  const consentHash = crypto
    .createHash('sha256')
    .update(`${params.userId}|${params.consentType}|${params.consentVersion}|${params.consentMethod}|${new Date().toISOString()}`)
    .digest('hex');

  const result = await db.query(
    `INSERT INTO dpa_consent_records (
       user_id,
       user_email,
       consent_type,
       consent_given,
       consent_timestamp,
       consent_version,
       consent_expiry,
       consent_method,
       consent_proof,
       ip_address,
       user_agent,
       recorded_by
     ) VALUES ($1,$2,$3,$4,NOW(),$5,NOW() + INTERVAL '7 years',$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      params.userId,
      params.userEmail,
      params.consentType,
      true,
      params.consentVersion,
      params.consentMethod,
      consentHash,
      params.ipAddress,
      params.userAgent,
      params.userId
    ]
  );

  return result.rows[0];
}

export async function withdrawConsent(userId: string, consentId: string, reason: string) {
  const result = await db.query(
    `UPDATE dpa_consent_records
     SET withdrawn_at = NOW(), withdrawal_reason = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [reason, consentId, userId]
  );

  return result.rows[0];
}

export async function exportUserData(userId: string, format: 'json' | 'csv' = 'json') {
  const userResult = await db.query(
    `SELECT id, email, first_name, last_name, role, department, phone_number, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  const auditResult = await db.query(
    `SELECT id, action, status, module, resource_type, resource_id, timestamp
     FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1000`,
    [userId]
  );

  const consentResult = await db.query(
    `SELECT id, consent_type, consent_given, consent_timestamp, withdrawn_at, withdrawal_reason
     FROM dpa_consent_records WHERE user_id = $1 ORDER BY consent_timestamp DESC`,
    [userId]
  );

  const exportData = {
    user: userResult.rows[0] || null,
    auditTrail: auditResult.rows,
    consentRecords: consentResult.rows
  };

  if (format === 'csv') {
    const headers = ['section', 'key', 'value'];
    const rows = [] as string[];

    if (exportData.user) {
      for (const [key, value] of Object.entries(exportData.user)) {
        rows.push(`user,${key},"${String(value).replace(/"/g, '""')}"`);
      }
    }

    exportData.auditTrail.forEach((entry) => {
      rows.push(`audit,${entry.id},"${entry.action} ${entry.status} ${entry.module}"`);
    });

    exportData.consentRecords.forEach((consent) => {
      rows.push(`consent,${consent.id},"${consent.consent_type} ${consent.consent_given}"`);
    });

    return headers.join(',') + '\n' + rows.join('\n');
  }

  return exportData;
}

export async function softDeleteCase(userId: string, caseId: string) {
  const result = await db.query(
    `UPDATE cases
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND created_by = $2
     RETURNING id, case_number, deleted_at`,
    [caseId, userId]
  );

  return result.rows[0];
}

export async function createDPIARecord(params: {
  createdBy: string;
  title: string;
  description: string;
  dataCategories: string[];
  riskLevel: DPIARecord['riskLevel'];
  measuresTaken: string[];
  mitigationScore: number;
  findings: string;
  approved: boolean;
  approvedBy?: string;
}) {
  const result = await db.query(
    `INSERT INTO dpia_records (
      created_by,
      title,
      description,
      data_categories,
      risk_level,
      measures_taken,
      mitigation_score,
      findings,
      approved,
      approved_by,
      approved_at,
      retention_until,
      created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $9 THEN NOW() ELSE NULL END, NOW() + INTERVAL '7 years', NOW())
    RETURNING *`,
    [
      params.createdBy,
      params.title,
      params.description,
      params.dataCategories,
      params.riskLevel,
      params.measuresTaken,
      params.mitigationScore,
      params.findings,
      params.approved,
      params.approvedBy || null
    ]
  );

  return result.rows[0];
}

export async function getDPIARecords() {
  const result = await db.query(
    `SELECT id, title, description, risk_level, mitigation_score, approved, approved_by, approved_at, retention_until, created_at
     FROM dpia_records
     ORDER BY created_at DESC`);

  return result.rows;
}
export async function detectUnusualAccess(userId: string) {
  try {
    // 1. Check for multiple failed login attempts
    const failedAuth = await db.query(
      `SELECT count(*) FROM audit_logs 
       WHERE user_id = $1 AND action = 'login' AND status = 'failure'
       AND timestamp > NOW() - INTERVAL '30 minutes'`,
      [userId]
    );

    // 2. Check for unusual volume of sensitive data access
    const massAccess = await db.query(
      `SELECT count(*) FROM audit_logs 
       WHERE user_id = $1 AND action = 'read' AND resource_type = 'case'
       AND timestamp > NOW() - INTERVAL '1 hour'`,
      [userId]
    );

    const isSuspicious = parseInt(failedAuth.rows[0].count) > 5 || parseInt(massAccess.rows[0].count) > 50;

    if (isSuspicious) {
      // Log suspected breach (DPA Sec 43)
      await db.query(
        `INSERT INTO breach_notifications (
          nature_of_breach, severity_level, status, detected_at, metadata
        ) VALUES ($1, $2, $3, NOW(), $4)`,
        [
          'Suspicious access pattern detected for user ' + userId,
          'high',
          'detected',
          JSON.stringify({ userId, failedAuth: failedAuth.rows[0].count, massAccess: massAccess.rows[0].count })
        ]
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Breach detection error:', error);
    return false;
  }
}
