import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('[RECENT-SERVERS] Iniciando obtención de servidores recientes...');
    
    // Obtener servidores de usuarios aprobados recientemente (últimos 30 días)
    const { data: userServers, error: userError } = await supabase
      .from('user_servers')
      .select(`
        id,
        title,
        slug,
        description,
        created_at,
        category_id,
        server_categories(name, slug)
      `)
      .eq('approved', true)
      .eq('status', 'online')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('[RECENT-SERVERS] User servers result:', { data: userServers?.length || 0, error: userError });

    // Obtener algunos servidores hardcodeados recientes como respaldo
    const { data: hardcodedServers, error: hardcodedError } = await supabase
      .from('servers')
      .select(`
        id,
        title,
        slug,
        description,
        created_at,
        category_id,
        server_categories(name, slug)
      `)
      .eq('approved', true)
      .eq('status', 'online')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('[RECENT-SERVERS] Hardcoded servers result:', { data: hardcodedServers?.length || 0, error: hardcodedError });

    // Combinar y procesar servidores
    const allServers = [
      ...(userServers || []).map(server => ({
        ...server,
        source: 'user_server' as const
      })),
      ...(hardcodedServers || []).map(server => ({
        ...server,
        source: 'hardcoded' as const
      }))
    ];

    // Ordenar por fecha de creación (más recientes primero)
    allServers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Tomar solo los 5 más recientes
    const recentServers = allServers.slice(0, 5);

    // Formatear respuesta
    const formattedServers = recentServers.map(server => ({
      id: server.id,
      title: server.title,
      slug: server.slug,
      description: server.description || '',
      createdAt: server.created_at,
      categoryName: server.server_categories?.[0]?.name || 'General',
      categorySlug: server.server_categories?.[0]?.slug || 'general',
      source: server.source
    }));

    console.log('[RECENT-SERVERS] Final result:', formattedServers.length, 'servidores');
    
    return NextResponse.json({
      success: true,
      servers: formattedServers
    });

  } catch (error) {
    console.error('[RECENT-SERVERS] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false, servers: [] },
      { status: 500 }
    );
  }
}

// Función helper para calcular tiempo transcurrido
function calculateTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return `${diffDays}d`
  } else if (diffHours > 0) {
    return `${diffHours}h`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m`
  } else {
    return 'Ahora'
  }
} 