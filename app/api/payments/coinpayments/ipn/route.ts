import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

const COINPAYMENTS_IPN_SECRET = process.env.COINPAYMENTS_IPN_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    // Verificar firma HMAC
    const receivedHmac = request.headers.get('hmac')
    const calculatedHmac = crypto
      .createHmac('sha512', COINPAYMENTS_IPN_SECRET)
      .update(body)
      .digest('hex')

    if (receivedHmac !== calculatedHmac) {
      console.error('Invalid HMAC signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const txnId = params.get('txn_id')
    const status = parseInt(params.get('status') || '0')
    const amount1 = parseFloat(params.get('amount1') || '0')
    const amount2 = parseFloat(params.get('amount2') || '0')
    const currency1 = params.get('currency1')
    const currency2 = params.get('currency2')
    const custom = params.get('custom') // Nuestro transaction ID

    if (!custom || !txnId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Buscar transacción en nuestra base de datos
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', custom)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', custom)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Determinar el estado de la transacción
    let newStatus = 'pending'
    if (status >= 100) {
      newStatus = 'completed'
    } else if (status < 0) {
      newStatus = 'failed'
    }

    // Actualizar transacción
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        external_id: txnId,
        metadata: {
          ...transaction.metadata,
          coinpayments_status: status,
          amount1,
          amount2,
          currency1,
          currency2,
          ipn_received_at: new Date().toISOString()
        }
      })
      .eq('id', custom)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Si el pago fue completado, agregar créditos al usuario
    if (newStatus === 'completed') {
      const { error: creditsError } = await supabase
        .from('user_profiles')
        .update({
          credits: supabase.sql`credits + ${transaction.credits_amount}`
        })
        .eq('id', transaction.user_id)

      if (creditsError) {
        console.error('Error adding credits:', creditsError)
        // No retornamos error aquí para no afectar el IPN
      }

      // Log de la transacción completada
      console.log(`Payment completed: ${transaction.credits_amount} credits added to user ${transaction.user_id}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('CoinPayments IPN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}