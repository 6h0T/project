import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAnyServerById } from '@/lib/database'

// Función para obtener la IP real del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  
  return '127.0.0.1'
}

// Función REAL para verificar estado de votación
async function checkVoteStatus(serverId: string, clientIP: string) {
  try {
    // Verificar que el servidor existe
    const { data: server, error: serverError } = await getAnyServerById(serverId)
    
    if (serverError || !server) {
      return {
        success: false,
        error: 'Servidor no encontrado'
      }
    }

    // Determinar el tipo de servidor
    let serverType = 'user_server'
    if (server.source === 'hardcoded') {
      serverType = 'hardcoded'
    } else if (server.source === 'user_server') {
      serverType = 'user_server'
    }

    // Verificar si puede votar usando la función de Supabase
    const { data: canVoteData, error: canVoteError } = await supabase
      .rpc('can_vote_for_server', {
        p_server_id: serverId,
        p_voter_ip: clientIP
      })

    if (canVoteError) {
      console.error('Error verificando si puede votar:', canVoteError)
      return {
        success: false,
        error: 'Error verificando estado de votación'
      }
    }

    // Obtener conteo de votos del mes actual
    const { data: voteCount, error: voteCountError } = await supabase
      .rpc('get_server_vote_count', {
        p_server_id: serverId,
        p_server_type: serverType
      })

    if (voteCountError) {
      console.error('Error obteniendo conteo de votos:', voteCountError)
    }

    const totalVotes = voteCount || 0

    if (canVoteData) {
      // Puede votar
      return {
        success: true,
        userStatus: {
          canVote: true,
          hasVoted: false,
          timeLeft: null
        },
        votes: {
          monthly: totalVotes
        },
        totalVotes: totalVotes
      }
    } else {
      // No puede votar, obtener tiempo restante
      const { data: timeLeftData, error: timeLeftError } = await supabase
        .rpc('time_until_next_vote', {
          p_server_id: serverId,
          p_voter_ip: clientIP
        })

      let timeLeft = null
      if (!timeLeftError && timeLeftData) {
        // Convertir interval de PostgreSQL a horas y minutos
        const intervalMatch = timeLeftData.match(/(\d+):(\d+):/)
        if (intervalMatch) {
          const hours = parseInt(intervalMatch[1])
          const minutes = parseInt(intervalMatch[2])
          if (hours > 0 || minutes > 0) {
            timeLeft = { hours, minutes }
          }
        }
      }

      return {
        success: true,
        userStatus: {
          canVote: false,
          hasVoted: true,
          timeLeft: timeLeft
        },
        votes: {
          monthly: totalVotes
        },
        totalVotes: totalVotes
      }
    }
  } catch (error) {
    console.error('Error checking vote status:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serverId = params.id
    const clientIP = getClientIP(request)
    
    if (!serverId) {
      return NextResponse.json({ error: 'ID de servidor requerido' }, { status: 400 })
    }

    // Verificar estado de votación usando la función actualizada
    const result = await checkVoteStatus(serverId, clientIP)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error al obtener estado de votación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}