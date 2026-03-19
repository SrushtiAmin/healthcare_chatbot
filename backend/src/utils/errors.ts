import { Response } from 'express';

export const handleApiError = (error: any, res: Response, source: string) => {
    console.error(`Error in ${source}:`, error);

    // Prisma and Database errors
    if (
        error.name === 'PrismaClientInitializationError' ||
        error.name === 'PrismaClientKnownRequestError' ||
        error.message.includes('Can\'t reach database') ||
        error.message.includes('getaddrinfo') ||
        error.code?.startsWith('P')
    ) {
        return res.status(503).json({
            success: false,
            message: 'Database connection failed. Please ensure the Postgres server is running and your connection URL is correct.',
            error: error.message
        });
    }

    // Zod validation errors (if not already handled)
    if (error.errors || error.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: (error.errors || error.issues).map((err: any) => ({
                field: err.path?.join('.') || err.field,
                message: err.message,
            }))
        });
    }

    // Standard errors
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
};
