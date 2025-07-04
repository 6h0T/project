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
function validateCaptcha(userInput: string, expected: string): boolean {
  return userInput.toLowerCase() === expected.toLowerCase()
}

// Función REAL para registrar voto
async function registerVote(serverId: string, clientIP: string, userAgent: string, country: string, userId?: string) {
  try {
    // Verificar que el servidor existe y está aprobado
    const { data: server, error: serverError } = await getAnyServerById(serverId)
    
    if (serverError || !server || !server.approved) {
      return {
        success: false,
        error: 'Servidor no encontrado o no aprobado',
        message: 'Este servidor no existe o no está disponible para votación'
      }
    }

    // Determinar el tipo de servidor
    let serverType = 'user_server'
    if (server.source === 'hardcoded') {
      serverType = 'hardcoded'
    } else if (server.source === 'user_server') {
      serverType = 'user_server'
    }

    // Usar la función de Supabase para registrar el voto
    const { data: voteResult, error: voteError } = await supabase
      .rpc('register_vote', {
        p_server_id: serverId,
        p_server_type: serverType,
        p_voter_ip: clientIP,
        p_user_id: userId || null,
        p_user_agent: userAgent || null,
        p_country: country || null
      })

    if (voteError) {
      console.error('Error registrando voto:', voteError)
      return {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el voto. Inténtalo más tarde.'
      }
    }

    // La función register_vote retorna un JSON con el resultado
    const result = voteResult

    if (result.success) {
      return {
        success: true,
        message: result.message,
        server: {
          id: server.id,
          title: server.title,
          totalVotes: result.totalVotes
        }
      }
    } else {
      return {
        success: false,
        error: result.error,
        message: result.message,
        timeLeft: result.timeLeft
      }
    }
  } catch (error) {
    console.error('Error registering vote:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el voto. Inténtalo más tarde.'
    }
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serverId = params.id
    const clientIP = getClientIP(request)
    const body = await request.json()
    
    if (!serverId) {
      return NextResponse.json({ error: 'ID de servidor requerido' }, { status: 400 })
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

    // Obtener información del user-agent y country
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const country = request.headers.get('cf-ipcountry') || 'Unknown'

    // Intentar obtener userId de la sesión (si está disponible)
    let userId: string | undefined
    try {
      // Aquí podrías implementar lógica para obtener userId de JWT/cookies de sesión
      // Por ahora lo dejamos como undefined para usuarios no logueados
      userId = body.userId || undefined
    } catch (error) {
      // Usuario no logueado o sesión inválida
      userId = undefined
    }

    // Registrar el voto usando la función actualizada
    const result = await registerVote(serverId, clientIP, userAgent, country, userId)

    if (!result.success) {
      const statusCode = result.timeLeft ? 429 : 400
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result)

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
    const serverId = params.id
    const clientIP = getClientIP(request)
    
    if (!serverId) {
      return NextResponse.json({ error: 'ID de servidor requerido' }, { status: 400 })
    }

    // Redirigir a la API de vote-status para consistencia
    const response = await fetch(`${request.nextUrl.origin}/api/servers/${serverId}/vote-status`, {
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
        'cf-connecting-ip': request.headers.get('cf-connecting-ip') || ''
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error('Error al verificar estado de voto:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}