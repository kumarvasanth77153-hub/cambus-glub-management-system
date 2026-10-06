import express from 'express';
import {
  getLeaderboard,
  getPointTransactions,
  getCertificates,
  verifyCertificate,
  downloadCertificatePDF,
  getAchievements,
} from '../controllers/gamificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public certificate verification
router.get('/verify-certificate/:uuid', verifyCertificate);
router.get('/verify-certificate/:uuid/', verifyCertificate);
router.get('/certificates/:uuid/download', downloadCertificatePDF);

// Authenticated gamification routes
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/leaderboard/', authenticate, getLeaderboard);
router.get('/point-transactions', authenticate, getPointTransactions);
router.get('/point-transactions/', authenticate, getPointTransactions);
router.get('/certificates', authenticate, getCertificates);
router.get('/certificates/', authenticate, getCertificates);
router.get('/achievements', authenticate, getAchievements);
router.get('/achievements/', authenticate, getAchievements);

export default router;
