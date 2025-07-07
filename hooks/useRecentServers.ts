import { useState, useEffect } from 'react';

interface RecentServer {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  updatedAt: string;
  source: 'user_server' | 'hardcoded';
  timeAgo: string;
}

interface UseRecentServersReturn {
  recentServers: RecentServer[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRecentServers(): UseRecentServersReturn {
  const [recentServers, setRecentServers] = useState<RecentServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/recent-servers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar servidores recientes');
      }

      setRecentServers(data.servers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching recent servers:', err);
      
      // Fallback a datos estáticos si hay error
      setRecentServers([
        {
          id: 'fallback-1',
          title: 'L2 New Era',
          slug: 'l2-new-era',
          categoryName: 'Lineage II',
          categorySlug: 'lineage-ii',
          updatedAt: new Date().toISOString(),
          source: 'hardcoded',
          timeAgo: '1h'
        },
        {
          id: 'fallback-2', 
          title: 'MU Legends',
          slug: 'mu-legends',
          categoryName: 'MU Online',
          categorySlug: 'mu-online',
          updatedAt: new Date().toISOString(),
          source: 'hardcoded',
          timeAgo: '2h'
        },
        {
          id: 'fallback-3',
          title: 'WoW Classic',
          slug: 'wow-classic',
          categoryName: 'World of Warcraft',
          categorySlug: 'wow',
          updatedAt: new Date().toISOString(),
          source: 'hardcoded',
          timeAgo: '3h'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentServers();
  }, []);

  const refetch = () => {
    fetchRecentServers();
  };

  return {
    recentServers,
    loading,
    error,
    refetch
  };
} 