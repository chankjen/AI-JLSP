import { Router } from 'express';
import Joi from 'joi';
import { AuthService } from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { findUserById, getUserProfile } from '../services/userService';

const router = Router();
const authService = new AuthService();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const validation = loginSchema.validate(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error.message });
  }

  try {
    const { email, password } = validation.value;
    const user = await authService.validateCredentials(email, password);
    const tokens = await authService.generateTokens(user);
    const profile = await getUserProfile(user.id);
    return res.status(200).json({ user: profile, tokens });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
});

router.post('/refresh', async (req, res) => {
  const validation = refreshSchema.validate(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error.message });
  }

  try {
    const { refreshToken } = validation.value;
    const userId = authService.verifyRefreshToken(refreshToken);
    const userRecord = await findUserById(userId);

    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = await authService.generateTokens(userRecord);
    const profile = await getUserProfile(userRecord.id);

    return res.status(200).json({ user: profile, tokens });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const profile = await getUserProfile(req.user.sub);
    return res.status(200).json({ user: profile });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to retrieve profile' });
  }
});

export default router;
