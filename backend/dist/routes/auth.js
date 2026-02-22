"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authController = new AuthController_1.AuthController();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/logout', auth_1.authenticateToken, authController.logout);
router.get('/profile', auth_1.authenticateToken, authController.getProfile);
router.put('/profile', auth_1.authenticateToken, authController.updateProfile);
router.delete('/account', auth_1.authenticateToken, authController.deleteAccount);
//# sourceMappingURL=auth.js.map