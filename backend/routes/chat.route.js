import { Router } from 'express';
import { getAllMessagesController } from '../controllers/chat.controller.js';
import { protectAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js'
import { roomParamsSchema } from '../schemas/messages.schema.js'

const router = Router();

router.get("/all/:room", validate(roomParamsSchema, 'params'), protectAuth, getAllMessagesController)

export default router;