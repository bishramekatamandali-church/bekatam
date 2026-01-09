"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEnumValue = void 0;
const normalizeEnumValue = (value, enumValues) => {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }
    const values = Object.values(enumValues);
    if (values.includes(trimmed)) {
        return trimmed;
    }
    const normalized = trimmed
        .replace(/[’']/g, '')
        .replace(/&/g, ' ')
        .replace(/[^\w]+/g, '_')
        .replace(/^_+|_+$/g, '');
    if (values.includes(normalized)) {
        return normalized;
    }
    return undefined;
};
exports.normalizeEnumValue = normalizeEnumValue;
