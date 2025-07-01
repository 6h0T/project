'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, CheckCircle, Loader2, Clock, Shield, Users, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface VoteButtonProps {
  serverId: number
  serverTitle?: string
  initialVoteCount?: number
}

interface VoteStatus {
  canVote: boolean
  message: string
  timeLeft?: { hours: number; minutes: number } | null
  totalVotes: number
}

export default function VoteButton({ serverId, serverTitle = 'este servidor', initialVoteCount = 0 }: VoteButtonProps) {
  const { user } = useAuth()
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    canVote: true,
    message: '',
    totalVotes: initialVoteCount
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [captcha, setCaptcha] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')

  // Generar captcha simple para usuarios no logueados
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // Verificar estado de votación al cargar
  useEffect(() => {
    checkVoteStatus()
    if (!user) {
      setCaptchaQuestion(generateCaptcha())
    }
  }, [serverId, user])

  // Contador en tiempo real para el tiempo restante
  useEffect(() => {
    if (voteStatus.timeLeft && (voteStatus.timeLeft.hours > 0 || voteStatus.timeLeft.minutes > 0)) {
      const timer = setInterval(() => {
        setVoteStatus(prev => {
          if (!prev.timeLeft) return prev
          
          const newMinutes = prev.timeLeft.minutes - 1
          const newHours = newMinutes < 0 ? prev.timeLeft.hours - 1 : prev.timeLeft.hours
          const adjustedMinutes = newMinutes < 0 ? 59 : newMinutes
          
          if (newHours < 0) {
            // Tiempo agotado, verificar estado nuevamente
            checkVoteStatus()
            return { ...prev, timeLeft: null, canVote: true }
          }
          
          return {
            ...prev,
            timeLeft: { hours: newHours, minutes: adjustedMinutes }
          }
        })
      }, 60000) // Actualizar cada minuto
      
      return () => clearInterval(timer)
    }
  }, [voteStatus.timeLeft])

  const checkVoteStatus = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/vote`)
      if (response.ok) {
        const data = await response.json()
        setVoteStatus({
          canVote: data.canVote,
          message: data.message,
          timeLeft: data.timeLeft,
          totalVotes: data.totalVotes
        })
      }
    } catch (error) {
      console.error('Error al verificar estado de voto:', error)
    }
  }

  const handleVote = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const body: any = {}
      
      // Incluir captcha para usuarios no logueados
      if (!user) {
        if (!captcha || captcha.length < 5) {
          setMessage('Por favor completa el captcha')
          setMessageType('error')
          setLoading(false)
          return
        }
        body.captcha = captcha
        body.expectedCaptcha = captchaQuestion
      }

      const response = await fetch(`/api/servers/${serverId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setMessageType('success')
        setVoteStatus({
          canVote: false,
          message: 'Voto registrado correctamente',
          timeLeft: { hours: 12, minutes: 0 },
          totalVotes: data.server.totalVotes
        })
        setCaptcha('')
        if (!user) {
          setCaptchaQuestion(generateCaptcha())
        }
      } else {
        setMessage(data.message || data.error)
        setMessageType('error')
        if (data.timeLeft) {
          setVoteStatus(prev => ({
            ...prev,
            timeLeft: data.timeLeft,
            canVote: false
          }))
        }
      }
    } catch (error) {
      setMessage('Error de conexión. Inténtalo más tarde.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterClick = () => {
    // Trigger the auth modal to open on register tab
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'register' } }))
    }
  }

  const showCaptcha = !user && voteStatus.canVote

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center">
          <TrendingUp className="mr-2 h-5 w-5 text-cyan-400" />
          Votar por {serverTitle}
        </CardTitle>
        <CardDescription className="text-slate-300">
          <div className="flex items-center justify-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-cyan-400">{voteStatus.totalVotes}</span>
            <span>votos este mes</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mensaje de resultado */}
        {message && (
          <Alert className={`${
            messageType === 'success' 
              ? 'bg-green-900/20 border-green-500/50' 
              : messageType === 'error'
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-blue-900/20 border-blue-500/50'
          }`}>
            <AlertDescription className={`${
              messageType === 'success' ? 'text-green-300' : 
              messageType === 'error' ? 'text-red-300' : 'text-blue-300'
            }`}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Tiempo restante */}
        {voteStatus.timeLeft && (voteStatus.timeLeft.hours > 0 || voteStatus.timeLeft.minutes > 0) && (
          <Alert className="bg-yellow-900/20 border-yellow-500/50">
            <Clock className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              <div className="font-semibold">Ya has votado por este servidor</div>
              <div className="text-sm">
                Podrás votar nuevamente en: <span className="font-mono">{voteStatus.timeLeft.hours}h {voteStatus.timeLeft.minutes}m</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Captcha para usuarios no logueados */}
        {showCaptcha && (
          <div className="space-y-3">
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <Label className="text-slate-300 text-sm">Código de verificación:</Label>
              <div className="bg-slate-600 p-3 rounded mt-2 text-center">
                <span className="font-mono text-xl tracking-widest text-white font-bold">
                  {captchaQuestion}
                </span>
              </div>
            </div>
            <div>
              <Input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
                placeholder="Introduce el código"
                className="bg-slate-700 border-slate-600 text-white text-center font-mono text-lg"
                maxLength={5}
                disabled={loading}
              />
            </div>
            
            {/* Card con información de registro y botón - CON GLOW AZUL */}
            <Alert 
              className="bg-blue-900/20 border-blue-500/50 relative"
              style={{
                boxShadow: `
                  0 0 20px rgba(59, 130, 246, 0.3),
                  0 0 40px rgba(59, 130, 246, 0.2),
                  0 0 60px rgba(59, 130, 246, 0.1)
                `
              }}
            >
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <div className="flex flex-col space-y-3">
                  <div className="text-sm text-center">
                    Los usuarios registrados no necesitan captcha
                  </div>
                  
                  <Button
                    onClick={handleRegisterClick}
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200 hover:border-blue-400/70 transition-all duration-300"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrarse Ahora
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Información del usuario */}
        <div className="text-center text-sm text-slate-400">
          {user ? (
            <p>Conectado como <span className="text-cyan-400 font-medium">{user.email}</span></p>
          ) : (
            <p>
              <button 
                onClick={handleRegisterClick}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors"
              >
                Inicia sesión
              </button> para votar sin captcha
            </p>
          )}
        </div>

        {/* Botón de votación */}
        <Button
          onClick={handleVote}
          disabled={loading || !voteStatus.canVote || (showCaptcha && captcha.length < 5)}
          className={`w-full py-3 text-lg font-bold transition-all duration-300 ${
            loading || !voteStatus.canVote || (showCaptcha && captcha.length < 5)
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/30'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando voto...
            </>
          ) : !voteStatus.canVote ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Ya has votado
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-5 w-5" />
              🗳️ VOTAR AHORA
            </>
          )}
        </Button>

        {/* Información adicional */}
        <div className="text-xs text-slate-500 text-center space-y-1">
          <p>• Un voto por IP cada 12 horas por servidor</p>
          <p>• Los votos se contabilizan mensualmente</p>
          <p>• Cada voto suma +1 al ranking del servidor</p>
        </div>
      </CardContent>
    </Card>
  )
}