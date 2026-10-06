import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { College } from '../models/College.js';
import { registerStudentSchema, loginSchema } from '../validators/authValidator.js';

const generateTokens = (user) => {
  const secret = process.env.JWT_SECRET || 'college_club_management_jwt_super_secret_key_2026';
  const access = jwt.sign(
    {
      id: user._id.toString(),
      user_id: user._id.toString(),
      email: user.email,
      role: user.role,
      college: user.college?._id?.toString() || user.college?.toString(),
    },
    secret,
    { expiresIn: '1d' }
  );

  const refresh = jwt.sign(
    {
      id: user._id.toString(),
      user_id: user._id.toString(),
      type: 'refresh',
    },
    secret,
    { expiresIn: '7d' }
  );

  return { access, refresh };
};

export const register = async (req, res, next) => {
  try {
    const validatedData = registerStudentSchema.parse(req.body);

    // 1. Check duplicate email
    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email address already exists.',
        field: 'email',
      });
    }

    // 2. Check college exists
    const college = await College.findById(validatedData.college_id);
    if (!college) {
      return res.status(404).json({
        error: 'Selected college was not found.',
        field: 'college_id',
      });
    }

    // 3. Check duplicate register number in this college
    const existingRoll = await StudentProfile.findOne({
      college: college._id,
      roll_number: validatedData.register_number.trim(),
    });
    if (existingRoll) {
      return res.status(409).json({
        error: 'This register / roll number is already registered for this college.',
        field: 'register_number',
      });
    }

    // 4. Split name
    const nameParts = validatedData.full_name.trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 5. Create user immediately with ACTIVE status and STUDENT role (NO APPROVAL)
    const user = new User({
      name: validatedData.full_name.trim(),
      first_name: firstName,
      last_name: lastName,
      email: validatedData.email.toLowerCase(),
      password: validatedData.password,
      role: 'STUDENT',
      college: college._id,
      isActive: true,
    });
    await user.save();

    // 6. Create StudentProfile
    await StudentProfile.create({
      user: user._id,
      college: college._id,
      roll_number: validatedData.register_number.trim(),
      department: validatedData.department.trim(),
      year: validatedData.year,
      section: validatedData.section?.trim() || '',
      total_points: 0,
    });

    // 7. Issue tokens directly
    const tokens = generateTokens(user);

    return res.status(201).json({
      message: 'Student account created and activated successfully.',
      access: tokens.access,
      refresh: tokens.refresh,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        college: college._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email.toLowerCase() })
      .select('+password')
      .populate('college');

    if (!user) {
      return res.status(401).json({
        detail: 'No active account found with the given credentials.',
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      return res.status(401).json({
        detail: 'No active account found with the given credentials.',
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const tokens = generateTokens(user);

    return res.status(200).json({
      access: tokens.access,
      refresh: tokens.refresh,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        college: user.college?._id?.toString() || user.college?.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Decode Google JWT payload safely
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    const email = payload.email?.toLowerCase();
    const firstName = payload.given_name || payload.name || 'Student';
    const lastName = payload.family_name || '';

    if (!email) {
      return res.status(400).json({ error: 'Google token does not contain a valid email' });
    }

    let user = await User.findOne({ email }).populate('college');
    if (!user) {
      const domain = email.split('@')[1];
      let college = await College.findOne({ domain });
      if (!college) {
        college = await College.findOne();
      }

      user = await User.create({
        name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        email,
        role: 'STUDENT',
        college: college ? college._id : null,
        isActive: true,
      });

      if (college) {
        await StudentProfile.create({
          user: user._id,
          college: college._id,
          roll_number: `GOOG-${user._id.toString().slice(-6).toUpperCase()}`,
          department: 'General',
          year: 1,
          section: 'A',
          total_points: 0,
        });
      }
    }

    const tokens = generateTokens(user);
    return res.status(200).json({
      access: tokens.access,
      refresh: tokens.refresh,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        college: user.college?._id?.toString() || user.college?.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh } = req.body;
    if (!refresh) {
      return res.status(400).json({ error: 'No refresh token provided' });
    }

    const secret = process.env.JWT_SECRET || 'college_club_management_jwt_super_secret_key_2026';
    const decoded = jwt.verify(refresh, secret);

    const user = await User.findById(decoded.id || decoded.user_id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    const tokens = generateTokens(user);
    return res.status(200).json({
      access: tokens.access,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getCurrentUser = async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });

  return res.status(200).json({
    id: req.user._id.toString(),
    email: req.user.email,
    role: req.user.role,
    name: req.user.name || `${req.user.first_name} ${req.user.last_name}`.trim(),
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    college: req.user.college?._id?.toString() || req.user.college?.toString(),
    college_name: req.user.college?.name || '',
    student_profile: profile
      ? {
          roll_number: profile.roll_number,
          register_number: profile.roll_number,
          department: profile.department,
          year: profile.year,
          section: profile.section,
          total_points: profile.total_points,
        }
      : null,
  });
};

export const logout = (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};
