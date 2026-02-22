"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.auth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
if (!firebase_admin_1.default.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;
    if (serviceAccount) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }
    else {
        firebase_admin_1.default.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }
}
exports.auth = (0, auth_1.getAuth)();
exports.db = (0, firestore_1.getFirestore)();
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.js.map