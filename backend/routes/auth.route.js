import { Router } from 'express';
import { loginController, logoutController, profileController, refreshTokenController, registerController } from '../controllers/auth.controller.js';
import { protectAuth } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { registerSchema, loginSchema } from '../schemas/users.schema.js'
const router = Router();

router.post("/register", validate(registerSchema, 'body'), registerController)
router.post("/login", loginLimiter, validate(loginSchema, 'body'), loginController)
router.get("/profile",protectAuth,profileController)
router.get("/logout", logoutController);
router.get("/refresh", refreshTokenController);

export default router;