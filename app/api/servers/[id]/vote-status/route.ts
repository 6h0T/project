import { NextRequest, NextResponse } from 'next/server'
import { getServerById, getVoteByIpAndServer, getVoteCountByServer } from '@/lib/database'

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serverId = parseInt(params.id)
    const clientIP = getClientIP(request)
    
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'ID de servidor inválido' }, { status: 400 })
    }

    // Obtener información del servidor
    const { data: server, error: serverError } = await getServerById(serverId)

    if (serverError || !server || !server.approved) {
      return NextResponse.json({ error: 'Servidor no encontrado' }, { status: 404 })
    }

    // Calcular total de votos del mes actual
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    const { data: monthlyVotes } = await getVoteCountByServer(serverId)
    const { data: allTimeVotes } = await getVoteCountByServer(serverId)

    // Verificar si esta IP ya votó
    const { data: userVote } = await getVoteByIpAndServer(clientIP, serverId)

    let canVote = true
    let timeLeft = null
    let lastVoteDate = null

    if (userVote) {
      lastVoteDate = userVote.updatedAt
      const timeDiff = now.getTime() - new Date(userVote.updatedAt).getTime()
      const hoursElapsed = Math.floor(timeDiff / (1000 * 60 * 60))
      
      if (hoursElapsed < 12) {
        canVote = false
        const minutesElapsed = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        timeLeft = {
          hours: 11 - hoursElapsed,
          minutes: 59 - minutesElapsed
        }
      }
    }

    return NextResponse.json({
      server: {
        id: server.id,
        title: server.title
      },
      votes: {
        monthly: monthlyVotes || 0,
        allTime: allTimeVotes || 0
      },
      userStatus: {
        canVote,
        timeLeft,
        lastVoteDate,
        hasVoted: !!userVote
      }
    })

  } catch (error) {
    console.error('Error al obtener estado de votación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}