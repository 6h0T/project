'use client'

import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';
import { useServers } from '@/hooks/useServers';

export default function WoWPage() {
  const { normalServers, totalServers, loading, error, refetch } = useServers('wow');

  if (loading) {
    return (
      <GameLayout
        title="World of Warcraft"
        description="Enter the World of Azeroth"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg"
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
        title="World of Warcraft"
        description="Enter the World of Azeroth"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg"
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
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
      title="World of Warcraft"
      description="Enter the World of Azeroth"
      totalServers={totalServers || 189}
      bgImage="https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg"
    >
      {normalServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}