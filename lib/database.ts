import { supabase } from './supabase';
import { validateServer, canAutoApprove, logValidationResult, type ServerForValidation } from './serverValidation';

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

// Nuevas interfaces para servidores de usuario
export interface UserServer {
  id: string;
  user_id: string;
  category_id: number | null;
  title: string;
  slug: string;
  description: string | null;
  website: string | null;
  country: string | null;
  language: string;
  version: string | null;
  experience: number | null;
  max_level: number | null;
  status: 'online' | 'offline' | 'maintenance' | 'pending' | 'rejected';
  premium: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
  category?: ServerCategory;
}

export interface ServerCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserServerData {
  title: string;
  description?: string;
  website?: string;
  country?: string;
  language?: string;
  version?: string;
  experience?: number;
  max_level?: number;
  category_id?: number;
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
      { id: 3, name: 'Perfect World', slug: 'perfect-world', _count: { servers: 2 } },
      { id: 4, name: 'Ragnarok Online', slug: 'ragnarok-online', _count: { servers: 4 } },
      { id: 5, name: 'Silkroad', slug: 'silkroad', _count: { servers: 1 } },
      { id: 6, name: 'Aion', slug: 'aion', _count: { servers: 2 } },
    ];

    return { data: categories, error: null };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { data: [], error };
  }
}

// ============================================================================
// FUNCIONES PARA SERVIDORES DE USUARIO
// ============================================================================

export async function getServerCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('server_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching server categories:', error);
      return { data: [], error };
    }

    return { data: categories || [], error: null };
  } catch (error) {
    console.error('Error getting server categories:', error);
    return { data: [], error };
  }
}

