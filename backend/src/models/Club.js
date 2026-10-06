import mongoose from 'mongoose';

export const CLUB_CATEGORIES = [
  'SOCIAL_SERVICE',
  'HEALTH',
  'ENVIRONMENT',
  'CULTURAL',
  'TECHNICAL',
  'SPORTS',
  'OTHER',
];

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: CLUB_CATEGORIES,
      default: 'OTHER',
    },
    status: {
      type: Boolean,
      default: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

clubSchema.index({ college: 1, name: 1 }, { unique: true });

export const Club = mongoose.model('Club', clubSchema);
