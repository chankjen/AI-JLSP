import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { suggestClauses, compliancePreCheck } from '../services/aiValidationService';

const router = Router();

// Suggest Clauses
router.post('/suggest-clauses', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { draftText, documentType } = req.body;

    if (!draftText || !documentType) {
      return res.status(400).json({ error: 'Missing draftText or documentType' });
    }

    const suggestions = await suggestClauses(draftText, documentType);

    return res.status(200).json({ suggestions: suggestions.suggestions || [] });
  } catch (error) {
    console.error('Error suggesting clauses:', error);
    return res.status(500).json({ error: 'Unable to suggest clauses' });
  }
});

// Compliance Pre-check
router.post('/compliance-check', authenticateToken, checkPermission('view_research'), async (req: AuthRequest, res) => {
  try {
    const { draftText, documentType } = req.body;

    if (!draftText || !documentType) {
      return res.status(400).json({ error: 'Missing draftText or documentType' });
    }

    const checkResult = await compliancePreCheck(draftText, documentType);

    return res.status(200).json(checkResult);
  } catch (error) {
    console.error('Error in compliance check:', error);
    return res.status(500).json({ error: 'Unable to perform compliance check' });
  }
});

export default router;
