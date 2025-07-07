import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

// Configuración de paquetes de créditos
const CREDIT_PACKAGES = {
  starter: {
    credits: 100,
    bonus: 0,
    price: 4.99,
    name: 'Starter Pack'
  },
  popular: {
    credits: 500,
    bonus: 50, // 10% bonus
    price: 19.99,
    name: 'Popular Pack'
  },
  premium: {
    credits: 1000,
    bonus: 150, // 15% bonus
    price: 34.99,
    name: 'Premium Pack'
  },
  ultimate: {
    credits: 2500,
    bonus: 500, // 20% bonus
    price: 79.99,
    name: 'Ultimate Pack'
  }
}

// Configuración de métodos de pago
const PAYMENT_METHODS = {
  coinpayments: {
    name: 'Coinpayments',
    currencies: ['BTC', 'ETH', 'LTC', 'USDT'],
    fees: 0, // Sin comisiones adicionales
    enabled: true
  },
  paypal: {
    name: 'PayPal',
    currencies: ['USD'],
    fees: 0.034, // 3.4% + $0.30
    fixedFee: 0.30,
    enabled: true
  },
  mercadopago: {
    name: 'Mercado Pago',
    currencies: ['USD', 'ARS', 'BRL', 'MXN'],
    fees: 0.029, // 2.9% + impuestos
    enabled: true
  }
}

interface CreateOrderRequest {
  packageId: keyof typeof CREDIT_PACKAGES
  paymentMethod: keyof typeof PAYMENT_METHODS
  currency?: string
  returnUrl?: string
  cancelUrl?: string
}

export async function POST(request: NextRequest) {
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

    const body: CreateOrderRequest = await request.json()
    const { packageId, paymentMethod, currency = 'USD', returnUrl, cancelUrl } = body

    // Validar paquete
    if (!CREDIT_PACKAGES[packageId]) {
      return NextResponse.json({ error: 'Paquete de créditos inválido' }, { status: 400 })
    }

    // Validar método de pago
    if (!PAYMENT_METHODS[paymentMethod] || !PAYMENT_METHODS[paymentMethod].enabled) {
      return NextResponse.json({ error: 'Método de pago no disponible' }, { status: 400 })
    }

    const package_info = CREDIT_PACKAGES[packageId]
    const payment_info = PAYMENT_METHODS[paymentMethod]

    // Calcular precio final con comisiones
    let finalAmount = package_info.price
    if (paymentMethod === 'paypal') {
      const paypalMethod = PAYMENT_METHODS.paypal
      finalAmount = (package_info.price + paypalMethod.fixedFee) / (1 - paypalMethod.fees)
    } else if (paymentMethod === 'mercadopago') {
      finalAmount = package_info.price / (1 - payment_info.fees)
    }

    // Generar ID único para la orden
    const orderId = `${paymentMethod}_${nanoid(12)}_${Date.now()}`
    const totalCredits = package_info.credits + package_info.bonus

    // Crear orden en la base de datos
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        order_id: orderId,
        amount: Math.round(finalAmount * 100) / 100, // Redondear a 2 decimales
        currency: currency.toUpperCase(),
        credits_amount: package_info.credits,
        bonus_credits: package_info.bonus,
        total_credits: totalCredits,
        payment_method: paymentMethod,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        metadata: {
          packageId,
          packageName: package_info.name,
          originalPrice: package_info.price,
          finalPrice: finalAmount,
          fees: payment_info.fees || 0,
          returnUrl,
          cancelUrl
        }
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creando orden:', orderError)
      return NextResponse.json({ error: 'Error creando orden de pago' }, { status: 500 })
    }

    // Generar URL de pago según el método
    let paymentUrl = ''
    let additionalData = {}

    switch (paymentMethod) {
      case 'coinpayments':
        paymentUrl = await generateCoinpaymentsUrl(order, currency)
        break
      
      case 'paypal':
        const paypalData = await generatePayPalUrl(order)
        paymentUrl = paypalData.url
        additionalData = { approvalUrl: paypalData.approvalUrl }
        break
      
      case 'mercadopago':
        paymentUrl = await generateMercadoPagoUrl(order)
        break
      
      default:
        return NextResponse.json({ error: 'Método de pago no implementado' }, { status: 400 })
    }

    // Actualizar orden con datos externos
    if (paymentUrl) {
      await supabase
        .from('payment_orders')
        .update({ 
          external_id: paymentUrl.split('/').pop() || orderId,
          metadata: { ...order.metadata, paymentUrl, ...additionalData }
        })
        .eq('id', order.id)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency,
        credits: {
          base: package_info.credits,
          bonus: package_info.bonus,
          total: totalCredits
        },
        paymentMethod,
        paymentUrl,
        expiresAt: order.expires_at,
        ...additionalData
      }
    })

  } catch (error) {
    console.error('Error en create-order:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// ============================================================================
// FUNCIONES AUXILIARES PARA CADA PROVEEDOR
// ============================================================================

async function generateCoinpaymentsUrl(order: any, currency: string): Promise<string> {
  // TODO: Implementar integración real con Coinpayments
  // Por ahora devolvemos URL de prueba
  const baseUrl = process.env.COINPAYMENTS_MERCHANT_URL || 'https://sandbox.coinpayments.net'
  
  const params = new URLSearchParams({
    cmd: '_pay_simple',
    reset: '1',
    merchant: process.env.COINPAYMENTS_MERCHANT_ID || 'test_merchant',
    item_name: `Créditos - ${order.metadata.packageName}`,
    item_number: order.order_id,
    amount: order.amount.toString(),
    currency: currency.toUpperCase(),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?order=${order.order_id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel?order=${order.order_id}`,
    ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/coinpayments`
  })
  
  return `${baseUrl}/index.php?${params.toString()}`
}

async function generatePayPalUrl(order: any): Promise<{ url: string, approvalUrl: string }> {
  // TODO: Implementar integración real con PayPal SDK
  // Por ahora devolvemos URLs de prueba
  const baseUrl = process.env.PAYPAL_SANDBOX_URL || 'https://api.sandbox.paypal.com'
  
  // Simular respuesta de PayPal
  const mockPayPalResponse = {
    id: `PAYPAL_${order.order_id}`,
    status: 'CREATED',
    links: [
      {
        href: `${baseUrl}/v2/checkout/orders/${order.order_id}`,
        rel: 'self',
        method: 'GET'
      },
      {
        href: `https://www.sandbox.paypal.com/checkoutnow?token=${order.order_id}`,
        rel: 'approve',
        method: 'GET'
      }
    ]
  }
  
  return {
    url: mockPayPalResponse.links[0].href,
    approvalUrl: mockPayPalResponse.links[1].href
  }
}

async function generateMercadoPagoUrl(order: any): Promise<string> {
  // TODO: Implementar integración real con Mercado Pago SDK
  // Por ahora devolvemos URL de prueba
  const baseUrl = process.env.MERCADOPAGO_SANDBOX_URL || 'https://api.mercadopago.com'
  
  return `${baseUrl}/checkout/v1/redirect?preference-id=TEST_${order.order_id}`
}

// ============================================================================
// ENDPOINT GET PARA OBTENER CONFIGURACIÓN
// ============================================================================

export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES,
    paymentMethods: PAYMENT_METHODS,
    currencies: {
      coinpayments: ['BTC', 'ETH', 'LTC', 'USDT', 'DOGE', 'XRP'],
      paypal: ['USD'],
      mercadopago: ['USD', 'ARS', 'BRL', 'MXN', 'COP', 'PEN']
    }
  })
} 