export type MediaKind = 'image' | 'video' | 'audio' | 'other';

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
]);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'ogv', 'webm']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);

const stripUrl = (url: string) => url.split('?')[0].split('#')[0];

export const getMediaKindFromUrl = (url?: string): MediaKind => {
  if (!url) return 'other';
  const cleanUrl = stripUrl(url);
  const extension = cleanUrl.split('.').pop()?.toLowerCase();

  if (extension && IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (extension && AUDIO_EXTENSIONS.has(extension)) {
    return 'audio';
  }

  if (extension && VIDEO_EXTENSIONS.has(extension)) {
    return 'video';
  }

  if (cleanUrl.includes('/image/upload')) {
    return 'image';
  }

  if (cleanUrl.includes('/video/upload')) {
    return 'video';
  }

  return 'other';
};
