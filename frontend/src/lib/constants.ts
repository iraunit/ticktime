import {platformConfig, platformDisplayNames} from "@/lib/platform-config";

// Social media platform options - using centralized config
export const SOCIAL_PLATFORMS = Object.entries(platformConfig).map(([value, config]) => ({
    value,
    label: platformDisplayNames[value] || value.charAt(0).toUpperCase() + value.slice(1),
    icon: '📱' // Generic icon since we have proper FontAwesome icons in platformConfig
}));

// File upload constraints
export const FILE_UPLOAD_CONFIG = {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};