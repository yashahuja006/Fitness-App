"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`Error ${statusCode}: ${message}`);
    console.error(err.stack);
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
        success: false,
        error: {
            message: isDevelopment ? message : 'Something went wrong',
            ...(isDevelopment && { stack: err.stack }),
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        }
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map