import { EventEmitter } from 'events';

export type ContentUpdatePayload = {
  type: 'sermon' | 'event' | 'blogPost' | 'news' | 'ministry';
  action: 'created' | 'updated' | 'deleted';
  id: string;
  timestamp: string;
};

const contentUpdateEmitter = new EventEmitter();

export const publishContentUpdate = (payload: ContentUpdatePayload) => {
  contentUpdateEmitter.emit('update', payload);
};

export const addContentUpdateListener = (listener: (payload: ContentUpdatePayload) => void) => {
  contentUpdateEmitter.on('update', listener);
};

export const removeContentUpdateListener = (listener: (payload: ContentUpdatePayload) => void) => {
  contentUpdateEmitter.off('update', listener);
};
