import { NextRequest, NextResponse } from 'next/server'
import { getServers, getCategories } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { validateServer, logValidationResult, type ServerForValidation } from '@/lib/serverValidation'

export async function POST(request: NextRequest) {
  try {
    console.log('[API_SERVERS] 🚀 Iniciando creación de servidor vía API');
    
    const body = await request.json()
    console.log('[API_SERVERS] Datos recibidos:', body);
    
    // Validaciones básicas
    if (!body.title || !body.ip || !body.category_id) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: title, ip, category_id' 
      }, { status: 400 })
    }

    // ===================================
    // 1. VALIDAR SERVIDOR ANTES DE CREAR
    // ===================================
    const serverForValidation: ServerForValidation = {
      title: body.title,
      description: body.description,
      website: body.website,
      ip: body.ip,
      category_id: body.category_id,
      source: 'regular_servers'
    };

    const validation = validateServer(serverForValidation);
    logValidationResult(serverForValidation, validation);

    // ===================================
    // 2. DETERMINAR ESTADO INICIAL
    // ===================================
    const initialStatus = validation.canAutoApprove ? 'online' : 'pending';
    const isApproved = validation.canAutoApprove;

    console.log(`[API_SERVERS] 🔍 Resultado de validación:`);
    console.log(`[API_SERVERS] - Score: ${validation.score}%`);
    console.log(`[API_SERVERS] - Auto-aprobable: ${validation.canAutoApprove ? '✅ SÍ' : '❌ NO'}`);

    // Crear slug automáticamente
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    // ===================================
    // 3. INSERTAR SERVIDOR CON ESTADO APROPIADO
    // ===================================
    const { data: server, error } = await supabase
      .from('servers')
      .insert({
        title: body.title,
        slug,
        description: body.description || '',
        website: body.website || null,
        ip: body.ip,
        country: body.country || 'International',
        version: body.version || null,
        experience: body.experience || 1,
        category_id: body.category_id,
        user_id: body.user_id || null,
        approved: isApproved,  // ← Auto-aprobar si cumple requisitos
        status: initialStatus, // ← 'online' si auto-aprobado, 'pending' si no
        premium: false
      })
      .select()
      .single()

    if (error) {
      console.error('[API_SERVERS] ❌ Error creando servidor:', error)
      return NextResponse.json({ 
        error: 'Error al crear el servidor',
        details: error.message
      }, { status: 500 })
    }

    // ===================================
    // 4. RESPUESTA CON INFORMACIÓN DE VALIDACIÓN
    // ===================================
    const responseMessage = isApproved 
      ? `¡Servidor aprobado automáticamente! Ya está disponible para votación.`
      : `Servidor creado pero requiere revisión. Score: ${validation.score}% (necesita ≥80%)`;

    if (isApproved) {
      console.log(`[API_SERVERS] 🎉 SERVIDOR AUTO-APROBADO: ${body.title}`);
    } else {
      console.log(`[API_SERVERS] ⏳ SERVIDOR PENDIENTE: ${body.title} - Score: ${validation.score}%`);
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      server,
      validation: {
        score: validation.score,
        autoApproved: isApproved,
        issues: validation.issues,
        recommendations: validation.recommendations
      }
    })

  } catch (error) {
    console.error('[API_SERVERS] ❌ Error general:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('API Request - Category:', category, 'Limit:', limit)
    
    // Primero obtener la categoría ID si se especifica
    let categoryId = null
    if (category && category !== 'all') {
      const { data: categoryData, error: categoryError } = await supabase
        .from('server_categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (categoryError) {
        console.error('Error fetching category:', categoryError)
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
      }
      
      categoryId = categoryData?.id
      console.log('Found category ID:', categoryId)
    }
    
    // ========================================
    // OBTENER SOLO SERVIDORES DE USUARIOS APROBADOS (REMOVER HARDCODEADOS)
    // ========================================
    let userServersQuery = supabase
      .from('user_servers')
      .select(`
        id,
        title,
        slug,
        description,
        website,
        country,
        version,
        experience,
        premium,
        status,
        created_at,
        category_id,
        server_categories(name, slug)
      `)
      .eq('approved', true)
      .eq('status', 'online')

    // Filtrar por categoría si se especifica
    if (categoryId) {
      userServersQuery = userServersQuery.eq('category_id', categoryId)
    }

    const { data: userServers, error: userServersError } = await userServersQuery
    
    console.log('User servers query result:', { 
      count: userServers?.length || 0, 
      error: userServersError 
    })

    // ========================================
    // USAR SOLO SERVIDORES DE USUARIOS REALES
    // ========================================
    const allServers = (userServers || []).map(server => ({
      ...server,
      source: 'user_server' as const,
      ip: '' // user_servers no tiene IP
    }));

    console.log('Real servers loaded:', {
      userServers: userServers?.length || 0,
      total: allServers.length
    })

    if (allServers.length === 0) {
      return NextResponse.json({ 
        success: true,
        servers: [],
        premiumServers: [],
        normalServers: [],
        total: 0,
        stats: {
          totalServers: 0,
          premiumCount: 0,
          totalVotes: 0
        }
      })
    }

    // ========================================
    // PROCESAR SERVIDORES CON VOTOS REALES
    // ========================================
    const serversWithVotes = await Promise.all(allServers.slice(0, limit).map(async server => {
      // Obtener votos reales usando la función de Supabase
      const { data: realVotes, error: voteCountError } = await supabase
        .rpc('get_server_vote_count', {
          p_server_id: server.id.toString(),
        })

      if (voteCountError) {
        console.error('Error obteniendo votos reales para servidor', server.id, ':', voteCountError)
      }

      const votes = realVotes || 0
      
      return {
        id: server.id,
        name: server.title,
        title: server.title,
        description: server.description || '',
        country: server.country || 'International',
        chronicle: server.version || 'Unknown',
        serverType: 'PvP', // Valor por defecto, se puede agregar a la BD después
        platform: 'L2J', // Valor por defecto, se puede agregar a la BD después
        players: Math.floor(Math.random() * 500) + 100, // Simulado por ahora
        votes: votes, // Usar votos reales
        uptime: '99.5%', // Valor por defecto, se puede agregar a la BD después
        exp: server.experience ? `Exp x${server.experience}` : 'Exp x1',
        features: server.premium ? ['Premium', 'VIP'] : ['Normal'],
        rank: 0, // Se calculará después del ordenamiento
        isPremium: server.premium || false,
        website: server.website,
        ip: server.ip,
        category: server.server_categories?.[0]?.name || 'Lineage 2',
        slug: server.slug,
        created_at: server.created_at,
        source: server.source
      }
    }))

    // Ordenar por premium primero, luego por votos descendente
    serversWithVotes.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1
      if (!a.isPremium && b.isPremium) return 1
      return b.votes - a.votes
    })

    // Asignar ranking
    serversWithVotes.forEach((server, index) => {
      server.rank = index + 1
    })

    // Separar servidores premium y normales
    const premiumServers = serversWithVotes.filter(s => s.isPremium)
    const normalServers = serversWithVotes.filter(s => !s.isPremium)

    console.log('Final result:', {
      total: serversWithVotes.length,
      premium: premiumServers.length,
      normal: normalServers.length
    })

    return NextResponse.json({
      success: true,
      servers: serversWithVotes,
      premiumServers,
      normalServers,
      total: serversWithVotes.length,
      stats: {
        totalServers: serversWithVotes.length,
        premiumCount: premiumServers.length,
        totalVotes: serversWithVotes.reduce((sum, s) => sum + s.votes, 0)
      }
    })

  } catch (error) {
    console.error('Error in servers API:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}