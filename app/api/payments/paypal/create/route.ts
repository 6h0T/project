import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Configuración de PayPal
const PAYPAL_CONFIG = {
  client_id: process.env.PAYPAL_CLIENT_ID || '',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'
}

// CONVERSION_RATE: 1 crédito = 1 USD - Modificar aquí para cambiar la conversión
const CREDIT_TO_USD_RATE = 1

// Función para obtener token de acceso de PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CONFIG.client_id}:${PAYPAL_CONFIG.client_secret}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_CONFIG.base_url}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { credits } = await request.json()

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

    // Calcular precio en USD (incluyendo comisiones de PayPal)
    const basePrice = credits * CREDIT_TO_USD_RATE
    const paypalFees = 0.034 // 3.4%
    const fixedFee = 0.30
    const totalAmount = (basePrice + fixedFee) / (1 - paypalFees)

    // Crear transacción en la base de datos
    const { data: transaction, error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        payment_method: 'paypal',
        credits_amount: credits,
        usd_amount: totalAmount,
        currency: 'USD',
        status: 'pending',
        metadata: {
          base_price: basePrice,
          fees: totalAmount - basePrice,
          total_amount: totalAmount
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

    // Obtener token de acceso de PayPal
    const accessToken = await getPayPalAccessToken()

    // Crear orden en PayPal
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: transaction.id,
        amount: {
          currency_code: 'USD',
          value: totalAmount.toFixed(2)
        },
        description: `${credits} Créditos GameServers Hub`,
        custom_id: transaction.id
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paypal/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-credits?payment=cancelled`,
        brand_name: 'GameServers Hub',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      }
    }

    const paypalResponse = await fetch(`${PAYPAL_CONFIG.base_url}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    })

    const paypalOrder = await paypalResponse.json()

    if (!paypalResponse.ok) {
      console.error('PayPal API Error:', paypalOrder)
      return NextResponse.json(
        { error: 'Error procesando pago con PayPal' },
        { status: 500 }
      )
    }

    // Actualizar transacción con ID de PayPal
    await supabase
      .from('payment_transactions')
      .update({
        external_id: paypalOrder.id,
        metadata: {
          ...transaction.metadata,
          paypal_order: paypalOrder
        }
      })
      .eq('id', transaction.id)

    // Encontrar el enlace de aprobación
    const approvalLink = paypalOrder.links.find((link: any) => link.rel === 'approve')

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      paypal_order_id: paypalOrder.id,
      approval_url: approvalLink?.href,
      amount: totalAmount.toFixed(2)
    })

  } catch (error) {
    console.error('PayPal create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}