import { Router } from 'express';
import { protectAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRoomSchema, updateRoomSchema, roomCodeParamsSchema, roomIdParamsSchema } from '../schemas/room.schema.js';
import { createRoom, getMyRooms, getRoomByCode, updateRoom, deleteRoom } from '../controllers/room.controller.js';

const router = Router();

router.use(protectAuth);

router.post('/', validate(createRoomSchema, 'body'), createRoom);
router.get('/my-rooms', getMyRooms);
router.get('/:code', validate(roomCodeParamsSchema, 'params'), getRoomByCode);
router.put('/:id', validate(roomIdParamsSchema, 'params'), validate(updateRoomSchema, 'body'), updateRoom);
router.delete('/:id', validate(roomIdParamsSchema, 'params'), deleteRoom);

export default router;
