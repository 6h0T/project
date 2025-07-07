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
    console.log(`[REGISTER_VOTE] Iniciando para servidor ${serverId}`)
    console.log(`[REGISTER_VOTE] Parámetros:`, { serverId, clientIP, userAgent, country, userId })
    
    // Verificar que el servidor existe y está aprobado
    const { data: server, error: serverError } = await getAnyServerById(serverId)
    
    console.log(`[REGISTER_VOTE] Resultado de getAnyServerById:`, { server: !!server, error: !!serverError })
    
    if (serverError) {
      console.error('[REGISTER_VOTE] Error obteniendo servidor:', serverError)
      return {
        success: false,
        error: 'Error al buscar servidor',
        message: 'No se pudo verificar la existencia del servidor'
      }
    }
    
    if (!server) {
      console.error('[REGISTER_VOTE] Servidor no encontrado')
      return {
        success: false,
        error: 'Servidor no encontrado',
        message: 'Este servidor no existe'
      }
    }
    
    if (!server.approved) {
      console.error('[REGISTER_VOTE] Servidor no aprobado')
      return {
        success: false,
        error: 'Servidor no aprobado',
        message: 'Este servidor no está disponible para votación'
      }
    }

    // Determinar el tipo de servidor
    let serverType = 'user_server'
    if (server.source === 'hardcoded') {
      serverType = 'hardcoded'
    } else if (server.source === 'user_server') {
      serverType = 'user_server'
    }
    
    console.log(`[REGISTER_VOTE] Tipo de servidor determinado: ${serverType}`)

    // Validar y formatear parámetros
    let formattedUserId = null
    if (userId) {
      // Verificar que sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(userId)) {
        formattedUserId = userId
      } else {
        console.log(`[REGISTER_VOTE] userId inválido, usando null:`, userId)
      }
    }

    // Validar formato de IP
    let formattedIP = clientIP
    // Asegurar que la IP esté en un formato válido para PostgreSQL INET
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === 'localhost') {
      formattedIP = '127.0.0.1'
    }
    
    console.log(`[REGISTER_VOTE] Parámetros formateados:`, { 
      serverId, 
      serverType, 
      formattedIP, 
      formattedUserId,
      userAgent: userAgent?.substring(0, 100), // Truncar user agent
      country 
    })

    // Usar la función de Supabase para registrar el voto
    console.log(`[REGISTER_VOTE] Llamando función RPC register_vote`)
    const { data: voteResult, error: voteError } = await supabase
      .rpc('register_vote', {
        p_server_id: serverId,
        p_server_type: serverType,
        p_voter_ip: formattedIP,
        p_user_id: formattedUserId,
        p_user_agent: userAgent?.substring(0, 500) || null, // Truncar para evitar errores
        p_country: country?.substring(0, 10) || null // Truncar para evitar errores
      })

    if (voteError) {
      console.error('[REGISTER_VOTE] Error en función RPC:', voteError)
      console.error('[REGISTER_VOTE] Detalles del error:', {
        message: voteError.message,
        details: voteError.details,
        hint: voteError.hint,
        code: voteError.code
      })
      return {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo registrar el voto. Inténtalo más tarde.',
        debug: voteError.message
      }
    }
    
    console.log(`[REGISTER_VOTE] Resultado de RPC:`, voteResult)

    // La función register_vote retorna un JSON con el resultado
    const result = voteResult

    if (result && result.success) {
      console.log(`[REGISTER_VOTE] Voto registrado exitosamente`)
      return {
        success: true,
        message: result.message || '¡Voto registrado exitosamente!',
        server: {
          id: server.id,
          title: server.title,
          totalVotes: result.totalVotes || 1
        }
      }
    } else {
      console.log(`[REGISTER_VOTE] Voto rechazado por reglas de negocio:`, result)
      return {
        success: false,
        error: result?.error || 'Error desconocido',
        message: result?.message || 'No se pudo registrar el voto',
        timeLeft: result?.timeLeft
      }
    }
  } catch (error) {
    console.error('[REGISTER_VOTE] Error inesperado:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el voto. Inténtalo más tarde.',
      debug: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`[VOTE] ===== ENDPOINT ALCANZADO =====`)
  console.log(`[VOTE] Method: ${request.method}`)
  console.log(`[VOTE] URL: ${request.url}`)
  console.log(`[VOTE] Params:`, params)
  
  try {
    const serverId = params.id
    const clientIP = getClientIP(request)
    
    console.log(`[VOTE] Iniciando votación para servidor ${serverId} desde IP ${clientIP}`)
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('[VOTE] Error parseando JSON:', error)
      return NextResponse.json({ 
        error: 'Datos inválidos',
        message: 'No se pudo procesar la solicitud'
      }, { status: 400 })
    }
    
    if (!serverId) {
      console.error('[VOTE] ID de servidor faltante')
      return NextResponse.json({ error: 'ID de servidor requerido' }, { status: 400 })
    }

    // Validar captcha si se proporciona (para usuarios no logueados)
    if (body.captcha && body.expectedCaptcha) {
      console.log('[VOTE] Validando captcha...')
      if (!validateCaptcha(body.captcha, body.expectedCaptcha)) {
        console.error('[VOTE] Captcha incorrecto')
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
      console.log(`[VOTE] Usuario ID: ${userId || 'no logueado'}`)
    } catch (error) {
      // Usuario no logueado o sesión inválida
      userId = undefined
    }

    // Registrar el voto usando la función actualizada
    console.log('[VOTE] Registrando voto...')
    const result = await registerVote(serverId, clientIP, userAgent, country, userId)
    
    console.log('[VOTE] Resultado de votación:', result)

    if (!result.success) {
      const statusCode = result.timeLeft ? 429 : 400
      console.error(`[VOTE] Voto fallido con código ${statusCode}:`, result.error)
      return NextResponse.json(result, { status: statusCode })
    }

    console.log('[VOTE] Voto exitoso')
    return NextResponse.json(result)

  } catch (error) {
    console.error('[VOTE] Error en votación:', error)
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