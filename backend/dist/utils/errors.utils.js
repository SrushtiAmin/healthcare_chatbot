"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = void 0;
const handleApiError = (error, res, source) => {
    console.error(`Error in ${source}:`, error);
    // Prisma and Database errors
    if (error.name === 'PrismaClientInitializationError' ||
        error.name === 'PrismaClientKnownRequestError' ||
        error.message?.includes('Can\'t reach database') ||
        error.message?.includes('getaddrinfo') ||
        error.code?.startsWith('P')) {
        return res.status(503).json({
            success: false,
            message: 'A database error occurred. Please try again later or check your DB connection.',
            // Removed raw error.message to prevent leaking table/DB structures to frontend
        });
    }
    // Zod validation errors (if not already handled)
    if (error.errors || error.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: (error.errors || error.issues).map((err) => ({
                field: err.path?.join('.') || err.field,
                message: err.message,
            }))
        });
    }
    // Standard errors
    return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
    });
};
exports.handleApiError = handleApiError;
//# sourceMappingURL=errors.utils.js.map