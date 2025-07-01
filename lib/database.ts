import { supabase } from './supabase';

// Tipos para la base de datos
export interface Server {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  website: string | null;
  ip: string;
  country: string | null;
  language: string;
  version: string | null;
  experience: number | null;
  maxLevel: number | null;
  status: string;
  premium: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  userId: number;
  category?: Category;
  user?: User;
  _count?: { votes: number };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: { servers: number };
}

export interface User {
  id: number;
  nickname: string;
  email: string;
}

export interface Vote {
  id: number;
  ip: string;
  count: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  serverId: number;
  userId: number | null;
}

// Funciones para manejar servidores
export async function getServers() {
  try {
    // Crear tabla servers si no existe
    const { error: createError } = await supabase.rpc('create_servers_table');
    
    // Obtener servidores con datos de ejemplo
    const servers: Server[] = [
      {
        id: 1,
        title: 'L2JADE',
        slug: 'l2jade',
        description: 'Interlude x30 Sub acumulativas base +1 No custom Ofrecemos un servidor de calidad No esperes mas unete ahora mismo!',
        website: 'https://l2jade.com',
        ip: '192.168.1.100:7777',
        country: 'Spain',
        language: 'es',
        version: 'Interlude',
        experience: 30,
        maxLevel: 80,
        status: 'online',
        premium: true,
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: 1,
        userId: 1,
        category: { id: 1, name: 'Lineage 2', slug: 'lineage-2' },
        user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
        _count: { votes: 1644 }
      },
      {
        id: 2,
        title: 'DARK DRAGON',
        slug: 'dark-dragon',
        description: 'DARK DRAGON *NEW ERA* LONG TERM HIGH FIVE SERVER A new era begins... The concept is based as a long-running non P2W, emulating the...',
        website: 'https://darkdragon.com',
        ip: '192.168.1.101:7777',
        country: 'International',
        language: 'en',
        version: 'High Five',
        experience: 2,
        maxLevel: 85,
        status: 'online',
        premium: false,
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: 1,
        userId: 1,
        category: { id: 1, name: 'Lineage 2', slug: 'lineage-2' },
        user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
        _count: { votes: 173 }
      },
      {
        id: 3,
        title: 'MASTER OF LINEAGE',
        slug: 'master-of-lineage',
        description: 'Master of Lineage 2 Server! XP / SP / Drop / Spoil = x20 Adena = x30 Raid Drop = x3 Quest Drop = x10 Quest Reward = x10 Manor = x15 Party XP/SP Multiplier',
        website: 'https://masterlineage.com',
        ip: '192.168.1.102:7777',
        country: 'English',
        language: 'en',
        version: 'High Five',
        experience: 20,
        maxLevel: 85,
        status: 'online',
        premium: false,
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: 1,
        userId: 1,
        category: { id: 1, name: 'Lineage 2', slug: 'lineage-2' },
        user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
        _count: { votes: 154 }
      },
      {
        id: 4,
        title: 'L2KINGDOMS',
        slug: 'l2kingdoms',
        description: '#U3Games #L2Kingdoms | High Five | Multi-Lang | VIP FREE Las leyendas nunca mueren! Disfruta de nuestro nuevo servidor en modo clasico o pvp, tu eliges!',
        website: 'https://l2kingdoms.com',
        ip: '192.168.1.103:7777',
        country: 'Spain',
        language: 'es',
        version: 'High Five',
        experience: 10,
        maxLevel: 85,
        status: 'online',
        premium: false,
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: 1,
        userId: 1,
        category: { id: 1, name: 'Lineage 2', slug: 'lineage-2' },
        user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
        _count: { votes: 29 }
      },
      {
        id: 5,
        title: 'L2CRIPTO.COM',
        slug: 'l2cripto-com',
        description: 'L2Crypto.com is the first server with MARKETPLACE where you can post all your items and characters for sale or buy them with REAL MONEY',
        website: 'https://l2cripto.com',
        ip: '192.168.1.104:7777',
        country: 'Spain',
        language: 'es',
        version: 'Interlude',
        experience: 1,
        maxLevel: 80,
        status: 'online',
        premium: false,
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: 1,
        userId: 1,
        category: { id: 1, name: 'Lineage 2', slug: 'lineage-2' },
        user: { id: 1, nickname: 'Admin', email: 'admin@test.com' },
        _count: { votes: 20 }
      }
    ];

    return { data: servers, error: null };
  } catch (error) {
    console.error('Error getting servers:', error);
    return { data: [], error };
  }
}

export async function getServerById(id: number) {
  try {
    const { data: servers } = await getServers();
    const server = servers.find(s => s.id === id);
    return { data: server || null, error: null };
  } catch (error) {
    console.error('Error getting server by ID:', error);
    return { data: null, error };
  }
}

export async function getCategories() {
  try {
    const categories: Category[] = [
      { id: 1, name: 'Lineage 2', slug: 'lineage-2', _count: { servers: 5 } },
      { id: 2, name: 'MU Online', slug: 'mu-online', _count: { servers: 3 } },
      { id: 3, name: 'World of Warcraft', slug: 'world-of-warcraft', _count: { servers: 2 } },
      { id: 4, name: 'Aion Online', slug: 'aion-online', _count: { servers: 1 } },
      { id: 5, name: 'Perfect World', slug: 'perfect-world', _count: { servers: 1 } },
    ];

    return { data: categories, error: null };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { data: [], error };
  }
}

// Funciones para manejar votos
export async function createVote(data: {
  ip: string;
  serverId: number;
  userId?: string | null;
}) {
  try {
    // Simular creación de voto
    const vote: Vote = {
      id: Math.floor(Math.random() * 1000),
      ip: data.ip,
      count: 1,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverId: data.serverId,
      userId: data.userId ? parseInt(data.userId) : null
    };

    return { data: vote, error: null };
  } catch (error) {
    console.error('Error creating vote:', error);
    return { data: null, error };
  }
}

export async function getVoteByIpAndServer(ip: string, serverId: number): Promise<{ data: Vote | null; error: any }> {
  try {
    // Simular búsqueda de voto existente
    // Para propósitos de demostración, simular que existe un voto para una IP específica
    if (ip === '192.168.1.1' && serverId === 1) {
      const mockVote: Vote = {
        id: 1,
        ip: ip,
        count: 1,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
        updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
        serverId: serverId,
        userId: null
      };
      return { data: mockVote, error: null };
    }
    
    // En una implementación real, esto buscaría en la base de datos
    return { data: null, error: null };
  } catch (error) {
    console.error('Error getting vote:', error);
    return { data: null, error };
  }
}

export async function updateVote(id: number, data: Partial<Vote>) {
  try {
    // Simular actualización de voto
    return { data: { ...data, id }, error: null };
  } catch (error) {
    console.error('Error updating vote:', error);
    return { data: null, error };
  }
}

export async function getVoteCountByServer(serverId: number) {
  try {
    // Simular conteo de votos
    const { data: servers } = await getServers();
    const server = servers.find(s => s.id === serverId);
    return { data: server?._count?.votes || 0, error: null };
  } catch (error) {
    console.error('Error getting vote count:', error);
    return { data: 0, error };
  }
}

// Función para obtener estadísticas
export async function getStats() {
  try {
    const stats = {
      totalServers: 5,
      approvedServers: 5,
      totalVotes: 2020,
      categories: 5
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { data: null, error };
  }
}