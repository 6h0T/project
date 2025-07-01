import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

// Servidores Premium (primeras 3 posiciones) - COMPACTOS
const premiumServers = [
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

// Top Servers Normales (posiciones 1, 2, 3)
const topServers = [
  {
    id: 1,
    name: 'L2JADE',
    description: 'Interlude x30 Sub acumulativas base +1 No custom Ofrecemos un servidor de calidad No esperes mas unete ahora mismo!',
    country: 'Spain',
    chronicle: 'Interlude',
    serverType: 'PvP',
    platform: 'L2J',
    players: 1644,
    votes: 1644,
    uptime: '99.5%',
    exp: 'Exp x30',
    features: ['Stacksub', 'L2J'],
    rank: 1,
    isPremium: false
  },
  {
    id: 2,
    name: 'DARK DRAGON',
    description: 'DARK DRAGON *NEW ERA* LONG TERM HIGH FIVE SERVER A new era begins... The concept is based as a long-running non P2W, emulating the...',
    country: 'International',
    chronicle: 'High Five',
    serverType: 'Mixed',
    platform: 'L2J',
    players: 173,
    votes: 173,
    uptime: '98.2%',
    exp: 'Exp x2',
    features: ['High Five', 'Normal'],
    rank: 2,
    isPremium: false
  },
  {
    id: 3,
    name: 'MASTER OF LINEAGE',
    description: 'Master of Lineage 2 Server! XP / SP / Drop / Spoil = x20 Adena = x30 Raid Drop = x3 Quest Drop = x10 Quest Reward = x10 Manor = x15 Party XP/SP Multiplier',
    country: 'English',
    chronicle: 'High Five',
    serverType: 'PvE',
    platform: 'L2J',
    players: 154,
    votes: 154,
    uptime: '97.8%',
    exp: 'Exp x20',
    features: ['English', 'Normal'],
    rank: 3,
    isPremium: false
  },
  {
    id: 4,
    name: 'L2KINGDOMS',
    description: '#U3Games #L2Kingdoms | High Five | Multi-Lang | VIP FREE Las leyendas nunca mueren! Disfruta de nuestro nuevo servidor en modo clasico o pvp, tu eliges!',
    country: 'Spain',
    chronicle: 'High Five',
    serverType: 'PvP',
    platform: 'L2J',
    players: 29,
    votes: 29,
    uptime: '95.1%',
    exp: 'Exp x10',
    features: ['Spanish', 'Normal'],
    rank: 4,
    isPremium: false
  },
  {
    id: 5,
    name: 'L2CRIPTO.COM',
    description: 'L2Crypto.com is the first server with MARKETPLACE where you can post all your items and characters for sale or buy them with REAL MONEY',
    country: 'Spain',
    chronicle: 'Interlude',
    serverType: 'Mixed',
    platform: 'L2J',
    players: 20,
    votes: 20,
    uptime: '92.3%',
    exp: 'Exp x1',
    features: ['Spanish', 'Normal'],
    rank: 5,
    isPremium: false
  },
  {
    id: 6,
    name: 'LINEAGE REVOLUTION',
    description: 'Nuevo servidor con sistema de clanes mejorado, eventos automáticos y sistema anti-bot avanzado. ¡Únete a la revolución!',
    country: 'International',
    chronicle: 'Gracia',
    serverType: 'PvP',
    platform: 'L2J',
    players: 89,
    votes: 89,
    uptime: '96.5%',
    exp: 'Exp x7',
    features: ['Gracia', 'Anti-Bot'],
    rank: 6,
    isPremium: false
  },
  {
    id: 7,
    name: 'ETERNAL LINEAGE',
    description: 'Servidor de larga duración con economía estable, drops balanceados y comunidad madura. Perfecto para jugadores serios.',
    country: 'Brazil',
    chronicle: 'Freya',
    serverType: 'Mixed',
    platform: 'L2J',
    players: 156,
    votes: 156,
    uptime: '98.1%',
    exp: 'Exp x5',
    features: ['Brazilian', 'Stable'],
    rank: 7,
    isPremium: false
  },
  {
    id: 8,
    name: 'PHOENIX RISING',
    description: 'Renace como un fénix en este servidor con sistema de reencarnación único, mascotas evolucionables y dungeons exclusivos.',
    country: 'Russia',
    chronicle: 'High Five',
    serverType: 'PvE',
    platform: 'L2J',
    players: 234,
    votes: 234,
    uptime: '97.3%',
    exp: 'Exp x12',
    features: ['Russian', 'Custom'],
    rank: 8,
    isPremium: false
  }
];

export default function Home() {
  return (
    <GameLayout
      title="Lineage II"
      description="Top Servers"
      totalServers={450}
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
          {topServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </div>
    </GameLayout>
  );
}