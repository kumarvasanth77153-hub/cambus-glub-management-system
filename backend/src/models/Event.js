import mongoose from 'mongoose';

export const EVENT_APPROVAL_STATUSES = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'CANCELLED',
];

export const EVENT_STATUSES = [
  'UPCOMING',
  'OPEN',
  'FULL',
  'CLOSED',
  'COMPLETED',
  'CANCELLED',
];

const eventSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    start_time: {
      type: String,
      required: [true, 'Start time is required'],
    },
    end_time: {
      type: String,
      required: [true, 'End time is required'],
    },
    venue: {
      type: String,
      default: 'Campus Auditorium',
    },
    maximum_participants: {
      type: Number,
      default: null,
    },
    registration_start: {
      type: Date,
      default: Date.now,
    },
    registration_end: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    approval_status: {
      type: String,
      enum: EVENT_APPROVAL_STATUSES,
      default: 'PENDING',
      index: true,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'OPEN',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

eventSchema.virtual('registrations', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'event',
});

export const Event = mongoose.model('Event', eventSchema);
