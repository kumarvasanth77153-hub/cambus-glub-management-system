import express from 'express';
import {
  getClubs,
  getClubById,
  createClub,
  assignAdmin,
  applyToClub,
  getMemberships,
  approveMembership,
  rejectMembership,
} from '../controllers/clubController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { checkClubAccess } from '../middleware/clubAccess.js';

const router = express.Router();

router.use(authenticate);

// Clubs
router.get('/', getClubs);
router.get('/:id', getClubById);
router.post('/', requireRole(['PLATFORM_ADMIN', 'COLLEGE_ADMIN']), createClub);
router.post('/:id/assign_admin', requireRole(['PLATFORM_ADMIN', 'COLLEGE_ADMIN']), assignAdmin);
router.post('/:id/assign_admin/', requireRole(['PLATFORM_ADMIN', 'COLLEGE_ADMIN']), assignAdmin);
router.post('/:id/apply', requireRole('STUDENT'), applyToClub);
router.post('/:id/apply/', requireRole('STUDENT'), applyToClub);
router.post('/:id/join', requireRole('STUDENT'), applyToClub);
router.post('/:id/join/', requireRole('STUDENT'), applyToClub);

// Memberships sub-routes on club router
export const membershipRouter = express.Router();
membershipRouter.use(authenticate);
membershipRouter.get('/', getMemberships);
membershipRouter.post('/:id/approve', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), approveMembership);
membershipRouter.post('/:id/approve/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), approveMembership);
membershipRouter.post('/:id/reject', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), rejectMembership);
membershipRouter.post('/:id/reject/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), rejectMembership);

export default router;
