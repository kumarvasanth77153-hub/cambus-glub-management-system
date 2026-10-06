import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { cacheService } from '../services/cacheService.js';
import { v4 as uuidv4 } from 'uuid';

export const createSession = async (req, res, next) => {
  try {
    const { club, event, activity, valid_duration_minutes } = req.body;

    const duration = valid_duration_minutes ? parseInt(valid_duration_minutes, 10) : 120;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const session = await AttendanceSession.create({
      club,
      college: req.user.college,
      event: event || null,
      activity: activity || null,
      qr_token: uuidv4(),
      created_by: req.user._id,
      expires_at: expiresAt,
      is_active: true,
    });

    return res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const scanQR = async (req, res, next) => {
  try {
    const { qr_token, qrToken } = req.body;
    const tokenToSearch = qr_token || qrToken;

    if (!tokenToSearch) {
      return res.status(400).json({ error: 'qr_token is required' });
    }

    const session = await AttendanceSession.findOne({ qr_token: tokenToSearch })
      .populate('club')
      .populate('event')
      .populate('activity');

    if (!session) {
      return res.status(404).json({ error: 'Invalid QR Token' });
    }

    if (!session.is_active || (session.expires_at && new Date() > new Date(session.expires_at))) {
      return res.status(400).json({ error: 'Attendance session has expired' });
    }

    // Verify student is an approved member of the club
    const isMember = await ClubMembership.findOne({
      club: session.club._id,
      student: req.user._id,
      status: 'APPROVED',
    });

    if (!isMember) {
      return res.status(403).json({
        error: 'You must be an approved member of this club to mark attendance.',
      });
    }

    const [record, created] = await AttendanceRecord.findOneAndUpdate(
      {
        session: session._id,
        student: req.user._id,
      },
      {
        $setOnInsert: {
          club: session.club._id,
          college: session.college,
          status: 'PRESENT',
          timestamp: new Date(),
        },
      },
      { upsert: true, new: true, rawResult: true }
    ).then(res => [res.value, !res.lastErrorObject?.updatedExisting]);

    if (!created) {
      return res.status(200).json({ message: 'Attendance already recorded', record });
    }

    // Award +10 participation points
    const targetName = session.event?.title || session.activity?.title || session.club?.name || 'Club Session';
    await PointTransaction.create({
      student: req.user._id,
      college: req.user.college,
      club: session.club._id,
      points: 10,
      reason: `Attendance: ${targetName}`,
    });

    await cacheService.invalidateStudent(req.user._id.toString());
    return res.status(201).json({ message: 'Attendance recorded successfully (+10 points)', record });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const user = req.user;
    const sessions = await AttendanceSession.find({ college: user.college })
      .populate('club', 'name')
      .populate('event', 'title')
      .populate('activity', 'title')
      .sort({ createdAt: -1 });

    return res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};

export const getRecords = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { college: user.college };

    if (user.role === 'STUDENT') {
      query.student = user._id;
    }

    const records = await AttendanceRecord.find(query)
      .populate('session')
      .populate('student', 'email name')
      .populate('club', 'name')
      .sort({ timestamp: -1 });

    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};
