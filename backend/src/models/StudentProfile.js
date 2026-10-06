import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    roll_number: {
      type: String,
      required: [true, 'Register / Roll number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year of study is required'],
      min: 1,
      max: 6,
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    total_points: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.register_number = ret.roll_number;
        ret.totalPoints = ret.total_points;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

studentProfileSchema.index({ college: 1, roll_number: 1 }, { unique: true });

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
