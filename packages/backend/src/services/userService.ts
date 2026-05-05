import { query } from '../db';
import { UserRole, User } from '../../../shared';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  department: string | null;
  phone_number: string | null;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  is_active: boolean;
  last_login: Date | null;
  consent_given: boolean;
  consent_timestamp: Date | null;
  consent_version: string | null;
}

function normalizeUser(record: any): User {
  return {
    id: record.id,
    email: record.email,
    firstName: record.first_name,
    lastName: record.last_name,
    role: record.role,
    department: record.department || undefined,
    phoneNumber: record.phone_number || undefined,
    mfaEnabled: record.mfa_enabled,
    mfaSecret: record.mfa_secret || undefined,
    isActive: record.is_active,
    lastLogin: record.last_login,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    consentGiven: record.consent_given,
    consentTimestamp: record.consent_timestamp,
    consentVersion: record.consent_version || undefined
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await query(
    `SELECT id, email, password_hash, first_name, last_name, role, department, phone_number, mfa_enabled, mfa_secret, is_active, last_login, consent_given, consent_timestamp, consent_version, created_at, updated_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.toLowerCase()]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await query(
    `SELECT id, email, password_hash, first_name, last_name, role, department, phone_number, mfa_enabled, mfa_secret, is_active, last_login, consent_given, consent_timestamp, consent_version, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function getUserProfile(id: string): Promise<User> {
  const userRecord = await findUserById(id);
  if (!userRecord) {
    throw new Error('User not found');
  }
  return normalizeUser(userRecord);
}
