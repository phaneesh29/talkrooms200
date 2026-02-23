import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default {
  registerSchema,
  loginSchema,
}
