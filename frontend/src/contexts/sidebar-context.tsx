"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isHoverExpanded: boolean;
  setIsHoverExpanded: (expanded: boolean) => void;
  isInitialized: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
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
      try {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
          const parsed = JSON.parse(savedState);
          // Validate the parsed value is boolean
          if (typeof parsed === 'boolean') {
            setIsCollapsed(parsed);
          }
        }
      } catch (error) {
        console.warn('Failed to parse sidebar state from localStorage:', error);
        // Fall back to default state if parsing fails
      } finally {
        setIsInitialized(true);
      }
    } else if (hasMounted) {
      // If localStorage is not available, still mark as initialized
      setIsInitialized(true);
    }
  }, [hasMounted]);

  // Save state to localStorage when it changes (with error handling)
  useEffect(() => {
    if (isInitialized && hasMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [isCollapsed, isInitialized, hasMounted]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
    // Clear any hover expansion when manually toggling
    setIsHoverExpanded(false);
    clearHoverTimeout();
  }, [clearHoverTimeout]);

  const handleSetCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    // Clear hover expansion when manually setting state
    if (!collapsed) {
      setIsHoverExpanded(false);
      clearHoverTimeout();
    }
  }, [clearHoverTimeout]);

  const handleSetHoverExpanded = useCallback((expanded: boolean) => {
    // Only allow hover expansion if component is initialized
    if (!isInitialized) return;

    setIsHoverExpanded(expanded);
    clearHoverTimeout();

    // If expanding on hover, set a timeout to collapse after delay
    if (expanded && isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoverExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds of no hover
    }
  }, [isCollapsed, isInitialized, clearHoverTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearHoverTimeout();
    };
  }, [clearHoverTimeout]);

  // Reset hover state when collapsed state changes
  useEffect(() => {
    if (!isCollapsed) {
      setIsHoverExpanded(false);
      clearHoverTimeout();
    }
  }, [isCollapsed, clearHoverTimeout]);

  const contextValue: SidebarContextType = {
    isCollapsed,
    setIsCollapsed: handleSetCollapsed,
    toggleSidebar,
    isHoverExpanded,
    setIsHoverExpanded: handleSetHoverExpanded,
    isInitialized,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
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