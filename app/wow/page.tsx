import GameLayout from '@/components/GameLayout';
import ServerCard from '@/components/ServerCard';

const wowServers = [
  {
    id: 1,
    name: 'Azeroth Reborn',
    description: 'Vanilla World of Warcraft experience with Blizzlike gameplay and active community of 3000+ players.',
    country: 'International',
    chronicle: 'Vanilla',
    serverType: 'PvP',
    platform: 'WoW',
    players: 3500,
    votes: 3500,
    uptime: '99.8%',
    exp: 'Blizzlike',
    features: ['Vanilla', 'Blizzlike', 'High Pop'],
    rank: 1
  },
  {
    id: 2,
    name: 'Burning Crusade Legacy',
    description: 'The Burning Crusade expansion with enhanced features and bug fixes. Relive the classic experience!',
    country: 'English',
    chronicle: 'TBC',
    serverType: 'PvE',
    platform: 'WoW',
    players: 2100,
    votes: 2100,
    uptime: '98.5%',
    exp: 'x1',
    features: ['TBC', 'Enhanced', 'Bug Fixes'],
    rank: 2
  },
  {
    id: 3,
    name: 'Wrath of the Lich King+',
    description: 'WotLK server with custom content and quality of life improvements. Experience Northrend again!',
    country: 'International',
    chronicle: 'WotLK',
    serverType: 'Mixed',
    platform: 'WoW',
    players: 1800,
    votes: 1800,
    uptime: '97.9%',
    exp: 'x2',
    features: ['WotLK', 'Custom', 'QoL'],
    rank: 3
  }
];

export default function WowPage() {
  return (
    <GameLayout
      title="World of Warcraft"
      description="For Azeroth!"
      totalServers={275}
      bgImage="https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg"
    >
      {wowServers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </GameLayout>
  );
}