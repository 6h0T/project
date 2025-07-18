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
    // OBTENER SERVIDORES DE LA TABLA SERVERS (IMPORTADOS + CREADOS)
    // ========================================
    let serversQuery = supabase
      .from('servers')
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
        legacy_id,
        ip,
        ip_address,
        experience_rate,
        votes,
        is_premium,
        is_approved,
        server_categories(name, slug)
      `)
      .or('approved.eq.true,is_approved.eq.true')
      .in('status', ['online', 'active'])

    // Filtrar por categoría si se especifica
    if (categoryId) {
      serversQuery = serversQuery.eq('category_id', categoryId)
    }

    const { data: servers, error: serversError } = await serversQuery
    
    console.log('Servers query result:', { 
      count: servers?.length || 0, 
      error: serversError,
      categoryId: categoryId 
    })

    // ========================================
    // USAR SERVIDORES IMPORTADOS Y CREADOS
    // ========================================
    const allServers = (servers || []).map(server => ({
      ...server,
      source: server.legacy_id ? 'imported' : 'created',
      ip: server.ip || server.ip_address || ''
    }));

    console.log('Real servers loaded:', {
      imported: allServers.filter(s => s.source === 'imported').length,
      created: allServers.filter(s => s.source === 'created').length,
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
      // Usar votos de la base de datos directamente (ya están en el campo votes)
      const votes = server.votes || 0
      
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