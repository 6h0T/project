import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

const aionServers = [
  {
    id: 1,
    name: 'Aion Legacy',
    description: 'Classic Aion experience with enhanced features. Join thousands of players in epic battles across Atreia!',
    country: 'International',
    chronicle: 'Classic',
    serverType: 'PvP',
    platform: 'Aion',
    players: 2150,
    votes: 2150,
    uptime: '99.8%',
    exp: 'Exp x3',
    features: ['Classic', 'PvP', 'International'],
    rank: 1
  },
  {
    id: 2,
    name: 'Atreia Rising',
    description: 'New server with balanced gameplay and active community. Perfect for both new and veteran players.',
    country: 'English',
    chronicle: 'Classic',
    serverType: 'Mixed',
    platform: 'Aion',
    players: 890,
    votes: 890,
    uptime: '98.5%',
    exp: 'Exp x2',
    features: ['English', 'Balanced', 'Community'],
    rank: 2
  },
  {
    id: 3,
    name: 'Wings of Destiny',
    description: 'High-rate Aion server with custom content and events. Experience Aion like never before!',
    country: 'Germany',
    chronicle: 'Classic',
    serverType: 'PvE',
    platform: 'Aion',
    players: 567,
    votes: 567,
    uptime: '97.2%',
    exp: 'Exp x5',
    features: ['German', 'Custom', 'Events'],
    rank: 3
  }
];

export default function AionPage() {
  return (
    <GameLayout
      title="Aion Online"
      description="Soar Through Atreia"
      totalServers={85}
      bgImage="https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg"
    >
      {aionServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}