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

// Función simulada para verificar estado de votación (temporal)
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

    // Simulación temporal del estado de votación
    // En producción esto consultaría la tabla de votos real
    const hasVoted = Math.random() > 0.7 // 30% probabilidad de haber votado
    const monthlyVotes = Math.floor(Math.random() * 500) + 50
    
    if (hasVoted) {
      const hoursRemaining = Math.floor(Math.random() * 12) + 1
      const minutesRemaining = Math.floor(Math.random() * 60)
      
      return {
        success: true,
        userStatus: {
          canVote: false,
          hasVoted: true,
          timeLeft: {
            hours: hoursRemaining,
            minutes: minutesRemaining
          }
        },
        votes: {
          monthly: monthlyVotes
        }
      }
    } else {
      return {
        success: true,
        userStatus: {
          canVote: true,
          hasVoted: false,
          timeLeft: null
        },
        votes: {
          monthly: monthlyVotes
        }
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