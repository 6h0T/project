'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  CheckCircle, 
  Loader2, 
  Clock, 
  Shield, 
  Users, 
  ArrowLeft,
  Globe,
  MapPin,
  Star,
  ExternalLink,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import CountryFlag from './CountryFlag'

interface Server {
  id: number
  title: string
  description: string | null
  website: string | null
  ip: string
  country: string | null
  language: string
  version: string | null
  experience: number | null
  maxLevel: number | null
  status: string
  premium: boolean
  approved: boolean
  createdAt: string
  updatedAt: string
  category?: {
    id: number
    name: string
    slug: string
  }
  user: {
    id: number
    nickname: string
  }
  _count: {
    votes: number
  }
}

interface VoteStatus {
  canVote: boolean
  message: string
  timeLeft?: { hours: number; minutes: number } | null
  totalVotes: number
  hasVoted: boolean
}

interface VotePageProps {
  server: Server
  onOpenAuth?: () => void
}

export default function VotePage({ server, onOpenAuth }: VotePageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    canVote: true,
    message: '',
    totalVotes: server._count.votes,
    hasVoted: false
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

  const checkVoteStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/servers/${server.id}/vote-status`)
      if (response.ok) {
        const data = await response.json()
        setVoteStatus({
          canVote: data.userStatus.canVote,
          message: data.userStatus.canVote ? 'Puedes votar por este servidor' : 'Ya has votado',
          timeLeft: data.userStatus.timeLeft,
          totalVotes: data.votes.monthly,
          hasVoted: data.userStatus.hasVoted
        })
      }
    } catch (error) {
      console.error('Error al verificar estado de voto:', error)
    }
  }, [server.id])

  // Verificar estado de votación al cargar
  useEffect(() => {
    checkVoteStatus()
    if (!user) {
      setCaptchaQuestion(generateCaptcha())
    }
  }, [server.id, user, checkVoteStatus])

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
  }, [voteStatus.timeLeft, checkVoteStatus])

  const handleVote = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const body: any = {}
      
      // Incluir captcha para usuarios no logueados
      if (!user) {
        if (!captcha || captcha.length < 5) {
          setMessage('Por favor completa el captcha correctamente')
          setMessageType('error')
          setLoading(false)
          return
        }
        body.captcha = captcha
        body.expectedCaptcha = captchaQuestion
      }

      const response = await fetch(`/api/servers/${server.id}/vote`, {
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
          totalVotes: data.server.totalVotes,
          hasVoted: true
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'offline':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'review':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'En línea'
      case 'offline':
        return 'Fuera de línea'
      case 'review':
        return 'En revisión'
      default:
        return status
    }
  }

  const showCaptcha = !user && voteStatus.canVote

  const handleRegisterClick = () => {
    // Trigger the auth modal to open on register tab
    if (typeof window !== 'undefined') {
      // Dispatch a custom event to open the auth modal
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab: 'register' } }))
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      
      {/* Header compacto con botón de regreso */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <Button 
          onClick={() => router.back()}
          variant="outline" 
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Contenido principal que ocupa el resto del viewport */}
      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-8 pb-4">
        
        {/* Tarjeta horizontal ultra compacta de información del servidor */}
        <div className="flex-shrink-0 mb-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                
                {/* Información principal del servidor */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    #{server.id}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h1 className="text-lg font-bold text-white truncate">{server.title}</h1>
                      {server.premium && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs flex-shrink-0">
                          ⭐
                        </Badge>
                      )}
                      <Badge className={`${getStatusColor(server.status)} text-xs flex-shrink-0`}>
                        {getStatusText(server.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <CountryFlag country={server.country || 'International'} size="sm" />
                        <span className="text-slate-300">{server.country}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{server.category?.name || 'Lineage 2'}</span>
                      {server.version && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{server.version}</span>
                        </>
                      )}
                      {server.experience && (
                        <>
                          <span className="text-slate-400">•</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">x{server.experience}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estadísticas y botón Web */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      {voteStatus.totalVotes}
                    </div>
                    <div className="text-xs text-slate-400">votos</div>
                  </div>

                  {server.website ? (
                    <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-8 text-xs">
                      <a href={server.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Web
                      </a>
                    </Button>
                  ) : (
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">IP del servidor</div>
                      <div className="font-mono text-cyan-400 bg-slate-700/50 px-2 py-1 rounded text-xs">
                        {server.ip}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de votación que ocupa el resto del espacio disponible */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-5xl">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md h-full">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white flex items-center justify-center text-2xl mb-2">
                  <TrendingUp className="mr-3 h-7 w-7 text-cyan-400" />
                  Votar por este servidor
                </CardTitle>
                <div className="text-slate-300 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Ayuda a {server.title} a subir en el ranking</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-8">
                {/* Mensaje de resultado */}
                {message && (
                  <Alert className={`${
                    messageType === 'success' 
                      ? 'bg-green-900/20 border-green-500/50' 
                      : messageType === 'error'
                      ? 'bg-red-900/20 border-red-500/50'
                      : 'bg-blue-900/20 border-blue-500/50'
                  }`}>
                    <AlertDescription className={`text-center ${
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
                    <AlertDescription className="text-yellow-300 text-center">
                      <span className="font-semibold block">Ya has votado por este servidor</span>
                      <span className="text-sm block">
                        Podrás votar nuevamente en: <span className="font-mono">{voteStatus.timeLeft.hours}h {voteStatus.timeLeft.minutes}m</span>
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Captcha para usuarios no logueados */}
                {showCaptcha && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <Label className="text-slate-300 text-sm font-medium block text-center mb-2">
                        Código de verificación:
                      </Label>
                      <div className="bg-slate-600 p-4 rounded text-center">
                        <span className="font-mono text-2xl tracking-widest text-white font-bold">
                          {captchaQuestion}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={captcha}
                        onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
                        placeholder="Introduce el código"
                        className="bg-slate-700 border-slate-600 text-white text-center font-mono text-lg h-12"
                        maxLength={5}
                        disabled={loading}
                      />
                      
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
                        <div className="text-blue-300 text-sm">
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
                        </div>
                      </Alert>
                    </div>
                  </div>
                )}

                {/* Información del usuario */}
                <div className="text-center text-slate-400">
                  {user ? (
                    <p>Conectado como <span className="text-cyan-400 font-medium">{user.email}</span></p>
                  ) : (
                    <p>
                      <button 
                        onClick={handleRegisterClick}
                        className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors"
                      >
                        Regístrate
                      </button> para votar sin captcha y obtener beneficios adicionales
                    </p>
                  )}
                </div>

                {/* Botón de votación */}
                <div className="max-w-3xl mx-auto">
                  <Button
                    onClick={handleVote}
                    disabled={loading || !voteStatus.canVote || (showCaptcha && captcha.length < 5)}
                    className={`w-full py-4 text-xl font-bold transition-all duration-300 ${
                      loading || !voteStatus.canVote || (showCaptcha && captcha.length < 5)
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/30'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Procesando voto...
                      </>
                    ) : !voteStatus.canVote ? (
                      <>
                        <CheckCircle className="mr-3 h-6 w-6" />
                        Ya has votado
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-3 h-6 w-6" />
                        🗳️ VOTAR AHORA
                      </>
                    )}
                  </Button>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-slate-500 text-center space-y-1 pt-4 border-t border-slate-700">
                  <div className="flex justify-center space-x-6">
                    <span>• Un voto por IP cada 12 horas</span>
                    <span>• Los votos se contabilizan mensualmente</span>
                    <span>• Cada voto suma +1 al ranking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}