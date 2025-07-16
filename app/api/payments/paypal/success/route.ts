import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

const PAYPAL_CONFIG = {
  client_id: process.env.PAYPAL_CLIENT_ID || '',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') // PayPal order ID
    const payerId = searchParams.get('PayerID')

    if (!token) {
      return redirect('/buy-credits?payment=error&message=missing_token')
    }

    // Buscar transacción en nuestra base de datos
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', token)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', token)
      return redirect('/buy-credits?payment=error&message=transaction_not_found')
    }

    // Obtener token de acceso de PayPal
    const accessToken = await getPayPalAccessToken()

    // Capturar el pago en PayPal
    const captureResponse = await fetch(`${PAYPAL_CONFIG.base_url}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const captureData = await captureResponse.json()

    if (!captureResponse.ok) {
      console.error('PayPal capture error:', captureData)
      return redirect('/buy-credits?payment=error&message=capture_failed')
    }

    // Verificar que el pago fue completado
    const captureStatus = captureData.purchase_units[0]?.payments?.captures[0]?.status

    if (captureStatus === 'COMPLETED') {
      // Actualizar transacción como completada
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          metadata: {
            ...transaction.metadata,
            paypal_capture: captureData,
            payer_id: payerId,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        return redirect('/buy-credits?payment=error&message=database_error')
      }

      // Primero obtener los créditos actuales
      const { data: userProfile, error: fetchUserError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', transaction.user_id)
        .single()

      if (fetchUserError || !userProfile) {
        console.error('Error obteniendo perfil de usuario:', fetchUserError)
        return redirect('/buy-credits?payment=error&message=user_profile_error')
      }

      // Agregar créditos al usuario en user_profiles
      const { error: creditsError } = await supabase
        .from('user_profiles')
        .update({
          credits: userProfile.credits + transaction.credits_amount
        })
        .eq('id', transaction.user_id)

      if (creditsError) {
        console.error('Error adding credits:', creditsError)
        return redirect('/buy-credits?payment=error&message=credits_error')
      }

      // Log de la transacción completada
      console.log(`PayPal payment completed: ${transaction.credits_amount} credits added to user ${transaction.user_id}`)

      return redirect(`/dashboard?payment=success&credits=${transaction.credits_amount}`)
    } else {
      // Pago no completado
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            paypal_capture: captureData,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id)

      return redirect('/buy-credits?payment=error&message=payment_not_completed')
    }

  } catch (error) {
    console.error('PayPal success error:', error)
    return redirect('/buy-credits?payment=error&message=internal_error')
  }
}