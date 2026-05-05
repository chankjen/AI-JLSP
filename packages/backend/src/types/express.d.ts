import { JWTPayload } from '../../../shared';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
