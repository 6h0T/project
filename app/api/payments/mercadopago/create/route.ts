import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Configuración de MercadoPago
const MERCADOPAGO_CONFIG = {
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  public_key: process.env.MERCADOPAGO_PUBLIC_KEY || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api.mercadopago.com' 
    : 'https://api.mercadopago.com' // MercadoPago usa la misma URL para sandbox
}

// CONVERSION_RATE: 1 crédito = 1 USD - Modificar aquí para cambiar la conversión
const CREDIT_TO_USD_RATE = 1

export async function POST(request: NextRequest) {
  try {
    const { credits, currency = 'USD' } = await request.json()

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

    // Calcular precio (incluyendo comisiones de MercadoPago)
    const basePrice = credits * CREDIT_TO_USD_RATE
    const mercadopagoFees = 0.029 // 2.9%
    const totalAmount = basePrice / (1 - mercadopagoFees)

    // Crear transacción en la base de datos
    const { data: transaction, error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        payment_method: 'mercadopago',
        credits_amount: credits,
        usd_amount: totalAmount,
        currency,
        status: 'pending',
        metadata: {
          base_price: basePrice,
          fees: totalAmount - basePrice,
          total_amount: totalAmount,
          currency
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

    // Crear preferencia de pago en MercadoPago
    const preferenceData = {
      items: [{
        id: transaction.id,
        title: `${credits} Créditos GameServers Hub`,
        description: `Compra de ${credits} créditos para GameServers Hub`,
        quantity: 1,
        currency_id: currency,
        unit_price: totalAmount
      }],
      payer: {
        email: '', // Se puede obtener del usuario
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/buy-credits?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/buy-credits?payment=pending`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mercadopago/webhook`,
      external_reference: transaction.id,
      statement_descriptor: 'GameServers Hub',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    }

    const mercadopagoResponse = await fetch(`${MERCADOPAGO_CONFIG.base_url}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_CONFIG.access_token}`
      },
      body: JSON.stringify(preferenceData)
    })

    const mercadopagoPreference = await mercadopagoResponse.json()

    if (!mercadopagoResponse.ok) {
      console.error('MercadoPago API Error:', mercadopagoPreference)
      return NextResponse.json(
        { error: 'Error procesando pago con MercadoPago' },
        { status: 500 }
      )
    }

    // Actualizar transacción con ID de MercadoPago
    await supabase
      .from('payment_transactions')
      .update({
        external_id: mercadopagoPreference.id,
        metadata: {
          ...transaction.metadata,
          mercadopago_preference: mercadopagoPreference
        }
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      preference_id: mercadopagoPreference.id,
      init_point: mercadopagoPreference.init_point,
      sandbox_init_point: mercadopagoPreference.sandbox_init_point,
      amount: totalAmount.toFixed(2)
    })

  } catch (error) {
    console.error('MercadoPago create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}