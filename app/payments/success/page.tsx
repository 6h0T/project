'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Coins, 
  Gift, 
  ArrowRight, 
  Home,
  RefreshCw,
  Clock,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface OrderStatus {
  orderId: string
  status: string
  credits: {
    base: number
    bonus: number
    total: number
  }
  payment: {
    method: string
    amount: number
    currency: string
  }
  time: {
    createdAt: string
    processedAt?: string
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order')
  
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      checkOrderStatus()
      // Verificar cada 5 segundos por si el pago aún se está procesando
      const interval = setInterval(checkOrderStatus, 5000)
      
      // Limpiar después de 2 minutos
      setTimeout(() => clearInterval(interval), 120000)
      
      return () => clearInterval(interval)
    } else {
      setError('ID de orden no encontrado')
      setLoading(false)
    }
  }, [orderId])

  const checkOrderStatus = async () => {
    try {
      // TODO: Implementar verificación real del estado
      // const response = await fetch(`/api/payments/status/${orderId}`)
      // const data = await response.json()
      
      // Simular respuesta exitosa por ahora
      setOrderStatus({
        orderId: orderId!,
        status: 'completed',
        credits: {
          base: 500,
          bonus: 50,
          total: 550
        },
        payment: {
          method: 'coinpayments',
          amount: 19.99,
          currency: 'USD'
        },
        time: {
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString()
        }
      })
      setLoading(false)
    } catch (error) {
      console.error('Error verificando estado:', error)
      setError('Error verificando el estado del pago')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/5 backdrop-blur-md border-white/20 p-8">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
            <h2 className="text-xl font-bold text-white">Verificando tu pago...</h2>
            <p className="text-slate-300">Por favor espera mientras confirmamos tu transacción</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !orderStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/5 backdrop-blur-md border-red-500/30 p-8 max-w-md">
          <CardContent className="text-center space-y-4">
            <div className="text-red-500 text-6xl">⚠️</div>
            <h2 className="text-xl font-bold text-white">Error de Verificación</h2>
            <p className="text-slate-300">{error || 'No se pudo verificar el estado del pago'}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">Ir al Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = orderStatus.status === 'completed'
  const isPending = orderStatus.status === 'pending'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Header de éxito */}
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-12 w-12 text-white" />
              ) : (
                <Clock className="h-12 w-12 text-white" />
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {isCompleted ? '¡Pago Exitoso!' : 'Pago en Proceso'}
            </h1>
            
            <p className="text-xl text-slate-300">
              {isCompleted 
                ? 'Tus créditos han sido agregados a tu cuenta'
                : 'Tu pago está siendo procesado, recibirás tus créditos pronto'
              }
            </p>
          </div>

          {/* Detalles de la transacción */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-400" />
                Detalles de tu Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Información de créditos */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Créditos Adquiridos</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Créditos base:</span>
                      <span className="text-white font-medium">
                        {orderStatus.credits.base.toLocaleString()}
                      </span>
                    </div>
                    
                    {orderStatus.credits.bonus > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span className="flex items-center gap-1">
                          <Gift className="h-4 w-4" />
                          Créditos bonus:
                        </span>
                        <span className="font-medium">
                          +{orderStatus.credits.bonus.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <hr className="border-white/20" />
                    
                    <div className="flex justify-between text-xl font-bold text-yellow-400">
                      <span>Total:</span>
                      <span>{orderStatus.credits.total.toLocaleString()} créditos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Información de Pago</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Orden ID:</span>
                      <span className="text-white font-mono text-sm">
                        {orderStatus.orderId}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-slate-300">
                      <span>Método:</span>
                      <span className="text-white capitalize">
                        {orderStatus.payment.method}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-slate-300">
                      <span>Monto:</span>
                      <span className="text-white font-medium">
                        ${orderStatus.payment.amount} {orderStatus.payment.currency}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-slate-300">
                      <span>Estado:</span>
                      <span className={`font-medium ${
                        isCompleted ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {isCompleted ? 'Completado' : 'Procesando'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje de bonus */}
              {orderStatus.credits.bonus > 0 && isCompleted && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 text-purple-300 font-medium mb-2">
                    <Star className="h-5 w-5" />
                    ¡Felicidades por tu compra!
                  </div>
                  <p className="text-purple-200 text-sm">
                    Has recibido {orderStatus.credits.bonus.toLocaleString()} créditos adicionales como bonus. 
                    ¡Aprovecha al máximo tu inversión!
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                  <Link href="/create-server">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Crear Servidor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">¿Qué sigue?</h3>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <div>
                    <div className="font-medium text-white">Verifica tus créditos</div>
                    <div className="text-sm">Revisa tu saldo en el dashboard para confirmar que los créditos fueron agregados</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <div>
                    <div className="font-medium text-white">Usa tus créditos</div>
                    <div className="text-sm">Impulsa tus servidores, accede a características premium y mejora tu ranking</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  <div>
                    <div className="font-medium text-white">Disfruta los beneficios</div>
                    <div className="text-sm">Aprovecha todas las ventajas de ser un usuario premium en nuestra plataforma</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 