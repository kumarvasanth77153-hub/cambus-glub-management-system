import { Notification } from '../models/Notification.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Club } from '../models/Club.js';
import { cacheService } from '../services/cacheService.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { college: user.college };

    if (user.role === 'STUDENT') {
      const clubIds = await ClubMembership.find({ student: user._id, status: 'APPROVED' }).distinct('club');
      query.$or = [
        { type: 'COLLEGE_ANNOUNCEMENT' },
        { club: { $in: clubIds } },
        { recipient: user._id },
      ];
    } else if (user.role === 'CLUB_ADMIN') {
      const managedClubs = await Club.find({ admins: user._id }).select('_id');
      query.$or = [
        { club: { $in: managedClubs } },
        { type: 'COLLEGE_ANNOUNCEMENT' },
      ];
    }

    const announcements = await Notification.find(query)
      .populate('club', 'name')
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    const formatted = announcements.map(a => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content || a.message,
      type: a.type,
      club: a.club?._id?.toString(),
      club_name: a.club?.name || null,
      created_at: a.created_at,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const user = req.user;
    const { title, content, message, club } = req.body;

    let announcementType = 'COLLEGE_ANNOUNCEMENT';
    let targetClub = null;

    if (user.role === 'CLUB_ADMIN' || club) {
      announcementType = 'CLUB_ANNOUNCEMENT';
      targetClub = club;
      if (!targetClub && user.role === 'CLUB_ADMIN') {
        const firstManaged = await Club.findOne({ admins: user._id });
        targetClub = firstManaged?._id;
      }
    }

    const announcement = await Notification.create({
      title: title.trim(),
      content: (content || message || '').trim(),
      message: (message || content || '').trim(),
      type: announcementType,
      college: user.college,
      club: targetClub || null,
      created_by: user._id,
    });

    await cacheService.delPattern('*student:dashboard*');
    return res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};
