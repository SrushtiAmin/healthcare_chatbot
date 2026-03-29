"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/auth/signup - Register a new user
router.post('/signup', auth_controller_1.AuthController.signup);
// POST /api/auth/login - Login user
router.post('/login', auth_controller_1.AuthController.login);
// GET /api/auth/me - Get current user (protected)
router.get('/me', auth_middleware_1.authenticateToken, auth_controller_1.AuthController.getMe);
exports.default = router;
//# sourceMappingURL=auth.route.js.map