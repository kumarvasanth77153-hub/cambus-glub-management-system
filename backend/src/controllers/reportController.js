import { User } from '../models/User.js';
import { Club } from '../models/Club.js';
import { Event } from '../models/Event.js';

export const getCollegeReport = async (req, res, next) => {
  try {
    const user = req.user;
    const collegeId = user.college?._id || user.college;

    const totalStudents = await User.countDocuments({
      college: collegeId,
      role: 'STUDENT',
    });

    const totalClubs = await Club.countDocuments({
      college: collegeId,
    });

    const totalEvents = await Event.countDocuments({
      college: collegeId,
    });

    return res.status(200).json([
      {
        total_students: totalStudents,
        total_clubs: totalClubs,
        total_events: totalEvents,
      },
    ]);
  } catch (error) {
    next(error);
  }
};
