import { NextRequest, NextResponse } from 'next/server'
import { getServers, getCategories } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validaciones básicas
    if (!body.title || !body.ip || !body.category_id) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: title, ip, category_id' 
      }, { status: 400 })
    }

    // Crear slug automáticamente
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    // Insertar servidor (empezará con 0 votos automáticamente)
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
        user_id: body.user_id || null, // En producción, obtener del auth
        approved: false, // Los nuevos servidores requieren aprobación
        status: 'pending',
        premium: false // Los nuevos servidores no son premium por defecto
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating server:', error)
      return NextResponse.json({ 
        error: 'Error al crear el servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Servidor creado exitosamente. Pendiente de aprobación.',
      server
    })

  } catch (error) {
    console.error('Error in server creation:', error)
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
        .from('game_categories')
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
    
    // Construir la query base para servidores
    let serversQuery = supabase
      .from('servers')
      .select(`
        id,
        title,
        slug,
        description,
        website,
        ip,
        country,
        version,
        experience,
        premium,
        status,
        created_at,
        category_id,
        game_categories(name, slug)
      `)
      .eq('approved', true)
      .eq('status', 'online')
      .order('premium', { ascending: false })
      .limit(limit)

    // Filtrar por categoría si se especifica
    if (categoryId) {
      serversQuery = serversQuery.eq('category_id', categoryId)
    }

    const { data: servers, error: serversError } = await serversQuery
    
    console.log('Servers query result:', { 
      serversCount: servers?.length || 0, 
      error: serversError 
    })

    if (serversError) {
      console.error('Error fetching servers:', serversError)
      return NextResponse.json({ error: 'Error al obtener servidores' }, { status: 500 })
    }

    if (!servers || servers.length === 0) {
      return NextResponse.json({ servers: [] })
    }

    // Obtener estadísticas de votos para el mes actual
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    const serverIds = servers.map(s => s.id)
    
    const { data: voteStats, error: voteError } = await supabase
      .from('vote_stats')
      .select('server_id, total_votes, unique_ips')
      .in('server_id', serverIds)
      .eq('year', currentYear)
      .eq('month', currentMonth)

    if (voteError) {
      console.error('Error fetching vote stats:', voteError)
      // Continuar sin votos si hay error
    }

    // Combinar datos de servidores con estadísticas de votos
    const serversWithVotes = servers.map(server => {
      const voteData = voteStats?.find(vs => vs.server_id === server.id)
      
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
        votes: voteData?.total_votes || 0,
        uptime: '99.5%', // Valor por defecto, se puede agregar a la BD después
        exp: server.experience ? `Exp x${server.experience}` : 'Exp x1',
        features: server.premium ? ['Premium', 'VIP'] : ['Normal'],
        rank: 0, // Se calculará después del ordenamiento
        isPremium: server.premium || false,
        website: server.website,
        ip: server.ip,
        category: server.game_categories?.[0]?.name || 'Lineage 2',
        slug: server.slug,
        created_at: server.created_at
      }
    })

         // Ordenar por votos descendente y asignar ranking
     serversWithVotes.sort((a, b) => b.votes - a.votes)
     serversWithVotes.forEach((server, index) => {
       server.rank = index + 1
     })

    // Separar servidores premium y normales
    const premiumServers = serversWithVotes.filter(s => s.isPremium)
    const normalServers = serversWithVotes.filter(s => !s.isPremium)

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