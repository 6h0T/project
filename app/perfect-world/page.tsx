import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

const pwServers = [
  {
    id: 1,
    name: 'Perfect World Reborn',
    description: 'Classic Perfect World International experience with enhanced graphics and improved gameplay mechanics.',
    country: 'International',
    chronicle: 'Classic',
    serverType: 'PvP',
    platform: 'PWI',
    players: 1450,
    votes: 1450,
    uptime: '99.3%',
    exp: 'Exp x2',
    features: ['Classic', 'PvP', 'Enhanced'],
    rank: 1
  },
  {
    id: 2,
    name: 'Mystic Realms',
    description: 'High-rate Perfect World server with custom content and regular events. Explore the perfect world!',
    country: 'English',
    chronicle: 'Rising Tide',
    serverType: 'Mixed',
    platform: 'PWI',
    players: 980,
    votes: 980,
    uptime: '98.1%',
    exp: 'Exp x5',
    features: ['Rising Tide', 'Custom', 'Events'],
    rank: 2
  },
  {
    id: 3,
    name: 'Celestial Dynasty',
    description: 'Balanced Perfect World server focusing on teamwork and guild wars. Build your dynasty today!',
    country: 'International',
    chronicle: 'Genesis',
    serverType: 'PvE',
    platform: 'PWI',
    players: 640,
    votes: 640,
    uptime: '97.5%',
    exp: 'Exp x3',
    features: ['Genesis', 'Guild Wars', 'Balanced'],
    rank: 3
  }
];

export default function PerfectWorldPage() {
  return (
    <GameLayout
      title="Perfect World"
      description="Discover Your Perfect World"
      totalServers={92}
      bgImage="https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg"
    >
      {pwServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}