"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Bell, Menu, X, LogOut, Settings, ChevronDown } from "@/lib/icons";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserContext } from "@/components/providers/app-providers";
import { usePathname } from "next/navigation";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { user, isLoading } = useUserContext();
  const pathname = usePathname();

  const isAuthenticated = !!user;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const linkBase = "text-sm transition-colors font-medium";
  const linkInactive = "text-gray-600 hover:text-gray-900";
  const linkActive = "text-blue-600";

  const handleLogout = () => {
    logout.mutate();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">TT</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">TickTime</span>
          </Link>

          {/* Desktop Navigation - Only show if authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className={`${linkBase} ${isActive("/dashboard") ? linkActive : linkInactive}`}>
                Dashboard
              </Link>
              <Link href="/deals" className={`${linkBase} ${isActive("/deals") ? linkActive : linkInactive}`}>
                Deals
              </Link>
              <Link href="/profile" className={`${linkBase} ${isActive("/profile") ? linkActive : linkInactive}`}>
                Profile
              </Link>
              <Link href="/messages" className={`${linkBase} ${isActive("/messages") ? linkActive : linkInactive}`}>
                Messages
              </Link>
              <Link href="/analytics" className={`${linkBase} ${isActive("/analytics") ? linkActive : linkInactive}`}>
                Analytics
              </Link>
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bell className="w-4 h-4" />
                </Button>
                
                {/* User Menu */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2 gap-1"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link 
                        href="/profile" 
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="h-8 px-3 text-sm">
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            {isAuthenticated ? (
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/dashboard" 
                  className={`${linkBase} ${isActive("/dashboard") ? linkActive : linkInactive} py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/deals" 
                  className={`${linkBase} ${isActive("/deals") ? linkActive : linkInactive} py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Deals
                </Link>
                <Link 
                  href="/profile" 
                  className={`${linkBase} ${isActive("/profile") ? linkActive : linkInactive} py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  href="/messages" 
                  className={`${linkBase} ${isActive("/messages") ? linkActive : linkInactive} py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link 
                  href="/analytics" 
                  className={`${linkBase} ${isActive("/analytics") ? linkActive : linkInactive} py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Analytics
                </Link>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="h-8 px-3 text-sm"
                  >
                    Logout
                  </Button>
                </div>
              </nav>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button variant="ghost" size="sm" asChild className="h-8 justify-start">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button size="sm" asChild className="h-8 justify-start">
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Backdrop for user menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
}