export async function getUserServers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_servers')
      .select(`
        *,
        category:server_categories(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user servers:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting user servers:', error);
    return { data: [], error };
  }
}

// Función para generar ID único - VERSIÓN TEMPORAL
// TODO: Cambiar después de aplicar migración de base de datos
function generateServerId(): string {
  // TEMPORAL: Generar solo 6 dígitos para compatibilidad con VARCHAR(6)
  // Después de aplicar migración, usar: `${baseId}_${timestamp}`
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createUserServer(userId: string, serverData: CreateUserServerData) {
  try {
    console.log(`[CREATE_SERVER] 🚀 Iniciando creación de servidor para usuario ${userId}`);
    console.log(`[CREATE_SERVER] Datos del servidor:`, serverData);

    // ===================================
    // 1. VALIDAR SERVIDOR ANTES DE CREAR
    // ===================================
    const serverForValidation: ServerForValidation = {
      title: serverData.title,
      description: serverData.description,
      website: serverData.website,
      language: serverData.language || 'es',
      category_id: serverData.category_id,
      source: 'user_server'
    };

    const validation = validateServer(serverForValidation);
    logValidationResult(serverForValidation, validation);

    // ===================================
    // 2. GENERAR ID Y SLUG ÚNICOS
    // ===================================
    let serverId = generateServerId();
    
    // Verificar que el ID no exista (aunque las probabilidades son muy bajas)
    while (true) {
      const { data: existingServer } = await supabase
        .from('user_servers')
        .select('id')
        .eq('id', serverId)
        .single();
      
      if (!existingServer) break;
      serverId = generateServerId();
    }

    // Generar slug único
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_server_slug', { 
        server_title: serverData.title, 
        user_id: userId 
      });

    let slug = slugData;
    if (slugError) {
      console.error('Error generating slug:', slugError);
      // Fallback: generar slug simple
      const baseSlug = serverData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      slug = `${baseSlug}-${Date.now()}`;
    }

    // ===================================
    // 3. DETERMINAR ESTADO INICIAL BASADO EN VALIDACIÓN
    // ===================================
    const initialStatus = validation.canAutoApprove ? 'online' : 'pending';
    const isApproved = validation.canAutoApprove;

    console.log(`[CREATE_SERVER] 🔍 Resultado de validación:`);
    console.log(`[CREATE_SERVER] - Score: ${validation.score}%`);
    console.log(`[CREATE_SERVER] - Auto-aprobable: ${validation.canAutoApprove ? '✅ SÍ' : '❌ NO'}`);
    console.log(`[CREATE_SERVER] - Estado inicial: ${initialStatus}`);
    console.log(`[CREATE_SERVER] - Aprobado: ${isApproved}`);

    // ===================================
    // 4. CREAR SERVIDOR CON ESTADO APROPIADO
    // ===================================
    const { data, error } = await supabase
      .from('user_servers')
      .insert({
        id: serverId,
        user_id: userId,
        slug: slug,
        approved: isApproved,  // ← Auto-aprobar si cumple requisitos
        status: initialStatus, // ← 'online' si auto-aprobado, 'pending' si no
        ...serverData
      })
      .select()
      .single();

    if (error) {
      console.error('[CREATE_SERVER] ❌ Error creando servidor:', error);
      return { data: null, error, validation };
    }

    // ===================================
    // 5. LOGGING Y NOTIFICACIONES
    // ===================================
    if (isApproved) {
      console.log(`[CREATE_SERVER] 🎉 SERVIDOR AUTO-APROBADO`);
      console.log(`[CREATE_SERVER] - ID: ${serverId}`);
      console.log(`[CREATE_SERVER] - Título: ${serverData.title}`);
      console.log(`[CREATE_SERVER] - Score de validación: ${validation.score}%`);
      console.log(`[CREATE_SERVER] - Ya disponible para votación y listado público`);
    } else {
      console.log(`[CREATE_SERVER] ⏳ SERVIDOR PENDIENTE DE REVISIÓN`);
      console.log(`[CREATE_SERVER] - ID: ${serverId}`);
      console.log(`[CREATE_SERVER] - Título: ${serverData.title}`);
      console.log(`[CREATE_SERVER] - Score: ${validation.score}% (necesita ≥80%)`);
      console.log(`[CREATE_SERVER] - Issues:`, validation.issues);
      console.log(`[CREATE_SERVER] - Requiere revisión manual o mejoras del usuario`);
    }

    return { 
      data, 
      error: null, 
      validation,
      autoApproved: isApproved,
      message: isApproved 
        ? `¡Servidor aprobado automáticamente! Ya está disponible para votación.`
        : `Servidor creado pero requiere revisión. Score: ${validation.score}% (necesita ≥80%)`
    };
    
  } catch (error) {
    console.error('[CREATE_SERVER] ❌ Error general creando servidor:', error);
    return { 
      data: null, 
      error,
      validation: null,
      autoApproved: false,
      message: 'Error interno del servidor'
    };
  }
}

export async function updateUserServer(serverId: string, serverData: Partial<CreateUserServerData>) {
  try {
    const { data, error } = await supabase
      .from('user_servers')
      .update(serverData)
      .eq('id', serverId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user server:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user server:', error);
    return { data: null, error };
  }
}

export async function deleteUserServer(serverId: string) {
  try {
    const { error } = await supabase
      .from('user_servers')
      .delete()
      .eq('id', serverId);

    if (error) {
      console.error('Error deleting user server:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting user server:', error);
    return { error };
  }
}

export async function getUserServerById(serverId: string) {
  try {
    const { data, error } = await supabase
      .from('user_servers')
      .select(`
        *,
        category:server_categories(*)
      `)
      .eq('id', serverId)
      .single();

    if (error) {
      console.error('Error fetching user server:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user server by ID:', error);
    return { data: null, error };
  }
}

// ============================================================================
// FUNCIONES ORIGINALES DE VOTOS
// ============================================================================

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
      userId: data.userId ? parseInt(data.userId) : null,
    };

    return { data: vote, error: null };
  } catch (error) {
    console.error('Error creating vote:', error);
    return { data: null, error };
  }
}

export async function getVoteByIpAndServer(ip: string, serverId: number): Promise<{ data: Vote | null; error: any }> {
  try {
    // Simular verificación de voto existente
    // En una implementación real, aquí consultarías la base de datos
    const existingVote = Math.random() > 0.7; // 30% de probabilidad de voto existente
    
    if (existingVote) {
      const vote: Vote = {
        id: Math.floor(Math.random() * 1000),
        ip,
        count: 1,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
        updatedAt: new Date().toISOString(),
        serverId,
        userId: null,
      };
      return { data: vote, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error getting vote by IP and server:', error);
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
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Simular conteo de votos
    const count = Math.floor(Math.random() * 1000) + 50;
    
    return { data: { count, month: currentMonth, year: currentYear }, error: null };
  } catch (error) {
    console.error('Error getting vote count:', error);
    return { data: null, error };
  }
}

export async function getStats() {
  try {
    const stats = {
      totalServers: 15,
      totalVotes: 5234,
      activeUsers: 1247,
      monthlyVotes: 3456
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { data: null, error };
  }
}

// ============================================================================
// FUNCIONES UNIFICADAS PARA TODOS LOS SERVIDORES
// ============================================================================

// Interfaz unificada para cualquier tipo de servidor
export interface UnifiedServer {
  id: string | number;
  title: string;
  slug: string;
  description: string | null;
  website: string | null;
  ip?: string; // Opcional para compatibilidad
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
  categoryId?: number;
  category_id?: number;
  userId?: number;
  user_id?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
  };
  user?: {
    id: number | string;
    nickname?: string;
    email?: string;
  };
  _count?: {
    votes: number;
  };
  // Campos específicos para identificar el tipo
  source: 'hardcoded' | 'user_server';
}

// Función helper para obtener votos reales de un servidor
export async function getRealVoteCount(serverId: string | number, serverType: string = 'user_server'): Promise<number> {
  try {
    const { data: voteCount, error } = await supabase
      .rpc('get_server_vote_count', {
        p_server_id: serverId.toString(),
        p_server_type: serverType
      });

    if (error) {
      console.error('Error obteniendo votos reales:', error);
      return 0;
    }

    return voteCount || 0;
  } catch (error) {
    console.error('Error en getRealVoteCount:', error);
    return 0;
  }
}

// Función para normalizar un servidor hardcodeado a la interfaz unificada
function normalizeHardcodedServer(server: Server): UnifiedServer {
  return {
    ...server,
    source: 'hardcoded',
    updatedAt: server.updatedAt || server.createdAt
  };
}

// Función para normalizar un servidor de usuario a la interfaz unificada
function normalizeUserServer(server: UserServer): UnifiedServer {
  return {
    id: server.id,
    title: server.title,
    slug: server.slug,
    description: server.description,
    website: server.website,
    country: server.country,
    language: server.language,
    version: server.version,
    experience: server.experience,
    maxLevel: server.max_level,
    status: server.status,
    premium: server.premium,
    approved: server.approved,
    createdAt: server.created_at,
    updatedAt: server.updated_at,
    categoryId: server.category_id ?? undefined,
    category_id: server.category_id ?? undefined,
    user_id: server.user_id,
    category: server.category ? {
      id: server.category.id,
      name: server.category.name,
      slug: server.category.slug,
      icon: server.category.icon || undefined
    } : undefined,
    _count: {
      votes: 0 // Se actualizará con votos reales donde se use
    },
    source: 'user_server'
  };
}

// Función unificada para buscar cualquier servidor por ID
export async function getAnyServerById(serverId: string): Promise<{ data: UnifiedServer | null; error: any }> {
  try {
    // Primero intentar como ID de user_server (string alfanumérico)
    // Eliminamos la restricción de longitud y formato numérico
    const { data: userServer, error: userError } = await getUserServerById(serverId);
    
    if (!userError && userServer && userServer.approved) {
      const normalizedServer = normalizeUserServer(userServer);
      
      // Obtener votos reales
      const realVotes = await getRealVoteCount(serverId, 'user_server');
      normalizedServer._count = { votes: realVotes };
      
      return { 
        data: normalizedServer, 
        error: null 
      };
    }

    // Si no se encontró como user_server, intentar buscar en la base de datos de Supabase
    try {
      const { data: supabaseServer, error: supabaseError } = await supabase
        .from('servers')
        .select(`
          *,
          server_categories(id, name, slug)
        `)
        .eq('id', serverId)
        .single();

      if (!supabaseError && supabaseServer) {
        // Obtener votos reales
        const realVotes = await getRealVoteCount(serverId, 'hardcoded');
        
        // Normalizar servidor de Supabase a UnifiedServer
        const normalizedSupabaseServer: UnifiedServer = {
          id: supabaseServer.id,
          title: supabaseServer.title,
          slug: supabaseServer.slug,
          description: supabaseServer.description,
          website: supabaseServer.website,
          ip: supabaseServer.ip,
          country: supabaseServer.country,
          language: supabaseServer.language,
          version: supabaseServer.version,
          experience: supabaseServer.experience,
          maxLevel: supabaseServer.max_level,
          status: supabaseServer.status,
          premium: supabaseServer.premium,
          approved: supabaseServer.approved,
          createdAt: supabaseServer.created_at,
          updatedAt: supabaseServer.updated_at,
          categoryId: supabaseServer.category_id,
          category_id: supabaseServer.category_id,
          userId: supabaseServer.user_id,
          user_id: supabaseServer.user_id?.toString(),
          category: undefined, // Simplificamos para evitar errores de tipado
          _count: {
            votes: realVotes // Usar votos reales
          },
          source: 'hardcoded' // Marcamos como hardcoded para compatibilidad
        };

        return { 
          data: normalizedSupabaseServer, 
          error: null 
        };
      }
    } catch (supabaseError) {
      console.log('Error searching in Supabase servers:', supabaseError);
    }

    // Si no se encontró en Supabase, intentar como servidor hardcodeado (solo para IDs numéricos)
    const numericId = parseInt(serverId);
    if (!isNaN(numericId)) {
      const { data: hardcodedServers, error: hardcodedError } = await getServers();
      if (!hardcodedError && hardcodedServers) {
        const hardcodedServer = hardcodedServers.find((s: Server) => s.id === numericId);
        if (hardcodedServer) {
          const normalizedServer = normalizeHardcodedServer(hardcodedServer);
          
          // Obtener votos reales
          const realVotes = await getRealVoteCount(numericId, 'hardcoded');
          normalizedServer._count = { votes: realVotes };
          
          return { 
            data: normalizedServer, 
            error: null 
          };
        }
      }
    }

    console.log(`Servidor no encontrado con ID: ${serverId}`);
    return { data: null, error: 'Servidor no encontrado' };
  } catch (error) {
    console.error('Error en getAnyServerById:', error);
    return { data: null, error };
  }
}

// Función para obtener todos los servidores (hardcodeados + usuarios aprobados)
export async function getAllServers(): Promise<{ data: UnifiedServer[]; error: any }> {
  try {
    const allServers: UnifiedServer[] = [];

    // Obtener servidores hardcodeados
    const { data: hardcodedServers, error: hardcodedError } = await getServers();
    if (!hardcodedError && hardcodedServers) {
      allServers.push(...hardcodedServers.map(normalizeHardcodedServer));
    }

    // Obtener servidores de usuario aprobados
    try {
      const { data: userServers, error: userError } = await supabase
        .from('user_servers')
        .select(`
          *,
          category:server_categories(*)
        `)
        .eq('approved', true)
        .eq('status', 'online')
        .order('created_at', { ascending: false });

      if (!userError && userServers) {
        allServers.push(...userServers.map(normalizeUserServer));
      }
    } catch (error) {
      console.log('Error fetching user servers (tabla podría no existir):', error);
    }

    return { data: allServers, error: null };

  } catch (error) {
    console.error('Error getting all servers:', error);
    return { data: [], error };
  }
}