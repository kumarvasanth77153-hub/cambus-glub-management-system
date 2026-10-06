import express from 'express';
import {
  createSession,
  scanQR,
  getSessions,
  getRecords,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

// Session endpoints
router.post('/sessions', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), createSession);
router.post('/sessions/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), createSession);
router.get('/sessions', getSessions);
router.get('/sessions/', getSessions);

// QR Scan endpoints
router.post('/scan', requireRole('STUDENT'), scanQR);
router.post('/scan/', requireRole('STUDENT'), scanQR);
router.post('/scan_qr', requireRole('STUDENT'), scanQR);
router.post('/scan_qr/', requireRole('STUDENT'), scanQR);

// Records
router.get('/records', getRecords);
router.get('/records/', getRecords);

export default router;
