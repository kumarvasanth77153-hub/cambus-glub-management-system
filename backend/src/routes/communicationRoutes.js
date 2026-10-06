import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
} from '../controllers/communicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', requireRole(['COLLEGE_ADMIN', 'CLUB_ADMIN']), createAnnouncement);

export default router;
