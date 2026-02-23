import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Room name must be under 100 characters'),
});

export const updateRoomSchema = z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Room name must be under 100 characters'),
});

export const roomCodeParamsSchema = z.object({
    code: z.string().length(6, 'Room code must be exactly 6 characters').toUpperCase(),
})

export const roomIdParamsSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
})
