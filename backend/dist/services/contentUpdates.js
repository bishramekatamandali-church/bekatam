"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeContentUpdateListener = exports.addContentUpdateListener = exports.publishContentUpdate = void 0;
const events_1 = require("events");
const contentUpdateEmitter = new events_1.EventEmitter();
const publishContentUpdate = (payload) => {
    contentUpdateEmitter.emit('update', payload);
};
exports.publishContentUpdate = publishContentUpdate;
const addContentUpdateListener = (listener) => {
    contentUpdateEmitter.on('update', listener);
};
exports.addContentUpdateListener = addContentUpdateListener;
const removeContentUpdateListener = (listener) => {
    contentUpdateEmitter.off('update', listener);
};
exports.removeContentUpdateListener = removeContentUpdateListener;
