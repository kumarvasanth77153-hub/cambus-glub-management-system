import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { User } from '../models/User.js';
import { createClubSchema, assignAdminSchema } from '../validators/clubValidator.js';
import { cacheService } from '../services/cacheService.js';

export const getClubs = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'PLATFORM_ADMIN') {
      // see all
    } else if (user.role === 'CLUB_ADMIN') {
      query = { admins: user._id };
    } else if (['FACULTY', 'FACULTY_COORDINATOR'].includes(user.role)) {
      query = { coordinators: user._id };
    } else {
      query = { college: user.college, status: true };
    }

    const clubs = await Club.find(query).populate('college').populate('admins', 'name email');
    return res.status(200).json(clubs);
  } catch (error) {
    next(error);
  }
};

export const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('college')
      .populate('admins', 'name email')
      .populate('coordinators', 'name email');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    return res.status(200).json(club);
  } catch (error) {
    next(error);
  }
};

export const createClub = async (req, res, next) => {
  try {
    const validated = createClubSchema.parse(req.body);
    const collegeId = req.user.college?._id || req.user.college;

    const club = await Club.create({
      name: validated.name.trim(),
      description: validated.description?.trim() || '',
      category: validated.category,
      college: collegeId,
      status: true,
    });

    await cacheService.delPattern('*club*');
    return res.status(201).json(club);
  } catch (error) {
    next(error);
  }
};

export const assignAdmin = async (req, res, next) => {
  try {
    const validated = assignAdminSchema.parse(req.body);
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const targetUser = await User.findOne({
      email: validated.email.toLowerCase(),
      college: club.college,
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in your college.' });
    }

    // Upgrade role to CLUB_ADMIN if student or faculty
    if (targetUser.role === 'STUDENT') {
      targetUser.role = 'CLUB_ADMIN';
      await targetUser.save();
    }

    if (!club.admins.includes(targetUser._id)) {
      club.admins.push(targetUser._id);
      await club.save();
    }

    await cacheService.delPattern('*club*');
    return res.status(200).json({ message: 'Club admin assigned successfully', club });
  } catch (error) {
    next(error);
  }
};

export const applyToClub = async (req, res, next) => {
  try {
    const student = req.user;
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const existing = await ClubMembership.findOne({ student: student._id, club: clubId });
    if (existing) {
      return res.status(400).json({ error: 'Already applied or a member of this club.' });
    }

    const membership = await ClubMembership.create({
      student: student._id,
      club: club._id,
      college: student.college,
      status: 'PENDING',
    });

    await cacheService.invalidateStudent(student._id.toString());
    return res.status(201).json(membership);
  } catch (error) {
    next(error);
  }
};

export const getMemberships = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'STUDENT') {
      query.student = user._id;
    } else if (user.role === 'CLUB_ADMIN') {
      const managedClubs = await Club.find({ admins: user._id }).select('_id');
      query.club = { $in: managedClubs };
    } else if (['FACULTY', 'FACULTY_COORDINATOR'].includes(user.role)) {
      const coordinatedClubs = await Club.find({ coordinators: user._id }).select('_id');
      query.club = { $in: coordinatedClubs };
    } else if (user.role === 'COLLEGE_ADMIN') {
      query.college = user.college;
    }

    const memberships = await ClubMembership.find(query)
      .populate('student', 'email first_name last_name name')
      .populate('club', 'name category')
      .sort({ applied_at: -1 });

    const formatted = memberships.map(m => ({
      id: m._id.toString(),
      student: m.student?._id?.toString(),
      club: m.club?._id?.toString(),
      status: m.status,
      applied_at: m.applied_at,
      joined_date: m.joined_date,
      student_details: {
        id: m.student?._id?.toString(),
        email: m.student?.email,
        name: m.student?.name || `${m.student?.first_name || ''} ${m.student?.last_name || ''}`.trim(),
      },
      club_details: {
        id: m.club?._id?.toString(),
        name: m.club?.name,
        category: m.club?.category,
      },
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const approveMembership = async (req, res, next) => {
  try {
    const membership = await ClubMembership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    membership.status = 'APPROVED';
    membership.joined_date = new Date();
    await membership.save();

    await cacheService.invalidateStudent(membership.student.toString());
    return res.status(200).json({ status: 'Approved', membership });
  } catch (error) {
    next(error);
  }
};

export const rejectMembership = async (req, res, next) => {
  try {
    const membership = await ClubMembership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    membership.status = 'REJECTED';
    await membership.save();

    await cacheService.invalidateStudent(membership.student.toString());
    return res.status(200).json({ status: 'Rejected', membership });
  } catch (error) {
    next(error);
  }
};
