import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'COLLEGE_ANNOUNCEMENT',
  'CLUB_ANNOUNCEMENT',
  'EVENT_REMINDER',
  'ACTIVITY_REMINDER',
  'CERTIFICATE',
  'ACHIEVEMENT',
  'SYSTEM',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means broadcast to college/club
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'CLUB_ANNOUNCEMENT',
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.message = ret.message || ret.content;
        ret.content = ret.content || ret.message;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Backward compatibility alias: Announcement model points to same schema
export const Notification = mongoose.model('Notification', notificationSchema);
export const Announcement = Notification;
