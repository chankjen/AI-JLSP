import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { provideCitizenGuidance, translateToSwahili } from '../services/aiValidationService';

const router = Router();

// Get guidance (Citizen bot)
router.post('/guidance', async (req: AuthRequest, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const guidanceResult = await provideCitizenGuidance(query);

    return res.status(200).json(guidanceResult);
  } catch (error) {
    console.error('Error providing guidance:', error);
    return res.status(500).json({ error: 'Unable to provide guidance' });
  }
});

// Translate text (Multi-lingual support)
router.post('/translate', async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const translationResult = await translateToSwahili(text);

    return res.status(200).json(translationResult);
  } catch (error) {
    console.error('Error translating text:', error);
    return res.status(500).json({ error: 'Unable to translate text' });
  }
});

export default router;
