"use client";

import {useState, useRef, useEffect} from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export function Tooltip({content, children, side = 'top', className = ''}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && tooltipRef.current && triggerRef.current) {
            const tooltip = tooltipRef.current;
            const trigger = triggerRef.current;
            const rect = trigger.getBoundingClientRect();

            // Position tooltip
            switch (side) {
                case 'top':
                    tooltip.style.bottom = `${rect.height + 8}px`;
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    break;
                case 'bottom':
                    tooltip.style.top = `${rect.height + 8}px`;
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    break;
                case 'left':
                    tooltip.style.right = `${rect.width + 8}px`;
                    tooltip.style.top = '50%';
                    tooltip.style.transform = 'translateY(-50%)';
                    break;
                case 'right':
                    tooltip.style.left = `${rect.width + 8}px`;
                    tooltip.style.top = '50%';
                    tooltip.style.transform = 'translateY(-50%)';
                    break;
            }
        }
    }, [isVisible, side]);

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-lg max-w-xs pointer-events-none ${
                        side === 'top' ? 'bottom-full mb-1' :
                        side === 'bottom' ? 'top-full mt-1' :
                        side === 'left' ? 'right-full mr-1' :
                        'left-full ml-1'
                    }`}
                    style={{whiteSpace: 'normal', wordWrap: 'break-word'}}
                >
                    {content}
                    <div
                        className={`absolute w-0 h-0 border-4 ${
                            side === 'top' ? 'top-full border-t-gray-900 border-r-transparent border-b-transparent border-l-transparent' :
                            side === 'bottom' ? 'bottom-full border-b-gray-900 border-r-transparent border-t-transparent border-l-transparent' :
                            side === 'left' ? 'left-full border-l-gray-900 border-t-transparent border-r-transparent border-b-transparent' :
                            'right-full border-r-gray-900 border-t-transparent border-l-transparent border-b-transparent'
                        }`}
                        style={{
                            [side === 'top' ? 'left' : side === 'bottom' ? 'left' : side === 'left' ? 'top' : 'top']: '50%',
                            transform: side === 'top' || side === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
                        }}
                    />
                </div>
            )}
        </div>
    );
}

