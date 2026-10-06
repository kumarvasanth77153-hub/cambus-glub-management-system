import express from 'express';
import {
  getStudentDashboard,
  getStudentPortfolio,
  getStudentDirectory,
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/me/dashboard', getStudentDashboard);
router.get('/me/portfolio', getStudentPortfolio);
router.get('/:studentId/portfolio', getStudentPortfolio);
router.get('/', getStudentDirectory);

export default router;
