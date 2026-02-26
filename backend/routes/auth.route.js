import { Router } from 'express';
import { loginController, logoutController, profileController, refreshTokenController, registerController, updateProfileController, changePasswordController } from '../controllers/auth.controller.js';
import { protectAuth } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../schemas/users.schema.js'
const router = Router();

router.post("/register", validate(registerSchema, 'body'), registerController)
router.post("/login", loginLimiter, validate(loginSchema, 'body'), loginController)
router.get("/profile", protectAuth, profileController)
router.put("/profile", protectAuth, validate(updateProfileSchema, 'body'), updateProfileController)
router.put("/password", protectAuth, validate(changePasswordSchema, 'body'), changePasswordController)
router.get("/logout", logoutController);
router.get("/refresh", refreshTokenController);

export default router;