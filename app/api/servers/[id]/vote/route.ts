import { NextRequest, NextResponse } from 'next/server'
import { getServerById, createVote, getVoteByIpAndServer, updateVote, getVoteCountByServer } from '@/lib/database'

// Función para obtener la IP real del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  
  return '127.0.0.1' // Fallback para desarrollo local
}

// Función para calcular tiempo restante hasta poder votar (12 horas)
function calculateTimeRemaining(lastVoteDate: Date) {
  const now = new Date()
  const timeDiff = now.getTime() - lastVoteDate.getTime()
  const hoursElapsed = Math.floor(timeDiff / (1000 * 60 * 60))
  const minutesElapsed = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hoursElapsed >= 12) {
    return { canVote: true, hoursLeft: 0, minutesLeft: 0 }
  }
  
  return { 
    canVote: false, 
    hoursLeft: 11 - hoursElapsed, 
    minutesLeft: 59 - minutesElapsed 
  }
}

// Función para validar captcha simple
function validateCaptcha(userInput: string, expectedCaptcha: string): boolean {
  return userInput.toUpperCase() === expectedCaptcha.toUpperCase()
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serverId = parseInt(params.id)
    const clientIP = getClientIP(request)
    const body = await request.json()
    
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'ID de servidor inválido' }, { status: 400 })
    }

    // Verificar que el servidor existe y está aprobado
    const { data: server, error: serverError } = await getServerById(serverId)

    if (serverError || !server || !server.approved) {
      return NextResponse.json({ error: 'Servidor no encontrado o no aprobado' }, { status: 404 })
    }

    // Validar captcha si se proporciona (para usuarios no logueados)
    if (body.captcha && body.expectedCaptcha) {
      if (!validateCaptcha(body.captcha, body.expectedCaptcha)) {
        return NextResponse.json({ 
          error: 'Captcha incorrecto',
          message: 'El código de verificación no es correcto'
        }, { status: 400 })
      }
    }

    // Buscar voto existente de esta IP para este servidor
    const { data: existingVote } = await getVoteByIpAndServer(clientIP, serverId)

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    if (existingVote) {
      // Verificar limitación de 12 horas
      const timeCheck = calculateTimeRemaining(new Date(existingVote.updatedAt))
      
      if (!timeCheck.canVote) {
        return NextResponse.json({
          error: 'Tiempo de espera activo',
          message: `Debes esperar ${timeCheck.hoursLeft}h ${timeCheck.minutesLeft}m para votar nuevamente`,
          timeLeft: { hours: timeCheck.hoursLeft, minutes: timeCheck.minutesLeft },
          canVote: false
        }, { status: 429 })
      }

      // Calcular nuevo contador de votos (reinicia cada mes)
      const newCount = (existingVote.month === currentMonth && existingVote.year === currentYear) 
        ? existingVote.count + 1  // Mismo mes: incrementar
        : 1                       // Nuevo mes: reiniciar

      // Actualizar voto existente
      await updateVote(existingVote.id, {
        count: newCount,
        month: currentMonth,
        year: currentYear,
        updatedAt: now.toISOString()
      })
    } else {
      // Crear nuevo voto
      await createVote({
        ip: clientIP,
        serverId: serverId,
        userId: null // En una implementación real, obtener del token de autenticación
      })
    }

    // Calcular total de votos del servidor para el mes actual
    const { data: totalVotes } = await getVoteCountByServer(serverId)

    return NextResponse.json({
      success: true,
      message: '¡Voto registrado correctamente!',
      server: { 
        id: server.id, 
        title: server.title, 
        totalVotes: totalVotes || 0
      },
      nextVoteIn: { hours: 12, minutes: 0 }
    })

  } catch (error) {
    console.error('Error en votación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el voto. Inténtalo más tarde.'
    }, { status: 500 })
  }
}

// GET para verificar si una IP puede votar y obtener información
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serverId = parseInt(params.id)
    const clientIP = getClientIP(request)
    
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'ID de servidor inválido' }, { status: 400 })
    }

    // Verificar que el servidor existe
    const { data: server, error: serverError } = await getServerById(serverId)

    if (serverError || !server || !server.approved) {
      return NextResponse.json({ error: 'Servidor no encontrado' }, { status: 404 })
    }

    // Buscar voto existente
    const { data: existingVote } = await getVoteByIpAndServer(clientIP, serverId)

    // Calcular total de votos del mes actual
    const { data: totalVotes } = await getVoteCountByServer(serverId)

    if (!existingVote) {
      return NextResponse.json({ 
        canVote: true, 
        message: 'Puedes votar por este servidor',
        totalVotes: totalVotes || 0,
        timeLeft: null
      })
    }

    const timeCheck = calculateTimeRemaining(new Date(existingVote.updatedAt))
    
    return NextResponse.json({
      canVote: timeCheck.canVote,
      message: timeCheck.canVote 
        ? 'Puedes votar nuevamente'
        : `Podrás votar en ${timeCheck.hoursLeft}h ${timeCheck.minutesLeft}m`,
      timeLeft: timeCheck.canVote ? null : {
        hours: timeCheck.hoursLeft,
        minutes: timeCheck.minutesLeft
      },
      totalVotes: totalVotes || 0,
      lastVote: existingVote.updatedAt
    })
  } catch (error) {
    console.error('Error al verificar estado de voto:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}