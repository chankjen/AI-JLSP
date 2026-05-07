import { Router } from 'express';
import { chatbotQuery, analyzeChatbotFile } from '../services/aiValidationService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/chatbot/query', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { query, context } = req.body;
    const result = await chatbotQuery(query, context);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chatbot route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/chatbot/analyze-file', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { file_content, file_type, metadata } = req.body;
    const result = await analyzeChatbotFile(file_content, file_type, metadata);
    return res.status(200).json(result);
  } catch (error) {
    console.error('File analysis route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
