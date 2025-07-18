'use client'

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';
import { supabase } from '@/lib/supabase';
import { 
  extractUniqueCountries, 
  extractUniqueChronicles, 
  applyAllFilters,
  ServerItem 
} from '@/lib/serverFilters';

interface Server {
  id: string | number;
  name: string;
  title: string;
  description: string;
  country: string;
  chronicle: string;
  serverType: string;
  platform: string;
  players: number;
  votes: number;
  uptime: string;
  exp: string;
  features: string[];
  rank: number;
  isPremium: boolean;
  website?: string;
  ip?: string;
  category?: string;
  slug?: string;
  created_at?: string;
  source?: string;
}

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [servers, setServers] = useState<Server[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [chronicleFilter, setChronicleFilter] = useState('');

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryServers();
    }
  }, [categorySlug]);

  const fetchCategoryServers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener información de la categoría
      const { data: categoryData, error: categoryError } = await supabase
        .from('server_categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (categoryError) {
        throw new Error(`Categoría "${categorySlug}" no encontrada`);
      }

      setCategoryInfo(categoryData);

      // Obtener servidores de esta categoría
      const { data: serversData, error: serversError } = await supabase
        .from('servers')
        .select(`
          id,
          title,
          slug,
          description,
          website,
          country,
          version,
          experience,
          premium,
          status,
          created_at,
          category_id,
          legacy_id,
          ip,
          ip_address,
          experience_rate,
          votes,
          is_premium,
          is_approved,
          server_categories(name, slug)
        `)
        .eq('category_id', categoryData.id)
        .or('approved.eq.true,is_approved.eq.true')
        .in('status', ['online', 'active'])
        .order('votes', { ascending: false });

      if (serversError) throw serversError;

      // Transformar datos para el frontend
      const transformedServers: Server[] = (serversData || []).map((server, index) => ({
        id: server.id,
        name: server.title,
        title: server.title,
        description: server.description || '',
        country: server.country || 'International',
        chronicle: server.version || 'Unknown',
        serverType: 'PvP', // Valor por defecto
        platform: 'L2J', // Valor por defecto
        players: Math.floor(Math.random() * 500) + 100, // Simulado
        votes: server.votes || 0,
        uptime: '99.5%', // Valor por defecto
        exp: server.experience ? `Exp x${server.experience}` : (server.experience_rate ? `Exp x${server.experience_rate}` : 'Exp x1'),
        features: (server.premium || server.is_premium) ? ['Premium', 'VIP'] : ['Normal'],
        rank: index + 1,
        isPremium: server.premium || server.is_premium || false,
        website: server.website,
        ip: server.ip || server.ip_address || '',
        category: server.server_categories?.[0]?.name || categoryData.name,
        slug: server.slug,
        created_at: server.created_at,
        source: server.legacy_id ? 'imported' : 'created'
      }));

      // Ordenar por premium primero, luego por votos
      transformedServers.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return b.votes - a.votes;
      });

      // Actualizar rankings
      transformedServers.forEach((server, index) => {
        server.rank = index + 1;
      });

      setServers(transformedServers);
    } catch (err) {
      console.error('Error fetching category servers:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Convertir servidores al formato ServerItem para filtros
  const serverItems: ServerItem[] = servers.map(server => ({
    id: server.id,
    name: server.name,
    title: server.title,
    description: server.description,
    country: server.country,
    chronicle: server.chronicle,
    serverType: server.serverType,
    platform: server.platform,
    players: server.players,
    votes: server.votes,
    uptime: server.uptime,
    exp: server.exp,
    features: server.features,
    rank: server.rank,
    isPremium: server.isPremium,
    website: server.website,
    ip: server.ip,
    category: server.category,
    slug: server.slug,
    created_at: server.created_at,
    source: server.source
  }));

  // Extraer países y crónicas disponibles
  const availableCountries = useMemo(() => 
    extractUniqueCountries(serverItems), 
    [serverItems]
  );
  
  const availableChronicles = useMemo(() => 
    extractUniqueChronicles(serverItems), 
    [serverItems]
  );
  
  // Aplicar filtros
  const filteredServers = useMemo(() => 
    applyAllFilters(serverItems, searchTerm, countryFilter, chronicleFilter), 
    [serverItems, searchTerm, countryFilter, chronicleFilter]
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
        title={categoryInfo?.name || 'Cargando...'}
        description="Top Servers"
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
        title="Error"
        description="Error al cargar"
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
              {error}
            </h3>
            <button 
              onClick={fetchCategoryServers} 
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
      title={categoryInfo?.name || 'Servidores'}
      description={categoryInfo?.description || 'Top Servers'}
      totalServers={filteredServers.length}
      bgImage={getCategoryBackground(categorySlug)}
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
            {servers.length === 0 
              ? `No hay servidores disponibles para ${categoryInfo?.name || 'esta categoría'}`
              : 'Intenta con otros filtros o limpia los filtros aplicados'
            }
          </p>
          
          {/* Mostrar filtros activos */}
          {servers.length > 0 && (
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
                  Crónica: {chronicleFilter}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </GameLayout>
  );
}

// Helper function to get category-specific backgrounds
function getCategoryBackground(categorySlug: string): string {
  const backgrounds: { [key: string]: string } = {
    'lineage-ii': 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg',
    'lineage-2': 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg',
    'mu-online': 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg',
    'ragnarok-online': 'https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg',
    'aion': 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    'perfect-world': 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
    'counter-strike': 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg',
    'world-of-warcraft': 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    'wow': 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    'silkroad-online': 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
    'minecraft': 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg',
    'metin2': 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg'
  };
  
  return backgrounds[categorySlug] || 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg';
}