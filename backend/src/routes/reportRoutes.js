import express from 'express';
import { getCollegeReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole(['COLLEGE_ADMIN', 'PLATFORM_ADMIN']), getCollegeReport);

export default router;
