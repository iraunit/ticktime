"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

// Debug utility for sidebar context
const DEBUG = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV;
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown';
    const host = typeof window !== 'undefined' ? window.location.host : 'unknown';
    console.log(`[SIDEBAR-DEBUG ${timestamp}] [ENV: ${env}] [HOST: ${host}]`, message, data ? data : '');
    
    // Additional production debugging
    if (env === 'production') {
      console.log(`[PROD-DEBUG] User Agent: ${userAgent}`);
      console.log(`[PROD-DEBUG] Document ready state: ${typeof document !== 'undefined' ? document.readyState : 'unavailable'}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV;
    const host = typeof window !== 'undefined' ? window.location.host : 'unknown';
    console.error(`[SIDEBAR-ERROR ${timestamp}] [ENV: ${env}] [HOST: ${host}]`, message, error ? error : '');
  }
};

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isHoverExpanded: boolean;
  setIsHoverExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  DEBUG.log('🚀 SidebarProvider constructor - Simple state (NO localStorage)', {
    initial_isCollapsed: true,
    initial_isHoverExpanded: false,
    using_localStorage: false,
    reason: 'Removed localStorage to fix production issues'
  });

  // Debug environment and initial states  
  DEBUG.log('SidebarProvider simple state initialized', {
    isCollapsed,
    isHoverExpanded,
    approach: 'Simple React state - no localStorage',
    default_behavior: 'Always starts collapsed, user can toggle as needed'
  });

  const toggleSidebar = () => {
    DEBUG.log('toggleSidebar called', {
      current_isCollapsed: isCollapsed,
      will_become: !isCollapsed
    });
    setIsCollapsed(prev => {
      const newValue = !prev;
      DEBUG.log('isCollapsed state changing', {
        previous: prev,
        new: newValue
      });
      return newValue;
    });
    // Clear any hover expansion when manually toggling
    setIsHoverExpanded(false);
    DEBUG.log('toggleSidebar completed, hover expansion cleared');
  };

  const handleSetCollapsed = (collapsed: boolean) => {
    DEBUG.log('handleSetCollapsed called', {
      current_isCollapsed: isCollapsed,
      new_value: collapsed,
      note: 'Simple state update - no localStorage involved'
    });
    setIsCollapsed(collapsed);
    // Clear hover expansion when manually setting state
    if (!collapsed) {
      setIsHoverExpanded(false);
      DEBUG.log('Cleared hover expansion because sidebar is being expanded');
    }
  };

  const handleSetHoverExpanded = (expanded: boolean) => {
    DEBUG.log('handleSetHoverExpanded called', {
      expanded,
      current_isCollapsed: isCollapsed,
      current_isHoverExpanded: isHoverExpanded
    });
    
    setIsHoverExpanded(expanded);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      DEBUG.log('Cleared existing hover timeout');
    }

    // If expanding on hover, set a timeout to collapse after delay
    if (expanded && isCollapsed) {
      DEBUG.log('Setting auto-collapse timeout (3 seconds)');
      hoverTimeoutRef.current = setTimeout(() => {
        DEBUG.log('Auto-collapse timeout triggered');
        setIsHoverExpanded(false);
      }, 3000); // Auto-collapse after 3 seconds of no hover
    }
  };

  // Track isCollapsed state changes
  useEffect(() => {
    DEBUG.log('🔄 isCollapsed STATE CHANGED', {
      new_isCollapsed_value: isCollapsed,
      is_expanded: !isCollapsed,
      component_should_show_as: isCollapsed ? 'collapsed (w-16)' : 'expanded (w-64)'
    });
  }, [isCollapsed]);

  // Track isHoverExpanded state changes  
  useEffect(() => {
    DEBUG.log('👆 isHoverExpanded STATE CHANGED', {
      new_isHoverExpanded_value: isHoverExpanded,
      combined_expansion_state: !isCollapsed || isHoverExpanded
    });
  }, [isHoverExpanded]);

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