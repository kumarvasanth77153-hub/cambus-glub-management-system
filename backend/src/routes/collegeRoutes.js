import express from 'express';
import {
  getPublicColleges,
  getColleges,
  createCollege,
} from '../controllers/collegeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Public college list for registration dropdown
router.get('/public-colleges', getPublicColleges);
router.get('/public-colleges/', getPublicColleges);

// Authenticated college routes
router.get('/', authenticate, getColleges);
router.post('/', authenticate, requireRole('PLATFORM_ADMIN'), createCollege);

export const publicCollegeRouter = express.Router();
publicCollegeRouter.get('/', getPublicColleges);

export default router;

