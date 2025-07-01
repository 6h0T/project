import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

const muServers = [
  {
    id: 1,
    name: 'MU Origin',
    description: 'Classic MU Online experience with Season 6 features. Join the ultimate MMORPG adventure!',
    country: 'Brazil',
    chronicle: 'Season 6',
    serverType: 'PvP',
    platform: 'MU',
    players: 3200,
    votes: 3200,
    uptime: '99.9%',
    exp: 'Exp x100',
    features: ['Season 6', 'PvP', 'Brazilian'],
    rank: 1
  },
  {
    id: 2,
    name: 'MU Legends',
    description: 'High-rate MU server with balanced gameplay and amazing drop rates. Perfect for fast-paced gaming!',
    country: 'International',
    chronicle: 'Season 4',
    serverType: 'Mixed',
    platform: 'MU',
    players: 1850,
    votes: 1850,
    uptime: '98.7%',
    exp: 'Exp x999',
    features: ['Season 4', 'High Rate', 'International'],
    rank: 2
  },
  {
    id: 3,
    name: 'MU Revolution',
    description: 'New MU Online server with custom features and active administration. Join our growing community!',
    country: 'Spain',
    chronicle: 'Season 2',
    serverType: 'PvE',
    platform: 'MU',
    players: 720,
    votes: 720,
    uptime: '96.8%',
    exp: 'Exp x50',
    features: ['Season 2', 'Custom', 'Spanish'],
    rank: 3
  }
];

export default function MuOnlinePage() {
  return (
    <GameLayout
      title="Mu Online"
      description="Enter the World of MU"
      totalServers={165}
      bgImage="https://images.pexels.com/photos/735911/pexels-photo-735911.jpeg"
    >
      {muServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}