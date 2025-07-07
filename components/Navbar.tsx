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
  { name: 'Counter Strike', href: '/counter-strike', icon: Target },
  { name: 'World of Warcraft', href: '/wow', icon: Gamepad2 },
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
                    <span className="hidden sm:block">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse backdrop-blur-sm" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="relative w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <User className="h-4 w-4 text-white" />
                  </button>
                  
                  <div 
                    className={`absolute right-0 top-full mt-1 w-56 origin-top transform transition-all duration-200 ease-out ${
                      dropdownOpen 
                        ? 'opacity-100 scale-y-100 translate-y-0' 
                        : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
                    }`}
                    style={{
                      transformOrigin: 'top right'
                    }}
                  >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-lg p-1">
                      <div className="px-3 py-2 border-b border-white/10">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-white">{user.email}</p>
                          <p className="text-xs text-slate-400">Gestiona tu cuenta</p>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          href="/dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link 
                          href="/buy-credits" 
                          className="flex items-center px-3 py-2 text-sm text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 rounded-md transition-colors cursor-pointer"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Comprar Créditos
                        </Link>
                        <Link 
                          href="/dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configuración
                        </Link>
                      </div>
                      
                      <div className="border-t border-white/10 py-1">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/login"
                    className="text-slate-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    href="/registro"
                    className="bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Registrarse
                  </Link>
                </div>
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