import { StudentProfile } from '../models/StudentProfile.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Certificate } from '../models/Certificate.js';
import { Achievement } from '../models/Achievement.js';
import { pdfService } from '../services/pdfService.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const collegeId = req.user.college?._id || req.user.college;
    const topStudents = await StudentProfile.find({ college: collegeId })
      .populate('user', 'email first_name last_name name')
      .sort({ total_points: -1 })
      .limit(10);

    const leaderboard = topStudents.map((p, index) => ({
      rank: index + 1,
      student_name:
        p.user?.name ||
        `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() ||
        p.user?.email ||
        'Student',
      total_points: p.total_points,
      department: p.department,
      roll_number: p.roll_number,
    }));

    return res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
};

export const getPointTransactions = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { college: user.college };
    if (user.role === 'STUDENT') {
      query.student = user._id;
    }

    const transactions = await PointTransaction.find(query)
      .populate('student', 'email name')
      .populate('club', 'name')
      .sort({ created_at: -1 });

    return res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getCertificates = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { college: user.college };
    if (user.role === 'STUDENT') {
      query.student = user._id;
    }

    const certificates = await Certificate.find(query)
      .populate('club', 'name')
      .populate('event', 'title')
      .populate('activity', 'title')
      .populate('student', 'name email first_name last_name')
      .sort({ issue_date: -1 });

    return res.status(200).json(certificates);
  } catch (error) {
    next(error);
  }
};

export const verifyCertificate = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const certificate = await Certificate.findOne({ verification_uuid: uuid })
      .populate('club', 'name category')
      .populate('college', 'name domain')
      .populate('event', 'title date')
      .populate('student', 'first_name last_name email name');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found or invalid' });
    }

    return res.status(200).json({
      valid: true,
      verification_uuid: certificate.verification_uuid,
      type: certificate.type,
      issue_date: certificate.issue_date,
      student_name:
        certificate.student?.name ||
        `${certificate.student?.first_name || ''} ${certificate.student?.last_name || ''}`.trim() ||
        certificate.student?.email,
      club_name: certificate.club?.name,
      college_name: certificate.college?.name,
      event_title: certificate.event?.title || null,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCertificatePDF = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const certificate = await Certificate.findOne({ verification_uuid: uuid })
      .populate('club')
      .populate('college')
      .populate('event')
      .populate('activity')
      .populate('student');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await pdfService.generateCertificatePDF(certificate, res);
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const user = req.user;
    const achievements = await Achievement.find({ student: user._id })
      .populate('club', 'name')
      .sort({ awarded_date: -1 });

    return res.status(200).json(achievements);
  } catch (error) {
    next(error);
  }
};
