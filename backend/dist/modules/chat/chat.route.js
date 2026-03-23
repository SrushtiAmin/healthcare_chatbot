"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/chat -> call controller
// Protect route with Auth middleware
router.post('/', auth_middleware_1.authenticateToken, chat_controller_1.ChatController.handleChat);
router.get('/history', auth_middleware_1.authenticateToken, chat_controller_1.ChatController.handleGetHistory);
router.get('/sessions', auth_middleware_1.authenticateToken, chat_controller_1.ChatController.handleGetSessions);
router.get('/sessions/:sessionId/messages', auth_middleware_1.authenticateToken, chat_controller_1.ChatController.handleGetSessionMessages);
exports.default = router;
//# sourceMappingURL=chat.route.js.map