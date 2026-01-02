"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file is intentionally left blank as user logic has been consolidated into auth.ts
// for this simplified mock implementation. In a larger application, this file would
// handle routes like GET /api/users, GET /api/users/:id, PUT /api/users/:id, etc.
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
exports.default = router;
