import crypto from 'crypto';
import db from '../db';
import { AuditAction, AuditStatus, ResourceType } from '../../../shared';

export interface AuditEntryParams {
  userId: string;
  userRole: string;
  userEmail: string;
  action: AuditAction;
  status: AuditStatus;
  module: string;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
  consentId?: string;
  consentVerified?: boolean;
  dpiaId?: string;
  severityLevel?: 'low' | 'medium' | 'high' | 'critical';
  requiresReview?: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export async function getLastAuditHash(): Promise<string | null> {
  const result = await db.query(`
    SELECT hash_value
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 1
  `);

  return result.rows[0]?.hash_value ?? null;
}

export async function logAuditEntry(entry: AuditEntryParams) {
  const previousHash = await getLastAuditHash();
  const timestamp = new Date();
  const hashSource = JSON.stringify({
    previousHash,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    timestamp: timestamp.toISOString(),
    details: entry.details ?? {}
  });

  const hashValue = crypto.createHash('sha256').update(hashSource).digest('hex');

  const result = await db.query(
    `INSERT INTO audit_logs (
       user_id,
       user_role,
       user_email,
       action,
       status,
       module,
       resource_type,
       resource_id,
       details,
       ip_address,
       user_agent,
       session_id,
       consent_id,
       consent_verified,
       dpia_id,
       hash_value,
       previous_hash_value,
       data_residency,
       encrypted,
       encryption_key_version,
       severity_level,
       requires_review,
       reviewed_by,
       reviewed_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
     RETURNING id, hash_value, previous_hash_value, timestamp
    `,
    [
      entry.userId,
      entry.userRole,
      entry.userEmail,
      entry.action,
      entry.status,
      entry.module,
      entry.resourceType,
      entry.resourceId,
      JSON.stringify(entry.details || {}),
      entry.details?.ipAddress || 'system',
      entry.details?.userAgent || 'system',
      entry.details?.sessionId || 'system',
      entry.consentId || null,
      entry.consentVerified || false,
      entry.dpiaId || null,
      hashValue,
      previousHash,
      'KE',
      true,
      1,
      entry.severityLevel || 'low',
      entry.requiresReview || false,
      entry.reviewedBy || null,
      entry.reviewedAt || null
    ]
  );

  return result.rows[0];
}

export async function verifyAuditChain() {
  const result = await db.query(`
    SELECT id, hash_value, previous_hash_value, timestamp, user_id, action, resource_id
    FROM audit_logs
    ORDER BY timestamp ASC
  `);

  let previousHash = '';
  const issues: Array<{ id: string; expectedHash: string; actualHash: string }> = [];

  for (const row of result.rows) {
    const expectedHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          previousHash: previousHash || null,
          userId: row.user_id,
          action: row.action,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          timestamp: row.timestamp?.toISOString?.() || row.timestamp,
          details: {}
        })
      )
      .digest('hex');

    if (expectedHash !== row.hash_value) {
      issues.push({ id: row.id, expectedHash, actualHash: row.hash_value });
    }

    previousHash = row.hash_value;
  }

  return {
    valid: issues.length === 0,
    issues,
    totalEntries: result.rows.length
  };
}
