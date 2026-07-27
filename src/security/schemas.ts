import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// 1. Auth Schemas
export const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  companyName: z.string().optional(),
  industry: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').optional()
});

// 2. Lead CRM Schemas
export const createLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  score: z.number().optional()
});

export const updateLeadSchema = createLeadSchema.partial();

// 3. Appointment Schemas
export const createAppointmentSchema = z.object({
  leadId: z.string().optional(),
  title: z.string().optional(),
  leadName: z.string().optional(),
  contactEmail: z.string().optional(),
  dateTime: z.string().optional(),
  startTime: z.string().optional(),
  durationMins: z.number().optional(),
  durationMinutes: z.number().optional(),
  notes: z.string().optional(),
  timezone: z.string().optional()
});

// 4. AI Outreach / SDR Schemas
export const generateOutreachSchema = z.object({
  leadId: z.string().optional(),
  prospectName: z.string().optional(),
  company: z.string().optional(),
  valueProp: z.string().optional(),
  channel: z.string().optional(),
  tone: z.string().optional(),
  prompt: z.string().optional()
});

// Zod Middleware Validator Helper
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      res.status(400).json({
        error: 'Invalid request payload',
        details: issues,
        requestId: (req as any).id
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
