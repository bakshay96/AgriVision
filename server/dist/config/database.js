"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb+srv://akshaymaliedu_db_user:akshay@cluster0.o9hauwk.mongodb.net/?appName=agri_vision_pro';
    try {
        const conn = await mongoose_1.default.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('[MongoDB] Connection failed:', error);
        process.exit(1);
    }
};
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('[MongoDB] Error:', err);
});
exports.default = connectDB;
//# sourceMappingURL=database.js.map