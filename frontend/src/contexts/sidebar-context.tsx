"use client";

import {createContext, ReactNode, useContext, useRef, useState} from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    isHoverExpanded: boolean;
    setIsHoverExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({children}: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(true); // Always start collapsed
    const [isHoverExpanded, setIsHoverExpanded] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const toggleSidebar = () => {
        setIsCollapsed(prev => !prev);
        // Clear any hover expansion when manually toggling
        setIsHoverExpanded(false);
    };

    const handleSetCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        // Clear hover expansion when manually setting state
        if (!collapsed) {
            setIsHoverExpanded(false);
        }
    };

    const handleSetHoverExpanded = (expanded: boolean) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Set the hover expansion state directly
        setIsHoverExpanded(expanded);
    };

    // Cleanup timeout on unmount
    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            setIsCollapsed: handleSetCollapsed,
            toggleSidebar,
            isHoverExpanded,
            setIsHoverExpanded: handleSetHoverExpanded
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
} 