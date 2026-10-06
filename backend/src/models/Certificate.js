import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    type: {
      type: String,
      default: 'Participation',
    },
    verification_uuid: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    issue_date: {
      type: Date,
      default: Date.now,
    },
    file_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.verificationUuid = ret.verification_uuid;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Certificate = mongoose.model('Certificate', certificateSchema);
