'use client'

import GameLayout from '@/components/GameLayout'
import ServerCard from '@/components/ServerCard'
import { useServers } from '@/hooks/useServers'

// Servidores Premium hardcodeados como fallback
const premiumServersHardcoded = [
  {
    id: 101,
    name: 'L2 PREMIUM ELITE',
    description: '🌟 SERVIDOR PREMIUM 🌟 Interlude x50 con eventos únicos, sistema VIP gratuito y soporte 24/7. ¡La mejor experiencia L2!',
    country: 'International',
    chronicle: 'Interlude',
    serverType: 'PvP',
    platform: 'L2J',
    players: 2890,
    votes: 2890,
    uptime: '99.9%',
    exp: 'Exp x50',
    features: ['Premium', 'VIP Free'],
    rank: 'PREMIUM',
    isPremium: true
  },
  {
    id: 102,
    name: 'LEGENDS PREMIUM',
    description: '⭐ SERVIDOR PREMIUM ⭐ High Five con contenido custom, drop mejorado y comunidad activa. ¡Únete a la leyenda!',
    country: 'Spain',
    chronicle: 'High Five',
    serverType: 'Mixed',
    platform: 'L2J',
    players: 2456,
    votes: 2456,
    uptime: '99.8%',
    exp: 'Exp x25',
    features: ['Premium', 'Custom'],
    rank: 'PREMIUM',
    isPremium: true
  },
  {
    id: 103,
    name: 'ROYAL PREMIUM',
    description: '👑 SERVIDOR PREMIUM 👑 Classic con rates balanceados, PvP épico y sistema de recompensas exclusivo. ¡Vive la realeza!',
    country: 'English',
    chronicle: 'Classic',
    serverType: 'PvP',
    platform: 'L2J',
    players: 2123,
    votes: 2123,
    uptime: '99.7%',
    exp: 'Exp x15',
    features: ['Premium', 'Balanced'],
    rank: 'PREMIUM',
    isPremium: true
  }
];

export default function Home() {
  const { premiumServers: apiPremiumServers, normalServers: apiNormalServers, totalServers, loading, error, refetch } = useServers('lineage-ii')

  // Usar servidores de la API si existen, sino usar hardcodeados
  const premiumServers = apiPremiumServers.length > 0 ? apiPremiumServers : premiumServersHardcoded
  const normalServers = apiNormalServers

  if (loading) {
    return (
      <GameLayout
        title="Lineage II"
        description="Top Servers"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando servidores...</p>
          </div>
        </div>
      </GameLayout>
    )
  }

    if (error) {
    return (
      <GameLayout
        title="Lineage II"
        description="Top Servers"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
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
    )
  }

    return (
    <GameLayout
      title="Lineage II"
      description="Top Servers"
      totalServers={totalServers || 450}
      bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
    >
      {/* Sección de Servidores Premium - COMPACTA */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">⭐</span>
            </div>
            <h2 className="text-lg font-bold text-white">Servidores Premium</h2>
            <div className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
              <span className="text-yellow-400 text-xs font-medium">Destacados</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {premiumServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </div>

      {/* Separador Visual Compacto */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-slate-900 px-4 py-1 rounded-full border border-slate-700">
            <span className="text-slate-400 text-xs font-medium">Top Ranking</span>
          </div>
        </div>
      </div>

      {/* Sección de Top Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">#</span>
            </div>
            <h2 className="text-lg font-bold text-white">Top Servers</h2>
            <div className="px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-xs font-medium">Por Votos</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {normalServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </div>
    </GameLayout>
  )
}