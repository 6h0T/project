import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Configuración de webhooks por proveedor
const WEBHOOK_CONFIGS = {
  coinpayments: {
    secretKey: process.env.COINPAYMENTS_IPN_SECRET || 'test_secret',
    requiredFields: ['status', 'txn_id', 'invoice', 'amount1', 'currency1']
  },
  paypal: {
    webhookId: process.env.PAYPAL_WEBHOOK_ID || 'test_webhook_id',
    requiredFields: ['event_type', 'resource']
  },
  mercadopago: {
    secretKey: process.env.MERCADOPAGO_WEBHOOK_SECRET || 'test_secret',
    requiredFields: ['action', 'data']
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    // Determinar proveedor basado en headers o URL
    let provider = determineProvider(headers, request.url)
    
    if (!provider) {
      console.error('No se pudo determinar el proveedor de pago')
      return NextResponse.json({ error: 'Proveedor no identificado' }, { status: 400 })
    }

    console.log(`📨 Webhook recibido de ${provider}:`, {
      headers: Object.keys(headers),
      bodyLength: body.length
    })

    // Verificar autenticidad del webhook
    const isValid = await verifyWebhook(provider, body, headers)
    if (!isValid) {
      console.error(`❌ Webhook inválido de ${provider}`)
      return NextResponse.json({ error: 'Webhook inválido' }, { status: 401 })
    }

    // Procesar según el proveedor
    let result
    switch (provider) {
      case 'coinpayments':
        result = await processCoinpaymentsWebhook(body)
        break
      
      case 'paypal':
        result = await processPayPalWebhook(body)
        break
      
      case 'mercadopago':
        result = await processMercadoPagoWebhook(body)
        break
      
      default:
        return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 })
    }

    if (result.success) {
      console.log(`✅ Webhook de ${provider} procesado exitosamente:`, result.orderId)
      return NextResponse.json({ success: true, message: 'Webhook procesado' })
    } else {
      console.error(`❌ Error procesando webhook de ${provider}:`, result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error general en webhook:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function determineProvider(headers: Record<string, string>, url: string): string | null {
  // Coinpayments
  if (headers['user-agent']?.includes('CoinPayments') || url.includes('coinpayments')) {
    return 'coinpayments'
  }
  
  // PayPal
  if (headers['paypal-transmission-id'] || url.includes('paypal')) {
    return 'paypal'
  }
  
  // Mercado Pago
  if (headers['x-signature'] || url.includes('mercadopago')) {
    return 'mercadopago'
  }
  
  return null
}

async function verifyWebhook(provider: string, body: string, headers: Record<string, string>): Promise<boolean> {
  try {
    switch (provider) {
      case 'coinpayments':
        return verifyCoinpaymentsWebhook(body, headers)
      
      case 'paypal':
        return verifyPayPalWebhook(body, headers)
      
      case 'mercadopago':
        return verifyMercadoPagoWebhook(body, headers)
      
      default:
        return false
    }
  } catch (error) {
    console.error(`Error verificando webhook de ${provider}:`, error)
    return false
  }
}

function verifyCoinpaymentsWebhook(body: string, headers: Record<string, string>): boolean {
  // En entorno de desarrollo, siempre válido
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // TODO: Implementar verificación real de Coinpayments
  // const hmac = headers['http_hmac'] || headers['hmac']
  // const secret = WEBHOOK_CONFIGS.coinpayments.secretKey
  // const calculated = crypto.createHmac('sha512', secret).update(body).digest('hex')
  // return hmac === calculated
  
  return true // Por ahora para testing
}

function verifyPayPalWebhook(body: string, headers: Record<string, string>): boolean {
  // En entorno de desarrollo, siempre válido
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // TODO: Implementar verificación real de PayPal
  // Requiere validar con PayPal SDK
  return true // Por ahora para testing
}

function verifyMercadoPagoWebhook(body: string, headers: Record<string, string>): boolean {
  // En entorno de desarrollo, siempre válido
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // TODO: Implementar verificación real de Mercado Pago
  // const signature = headers['x-signature']
  // const secret = WEBHOOK_CONFIGS.mercadopago.secretKey
  // etc...
  
  return true // Por ahora para testing
}

// ============================================================================
// PROCESADORES POR PROVEEDOR
// ============================================================================

async function processCoinpaymentsWebhook(body: string): Promise<{ success: boolean, orderId?: string, error?: string }> {
  try {
    const data = new URLSearchParams(body)
    const status = data.get('status')
    const txnId = data.get('txn_id')
    const invoice = data.get('invoice') // Este será nuestro order_id
    const amount = parseFloat(data.get('amount1') || '0')
    const currency = data.get('currency1')

    if (!invoice) {
      return { success: false, error: 'Invoice/order_id no encontrado' }
    }

    console.log(`🪙 Coinpayments webhook - Status: ${status}, TxnId: ${txnId}, Invoice: ${invoice}`)

    // Status codes de Coinpayments:
    // 100 = Complete, 2 = Queued, 1 = Pending, -1 = Cancelled, etc.
    if (status === '100') {
      // Pago completado
      const success = await processPaymentCompletion(invoice, txnId || 'unknown', {
        provider: 'coinpayments',
        amount,
        currency,
        status,
        rawData: Object.fromEntries(data.entries())
      })

      return success 
        ? { success: true, orderId: invoice }
        : { success: false, error: 'Error procesando pago completado' }
    }

    // Otros estados no requieren acción por ahora
    return { success: true, orderId: invoice }

  } catch (error) {
    console.error('Error procesando Coinpayments webhook:', error)
    return { success: false, error: 'Error interno' }
  }
}

async function processPayPalWebhook(body: string): Promise<{ success: boolean, orderId?: string, error?: string }> {
  try {
    const data = JSON.parse(body)
    const eventType = data.event_type
    const resource = data.resource

    console.log(`💳 PayPal webhook - Event: ${eventType}`)

    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource.invoice_id || resource.custom_id
      const transactionId = resource.id
      
      if (!orderId) {
        return { success: false, error: 'Order ID no encontrado en PayPal webhook' }
      }

      const success = await processPaymentCompletion(orderId, transactionId, {
        provider: 'paypal',
        eventType,
        resource,
        rawData: data
      })

      return success 
        ? { success: true, orderId }
        : { success: false, error: 'Error procesando pago de PayPal' }
    }

    return { success: true }

  } catch (error) {
    console.error('Error procesando PayPal webhook:', error)
    return { success: false, error: 'Error interno' }
  }
}

async function processMercadoPagoWebhook(body: string): Promise<{ success: boolean, orderId?: string, error?: string }> {
  try {
    const data = JSON.parse(body)
    const action = data.action
    const paymentData = data.data

    console.log(`🇦🇷 MercadoPago webhook - Action: ${action}`)

    if (action === 'payment.updated' || action === 'payment.created') {
      const paymentId = paymentData.id
      
      // Necesitaríamos hacer una consulta a MP para obtener detalles completos
      // Por ahora simulamos
      const orderId = `mp_${paymentId}` // Esto vendría del external_reference
      
      const success = await processPaymentCompletion(orderId, paymentId, {
        provider: 'mercadopago',
        action,
        paymentData,
        rawData: data
      })

      return success 
        ? { success: true, orderId }
        : { success: false, error: 'Error procesando pago de MercadoPago' }
    }

    return { success: true }

  } catch (error) {
    console.error('Error procesando MercadoPago webhook:', error)
    return { success: false, error: 'Error interno' }
  }
}

// ============================================================================
// FUNCIÓN CENTRAL PARA PROCESAR PAGOS COMPLETADOS
// ============================================================================

async function processPaymentCompletion(
  orderId: string, 
  transactionId: string, 
  providerData: any
): Promise<boolean> {
  try {
    // Usar la función SQL para procesar el pago
    const { data, error } = await supabase
      .rpc('process_payment_completion', {
        p_order_id: orderId,
        p_transaction_id: transactionId,
        p_provider_data: providerData
      })

    if (error) {
      console.error('Error en process_payment_completion:', error)
      return false
    }

    console.log(`✅ Pago procesado exitosamente - Orden: ${orderId}, Transacción: ${transactionId}`)
    return data === true

  } catch (error) {
    console.error('Error procesando completion:', error)
    return false
  }
} 