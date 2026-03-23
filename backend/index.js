"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./src/modules/auth");
const chat_route_1 = __importDefault(require("./src/modules/chat/chat.route"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Healthcare Chatbot API is running!' });
});
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Auth routes
app.use('/api/auth', auth_1.authRoutes);
// Chat routes
app.use('/api/chat', chat_route_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
        console.warn('WARNING: JWT_SECRET is not set in environment variables');
    }
});
//# sourceMappingURL=index.js.map