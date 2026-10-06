import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Activity } from '../models/Activity.js';
import { ActivitySchedule } from '../models/ActivitySchedule.js';
import { Club } from '../models/Club.js';
import { createEventSchema } from '../validators/eventValidator.js';
import { cacheService } from '../services/cacheService.js';

export const getEvents = async (req, res, next) => {
  try {
    const user = req.user;
    const { club_id } = req.query;
    let query = {};

    if (club_id) {
      query.club = club_id;
    }

    if (user.role === 'PLATFORM_ADMIN') {
      // see all
    } else if (user.role === 'CLUB_ADMIN') {
      const managedClubs = await Club.find({ admins: user._id }).select('_id');
      query.club = { $in: managedClubs };
    } else if (['FACULTY', 'FACULTY_COORDINATOR'].includes(user.role)) {
      query.college = user.college;
    } else if (user.role === 'STUDENT') {
      query.college = user.college;
      query.approval_status = 'APPROVED';
    } else {
      query.college = user.college;
    }

    const events = await Event.find(query).populate('club', 'name category').sort({ date: 1 });
    return res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const validated = createEventSchema.parse(req.body);
    const club = await Club.findById(validated.club);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const event = await Event.create({
      club: club._id,
      college: club.college,
      title: validated.title.trim(),
      description: validated.description?.trim() || '',
      date: new Date(validated.date),
      start_time: validated.start_time,
      end_time: validated.end_time,
      venue: validated.venue || 'Campus Auditorium',
      maximum_participants: validated.maximum_participants || null,
      registration_start: validated.registration_start ? new Date(validated.registration_start) : new Date(),
      registration_end: validated.registration_end ? new Date(validated.registration_end) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      approval_status: 'PENDING',
      status: 'OPEN',
      created_by: req.user._id,
    });

    await cacheService.delPattern('*student:dashboard*');
    return res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req, res, next) => {
  try {
    const student = req.user;
    const event = await Event.findById(req.params.id).populate('club');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const now = new Date();
    if (event.registration_start && now < new Date(event.registration_start)) {
      return res.status(400).json({ error: 'Registration is not yet open.' });
    }
    if (event.registration_end && now > new Date(event.registration_end)) {
      return res.status(400).json({ error: 'Registration deadline has passed.' });
    }

    if (event.maximum_participants) {
      const regCount = await EventRegistration.countDocuments({
        event: event._id,
        status: 'REGISTERED',
      });
      if (regCount >= event.maximum_participants) {
        return res.status(400).json({ error: 'Event capacity is full.' });
      }
    }

    const existing = await EventRegistration.findOne({
      event: event._id,
      student: student._id,
    });
    if (existing) {
      return res.status(400).json({ error: 'Already registered for this event.' });
    }

    const registration = await EventRegistration.create({
      event: event._id,
      student: student._id,
      club: event.club?._id || event.club,
      college: event.college,
      status: 'REGISTERED',
    });

    await cacheService.invalidateStudent(student._id.toString());
    return res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
};

export const approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.approval_status = 'APPROVED';
    await event.save();

    await cacheService.delPattern('*student:dashboard*');
    return res.status(200).json({ status: 'Event Approved', event });
  } catch (error) {
    next(error);
  }
};

export const rejectEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.approval_status = 'REJECTED';
    await event.save();

    return res.status(200).json({ status: 'Event Rejected', event });
  } catch (error) {
    next(error);
  }
};

export const getEventRegistrations = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'STUDENT') {
      query.student = user._id;
    } else if (user.role === 'CLUB_ADMIN') {
      const managedClubs = await Club.find({ admins: user._id }).select('_id');
      query.club = { $in: managedClubs };
    } else {
      query.college = user.college;
    }

    if (req.query.event) {
      query.event = req.query.event;
    }

    const registrations = await EventRegistration.find(query)
      .populate('student', 'email first_name last_name name')
      .populate('event', 'title date start_time venue')
      .sort({ registered_at: -1 });

    const formatted = registrations.map(r => ({
      id: r._id.toString(),
      event: r.event?._id?.toString(),
      student: r.student?._id?.toString(),
      status: r.status,
      registered_at: r.registered_at,
      student_details: {
        id: r.student?._id?.toString(),
        email: r.student?.email,
        name: r.student?.name,
      },
      event_details: {
        id: r.event?._id?.toString(),
        title: r.event?.title,
        date: r.event?.date,
      },
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// Activity & Schedule Handlers
export const getActivities = async (req, res, next) => {
  try {
    const query = { college: req.user.college };
    if (req.query.club_id) query.club = req.query.club_id;
    const activities = await Activity.find(query).populate('club', 'name category');
    return res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const activity = await Activity.create({
      ...req.body,
      college: req.user.college,
      created_by: req.user._id,
    });
    return res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

export const getSchedules = async (req, res, next) => {
  try {
    const schedules = await ActivitySchedule.find({ college: req.user.college })
      .populate('activity')
      .populate('club', 'name');
    return res.status(200).json(schedules);
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const schedule = await ActivitySchedule.create({
      ...req.body,
      college: req.user.college,
    });
    await cacheService.delPattern('*student:dashboard*');
    return res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};
