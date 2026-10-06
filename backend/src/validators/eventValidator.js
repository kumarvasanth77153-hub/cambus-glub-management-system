import { z } from 'zod';

export const createEventSchema = z.object({
  club: z.string().min(1, 'Club ID is required'),
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  venue: z.string().optional().default('Campus Auditorium'),
  maximum_participants: z.coerce.number().optional().nullable(),
  registration_start: z.string().optional(),
  registration_end: z.string().optional(),
});
