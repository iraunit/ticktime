"use client";

interface GlobalLoaderProps {
    isVisible?: boolean;
    className?: string;
}

export function GlobalLoader({isVisible = true, className = ""}: GlobalLoaderProps) {
    if (!isVisible) return null;

    return (
        <div className={`min-h-screen flex items-center justify-center ${className}`}>
            <div className="text-center">
                <div className="mb-6">
                    <div className="flex space-x-3 mb-4">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg"
                                style={{
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Overlay loader variant for modals and overlays
export function OverlayLoader({className = ""}: { className?: string }) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
            <div className="text-center">
                <div className="mb-6">
                    <div className="flex space-x-3 mb-4">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg"
                                style={{
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Inline loader variant for buttons and small elements
export function InlineLoader({className = ""}: { className?: string }) {
    return (
        <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-sm"
                    style={{
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '1s'
                    }}
                />
            ))}
        </div>
    );
}
