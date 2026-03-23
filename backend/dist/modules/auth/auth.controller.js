"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_schema_1 = require("./auth.schema");
const errors_1 = require("../../utils/errors");
class AuthController {
    static async signup(req, res, next) {
        try {
            const validatedData = auth_schema_1.signupSchema.parse(req.body);
            const authResponse = await auth_service_1.AuthService.signup(validatedData);
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: authResponse,
            });
        }
        catch (error) {
            if (error.message.includes('already exists')) {
                res.status(409).json({ success: false, message: error.message });
                return;
            }
            (0, errors_1.handleApiError)(error, res, 'AuthController.signup');
        }
    }
    static async login(req, res, next) {
        try {
            const validatedData = auth_schema_1.loginSchema.parse(req.body);
            const authResponse = await auth_service_1.AuthService.login(validatedData);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: authResponse,
            });
        }
        catch (error) {
            if (error.message.includes('Invalid email or password')) {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }
            (0, errors_1.handleApiError)(error, res, 'AuthController.login');
        }
    }
    static async getMe(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'User not authenticated' });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'User retrieved successfully',
                data: { user: req.user },
            });
        }
        catch (error) {
            (0, errors_1.handleApiError)(error, res, 'AuthController.getMe');
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map