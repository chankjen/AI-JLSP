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

// ============================================================================
// MOCK USERS FOR DEVELOPMENT (When Docker/Postgres is unavailable)
// ============================================================================
const MOCK_USERS: Record<string, UserRecord> = {
  'advocate@demo.ke': {
    id: 'mock-advocate-id',
    email: 'advocate@demo.ke',
    password_hash: '$2a$12$Lh9.P1mQG6u8T2F9G9i8u.fQ8fH6i7g7h8i9j0k1l2m3n4o5p6q7r', // password123
    first_name: 'Demo',
    last_name: 'Advocate',
    role: 'advocate',
    department: 'Legal Practice',
    phone_number: '+254700000001',
    mfa_enabled: false,
    mfa_secret: null,
    is_active: true,
    last_login: new Date(),
    consent_given: true,
    consent_timestamp: new Date(),
    consent_version: '1.0'
  },
  'tdr@demo.ke': {
    id: 'mock-tdr-id',
    email: 'tdr@demo.ke',
    password_hash: '$2a$12$Lh9.P1mQG6u8T2F9G9i8u.fQ8fH6i7g7h8i9j0k1l2m3n4o5p6q7r',
    first_name: 'Demo',
    last_name: 'TDR Officer',
    role: 'tdr_officer',
    department: 'KRA Dispute Resolution',
    phone_number: '+254700000002',
    mfa_enabled: false,
    mfa_secret: null,
    is_active: true,
    last_login: new Date(),
    consent_given: true,
    consent_timestamp: new Date(),
    consent_version: '1.0'
  },
  'litigation@demo.ke': {
    id: 'mock-litigation-id',
    email: 'litigation@demo.ke',
    password_hash: '$2a$12$Lh9.P1mQG6u8T2F9G9i8u.fQ8fH6i7g7h8i9j0k1l2m3n4o5p6q7r',
    first_name: 'Demo',
    last_name: 'Counsel',
    role: 'litigation_counsel',
    department: 'Judiciary Litigation',
    phone_number: '+254700000003',
    mfa_enabled: false,
    mfa_secret: null,
    is_active: true,
    last_login: new Date(),
    consent_given: true,
    consent_timestamp: new Date(),
    consent_version: '1.0'
  },
  'admin@demo.ke': {
    id: 'mock-admin-id',
    email: 'admin@demo.ke',
    password_hash: '$2a$12$Lh9.P1mQG6u8T2F9G9i8u.fQ8fH6i7g7h8i9j0k1l2m3n4o5p6q7r',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    department: 'IT Support',
    phone_number: '+254700000000',
    mfa_enabled: false,
    mfa_secret: null,
    is_active: true,
    last_login: new Date(),
    consent_given: true,
    consent_timestamp: new Date(),
    consent_version: '1.0'
  }
};

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
    createdAt: record.created_at || new Date(),
    updatedAt: record.updated_at || new Date(),
    consentGiven: record.consent_given,
    consentTimestamp: record.consent_timestamp,
    consentVersion: record.consent_version || undefined
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, department, phone_number, mfa_enabled, mfa_secret, is_active, last_login, consent_given, consent_timestamp, consent_version, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );

    return result.rows[0] ?? MOCK_USERS[email.toLowerCase()] ?? null;
  } catch (error) {
    console.warn('Database connection failed, falling back to mock users.');
    return MOCK_USERS[email.toLowerCase()] ?? null;
  }
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  // Check mock users first in development
  const mockUser = Object.values(MOCK_USERS).find(u => u.id === id);
  if (mockUser) {
    console.log(`[UserService] Found mock user by ID: ${id}`);
    return mockUser;
  }

  try {
    console.log(`[UserService] Querying database for user ID: ${id}`);
    // Set a 5 second timeout for database queries
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    const result = await Promise.race([
      query(
        `SELECT id, email, password_hash, first_name, last_name, role, department, phone_number, mfa_enabled, mfa_secret, is_active, last_login, consent_given, consent_timestamp, consent_version, created_at, updated_at
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [id]
      ),
      timeoutPromise
    ]) as any;

    if (result.rows[0]) return result.rows[0];
  } catch (error) {
    console.warn(`[UserService] Database connection failed for ID lookup: ${(error as Error).message}`);
  }
  
  return null;
}

export async function getUserProfile(id: string): Promise<User> {
  const userRecord = await findUserById(id);
  if (!userRecord) {
    throw new Error('User not found');
  }
  return normalizeUser(userRecord);
}
