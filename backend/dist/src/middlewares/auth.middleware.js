"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../services/auth.service");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: 'Server configuration error',
            });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Get user from database (or in-memory storage)
        const user = await auth_service_1.AuthService.getUserById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token - user not found',
            });
            return;
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token expired',
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.middleware.js.map