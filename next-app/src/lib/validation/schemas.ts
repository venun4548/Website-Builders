import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeString = (val: string): string => {
  return DOMPurify.sanitize(val.trim());
};

export const passwordSchema = z.string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100).transform(sanitizeString),
  email: z.string().email('Invalid email address').transform(sanitizeString),
  phone: z.string().max(20).optional().default('').transform(sanitizeString),
  service: z.string().max(100).optional().default('').transform(sanitizeString),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000).transform(sanitizeString),
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
  turnstileToken: z.string().optional(),
});

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100).transform(sanitizeString),
  email: z.string().email('Invalid email address').transform(sanitizeString),
  password: passwordSchema,
  honeypot: z.string().max(0, 'Bot detected').optional().default(''),
  turnstileToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform(sanitizeString),
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').transform(sanitizeString),
  password: z.string().min(1, 'Password is required'),
});

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be a 4-digit number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').transform(sanitizeString),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: passwordSchema,
});
