'use client'

import { useState, useEffect } from 'react'
import GameLayout from '@/components/GameLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CreditCard, 
  Coins, 
  Shield, 
  Zap, 
  Bitcoin,
  DollarSign,
  Calculator,
  Lock,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Métodos de pago disponibles
const PAYMENT_METHODS = {
  coinpayments: {
    id: 'coinpayments',
    name: 'Criptomonedas',
    description: 'Bitcoin, Ethereum y más',
    icon: Bitcoin,
    fees: 0, // Sin comisiones
    color: 'from-orange-500 to-yellow-500',
    currencies: ['BTC', 'ETH', 'LTC', 'USDT', 'DOGE'],
    processingTime: 'Instantáneo'
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    description: 'Tarjetas y cuenta PayPal',
    icon: CreditCard,
    fees: 0.034, // 3.4%
    fixedFee: 0.30,
    color: 'from-blue-600 to-blue-700',
    currencies: ['USD'],
    processingTime: 'Inmediato'
  },
  mercadopago: {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Tarjetas de crédito y débito',
    icon: CreditCard,
    fees: 0.029, // 2.9%
    color: 'from-cyan-500 to-blue-500',
    currencies: ['USD', 'ARS', 'BRL', 'MXN'],
    processingTime: 'Inmediato'
  }
} as const

type PaymentMethodKey = keyof typeof PAYMENT_METHODS
type PaymentMethod = typeof PAYMENT_METHODS[PaymentMethodKey]

