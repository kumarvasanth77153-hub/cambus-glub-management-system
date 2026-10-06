import mongoose from 'mongoose';
import { StudentProfile } from './StudentProfile.js';

const pointTransactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
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
        ret.date = ret.created_at;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

pointTransactionSchema.post('save', async function (doc) {
  try {
    await StudentProfile.findOneAndUpdate(
      { user: doc.student },
      { $inc: { total_points: doc.points } }
    );
  } catch (err) {
    console.error('Error updating StudentProfile total_points:', err);
  }
});

export const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);
