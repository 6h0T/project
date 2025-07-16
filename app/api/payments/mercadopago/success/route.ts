import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

const MERCADOPAGO_CONFIG = {
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api.mercadopago.com' 
    : 'https://api.mercadopago.com'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collection_id = searchParams.get('collection_id')
    const collection_status = searchParams.get('collection_status')
    const payment_id = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const external_reference = searchParams.get('external_reference')
    const payment_type = searchParams.get('payment_type')
    const merchant_order_id = searchParams.get('merchant_order_id')
    const preference_id = searchParams.get('preference_id')
    const site_id = searchParams.get('site_id')
    const processing_mode = searchParams.get('processing_mode')
    const merchant_account_id = searchParams.get('merchant_account_id')

    console.log('MercadoPago Success params:', {
      collection_id,
      collection_status,
      payment_id,
      status,
      external_reference,
      payment_type,
      merchant_order_id,
      preference_id
    })

    if (!external_reference) {
      return redirect('/buy-credits?payment=error&message=missing_reference')
    }

    // Buscar transacción en nuestra base de datos
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', external_reference)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', external_reference)
      return redirect('/buy-credits?payment=error&message=transaction_not_found')
    }

    // Si ya está procesada, redirigir al dashboard
    if (transaction.status === 'completed') {
      return redirect(`/dashboard?payment=success&credits=${transaction.credits_amount}`)
    }

    // Verificar el pago con MercadoPago API si tenemos payment_id
    if (payment_id) {
      try {
        const paymentResponse = await fetch(`${MERCADOPAGO_CONFIG.base_url}/v1/payments/${payment_id}`, {
          headers: {
            'Authorization': `Bearer ${MERCADOPAGO_CONFIG.access_token}`
          }
        })

        const paymentData = await paymentResponse.json()

        if (paymentResponse.ok && paymentData.status === 'approved') {
          // Actualizar transacción como completada
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              metadata: {
                ...transaction.metadata,
                mercadopago_payment: paymentData,
                collection_id,
                collection_status,
                payment_id,
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

          console.log(`MercadoPago payment completed: ${transaction.credits_amount} credits added to user ${transaction.user_id}`)

          return redirect(`/dashboard?payment=success&credits=${transaction.credits_amount}`)
        } else {
          // Pago no aprobado
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              metadata: {
                ...transaction.metadata,
                mercadopago_payment: paymentData,
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', transaction.id)

          return redirect('/buy-credits?payment=error&message=payment_not_approved')
        }
      } catch (apiError) {
        console.error('Error verifying MercadoPago payment:', apiError)
        return redirect('/buy-credits?payment=error&message=verification_error')
      }
    }

    // Si llegamos aquí, verificar por status de URL
    if (status === 'approved' || collection_status === 'approved') {
      // Marcar como completado basado en parámetros de URL
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          metadata: {
            ...transaction.metadata,
            url_params: {
              collection_id,
              collection_status,
              payment_id,
              status,
              payment_type,
              merchant_order_id
            },
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id)

      if (!updateError) {
        // Primero obtener los créditos actuales
        const { data: userProfile, error: fetchUserError } = await supabase
          .from('user_profiles')
          .select('credits')
          .eq('id', transaction.user_id)
          .single()

        if (!fetchUserError && userProfile) {
          // Agregar créditos al usuario
          await supabase
            .from('user_profiles')
            .update({
              credits: userProfile.credits + transaction.credits_amount
            })
            .eq('id', transaction.user_id)
        }

        return redirect(`/dashboard?payment=success&credits=${transaction.credits_amount}`)
      }
    }

    // Si el estado es pendiente
    if (status === 'pending' || collection_status === 'pending') {
      return redirect('/buy-credits?payment=pending&message=payment_processing')
    }

    // Por defecto, redirigir con error
    return redirect('/buy-credits?payment=error&message=unknown_status')

  } catch (error) {
    console.error('MercadoPago success error:', error)
    return redirect('/buy-credits?payment=error&message=internal_error')
  }
}