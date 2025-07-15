'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';
import { Search, Filter, TrendingUp, BarChart3, HelpCircle } from 'lucide-react';
import CountryFlag from './CountryFlag';
import ClientIPDisplay from './ClientIPDisplay';
import BannerCard from './BannerCard';
import BannerDisplay from './BannerDisplay';
import { popularCountries, getCountryName } from '@/lib/countries';
import RecentServers from './RecentServers';
import { useBanners } from '@/hooks/useBanners';

interface GameLayoutProps {
  title: string;
  description: string;
  totalServers: number;
  children: ReactNode;
  bgImage?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  countryFilter?: string;
  chronicleFilter?: string;
  onCountryFilterChange?: (country: string) => void;
  onChronicleFilterChange?: (chronicle: string) => void;
  availableCountries?: string[];
  availableChronicles?: string[];
}

export default function GameLayout({ 
  title, 
  description, 
  totalServers, 
  children, 
  bgImage, 
  searchTerm = '', 
  onSearchChange,
  countryFilter = '',
  chronicleFilter = '',
  onCountryFilterChange,
  onChronicleFilterChange,
  availableCountries = [],
  availableChronicles = []
}: GameLayoutProps) {
  const isLineage = title === "Lineage II";
  const { getBannerByPosition, loading: bannersLoading } = useBanners();
  
  // Usar la imagen específica de Lineage II si es el caso
  const headerBgImage = isLineage 
    ? 'https://w0.peakpx.com/wallpaper/738/938/HD-wallpaper-lineage-2-the-chaotic-trone-2013-14-game-10.jpg'
    : bgImage;
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onCountryFilterChange) {
      onCountryFilterChange(e.target.value);
    }
  };

  const handleChronicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChronicleFilterChange) {
      onChronicleFilterChange(e.target.value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      
      {/* Hero Section - Más compacto para dar más espacio al contenido */}
      <div 
        className="flex-shrink-0 h-24 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: headerBgImage ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${headerBgImage})` : 
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="text-center">
          {isLineage ? (
            <div className="flex flex-col items-center">
              <img 
                src="/lineage-ii-logo.png" 
                alt="Lineage II" 
                className="h-10 w-auto mb-1 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
              <p className="text-xs text-slate-200 mb-1">{description}</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h1>
              <p className="text-xs text-slate-200 mb-1">{description}</p>
            </>
          )}
          <div className="flex items-center justify-center space-x-2 text-cyan-400">
            <TrendingUp className="h-3 w-3" />
            <span className="font-semibold text-xs">{totalServers} servers indexed</span>
          </div>
        </div>
      </div>

      {/* Banner Container - 180px de alto con padding */}
      <div className="flex-shrink-0 h-[180px] pt-2 pb-2">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          {/* 2 banners reales con 30px de espacio entre ellos */}
          <div className="flex justify-center items-center gap-[30px]">
            <BannerDisplay
              banner={getBannerByPosition('home-top-1')}
              position="home-top-1"
              dimensions={{ width: 468, height: 60 }}
              showPlaceholder={true}
            />
            <BannerDisplay
              banner={getBannerByPosition('home-top-2')}
              position="home-top-2"
              dimensions={{ width: 468, height: 60 }}
              showPlaceholder={true}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Altura fija para contener el grid de 1200px */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8" style={{ height: '1050px' }}>
        <div className="grid grid-cols-12 gap-6 h-full" style={{ height: '1200px' }}>
          
          {/* Sidebar Left - Más compacto */}
          <div className="col-span-12 lg:col-span-2 space-y-3 overflow-hidden">
            
            {/* Filtros Funcionales */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center">
                <Filter className="mr-1 h-3 w-3" />
                Filtros
              </h3>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">País</label>
                  <select 
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={countryFilter}
                    onChange={handleCountryChange}
                  >
                    <option value="">Todos los países</option>
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>
                        {getCountryName(country)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Crónica</label>
                  <select 
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={chronicleFilter}
                    onChange={handleChronicleChange}
                  >
                    <option value="">Todas las crónicas</option>
                    {availableChronicles.map((chronicle) => (
                      <option key={chronicle} value={chronicle}>
                        {chronicle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Estadísticas Compactas */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center">
                <BarChart3 className="mr-1 h-3 w-3 text-cyan-400" />
                Stats
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Servidores</span>
                  <span className="text-white font-semibold text-xs">{totalServers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Online</span>
                  <span className="text-green-400 font-semibold text-xs">{Math.max(0, totalServers - 2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Jugadores</span>
                  <span className="text-cyan-400 font-semibold text-xs">15,432</span>
                </div>
              </div>
            </div>

            {/* Ayuda Compacta */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center">
                <HelpCircle className="mr-1 h-3 w-3 text-purple-400" />
                Ayuda
              </h3>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium py-1 px-2 rounded-md transition-all duration-300">
                Soporte
              </button>
            </div>

            {/* Módulo de IP Pública */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
              <h3 className="text-xs font-semibold text-white mb-2 flex items-center">
                <TrendingUp className="mr-1 h-3 w-3 text-cyan-400" />
                Tu Conexión
              </h3>
              <div className="flex justify-center">
                <ClientIPDisplay />
              </div>
            </div>
          </div>

          {/* Main Content - Optimizado para mostrar más contenido sin scroll */}
          <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 px-2">
            
            {/* Header de búsqueda - Más compacto */}
            <div className="flex-shrink-0 mb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <h2 className="text-lg font-bold text-white">Top Servers</h2>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar servidores..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-7 pr-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm w-48"
                    />
                  </div>
                  
                  <select className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 text-sm">
                    <option>Por Votos</option>
                    <option>Por Jugadores</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Área de tarjetas con scroll - Altura fija y simple */}
            <div className="flex-1 overflow-hidden">
              {/* Contenedor de scroll con altura fija de 800px */}
              <div 
                className="overflow-y-auto px-4 pt-1 pb-6 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                style={{ 
                  height: '800px'
                }}
              >
                {children}
              </div>
            </div>
          </div>

          {/* Sidebar Right - Más compacto */}
          <div className="col-span-12 lg:col-span-2 space-y-3 overflow-hidden">
            
            {/* Banner Lateral Derecho */}
            <BannerDisplay
              banner={getBannerByPosition('home-sidebar-right')}
              position="home-sidebar-right"
              dimensions={{ width: 280, height: 500 }}
              showPlaceholder={true}
              className="w-full"
            />

            {/* Área de Servidores Recientes con banner integrado */}
            <div className="space-y-2">
              <RecentServers />
              
              {/* Banner en área de servidores recientes */}
              <BannerDisplay
                banner={getBannerByPosition('home-recent-servers')}
                position="home-recent-servers"
                dimensions={{ width: 280, height: 200 }}
                showPlaceholder={true}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}