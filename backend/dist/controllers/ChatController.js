"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class ChatController {
    constructor() {
        this.getChatSessions = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { sessions: [] } });
        });
        this.createChatSession = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Chat session created' });
        });
        this.getChatSession = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { session: {} } });
        });
        this.deleteChatSession = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Chat session deleted' });
        });
        this.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Message sent' });
        });
        this.getMessages = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { messages: [] } });
        });
        this.getSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { suggestions: [] } });
        });
        this.quickExerciseSearch = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { exercises: [] } });
        });
        this.getWorkoutHelp = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { help: {} } });
        });
        this.getFormGuidance = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { guidance: {} } });
        });
        this.getChatContext = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { context: {} } });
        });
        this.updateChatContext = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Context updated' });
        });
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=ChatController.js.map