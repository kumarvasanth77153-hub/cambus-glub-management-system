import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const attendanceSessionSchema = new mongoose.Schema(
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
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    qr_token: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.qrToken = ret.qr_token;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
