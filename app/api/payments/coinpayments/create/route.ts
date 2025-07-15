import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Configuración de CoinPayments
const COINPAYMENTS_CONFIG = {
  public_key: process.env.COINPAYMENTS_PUBLIC_KEY || '',
  private_key: process.env.COINPAYMENTS_PRIVATE_KEY || '',
  merchant_id: process.env.COINPAYMENTS_MERCHANT_ID || '',
  ipn_secret: process.env.COINPAYMENTS_IPN_SECRET || '',
  api_url: 'https://www.coinpayments.net/api.php'
}

// CONVERSION_RATE: 1 crédito = 1 USD - Modificar aquí para cambiar la conversión
const CREDIT_TO_USD_RATE = 1

export async function POST(request: NextRequest) {
  try {
    const { credits, currency = 'BTC' } = await request.json()

    if (!credits || credits < 1) {
      return NextResponse.json(
        { error: 'Cantidad de créditos inválida' },
        { status: 400 }
      )
    }

    // Obtener el usuario autenticado desde Supabase
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const user_id = user.id

    // Calcular precio en USD
    const amount_usd = credits * CREDIT_TO_USD_RATE

    // Crear transacción en la base de datos
    const { data: transaction, error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        payment_method: 'coinpayments',
        credits_amount: credits,
        usd_amount: amount_usd,
        currency,
        status: 'pending',
        metadata: {
          currency,
          amount_usd
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating transaction:', dbError)
      return NextResponse.json(
        { error: 'Error creando transacción' },
        { status: 500 }
      )
    }

    // Preparar datos para CoinPayments API
    const coinpaymentsData = {
      version: 1,
      cmd: 'create_transaction',
      amount: amount_usd,
      currency1: 'USD',
      currency2: currency,
      buyer_email: '', // Se puede obtener del usuario
      item_name: `${credits} Créditos GameServers Hub`,
      item_number: transaction.id,
      custom: transaction.id,
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/coinpayments/ipn`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-credits?payment=cancelled`
    }

    // Crear firma HMAC para CoinPayments
    const postData = new URLSearchParams(coinpaymentsData as any).toString()
    const hmac = crypto.createHmac('sha512', COINPAYMENTS_CONFIG.private_key)
    hmac.update(postData)
    const signature = hmac.digest('hex')

    // Llamar a CoinPayments API
    const response = await fetch(COINPAYMENTS_CONFIG.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'HMAC': signature
      },
      body: postData
    })

    const coinpaymentsResponse = await response.json()

    if (coinpaymentsResponse.error !== 'ok') {
      console.error('CoinPayments API Error:', coinpaymentsResponse)
      return NextResponse.json(
        { error: 'Error procesando pago con CoinPayments' },
        { status: 500 }
      )
    }

    // Actualizar transacción con datos de CoinPayments
    await supabase
      .from('payment_transactions')
      .update({
        external_id: coinpaymentsResponse.result.txn_id,
        metadata: {
          ...transaction.metadata,
          coinpayments_response: coinpaymentsResponse.result
        }
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      payment_url: coinpaymentsResponse.result.checkout_url,
      qr_code: coinpaymentsResponse.result.qrcode_url,
      amount: coinpaymentsResponse.result.amount,
      address: coinpaymentsResponse.result.address
    })

  } catch (error) {
    console.error('CoinPayments create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}