import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9]+$/, 'Username must contain only lowercase letters and numbers without special characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9]+$/, 'Username must contain only lowercase letters and numbers without special characters'),
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
}
