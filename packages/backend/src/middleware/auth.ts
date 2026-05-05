import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload } from '../../../shared/types/rbac';

const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('JWT verification failed', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
