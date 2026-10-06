import express from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import clubRoutes, { membershipRouter } from './clubRoutes.js';
import eventRoutes, {
  eventRegistrationRouter,
  activityRouter,
  scheduleRouter,
} from './eventRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import gamificationRoutes from './gamificationRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import collegeRoutes, { publicCollegeRouter } from './collegeRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

// Primary API Endpoints
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/clubs', clubRoutes);
router.use('/memberships', membershipRouter);
router.use('/events', eventRoutes);
router.use('/event-registrations', eventRegistrationRouter);
router.use('/activities', activityRouter);
router.use('/activity-schedules', scheduleRouter);
router.use('/attendance', attendanceRoutes);
router.use('/attendance-sessions', attendanceRoutes);
router.use('/attendance-records', attendanceRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/', gamificationRoutes); // for /leaderboard, /verify-certificate, /certificates
router.use('/announcements', communicationRoutes);
router.use('/colleges', collegeRoutes);
router.use('/public-colleges', publicCollegeRouter);
router.use('/reports', reportRoutes);

export default router;

