// Función handlePurchase actualizada para usar las APIs reales
const handlePurchase = async () => {
  if (!user) {
    alert('Debes iniciar sesión para comprar créditos')
    return
  }

  if (creditAmount < 1) {
    alert('La cantidad mínima es 1 crédito')
    return
  }

  setIsProcessing(true)
  
  try {
    let apiEndpoint = ''
    let requestBody: any = {
      credits: creditAmount,
      user_id: user.id
    }

    // Determinar endpoint según método de pago
    switch (selectedPayment) {
      case 'coinpayments':
        apiEndpoint = '/api/payments/coinpayments/create'
        requestBody.currency = 'BTC' // Moneda por defecto
        break
      case 'paypal':
        apiEndpoint = '/api/payments/paypal/create'
        break
      case 'mercadopago':
        apiEndpoint = '/api/payments/mercadopago/create'
        requestBody.currency = 'USD' // Moneda por defecto
        break
      default:
        throw new Error('Método de pago no válido')
    }

    console.log('Creando pago:', {
      credits: creditAmount,
      method: selectedPayment,
      price: finalPrice,
      endpoint: apiEndpoint
    })

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error procesando el pago')
    }

    console.log('Respuesta del pago:', data)

    // Redirigir según el método de pago
    if (selectedPayment === 'coinpayments') {
      if (data.payment_url) {
        window.open(data.payment_url, '_blank')
      } else {
        alert('Pago creado. Revisa tu email para instrucciones de pago.')
      }
    } else if (selectedPayment === 'paypal') {
      if (data.approval_url) {
        window.location.href = data.approval_url
      } else {
        throw new Error('No se recibió URL de aprobación de PayPal')
      }
    } else if (selectedPayment === 'mercadopago') {
      const redirectUrl = data.init_point || data.sandbox_init_point
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        throw new Error('No se recibió URL de pago de MercadoPago')
      }
    }

  } catch (error) {
    console.error('Error procesando compra:', error)
    alert(error instanceof Error ? error.message : 'Error procesando la compra')
  } finally {
    setIsProcessing(false)
  }
}