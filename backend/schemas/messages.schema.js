import { z } from 'zod'

export const roomParamsSchema = z.object({
  room: z.string().min(1, 'Room is required').max(100),
})

export default { roomParamsSchema }
