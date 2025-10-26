import {FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter, FaYoutube} from "react-icons/fa";

// Platform configuration with proper SVG icons and brand colors
export const platformConfig = {
    youtube: {
        icon: FaYoutube,
        label: 'YouTube',
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        gradient: "from-red-500 to-red-600"
    },
    instagram: {
        icon: FaInstagram,
        label: 'Instagram',
        color: "text-pink-600",
        bg: "bg-pink-50",
        border: "border-pink-200",
        gradient: "from-pink-500 to-purple-500"
    },
    tiktok: {
        icon: FaTiktok,
        label: 'TikTok',
        color: "text-gray-800",
        bg: "bg-gray-50",
        border: "border-gray-200",
        gradient: "from-gray-800 to-gray-900"
    },
    twitter: {
        icon: FaTwitter,
        label: 'Twitter',
        color: "text-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-400 to-blue-500"
    },
    linkedin: {
        icon: FaLinkedin,
        label: 'LinkedIn',
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-700 to-blue-800"
    },
    facebook: {
        icon: FaFacebook,
        label: 'Facebook',
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-600 to-blue-700"
    },
} as const;

// Platform options for select dropdowns
export const platformOptions = Object.entries(platformConfig).map(([value, config]) => ({
    value,
    label: config.label,
    icon: config.icon,
    color: config.color
}));

// Platform display names (for backward compatibility)
export const platformDisplayNames: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
};

// Helper function to get platform config
export const getPlatformConfig = (platformId: string) => {
    return platformConfig[platformId as keyof typeof platformConfig];
};

// Helper function to get platform label
export const getPlatformLabel = (platformId: string) => {
    return platformConfig[platformId as keyof typeof platformConfig]?.label || platformId;
};

// Deal type configuration
export const dealTypeConfig = {
    cash: {
        label: 'Cash Payment',
        description: 'Cash payment for content creation',
        icon: '💰',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        gradient: 'from-green-500 to-emerald-600'
    },
    product: {
        label: 'Barter Only',
        description: 'Product exchange for content creation',
        icon: '🎁',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        gradient: 'from-orange-500 to-amber-600'
    },
    hybrid: {
        label: 'Cash + Barter',
        description: 'Combination of cash and products',
        icon: '💎',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        gradient: 'from-purple-500 to-pink-600'
    }
} as const;

// Deal type display names
export const dealTypeDisplayNames: Record<string, string> = {
    cash: 'Cash Payment',
    product: 'Barter Only',
    hybrid: 'Cash + Barter'
};

// Helper function to get deal type config
export const getDealTypeConfig = (dealType: string) => {
    return dealTypeConfig[dealType as keyof typeof dealTypeConfig] || {
        label: dealType.charAt(0).toUpperCase() + dealType.slice(1),
        description: 'Deal type',
        icon: '💼',
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        gradient: 'from-gray-500 to-gray-600'
    };
};
