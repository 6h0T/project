import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: {
    orderId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
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

    // Obtener orden con transacciones
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        payment_transactions(*)
      `)
      .eq('order_id', orderId)
      .eq('user_id', user.id) // Verificar que sea del usuario autenticado
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Calcular estado detallado
    const now = new Date()
    const expiresAt = new Date(order.expires_at)
    const isExpired = now > expiresAt

    let detailedStatus = order.status
    if (order.status === 'pending' && isExpired) {
      detailedStatus = 'expired'
    }

    // Obtener la última transacción
    const latestTransaction = order.payment_transactions?.length > 0 
      ? order.payment_transactions[order.payment_transactions.length - 1]
      : null

    // Información de tiempo
    const timeInfo = {
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      expiresAt: order.expires_at,
      isExpired,
      timeRemaining: isExpired ? 0 : Math.max(0, expiresAt.getTime() - now.getTime())
    }

    // Información de créditos
    const creditsInfo = {
      base: order.credits_amount,
      bonus: order.bonus_credits,
      total: order.total_credits
    }

    // Información de pago
    const paymentInfo = {
      method: order.payment_method,
      amount: order.amount,
      currency: order.currency,
      paymentUrl: order.metadata?.paymentUrl
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderId: order.order_id,
        status: detailedStatus,
        originalStatus: order.status,
        externalId: order.external_id,
        credits: creditsInfo,
        payment: paymentInfo,
        time: timeInfo,
        metadata: order.metadata,
        latestTransaction: latestTransaction ? {
          id: latestTransaction.transaction_id,
          status: latestTransaction.status,
          processedAt: latestTransaction.processed_at,
          createdAt: latestTransaction.created_at
        } : null,
        transactions: order.payment_transactions?.map((tx: any) => ({
          id: tx.transaction_id,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          processedAt: tx.processed_at,
          createdAt: tx.created_at
        })) || []
      }
    })

  } catch (error) {
    console.error('Error en status API:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Endpoint para actualizar estado manualmente (para testing)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { status, transactionId } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId y status son requeridos' }, { status: 400 })
    }

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

    if (status === 'completed' && transactionId) {
      // Simular pago completado
      const { data, error } = await supabase
        .rpc('process_payment_completion', {
          p_order_id: orderId,
          p_transaction_id: transactionId,
          p_provider_data: {
            provider: 'manual_test',
            updatedAt: new Date().toISOString(),
            source: 'development_testing'
          }
        })

      if (error) {
        console.error('Error simulando pago completado:', error)
        return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Pago simulado exitosamente',
        result: data
      })
    } else {
      // Actualizar solo el estado
      const { error } = await supabase
        .from('payment_orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Estado actualizado a: ${status}`
      })
    }

  } catch (error) {
    console.error('Error en POST status:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 