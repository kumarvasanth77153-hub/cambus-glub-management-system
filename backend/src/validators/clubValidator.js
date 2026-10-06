import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(2, 'Club name is required'),
  description: z.string().optional().default(''),
  category: z.enum([
    'SOCIAL_SERVICE',
    'HEALTH',
    'ENVIRONMENT',
    'CULTURAL',
    'TECHNICAL',
    'SPORTS',
    'OTHER',
  ]).default('OTHER'),
});

export const assignAdminSchema = z.object({
  email: z.string().email('Valid email is required'),
});
