import mongoose from 'mongoose';

export const REGISTRATION_STATUSES = ['REGISTERED', 'CANCELLED', 'ATTENDED', 'ABSENT'];

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
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
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: 'REGISTERED',
      index: true,
    },
    registered_at: {
      type: Date,
      default: Date.now,
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

eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

export const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
