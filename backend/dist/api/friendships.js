"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file is intentionally left blank as friendship logic is managed
// within the frontend's AuthContext for this mock implementation.
// In a full backend architecture, this file would handle API routes
// for creating, accepting, rejecting, and deleting friendships.
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
exports.default = router;
