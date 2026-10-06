import express from 'express';
import {
  getEvents,
  createEvent,
  registerForEvent,
  approveEvent,
  rejectEvent,
  getEventRegistrations,
  getActivities,
  createActivity,
  getSchedules,
  createSchedule,
} from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

// Events
router.get('/', getEvents);
router.post('/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), createEvent);
router.post('/:id/register', requireRole('STUDENT'), registerForEvent);
router.post('/:id/register/', requireRole('STUDENT'), registerForEvent);
router.post('/:id/approve', requireRole(['FACULTY', 'FACULTY_COORDINATOR', 'COLLEGE_ADMIN']), approveEvent);
router.post('/:id/approve/', requireRole(['FACULTY', 'FACULTY_COORDINATOR', 'COLLEGE_ADMIN']), approveEvent);
router.post('/:id/reject', requireRole(['FACULTY', 'FACULTY_COORDINATOR', 'COLLEGE_ADMIN']), rejectEvent);
router.post('/:id/reject/', requireRole(['FACULTY', 'FACULTY_COORDINATOR', 'COLLEGE_ADMIN']), rejectEvent);

// Registrations sub-router
export const eventRegistrationRouter = express.Router();
eventRegistrationRouter.use(authenticate);
eventRegistrationRouter.get('/', getEventRegistrations);

// Activities sub-router
export const activityRouter = express.Router();
activityRouter.use(authenticate);
activityRouter.get('/', getActivities);
activityRouter.post('/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), createActivity);

// Activity Schedules sub-router
export const scheduleRouter = express.Router();
scheduleRouter.use(authenticate);
scheduleRouter.get('/', getSchedules);
scheduleRouter.post('/', requireRole(['CLUB_ADMIN', 'COLLEGE_ADMIN']), createSchedule);

export default router;
