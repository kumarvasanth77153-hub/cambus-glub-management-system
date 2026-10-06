import { z } from 'zod';

export const registerStudentSchema = z.preprocess((data) => {
  if (typeof data !== 'object' || data === null) return data;
  return {
    full_name: data.full_name || data.fullName,
    register_number: data.register_number || data.registerNumber || data.rollNumber || data.roll_number,
    college_id: data.college_id || data.collegeId,
    department: data.department,
    year: data.year,
    section: data.section || '',
    email: data.email,
    password: data.password,
    confirm_password: data.confirm_password || data.confirmPassword || data.password,
  };
}, z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  register_number: z.string().min(2, 'Register/Roll number is required'),
  college_id: z.string().min(1, 'College is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.coerce.number().min(1).max(6),
  section: z.string().optional().default(''),
  email: z.string().email('Valid college email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
}));

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

