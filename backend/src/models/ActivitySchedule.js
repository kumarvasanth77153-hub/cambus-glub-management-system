import mongoose from 'mongoose';

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'CUSTOM',
];

const activityScheduleSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
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
    day_of_week: {
      type: String,
      enum: DAYS_OF_WEEK,
      default: 'CUSTOM',
    },
    custom_date: {
      type: Date,
      default: null,
    },
    start_time: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
    },
    end_time: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
    },
    venue: {
      type: String,
      default: 'Club Room / Campus Ground',
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

export const ActivitySchedule = mongoose.model('ActivitySchedule', activityScheduleSchema);
