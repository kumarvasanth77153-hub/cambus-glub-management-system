import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ActivitySchedule } from '../models/ActivitySchedule.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Certificate } from '../models/Certificate.js';
import { Notification } from '../models/Notification.js';
import { cacheService } from '../services/cacheService.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const student = req.user;
    const studentId = student._id.toString();

    // 1. Try Redis cache first
    const cachedDashboard = await cacheService.getStudentDashboard(studentId);
    if (cachedDashboard) {
      return res.status(200).json(cachedDashboard);
    }

    // 2. Fetch Profile & Joined Clubs
    const profile = await StudentProfile.findOne({ user: student._id });
    const memberships = await ClubMembership.find({
      student: student._id,
      status: 'APPROVED',
    }).populate('club');

    const joinedClubIds = memberships.map(m => m.club?._id || m.club).filter(Boolean);

    // 3. Calculate College Rank
    const collegeStudents = await StudentProfile.find({ college: student.college })
      .sort({ total_points: -1 })
      .select('user total_points');

    let collegeRank = '-';
    const cIndex = collegeStudents.findIndex(s => s.user.toString() === studentId);
    if (cIndex !== -1) {
      collegeRank = cIndex + 1;
    }

    // 4. Calculate Best Club Rank
    let bestClubRank = '-';
    if (joinedClubIds.length > 0) {
      const clubRanks = [];
      for (const cid of joinedClubIds) {
        const clubMemberUsers = await ClubMembership.find({ club: cid, status: 'APPROVED' }).select('student');
        const memberIds = clubMemberUsers.map(m => m.student);
        const clubStudents = await StudentProfile.find({ user: { $in: memberIds } })
          .sort({ total_points: -1 })
          .select('user');

        const rIndex = clubStudents.findIndex(s => s.user.toString() === studentId);
        if (rIndex !== -1) {
          clubRanks.push(rIndex + 1);
        }
      }
      if (clubRanks.length > 0) {
        bestClubRank = Math.min(...clubRanks);
      }
    }

    // 5. Attendance Calculation
    const totalAtt = await AttendanceRecord.countDocuments({ student: student._id });
    const presentAtt = await AttendanceRecord.countDocuments({ student: student._id, status: 'PRESENT' });
    const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

    // 6. Today's Schedule (Matching student's clubs + current day of week / date)
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[new Date().getDay()];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const schedules = await ActivitySchedule.find({
      club: { $in: joinedClubIds },
      $or: [
        { day_of_week: currentDay },
        { custom_date: { $gte: todayDate, $lt: tomorrowDate } },
      ],
    })
      .populate('activity')
      .populate('club')
      .sort({ start_time: 1 });

    const todaysSchedule = schedules.map(s => ({
      id: s._id.toString(),
      activity_name: s.activity?.title || 'Club Activity',
      club_name: s.club?.name || 'Club',
      start_time: s.start_time,
      end_time: s.end_time,
      venue: s.venue || 'Club Venue',
    }));

    // 7. Upcoming Events
    const now = new Date();
    const upcomingEventsList = await Event.find({
      club: { $in: joinedClubIds },
      date: { $gte: now },
      approval_status: 'APPROVED',
    })
      .populate('club')
      .sort({ date: 1 })
      .limit(5);

    const userRegistrations = await EventRegistration.find({
      student: student._id,
      event: { $in: upcomingEventsList.map(e => e._id) },
    }).select('event status');

    const regMap = new Map();
    userRegistrations.forEach(r => regMap.set(r.event.toString(), r.status));

    const upcomingEvents = upcomingEventsList.map(e => ({
      id: e._id.toString(),
      title: e.title,
      club_name: e.club?.name || 'Club',
      date: e.date,
      start_time: e.start_time,
      end_time: e.end_time,
      venue: e.venue,
      is_registered: regMap.has(e._id.toString()),
      registration_status: regMap.get(e._id.toString()) || 'NOT_REGISTERED',
    }));

    // 8. Notifications / Announcements
    const notificationsList = await Notification.find({
      college: student.college,
      $or: [
        { type: 'COLLEGE_ANNOUNCEMENT' },
        { club: { $in: joinedClubIds } },
        { recipient: student._id },
      ],
    })
      .populate('club')
      .sort({ created_at: -1 })
      .limit(6);

    const notifications = notificationsList.map(n => ({
      id: n._id.toString(),
      title: n.title,
      content: n.content || n.message,
      type: n.type,
      club_name: n.club?.name || null,
      created_at: n.created_at,
      is_read: n.is_read,
    }));

    // 9. Recent Certificates
    const certificatesList = await Certificate.find({ student: student._id })
      .populate('club')
      .populate('event')
      .sort({ issue_date: -1 })
      .limit(5);

    const recentCertificates = certificatesList.map(c => ({
      id: c.verification_uuid,
      type: c.type,
      club_name: c.club?.name || 'Club',
      event_title: c.event?.title || null,
      issue_date: c.issue_date,
    }));

    // 10. Activity Timeline (Merge points, certs, attendance)
    const timeline = [];

    const recentPts = await PointTransaction.find({ student: student._id })
      .sort({ created_at: -1 })
      .limit(10);
    recentPts.forEach(p => {
      timeline.push({
        id: `pt_${p._id}`,
        type: 'POINT',
        title: `Earned ${p.points} points`,
        description: p.reason,
        date: p.created_at,
      });
    });

    const recentAttRecords = await AttendanceRecord.find({ student: student._id })
      .populate({
        path: 'session',
        populate: [{ path: 'activity' }, { path: 'event' }],
      })
      .sort({ timestamp: -1 })
      .limit(10);
    recentAttRecords.forEach(a => {
      const desc =
        a.session?.activity?.title || a.session?.event?.title || 'Club Session';
      timeline.push({
        id: `att_${a._id}`,
        type: 'ATTENDANCE',
        title: `Attendance marked: ${a.status}`,
        description: desc,
        date: a.timestamp,
      });
    });

    certificatesList.forEach(c => {
      timeline.push({
        id: `cert_${c.verification_uuid}`,
        type: 'CERTIFICATE',
        title: `Certificate Issued: ${c.type}`,
        description: c.club?.name || 'Club',
        date: c.issue_date,
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    const trimmedTimeline = timeline.slice(0, 15);

    // 11. Build Final Payload
    const dashboardData = {
      profile: {
        first_name: student.first_name,
        last_name: student.last_name,
        register_number: profile?.roll_number || '-',
        department: profile?.department || '-',
        year: profile?.year || 1,
        section: profile?.section || '',
        total_points: profile?.total_points || 0,
      },
      stats: {
        total_clubs: joinedClubIds.length,
        activities_completed: totalAtt,
        events_participated: await EventRegistration.countDocuments({ student: student._id }),
        attendance_percentage: attendancePercentage,
        total_certificates: await Certificate.countDocuments({ student: student._id }),
        college_rank: collegeRank,
        club_rank: bestClubRank,
      },
      my_clubs: memberships.map(m => ({
        id: m.club?._id?.toString(),
        name: m.club?.name,
        category: m.club?.category,
        status: m.status,
      })),
      todays_schedule: todaysSchedule,
      upcoming_events: upcomingEvents,
      notifications,
      recent_certificates: recentCertificates,
      timeline: trimmedTimeline,
    };

    // Store in Redis cache for 2 minutes
    await cacheService.setStudentDashboard(studentId, dashboardData, 120);

    return res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
};

export const getStudentPortfolio = async (req, res, next) => {
  try {
    const requester = req.user;
    const targetStudentId = req.params.studentId || req.params.pk || 'me';

    let studentUser;
    if (targetStudentId === 'me') {
      studentUser = requester;
    } else {
      studentUser = await User.findById(targetStudentId).populate('college');
      if (!studentUser || studentUser.role !== 'STUDENT') {
        return res.status(404).json({ error: 'Student not found.' });
      }
    }

    // Role-based authorization & club visibility mask
    let allowedClubIds = null; // null = all clubs

    if (requester._id.toString() === studentUser._id.toString()) {
      // Student viewing own portfolio
    } else if (requester.role === 'PLATFORM_ADMIN') {
      // Platform Admin viewing any portfolio
    } else if (requester.role === 'COLLEGE_ADMIN') {
      if (requester.college?._id?.toString() !== studentUser.college?._id?.toString()) {
        return res.status(403).json({ error: 'Forbidden: Different college.' });
      }
    } else if (requester.role === 'CLUB_ADMIN') {
      if (requester.college?._id?.toString() !== studentUser.college?._id?.toString()) {
        return res.status(403).json({ error: 'Forbidden: Different college.' });
      }
      const managedClubs = await Club.find({ admins: requester._id }).select('_id');
      allowedClubIds = managedClubs.map(c => c._id.toString());

      // Verify student belongs to at least one managed club
      const hasCommonClub = await ClubMembership.exists({
        student: studentUser._id,
        club: { $in: allowedClubIds },
      });
      if (!hasCommonClub) {
        return res.status(403).json({
          error: 'Forbidden: Student is not a member of any of your managed clubs.',
        });
      }
    } else if (['FACULTY', 'FACULTY_COORDINATOR'].includes(requester.role)) {
      if (requester.college?._id?.toString() !== studentUser.college?._id?.toString()) {
        return res.status(403).json({ error: 'Forbidden: Different college.' });
      }
      const coordinatedClubs = await Club.find({ coordinators: requester._id }).select('_id');
      allowedClubIds = coordinatedClubs.map(c => c._id.toString());

      const hasCommonClub = await ClubMembership.exists({
        student: studentUser._id,
        club: { $in: allowedClubIds },
      });
      if (!hasCommonClub) {
        return res.status(403).json({
          error: 'Forbidden: Student is not in your coordinated clubs.',
        });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden role for portfolio inspection.' });
    }

    // Fetch Profile
    const profile = await StudentProfile.findOne({ user: studentUser._id });

    // Memberships
    const membershipFilter = { student: studentUser._id, status: 'APPROVED' };
    if (allowedClubIds) {
      membershipFilter.club = { $in: allowedClubIds };
    }
    const memberships = await ClubMembership.find(membershipFilter).populate('club');

    // Events
    const eventFilter = { student: studentUser._id };
    if (allowedClubIds) {
      eventFilter.club = { $in: allowedClubIds };
    }
    const registrations = await EventRegistration.find(eventFilter)
      .populate('event')
      .populate('club');

    // Certificates
    const certFilter = { student: studentUser._id };
    if (allowedClubIds) {
      certFilter.club = { $in: allowedClubIds };
    }
    const certificates = await Certificate.find(certFilter).populate('club').populate('event');

    // Attendance
    const attFilter = { student: studentUser._id };
    if (allowedClubIds) {
      attFilter.club = { $in: allowedClubIds };
    }
    const attendanceRecords = await AttendanceRecord.find(attFilter).populate('club');
    const totalAtt = attendanceRecords.length;
    const presentAtt = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const attPercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

    // Points History
    let pointsHistory = [];
    if (!allowedClubIds) {
      const points = await PointTransaction.find({ student: studentUser._id }).sort({ created_at: -1 });
      pointsHistory = points.map(p => ({
        points: p.points,
        reason: p.reason,
        date: p.created_at,
      }));
    }

    return res.status(200).json({
      profile: {
        id: studentUser._id.toString(),
        email: studentUser.email,
        first_name: studentUser.first_name,
        last_name: studentUser.last_name,
        register_number: profile?.roll_number || '',
        department: profile?.department || '',
        year: profile?.year || '',
        section: profile?.section || '',
        total_points: profile?.total_points || 0,
      },
      clubs: memberships.map(m => ({
        club_id: m.club?._id?.toString(),
        club_name: m.club?.name,
        joined_date: m.joined_date || m.applied_at,
      })),
      events: registrations.map(r => ({
        event_title: r.event?.title,
        club_name: r.club?.name,
        date: r.event?.date,
        status: r.status,
      })),
      certificates: certificates.map(c => ({
        type: c.type,
        club_name: c.club?.name,
        event_title: c.event?.title || null,
        issue_date: c.issue_date,
        verification_uuid: c.verification_uuid,
      })),
      points_history: pointsHistory,
      attendance: {
        percentage: attPercentage,
        history: attendanceRecords.map(a => ({
          status: a.status,
          timestamp: a.timestamp,
          club_name: a.club?.name || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentDirectory = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { role: 'STUDENT' };

    if (user.role === 'PLATFORM_ADMIN') {
      // all students
    } else if (user.role === 'COLLEGE_ADMIN') {
      query.college = user.college;
    } else if (user.role === 'CLUB_ADMIN') {
      const managedClubs = await Club.find({ admins: user._id }).select('_id');
      const studentIds = await ClubMembership.find({ club: { $in: managedClubs } }).distinct('student');
      query._id = { $in: studentIds };
      query.college = user.college;
    } else if (['FACULTY', 'FACULTY_COORDINATOR'].includes(user.role)) {
      const coordinatedClubs = await Club.find({ coordinators: user._id }).select('_id');
      const studentIds = await ClubMembership.find({ club: { $in: coordinatedClubs } }).distinct('student');
      query._id = { $in: studentIds };
      query.college = user.college;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const students = await User.find(query).populate('student_profile').sort({ createdAt: -1 });

    const result = students.map(u => ({
      id: u._id.toString(),
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      register_number: u.student_profile?.roll_number || '',
      department: u.student_profile?.department || '',
      year: u.student_profile?.year || '',
      total_points: u.student_profile?.total_points || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
