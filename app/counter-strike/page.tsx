import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

const csServers = [
  {
    id: 1,
    name: 'CS Legends',
    description: 'Premium Counter-Strike 1.6 server with custom maps and active moderation. Join the legends!',
    country: 'International',
    chronicle: 'CS 1.6',
    serverType: 'PvP',
    platform: 'Steam',
    players: 2800,
    votes: 2800,
    uptime: '99.7%',
    exp: 'Classic',
    features: ['CS 1.6', 'Custom Maps', 'Active Mods'],
    rank: 1
  },
  {
    id: 2,
    name: 'Strike Zone',
    description: 'Competitive Counter-Strike Source server with ranked matches and tournaments. Show your skills!',
    country: 'English',
    chronicle: 'CS Source',
    serverType: 'Competitive',
    platform: 'Steam',
    players: 1920,
    votes: 1920,
    uptime: '98.9%',
    exp: 'Competitive',
    features: ['CS Source', 'Ranked', 'Tournaments'],
    rank: 2
  },
  {
    id: 3,
    name: 'Global Offensive Hub',
    description: 'CS:GO community server with custom game modes and friendly atmosphere. All skill levels welcome!',
    country: 'International',
    chronicle: 'CS:GO',
    serverType: 'Mixed',
    platform: 'Steam',
    players: 1560,
    votes: 1560,
    uptime: '97.8%',
    exp: 'Casual',
    features: ['CS:GO', 'Custom Modes', 'Community'],
    rank: 3
  }
];

export default function CounterStrikePage() {
  return (
    <GameLayout
      title="Counter Strike"
      description="Join the Battle"
      totalServers={320}
      bgImage="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg"
    >
      {csServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}