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
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug environment and initial states
  DEBUG.log('SidebarProvider initialized', {
    isCollapsed,
    isHoverExpanded,
    isInitialized,
    hasMounted,
    typeof_window: typeof window,
    localStorage_available: typeof window !== 'undefined' && window.localStorage,
    navigator_userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unavailable'
  });

  // Mark as mounted to prevent hydration issues
  useEffect(() => {
    DEBUG.log('Component mounting...');
    setHasMounted(true);
    DEBUG.log('Component mounted, hasMounted set to true');
  }, []);

  // Load initial state from localStorage only after mounting
  useEffect(() => {
    DEBUG.log('Loading state from localStorage effect triggered', {
      hasMounted,
      typeof_window: typeof window,
      window_available: typeof window !== 'undefined'
    });

    if (hasMounted && typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('sidebar-collapsed');
        DEBUG.log('Retrieved savedState from localStorage', {
          savedState,
          savedState_type: typeof savedState,
          localStorage_available: !!window.localStorage
        });

        if (savedState !== null) {
          const parsedState = JSON.parse(savedState);
          DEBUG.log('Parsed savedState, setting isCollapsed', {
            parsedState,
            parsedState_type: typeof parsedState,
            current_isCollapsed: isCollapsed
          });
          setIsCollapsed(parsedState);
        } else {
          DEBUG.log('No saved state found, keeping default collapsed state');
        }
        
        setIsInitialized(true);
        DEBUG.log('Initialization complete');
      } catch (error) {
        DEBUG.error('Error loading from localStorage', error);
        setIsInitialized(true);
      }
    } else {
      DEBUG.log('Cannot load from localStorage', {
        hasMounted,
        window_available: typeof window !== 'undefined'
      });
    }
  }, [hasMounted]);

  // Save state to localStorage when it changes
  useEffect(() => {
    DEBUG.log('Save state effect triggered', {
      isInitialized,
      hasMounted,
      typeof_window: typeof window,
      isCollapsed,
      shouldSave: isInitialized && hasMounted && typeof window !== 'undefined'
    });

    if (isInitialized && hasMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
        DEBUG.log('Successfully saved state to localStorage', {
          saved_value: isCollapsed,
          stringified_value: JSON.stringify(isCollapsed)
        });
      } catch (error) {
        DEBUG.error('Error saving to localStorage', error);
      }
    }
  }, [isCollapsed, isInitialized, hasMounted]);

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
      new_value: collapsed
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