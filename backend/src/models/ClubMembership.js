import mongoose from 'mongoose';

export const MEMBERSHIP_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'LEFT'];

const clubMembershipSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: 'PENDING',
      index: true,
    },
    joined_date: {
      type: Date,
      default: null,
    },
    applied_at: {
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

clubMembershipSchema.index({ student: 1, club: 1 }, { unique: true });

export const ClubMembership = mongoose.model('ClubMembership', clubMembershipSchema);
