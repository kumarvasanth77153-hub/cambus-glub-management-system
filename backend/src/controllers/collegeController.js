import { College } from '../models/College.js';

export const getPublicColleges = async (req, res, next) => {
  try {
    const colleges = await College.find({ status: true }).sort({ name: 1 });
    return res.status(200).json(colleges);
  } catch (error) {
    next(error);
  }
};

export const getColleges = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};
    if (user.role !== 'PLATFORM_ADMIN') {
      query = { _id: user.college };
    }

    const colleges = await College.find(query).sort({ name: 1 });
    return res.status(200).json(colleges);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    const { name, domain } = req.body;
    const college = await College.create({
      name: name.trim(),
      domain: domain.trim().toLowerCase(),
      status: true,
    });
    return res.status(201).json(college);
  } catch (error) {
    next(error);
  }
};
