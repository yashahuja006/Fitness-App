"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("./errorHandler");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw (0, errorHandler_1.createError)('Access token required', 401);
        }
        const decodedToken = await firebase_1.auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 'user'
        };
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            next((0, errorHandler_1.createError)('Invalid or expired token', 401));
        }
        else {
            next((0, errorHandler_1.createError)('Authentication failed', 401));
        }
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            next((0, errorHandler_1.createError)('Authentication required', 401));
            return;
        }
        if (!roles.includes(req.user.role || 'user')) {
            next((0, errorHandler_1.createError)('Insufficient permissions', 403));
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map