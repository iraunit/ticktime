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
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed for auto-close behavior
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage after mounting to avoid hydration errors
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
    setIsInitialized(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      if (isInitialized) {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
      }
      return newValue;
    });
    // Clear any hover expansion when manually toggling
    setIsHoverExpanded(false);
  };

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (isInitialized) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    }
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

    // If collapsing hover, immediately hide
    if (!expanded) {
      setIsHoverExpanded(false);
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