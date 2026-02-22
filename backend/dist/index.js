"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const workouts_1 = require("./routes/workouts");
const exercises_1 = require("./routes/exercises");
const diet_1 = require("./routes/diet");
const progress_1 = require("./routes/progress");
const chat_1 = require("./routes/chat");
const admin_1 = require("./routes/admin");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Fitness App API Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/users', users_1.userRoutes);
app.use('/api/workouts', workouts_1.workoutRoutes);
app.use('/api/exercises', exercises_1.exerciseRoutes);
app.use('/api/diet', diet_1.dietRoutes);
app.use('/api/progress', progress_1.progressRoutes);
app.use('/api/chat', chat_1.chatRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Fitness App API Server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map