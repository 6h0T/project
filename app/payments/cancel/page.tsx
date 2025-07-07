'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  Home,
  HelpCircle,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Header de cancelación */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mb-6">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Pago Cancelado
            </h1>
            
            <p className="text-xl text-slate-300">
              Tu transacción ha sido cancelada. No se ha realizado ningún cargo.
            </p>
          </div>

          {/* Información de la orden cancelada */}
          {orderId && (
            <Card className="bg-white/5 backdrop-blur-md border-white/20 mb-8">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Orden Cancelada</h3>
                <p className="text-slate-300 mb-4">
                  Orden ID: <span className="font-mono text-red-400">{orderId}</span>
                </p>
                <p className="text-slate-400 text-sm">
                  Esta orden ha sido cancelada y no se procesó ningún pago.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Razones comunes y soluciones */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-400" />
                ¿Por qué se canceló mi pago?
              </h3>
              
              <div className="space-y-4 text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-white">Cancelaste el proceso</div>
                    <div className="text-sm">Decidiste no completar la transacción</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-white">Problema con el método de pago</div>
                    <div className="text-sm">Fondos insuficientes o tarjeta rechazada</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-white">Tiempo de sesión expirado</div>
                    <div className="text-sm">La sesión de pago expiró por inactividad</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-white">Error técnico</div>
                    <div className="text-sm">Problema temporal con el procesador de pagos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones disponibles */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">¿Qué puedes hacer ahora?</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Button asChild className="h-auto p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/buy-credits" className="flex flex-col items-center text-center">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span className="font-medium">Intentar de Nuevo</span>
                    <span className="text-xs opacity-80">Volver a comprar créditos</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-auto p-4 border-white/20 text-white hover:bg-white/10">
                  <Link href="/dashboard" className="flex flex-col items-center text-center">
                    <Home className="h-6 w-6 mb-2" />
                    <span className="font-medium">Ir al Dashboard</span>
                    <span className="text-xs opacity-80">Volver a tu cuenta</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Soporte */}
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-blue-500/30">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">¿Necesitas Ayuda?</h3>
              <p className="text-slate-300 mb-4">
                Si continúas teniendo problemas con los pagos, nuestro equipo de soporte está aquí para ayudarte.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar Soporte
                </Button>
                
                <Button asChild variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
                  <Link href="/help">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Centro de Ayuda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Volver */}
          <div className="text-center mt-8">
            <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 