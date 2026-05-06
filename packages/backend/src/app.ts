import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import casesRoutes from './routes/cases';
import researchRoutes from './routes/research';
import tdrRoutes from './routes/tdr';
import conveyancingRoutes from './routes/conveyancing';
import boardRoutes from './routes/board';
import complianceRoutes from './routes/compliance';
import adminRoutes from './routes/admin';
import documentsRoutes from './routes/documents';
import portalRoutes from './routes/portal';
import signatureRoutes from './routes/signatures';
import commissioningRoutes from './routes/commissioning';
import profileRoutes from './routes/profile';
import { authenticateToken } from './middleware/auth';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(',') ?? '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => {
  return res.status(200).json({ status: 'ok', service: 'AI-JLSP Backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/cases', authenticateToken, casesRoutes);
app.use('/api/research', authenticateToken, researchRoutes);
app.use('/api/tdr', authenticateToken, tdrRoutes);
app.use('/api/conveyancing', authenticateToken, conveyancingRoutes);
app.use('/api/board', authenticateToken, boardRoutes);
app.use('/api/compliance', authenticateToken, complianceRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/documents', authenticateToken, documentsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/signatures', authenticateToken, signatureRoutes);
app.use('/api/commissioning', authenticateToken, commissioningRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(port, () => {
  console.log(`AI-JLSP backend running on http://localhost:${port}`);
});
