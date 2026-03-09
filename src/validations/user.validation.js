import { z } from "zod"
import { ROLE } from "../config/system.js"

const PASSWORD_MIN = 6;
const FULLNAME_MAX = 120;
const PHONE_REGEX = /^[0-9+\-\s()]{10,20}$/;

export const imageSchema = z.object({
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/ico',
    'image/heic',
    'image/heif',
  ]),
  size: z.number().max(5 * 1024 * 1024, 'Image size must be less than 5MB'),
})

const passwordSchema = z.object({
  password: z.string({ required_error: "Password is required" })
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
})
export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(1, "Full name is required")
      .max(FULLNAME_MAX, `Full name must be at most ${FULLNAME_MAX} characters`),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email address"),
    password: z.string({ required_error: "Password is required" })
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || PHONE_REGEX.test(val), "Invalid phone number format")
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Invalid email address"),
    password: z.string({ required_error: "Password is required" })
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name cannot be empty")
      .max(FULLNAME_MAX, `Full name must be at most ${FULLNAME_MAX} characters`)
      .optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || PHONE_REGEX.test(val), "Invalid phone number format"),
    email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .optional(),
    address: z.string().trim().max(255, 'Address must be at most 255 characters').optional(),
    role: z.enum(ROLE).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field to update is required");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string("Current password is required" ).min(1),
    newPassword: z
      .string("New password is required")
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  })
  .strict();
