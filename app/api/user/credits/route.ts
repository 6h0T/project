import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener créditos del usuario usando la función SQL
    const { data: credits, error: creditsError } = await supabase
      .rpc('get_user_credits', { p_user_id: user.id })

    if (creditsError) {
      console.error('Error obteniendo créditos:', creditsError)
      return NextResponse.json({ error: 'Error obteniendo créditos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      credits: credits || 0,
      userId: user.id
    })

  } catch (error) {
    console.error('Error en credits API:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Endpoint para actualizar créditos (solo para testing en desarrollo)
export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Endpoint solo disponible en desarrollo' }, { status: 403 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { credits, operation = 'add' } = body

    if (typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Cantidad de créditos inválida' }, { status: 400 })
    }

    let result
    if (operation === 'add') {
      // Agregar créditos
      const { data, error } = await supabase
        .rpc('add_user_credits', {
          p_user_id: user.id,
          p_credits: credits,
          p_type: 'manual_test',
          p_description: 'Créditos agregados manualmente (desarrollo)'
        })

      result = data
    } else if (operation === 'deduct') {
      // Deducir créditos
      const { data, error } = await supabase
        .rpc('deduct_user_credits', {
          p_user_id: user.id,
          p_credits: credits,
          p_type: 'manual_test',
          p_description: 'Créditos deducidos manualmente (desarrollo)'
        })

      result = data
    } else {
      return NextResponse.json({ error: 'Operación inválida' }, { status: 400 })
    }

    // Obtener créditos actualizados
    const { data: newCredits } = await supabase
      .rpc('get_user_credits', { p_user_id: user.id })

    return NextResponse.json({
      success: true,
      message: `Créditos ${operation === 'add' ? 'agregados' : 'deducidos'} exitosamente`,
      credits: newCredits || 0,
      operation,
      amount: credits
    })

  } catch (error) {
    console.error('Error en POST credits:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 