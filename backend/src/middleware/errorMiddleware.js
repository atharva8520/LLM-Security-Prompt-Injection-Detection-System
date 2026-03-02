export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log error for internal monitoring but sanitize output to client
    console.error(`[ERR] ${req.method} ${req.path} >>`, err.message);

    res.status(statusCode).json({
        success: false,
        code: err.code || 'INTERNAL_ERROR',
        error: err.message || 'An unexpected system error occurred'
    });
};
