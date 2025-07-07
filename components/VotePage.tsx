'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  TrendingUp, 
  Users,
  Clock,
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
  user?: {
    id: number
    nickname: string
    email?: string
  }
  _count?: {
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
    totalVotes: server._count?.votes || 0,
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

      console.log('[CLIENT] Enviando voto con body:', body)
      
      const response = await fetch(`/api/servers/${server.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      console.log('[CLIENT] Response status:', response.status)
      console.log('[CLIENT] Response headers:', response.headers)
      
      const responseText = await response.text()
      console.log('[CLIENT] Response text:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('[CLIENT] Failed to parse JSON:', e)
        data = { error: responseText }
      }

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

                  {server.website && (
                    <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-8 text-xs">
                      <a href={server.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Web
                      </a>
                    </Button>
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

              <CardContent className="flex-1 flex flex-col justify-center">
                {/* Estado de votación */}
                <div className="mb-8 text-center">
                  {voteStatus.canVote ? (
                    <div className="space-y-4">
                      <div className="text-lg text-green-400 font-medium">
                        ✅ Puedes votar por este servidor
                      </div>
                      
                      {/* Captcha para usuarios no logueados */}
                      {showCaptcha && (
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="text-sm text-slate-300 mb-2">
                            Completa el captcha para continuar:
                          </div>
                          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                            <div className="text-lg font-mono text-cyan-400 mb-3 text-center">
                              {captchaQuestion}
                            </div>
                            <Input
                              type="text"
                              placeholder="Respuesta..."
                              value={captcha}
                              onChange={(e) => setCaptcha(e.target.value)}
                              className="text-center bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Botón de votación */}
                      <Button 
                        onClick={handleVote} 
                        disabled={loading || (showCaptcha && !captcha)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Votando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-6 w-6" />
                            <span>¡VOTAR AHORA!</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-lg text-orange-400 font-medium">
                        ⏳ {voteStatus.message}
                      </div>
                      
                      {voteStatus.timeLeft && (
                        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="text-slate-300 text-sm mb-2">
                            Tiempo restante para votar nuevamente:
                          </div>
                          <div className="text-2xl font-bold text-cyan-400">
                            {voteStatus.timeLeft.hours}h {voteStatus.timeLeft.minutes}m
                          </div>
                        </div>
                      )}
                      
                      {!user && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                          <h3 className="text-blue-400 font-medium mb-2">
                            💡 ¿Sabías que...?
                          </h3>
                          <p className="text-blue-200 text-sm mb-3">
                            Los usuarios registrados pueden votar más fácilmente y obtener beneficios adicionales.
                          </p>
                          <Button
                            onClick={handleRegisterClick}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                          >
                            Registrarse gratis
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mensaje de resultado */}
                {message && (
                  <div className={`p-4 rounded-lg border text-center mb-6 ${
                    messageType === 'success' 
                      ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                      : 'bg-red-900/20 border-red-500/30 text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Información adicional del servidor */}
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Star className="mr-2 h-4 w-4 text-yellow-400" />
                    Información del Servidor
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Descripción:</span>
                      <p className="text-slate-200 mt-1">{server.description || 'Sin descripción disponible'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {server.maxLevel && (
                        <div>
                          <span className="text-slate-400">Nivel máximo:</span>
                          <p className="text-slate-200">{server.maxLevel}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-slate-400">Total de votos:</span>
                        <p className="text-cyan-400 font-bold">{voteStatus.totalVotes}</p>
                      </div>
                    </div>
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