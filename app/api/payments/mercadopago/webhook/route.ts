import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MERCADOPAGO_CONFIG = {
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api.mercadopago.com' 
    : 'https://api.mercadopago.com'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('MercadoPago Webhook received:', body)

    // MercadoPago envía diferentes tipos de notificaciones
    const { type, data } = body

    if (type === 'payment') {
      const paymentId = data.id

      if (!paymentId) {
        return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
      }

      // Obtener información del pago desde MercadoPago
      const paymentResponse = await fetch(`${MERCADOPAGO_CONFIG.base_url}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_CONFIG.access_token}`
        }
      })

      if (!paymentResponse.ok) {
        console.error('Error fetching payment from MercadoPago:', paymentResponse.statusText)
        return NextResponse.json({ error: 'Error fetching payment' }, { status: 500 })
      }

      const paymentData = await paymentResponse.json()
      const externalReference = paymentData.external_reference

      if (!externalReference) {
        console.error('No external reference found in payment data')
        return NextResponse.json({ error: 'No external reference' }, { status: 400 })
      }

      // Buscar transacción en nuestra base de datos
      const { data: transaction, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', externalReference)
        .single()

      if (fetchError || !transaction) {
        console.error('Transaction not found:', externalReference)
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      // Determinar el estado de la transacción
      let newStatus = 'pending'
      if (paymentData.status === 'approved') {
        newStatus = 'completed'
      } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
        newStatus = 'failed'
      }

      // Actualizar transacción
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: newStatus,
          metadata: {
            ...transaction.metadata,
            mercadopago_payment: paymentData,
            webhook_received_at: new Date().toISOString()
          }
        })
        .eq('id', externalReference)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // Si el pago fue aprobado, agregar créditos al usuario en user_profiles
      if (newStatus === 'completed') {
        // Primero obtener los créditos actuales
        const { data: userProfile, error: fetchUserError } = await supabase
          .from('user_profiles')
          .select('credits')
          .eq('id', transaction.user_id)
          .single()

        if (!fetchUserError && userProfile) {
          const { error: creditsError } = await supabase
            .from('user_profiles')
            .update({
              credits: userProfile.credits + transaction.credits_amount
            })
            .eq('id', transaction.user_id)

          if (creditsError) {
            console.error('Error adding credits:', creditsError)
            // No retornamos error aquí para no afectar el webhook
          }
        }

        console.log(`MercadoPago payment completed: ${transaction.credits_amount} credits added to user ${transaction.user_id}`)
      }

      return NextResponse.json({ success: true })
    }

    // Para otros tipos de notificaciones, simplemente confirmar recepción
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}