export default function BuyCreditsPage() {
  const { user, loading: authLoading } = useAuth()
  const [creditAmount, setCreditAmount] = useState(100) // Cantidad de créditos a comprar
  const [selectedPayment, setSelectedPayment] = useState<string>('coinpayments')
  const [isProcessing, setIsProcessing] = useState(false)
  const [userCredits, setUserCredits] = useState(0)

  // Cargar créditos del usuario
  useEffect(() => {
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  const fetchUserCredits = async () => {
    try {
      if (!user) return;

      // Obtener el token de sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return;

      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error fetching credits:', response.statusText);
        return;
      }

      const data = await response.json();
      setUserCredits(data.credits || 0);
    } catch (error) {
      console.error('Error obteniendo créditos:', error)
    }
  }

  const selectedMethod = PAYMENT_METHODS[selectedPayment as keyof typeof PAYMENT_METHODS]
  
  // Calcular precio final con comisiones
  const calculateFinalPrice = () => {
    let basePrice = creditAmount // 1 crédito = 1 USD
    
    if (selectedPayment === 'paypal') {
      const paypalMethod = PAYMENT_METHODS.paypal
      return (basePrice + paypalMethod.fixedFee) / (1 - paypalMethod.fees)
    } else if (selectedPayment === 'mercadopago') {
      return basePrice / (1 - selectedMethod.fees)
    }
    
    return basePrice // Coinpayments sin comisiones
  }

  const finalPrice = calculateFinalPrice()
  const fees = finalPrice - creditAmount

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
      // TODO: Implementar lógica de compra real
      console.log('Comprando:', {
        credits: creditAmount,
        method: selectedPayment,
        price: finalPrice
      })
      
      // Simular proceso
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`¡Compra exitosa! ${creditAmount} créditos por $${finalPrice.toFixed(2)}`)
    } catch (error) {
      console.error('Error procesando compra:', error)
      alert('Error procesando la compra')
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <GameLayout
        title="Comprar Créditos"
        description="Adquiere créditos para potenciar tu experiencia"
        totalServers={0}
        bgImage="https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg"
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando...</p>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout
      title="Comprar Créditos"
      description="1 Crédito = 1 USD • Transacciones Seguras"
      totalServers={0}
      bgImage="https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg"
    >
      <div className="max-w-7xl mx-auto h-full">
        
        {/* Información del usuario - Más compacta */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md mb-2">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Coins className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs">Créditos Actuales</h3>
                  <p className="text-slate-400 text-xs">{user?.email || 'Usuario'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400">{userCredits.toLocaleString()}</div>
                <div className="text-xs text-slate-400">disponibles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout principal - Reorganizado */}
        <div className="grid grid-cols-12 gap-3 pb-5">
          
          {/* Panel izquierdo - Solo cantidad de créditos */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            
            {/* Cantidad de créditos - Más compacto */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-xs">
                  <Calculator className="h-3 w-3 text-green-400" />
                  Cantidad de Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label htmlFor="credits" className="text-slate-300 text-xs">
                    Créditos a comprar (1 crédito = 1 USD)
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1 bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    placeholder="Ingresa la cantidad"
                  />
                </div>
                
                {/* Calculadora visual - Más compacta */}
                <div className="bg-slate-700/50 p-2 rounded-lg border border-slate-600">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Créditos:</span>
                      <span className="text-white font-medium">{creditAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Precio base:</span>
                      <span className="text-white">${creditAmount.toFixed(2)}</span>
                    </div>
                    {fees > 0 && (
                      <div className="flex justify-between text-orange-400">
                        <span>Comisiones ({selectedMethod.name}):</span>
                        <span>+${fees.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-slate-600" />
                    <div className="flex justify-between text-sm font-bold text-green-400">
                      <span>Total a pagar:</span>
                      <span>${finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Atajos rápidos */}
                <div>
                  <Label className="text-slate-300 text-xs">Cantidades populares:</Label>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[50, 100, 500, 1000].map(amount => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setCreditAmount(amount)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-xs h-6"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ¿Para qué usar créditos? - Horizontal a la izquierda */}
            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-md">
              <CardContent className="p-3">
                <h3 className="text-white font-semibold mb-2 text-xs">¿Para qué usar créditos?</h3>
                <div className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                  <div>• Impulsar servidores en el ranking</div>
                  <div>• Acceso a características premium</div>
                  <div>• Crear banners publicitarios</div>
                  <div>• Soporte prioritario</div>
                  <div>• Sin anuncios en tu perfil</div>
                </div>
              </CardContent>
            </Card>

            {/* Transacción Segura - Movida aquí */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardContent className="p-3">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-xs">
                  <Shield className="h-3 w-3 text-green-400" />
                  Transacción Segura
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-400" />
                    <span>SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-blue-400" />
                    <span>PCI DSS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-400" />
                    <span>Instantáneo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-purple-400" />
                    <span>24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho - Resumen y métodos de pago */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            
            {/* Resumen de compra - Más compacto */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                  Resumen de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {creditAmount.toLocaleString()}
                  </div>
                  <div className="text-green-300 font-medium text-sm">Créditos</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Serán agregados a tu cuenta inmediatamente
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Método de pago:</span>
                      <span className="text-white font-medium">{selectedMethod.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Procesamiento:</span>
                      <span className="text-green-400">{selectedMethod.processingTime}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Nuevos créditos:</span>
                      <span className="text-cyan-400">+{creditAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total después:</span>
                      <span className="text-white font-bold">{(userCredits + creditAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchase}
                  disabled={isProcessing || !user || creditAmount < 1}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 text-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </div>
                  ) : !user ? (
                    'Inicia Sesión para Comprar'
                  ) : (
                    `Pagar $${finalPrice.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Métodos de pago - Horizontal debajo del resumen */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-xs">
                  <CreditCard className="h-3 w-3 text-blue-400" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => {
                    const IconComponent = method.icon
                    const isSelected = selectedPayment === key
                    
                    return (
                      <div
                        key={key}
                        className={`p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50'
                        }`}
                        onClick={() => setSelectedPayment(key)}
                      >
                        <div className="flex flex-col items-center text-center gap-1">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-xs">{method.name}</div>
                            <div className="text-xs text-slate-400">{method.description}</div>
                            <div className="text-xs text-green-400">
                              {method.fees === 0 ? 'Sin comisiones' : `${(method.fees * 100).toFixed(1)}% comisión`}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-3 w-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GameLayout>
  )
} 