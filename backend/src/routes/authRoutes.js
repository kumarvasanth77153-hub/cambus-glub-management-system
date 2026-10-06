import express from 'express';
import {
  register,
  login,
  googleLogin,
  refreshToken,
  getCurrentUser,
  logout,
} from '../controllers/authController.js';
import {
  getStudentDashboard,
  getStudentDirectory,
  getStudentPortfolio,
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public Authentication
router.post('/register', register);
router.post('/register/', register);
router.post('/login', login);
router.post('/login/', login);
router.post('/google', googleLogin);
router.post('/google/', googleLogin);
router.post('/refresh', refreshToken);
router.post('/refresh/', refreshToken);
router.post('/logout', logout);
router.post('/logout/', logout);

// Authenticated Endpoints
router.get('/me', authenticate, getCurrentUser);
router.get('/me/', authenticate, getCurrentUser);

// Backward-compatible endpoints matching previous client routes
router.get('/student-dashboard', authenticate, getStudentDashboard);
router.get('/student-dashboard/', authenticate, getStudentDashboard);
router.get('/students', authenticate, getStudentDirectory);
router.get('/students/', authenticate, getStudentDirectory);
router.get('/students/me/portfolio', authenticate, getStudentPortfolio);
router.get('/students/me/portfolio/', authenticate, getStudentPortfolio);
router.get('/students/:studentId/portfolio', authenticate, getStudentPortfolio);
router.get('/students/:studentId/portfolio/', authenticate, getStudentPortfolio);

export default router;
