export type CloudinaryResourceType = 'image' | 'video' | 'raw';

const MB = 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * MB;
const VIDEO_MAX_BYTES = 50 * MB;
const AUDIO_MAX_BYTES = 50 * MB;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

const formatBytes = (bytes: number) => `${Math.round(bytes / MB)} MB`;

const getMaxBytesForFile = (file: File) => {
  if (file.type.startsWith('image/')) return IMAGE_MAX_BYTES;
  if (file.type.startsWith('video/')) return VIDEO_MAX_BYTES;
  if (file.type.startsWith('audio/')) return AUDIO_MAX_BYTES;
  return VIDEO_MAX_BYTES;
};

export const getCloudinaryResourceType = (file: File): CloudinaryResourceType => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'video';
  if (!file.type.startsWith('image/')) return 'raw'; 
 return 'image';
};

export const getCloudinaryUploadDetails = (resourceType: CloudinaryResourceType) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return { error: 'Cloudinary configuration is missing.' } as const;
  }

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  } as const;
};

export const getCloudinaryFileSizeError = (file: File) => {
  const maxBytes = getMaxBytesForFile(file);
  if (file.size > maxBytes) {
    const label = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : 'media';
    return `File is too large. Max size for ${label} uploads is ${formatBytes(maxBytes)}.`;
  }
  return null;
};

export const getCloudinaryLimitLabel = (mediaType: 'image' | 'video' | 'audio' | 'any') => {
  switch (mediaType) {
    case 'image':
      return `Max image size: ${formatBytes(IMAGE_MAX_BYTES)}.`;
    case 'video':
      return `Max video size: ${formatBytes(VIDEO_MAX_BYTES)}.`;
    case 'audio':
      return `Max audio size: ${formatBytes(AUDIO_MAX_BYTES)}.`;
    case 'any':
    default:
      return `Images up to ${formatBytes(IMAGE_MAX_BYTES)}. Video/audio up to ${formatBytes(VIDEO_MAX_BYTES)}.`;
  }
};
