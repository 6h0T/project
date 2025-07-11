'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Users, Zap, Shield, Target, Sword, LogIn, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Lineage II', href: '/', icon: Sword },
  { name: 'Aion Online', href: '/aion', icon: Shield },
  { name: 'Mu Online', href: '/mu-online', icon: Zap },
  { name: 'Perfect World', href: '/perfect-world', icon: Users },
  { name: 'Ragnarok Online', href: '/ragnarok-online', icon: Target },
  { name: 'Silkroad', href: '/silkroad', icon: Gamepad2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for custom events to open auth modal
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      const tab = event.detail?.tab || 'login';
      openAuthModal(tab);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);

  return (
    <>
      <nav className="relative sticky top-0 z-50">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-700/85 backdrop-blur-xl border-b border-white/10"></div>
        
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 animate-gradient"></div>
        
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-10 w-auto hover:scale-105 transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                />
              </Link>
            </div>
            
            <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/80 hover:border-cyan-500/60 text-white hover:text-cyan-100 backdrop-blur-sm transition-all duration-200 shadow-lg min-w-[44px] h-10"
                  >
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline font-medium truncate">{user.email?.split('@')[0]}</span>
                  </Button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-600/80 rounded-lg shadow-2xl z-50 profile-dropdown-custom">
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/70 hover:text-white transition-all duration-150 first:rounded-t-lg"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3 text-slate-400 flex-shrink-0" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-slate-200 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 last:rounded-b-lg"
                        >
                          <LogOut className="h-4 w-4 mr-3 text-slate-400 flex-shrink-0" />
                          <span className="font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => openAuthModal('login')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </>
  );
}