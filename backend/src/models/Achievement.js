import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
      default: null,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    points: {
      type: Number,
      default: 50,
    },
    awarded_date: {
      type: Date,
      default: Date.now,
    },
    badge_icon: {
      type: String,
      default: 'Trophy',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.date = ret.awarded_date;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Achievement = mongoose.model('Achievement', achievementSchema);
