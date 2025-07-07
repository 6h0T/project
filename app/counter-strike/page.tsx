'use client'

import { useState, useMemo } from 'react';
import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';
import { useServers } from '@/hooks/useServers';
import { 
  extractUniqueCountries, 
  extractUniqueChronicles, 
  applyAllFilters,
  ServerItem 
} from '@/lib/serverFilters'

export default function CounterStrikePage() {
  const { premiumServers, normalServers, totalServers, loading, error, refetch } = useServers('counter-strike');
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [chronicleFilter, setChronicleFilter] = useState('');

  // Combinar todos los servidores
  const allServers: ServerItem[] = [...premiumServers, ...normalServers];
  
  // Extraer países y crónicas disponibles de todos los servidores
  const availableCountries = useMemo(() => 
    extractUniqueCountries(allServers), 
    [allServers]
  );
  
  const availableChronicles = useMemo(() => 
    extractUniqueChronicles(allServers), 
    [allServers]
  );
  
  // Aplicar todos los filtros
  const filteredServers = useMemo(() => 
    applyAllFilters(allServers, searchTerm, countryFilter, chronicleFilter), 
    [allServers, searchTerm, countryFilter, chronicleFilter]
  );

  // Separar servidores filtrados en premium y normales
  const filteredPremiumServers = filteredServers.filter(server => server.isPremium);
  const filteredNormalServers = filteredServers.filter(server => !server.isPremium);

  // Handlers para cambios de filtros
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleCountryFilterChange = (country: string) => {
    setCountryFilter(country);
  };

  const handleChronicleFilterChange = (chronicle: string) => {
    setChronicleFilter(chronicle);
  };

  if (loading) {
    return (
      <GameLayout
        title="Counter-Strike"
        description="Global Offensive"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        countryFilter={countryFilter}
        chronicleFilter={chronicleFilter}
        onCountryFilterChange={handleCountryFilterChange}
        onChronicleFilterChange={handleChronicleFilterChange}
        availableCountries={availableCountries}
        availableChronicles={availableChronicles}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando servidores...</p>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (error) {
    return (
      <GameLayout
        title="Counter-Strike"
        description="Global Offensive"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        countryFilter={countryFilter}
        chronicleFilter={chronicleFilter}
        onCountryFilterChange={handleCountryFilterChange}
        onChronicleFilterChange={handleChronicleFilterChange}
        availableCountries={availableCountries}
        availableChronicles={availableChronicles}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center max-w-2xl">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Error al cargar servidores
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout
      title="Counter-Strike"
      description="Global Offensive"
      totalServers={filteredServers.length}
      bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      countryFilter={countryFilter}
      chronicleFilter={chronicleFilter}
      onCountryFilterChange={handleCountryFilterChange}
      onChronicleFilterChange={handleChronicleFilterChange}
      availableCountries={availableCountries}
      availableChronicles={availableChronicles}
    >
      {filteredServers.length > 0 ? (
        <>
          {/* Servidores Premium */}
          {filteredPremiumServers.map((server, index) => (
            <ServerCard 
              key={`premium-${server.id}`} 
              server={server as any} 
              rank={index + 1}
            />
          ))}
          
          {/* Servidores Normales */}
          {filteredNormalServers.map((server, index) => (
            <ServerCard 
              key={`normal-${server.id}`} 
              server={server as any} 
              rank={filteredPremiumServers.length + index + 1}
            />
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-slate-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No se encontraron servidores
          </h3>
          <p className="text-slate-400 mb-4">
            Intenta con otros filtros o limpia los filtros aplicados
          </p>
          
          {/* Mostrar filtros activos */}
          <div className="flex flex-wrap gap-2 justify-center">
            {searchTerm && (
              <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                Búsqueda: "{searchTerm}"
              </span>
            )}
            {countryFilter && (
              <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                País: {countryFilter}
              </span>
            )}
            {chronicleFilter && (
              <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                Versión: {chronicleFilter}
              </span>
            )}
          </div>
        </div>
      )}
    </GameLayout>
  );
}