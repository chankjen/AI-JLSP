import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';
import { findUserByEmail, findUserById, UserRecord } from './userService';
import { AuthToken, JWTPayload, UserRole } from '../../../shared/types/rbac';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '86400';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '604800';

export class AuthService {
  async validateCredentials(email: string, password: string): Promise<UserRecord> {
    const user = await findUserByEmail(email);
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    const valid = await compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async hashPassword(plainPassword: string): Promise<string> {
    return hash(plainPassword, 12);
  }

  async generateTokens(user: UserRecord): Promise<AuthToken> {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      iat: now,
      exp: now + parseInt(JWT_EXPIRY, 10),
      mfaVerified: !user.mfa_enabled
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: parseInt(JWT_EXPIRY, 10)
    });

    const refreshToken = jwt.sign(
      { sub: user.id, token_type: 'refresh' },
      JWT_SECRET,
      {
        algorithm: JWT_ALGORITHM,
        expiresIn: parseInt(JWT_REFRESH_EXPIRY, 10)
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(JWT_EXPIRY, 10),
      tokenType: 'Bearer'
    };
  }

  verifyToken(token: string): JWTPayload {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    }) as JWTPayload;
    return payload;
  }

  verifyRefreshToken(token: string): string {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM]
    }) as { sub: string; token_type?: string };
    if (payload.token_type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return payload.sub;
  }

  async loadUserFromToken(token: string) {
    const payload = this.verifyToken(token);
    return findUserById(payload.sub);
  }
}
