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
  UserPlus,
  Settings,
  Database,
  FileText
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
  rank?: number // Agregar ranking al interface
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
  const [serverRank, setServerRank] = useState<number | null>(null)

  // Generar captcha simple para usuarios no logueados
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // Función para obtener el ranking del servidor
  const fetchServerRank = useCallback(async () => {
    try {
      const categorySlug = server.category?.slug || 'lineage-2'
      const response = await fetch(`/api/servers?category=${categorySlug}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.servers) {
          // Encontrar la posición del servidor actual en la lista ordenada
          const serverIndex = data.servers.findIndex((s: any) => s.id.toString() === server.id.toString())
          if (serverIndex !== -1) {
            setServerRank(serverIndex + 1)
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo ranking del servidor:', error)
    }
  }, [server.id, server.category?.slug])

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

  // Verificar estado de votación y ranking al cargar
  useEffect(() => {
    checkVoteStatus()
    fetchServerRank()
    if (!user) {
      setCaptchaQuestion(generateCaptcha())
    }
  }, [server.id, user, checkVoteStatus, fetchServerRank])

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
      
      let data: any
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      
      {/* Banners en los bordes extremos del viewport */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 hidden 2xl:block">
        <div className="w-[250px] h-[600px] bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-500 transition-colors duration-200">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Star className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-sm font-medium mb-2">Banner Space</p>
            <p className="text-xs text-slate-500">250x600px</p>
          </div>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 hidden 2xl:block">
        <div className="w-[250px] h-[600px] bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-500 transition-colors duration-200">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Star className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-sm font-medium mb-2">Banner Space</p>
            <p className="text-xs text-slate-500">250x600px</p>
          </div>
        </div>
      </div>
      
      {/* Header compacto con botón de regreso */}
      <div className="px-4 sm:px-6 lg:px-8 pt-1 pb-2">
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

      {/* Encabezado de votación */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center text-2xl mb-2">
            <TrendingUp className="mr-3 h-7 w-7 text-cyan-400" />
            <h2 className="text-white font-bold">Votar por este servidor</h2>
          </div>
          <div className="text-slate-300">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Ayuda a {server.title} a subir en el ranking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal centrado - Sin banners en el grid */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8 2xl:px-[300px]">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Información del Servidor - Contenedor Unificado */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="py-6 space-y-6">
              
              {/* Encabezado del Servidor - Fila Superior */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl font-bold text-white">
                    #{serverRank || server.id} {server.title}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(server.status)} text-sm`}>
                      {getStatusText(server.status)}
                    </Badge>
                    {server.premium && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm">
                        ⭐ Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Botón web alineado a la derecha */}
                {server.website && (
                  <div className="flex-shrink-0">
                    <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                      <a href={server.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visitar Web Oficial
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-slate-700"></div>

              {/* Tres Columnas Inferiores */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna 1: Información Técnica Básica */}
                <div className="bg-slate-900/30 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-blue-400" />
                    Información del Servidor
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">País</span>
                      <div className="flex items-center space-x-2">
                        <CountryFlag country={server.country || 'International'} size="sm" />
                        <span className="text-slate-200">{server.country}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Categoría</span>
                      <span className="text-slate-200">{server.category?.name || 'Lineage 2'}</span>
                    </div>

                    {server.version && (
                      <div>
                        <span className="text-slate-400 text-sm font-medium block mb-1">Versión</span>
                        <span className="text-slate-200">{server.version}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Experiencia</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">x{server.experience || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna 2: Información Técnica Avanzada */}
                <div className="bg-slate-900/30 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Database className="mr-2 h-5 w-5 text-green-400" />
                    Detalles Técnicos
                  </h3>
                  <div className="space-y-4">
                    {server.maxLevel && (
                      <div>
                        <span className="text-slate-400 text-sm font-medium block mb-1">Nivel máximo</span>
                        <span className="text-slate-200">{server.maxLevel}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Idioma</span>
                      <span className="text-slate-200">{server.language}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Ranking</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                        <span className="text-cyan-400 font-semibold">#{serverRank || server.id}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Total de votos</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-semibold">{voteStatus.totalVotes}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-sm font-medium block mb-1">Fecha de creación</span>
                      <span className="text-slate-200">{new Date(server.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Columna 3: Descripción del Servidor */}
                <div className="bg-slate-900/30 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-purple-400" />
                    Descripción del Servidor
                  </h3>
                  <div className="text-sm text-slate-300 space-y-3 text-left">
                    {server.description ? (
                      <div className="leading-relaxed">
                        {server.description.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">
                        No hay descripción disponible para este servidor.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Votación - Más compacto */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="py-6">
              {/* Estado de votación */}
              <div className="text-center space-y-4">
                {voteStatus.canVote ? (
                  <div className="space-y-4">
                    <div className="text-lg text-green-400 font-medium">
                      ✅ Puedes votar por este servidor
                    </div>
                    
                    {/* Captcha para usuarios no logueados */}
                    {showCaptcha && (
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="text-sm text-slate-300">
                          Completa el captcha para continuar:
                        </div>
                        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                          <div className="text-xl font-mono text-cyan-400 mb-3 text-center">
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
                    
                    {/* Botón de votación centrado */}
                    <div className="flex justify-center">
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
                            <TrendingUp className="h-5 w-5" />
                            <span>¡VOTAR AHORA!</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-lg text-orange-400 font-medium">
                      ⏳ {voteStatus.message}
                    </div>
                    
                    {voteStatus.timeLeft && (
                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 max-w-sm mx-auto">
                        <div className="text-slate-300 text-sm mb-2">
                          Tiempo restante para votar nuevamente:
                        </div>
                        <div className="text-2xl font-bold text-cyan-400">
                          {voteStatus.timeLeft.hours}h {voteStatus.timeLeft.minutes}m
                        </div>
                      </div>
                    )}
                    
                    {!user && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 max-w-sm mx-auto">
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
                          className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Registrarse gratis
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje de resultado */}
                {message && (
                  <div className={`p-3 rounded-lg border text-center max-w-sm mx-auto ${
                    messageType === 'success' 
                      ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                      : 'bg-red-900/20 border-red-500/30 text-red-400'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}