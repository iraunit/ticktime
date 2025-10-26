import {
    HiChatBubbleLeftRight,
    HiDocumentText,
    HiFilm,
    HiGlobeAlt,
    HiMicrophone,
    HiPhoto,
    HiPlay,
    HiVideoCamera
} from "react-icons/hi2";

// Content type configuration with icons
export const contentTypeConfig = {
    image: {
        label: 'Image',
        icon: HiPhoto,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
    },
    video: {
        label: 'Video',
        icon: HiVideoCamera,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200'
    },
    story: {
        label: 'Story',
        icon: HiChatBubbleLeftRight,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200'
    },
    reel: {
        label: 'Reel',
        icon: HiPlay,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200'
    },
    post: {
        label: 'Post',
        icon: HiDocumentText,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
    },
    live: {
        label: 'Live Stream',
        icon: HiMicrophone,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200'
    },
    blog: {
        label: 'Blog Post',
        icon: HiFilm,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
    }
} as const;

// Helper function to get content type config
export const getContentTypeConfig = (contentType: string) => {
    return contentTypeConfig[contentType as keyof typeof contentTypeConfig] || {
        label: contentType.charAt(0).toUpperCase() + contentType.slice(1),
        icon: HiGlobeAlt,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
    };
};

// Content type display names
export const contentTypeDisplayNames: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    story: 'Story',
    reel: 'Reel',
    post: 'Post',
    live: 'Live Stream',
    blog: 'Blog Post'
};
