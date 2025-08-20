"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isHoverExpanded: boolean;
  setIsHoverExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mark as mounted to prevent hydration issues
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load initial state from localStorage only after mounting
  useEffect(() => {
    if (hasMounted && typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
      setIsInitialized(true);
    }
  }, [hasMounted]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isInitialized && hasMounted && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isInitialized, hasMounted]);

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
    setIsHoverExpanded(expanded);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // If expanding on hover, set a timeout to collapse after delay
    if (expanded && isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoverExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds of no hover
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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