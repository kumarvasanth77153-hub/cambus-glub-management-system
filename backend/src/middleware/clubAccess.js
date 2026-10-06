import { Club } from '../models/Club.js';

export const checkClubAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // PLATFORM_ADMIN and COLLEGE_ADMIN have oversight over their college's clubs
  if (['PLATFORM_ADMIN', 'COLLEGE_ADMIN'].includes(req.user.role)) {
    return next();
  }

  // For CLUB_ADMIN and FACULTY_COORDINATOR, ensure they manage/coordinate this club
  const clubId = req.params.clubId || req.params.id || req.body.clubId || req.body.club;
  if (!clubId) {
    return next();
  }

  try {
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const userIdStr = req.user._id.toString();
    const isAdmin = club.admins && club.admins.some(a => a.toString() === userIdStr);
    const isCoordinator = club.coordinators && club.coordinators.some(c => c.toString() === userIdStr);

    if (req.user.role === 'CLUB_ADMIN' && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: You are not an admin of this club.' });
    }

    if (['FACULTY', 'FACULTY_COORDINATOR'].includes(req.user.role) && !isCoordinator) {
      return res.status(403).json({ error: 'Forbidden: You do not coordinate this club.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking club access: ' + error.message });
  }
};
