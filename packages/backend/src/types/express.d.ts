import { JWTPayload } from '../../../shared/types/rbac';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
