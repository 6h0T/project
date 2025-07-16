'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Upload, CreditCard, Eye, Info, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import BannerPreview from '@/components/BannerPreview'
import BannerImageUpload from '@/components/BannerImageUpload'

interface UserProfile {
  id: string
  email: string
  credits: number
}

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  target_url: string
  position: string
  game_category: string
  status: 'active' | 'pending' | 'rejected'
  credits_cost: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

const bannerPositions = [
  // Página Principal
  { 
    value: 'home-top-1', 
    label: 'Banner Superior Izquierdo (468x85)', 
    cost: 2, 
    description: 'Página principal - Posición premium superior izquierda',
    dimensions: '468x85',
    page: 'Página Principal'
  },
  { 
    value: 'home-top-2', 
    label: 'Banner Superior Derecho (468x85)', 
    cost: 2, 
    description: 'Página principal - Posición premium superior derecha',
    dimensions: '468x85',
    page: 'Página Principal'
  },
  { 
    value: 'home-sidebar-left-bottom', 
    label: 'Banner Lateral Izquierdo Inferior (280x500)', 
    cost: 3, 
    description: 'Página principal - Sidebar izquierdo inferior, alta visibilidad',
    dimensions: '280x500',
    page: 'Página Principal'
  },
  { 
    value: 'home-sidebar-right', 
    label: 'Banner Lateral Derecho (280x500)', 
    cost: 3, 
    description: 'Página principal - Sidebar derecho, alta visibilidad',
    dimensions: '280x500',
    page: 'Página Principal'
  },
  { 
    value: 'home-recent-servers', 
    label: 'Banner Servidores Recientes (280x200)', 
    cost: 1, 
    description: 'Página principal - Área de servidores recientes',
    dimensions: '280x200',
    page: 'Página Principal'
  },
  // Página de Votación
  { 
    value: 'vote-left-skyscraper', 
    label: 'Banner Izquierdo Votación (250x600)', 
    cost: 4, 
    description: 'Página de votación - Lateral izquierdo, máxima exposición',
    dimensions: '250x600',
    page: 'Página de Votación'
  },
  { 
    value: 'vote-right-skyscraper', 
    label: 'Banner Derecho Votación (250x600)', 
    cost: 4, 
    description: 'Página de votación - Lateral derecho, máxima exposición',
    dimensions: '250x600',
    page: 'Página de Votación'
  }
]

const durations = [
  { value: '10', label: '10 días', multiplier: 1 },
  { value: '20', label: '20 días', multiplier: 1.8 },
  { value: '30', label: '30 días', multiplier: 2.5 },
]

export default function CreateBannerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [existingBanners, setExistingBanners] = useState<Banner[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null,
    targetUrl: '',
    position: '',
    duration: '10',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user) {
      fetchProfile()
      fetchExistingBanners()
    }
  }, [user, loading, router])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchExistingBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    }
  }

  const calculateCost = () => {
    const position = bannerPositions.find(p => p.value === formData.position)
    const duration = durations.find(d => d.value === formData.duration)
    return position && duration ? Math.round(position.cost * duration.multiplier) : 0
  }

  const handlePositionSelect = (position: string) => {
    setFormData(prev => ({ ...prev, position }))
  }

  const handleImageChange = (imageUrl: string, imageFile: File | null) => {
    setFormData(prev => ({ ...prev, imageUrl, imageFile }))
  }

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setIsCreating(true)
    setMessage('')

    try {
      const cost = calculateCost()
      
      if (profile.credits < cost) {
        setMessage(`Necesitas ${cost} créditos para crear este banner. Tienes ${profile.credits} créditos disponibles.`)
        setMessageType('error')
        return
      }

      if (!formData.position) {
        setMessage('Por favor selecciona una posición para el banner.')
        setMessageType('error')
        return
      }

      if (!formData.imageFile && !formData.imageUrl) {
        setMessage('Por favor carga una imagen para el banner.')
        setMessageType('error')
        return
      }

      // Verificar si la posición ya está ocupada
      const positionTaken = existingBanners.some(banner => banner.position === formData.position)
      if (positionTaken) {
        setMessage('Esta posición ya está ocupada. Por favor selecciona otra posición.')
        setMessageType('error')
        return
      }

      // Subir imagen si hay un archivo
      let imageUrl = formData.imageUrl
      if (formData.imageFile) {
        try {
          imageUrl = await uploadImageToSupabase(formData.imageFile)
        } catch (error) {
          setMessage('Error al subir la imagen. Por favor intenta de nuevo.')
          setMessageType('error')
          return
        }
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(startDate.getDate() + parseInt(formData.duration))

      // Validar si el banner puede ser auto-aprobado
      const { validateBanner } = await import('@/lib/bannerValidation')
      const validation = validateBanner({
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        target_url: formData.targetUrl,
        position: formData.position
      })

      // Determinar estado inicial del banner
      const initialStatus = validation.canAutoApprove ? 'active' : 'pending'
      const initialStartDate = validation.canAutoApprove ? startDate.toISOString() : null

      const { data: banner, error: bannerError } = await supabase
        .from('banners')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          image_url: imageUrl,
          target_url: formData.targetUrl,
          position: formData.position,
          game_category: 'all',
          status: initialStatus,
          credits_cost: cost,
          start_date: initialStartDate,
          end_date: endDate.toISOString(),
        })
        .select()
        .single()

      if (bannerError) throw bannerError

      // Deduct credits
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ credits: profile.credits - cost })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Mensaje personalizado según el estado del banner
      if (validation.canAutoApprove) {
        setMessage(`¡Banner creado y aprobado automáticamente! Ya está activo y visible en el sitio. (Score de validación: ${validation.score}%)`)
        setMessageType('success')
      } else {
        setMessage(`Banner creado exitosamente y enviado para revisión manual. Para aprobación automática, asegúrate de que la descripción tenga al menos 120 caracteres. (Score actual: ${validation.score}%)`)
        setMessageType('info')
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        imageFile: null,
        targetUrl: '',
        position: '',
        duration: '10',
      })

      // Refresh data
      fetchProfile()
      fetchExistingBanners()
    } catch (error: any) {
      setMessage(error.message || 'Error al crear el banner')
      setMessageType('error')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mr-4 text-slate-300 border-slate-600 hover:text-white hover:border-cyan-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Crear Banner Publicitario</h1>
            <p className="text-slate-400">Diseña y publica tu banner en posiciones estratégicas</p>
          </div>
        </div>

        {/* Credits Display */}
        {profile && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-yellow-300 font-semibold">Créditos Disponibles</p>
                    <p className="text-yellow-400 text-sm">Después de la compra: {profile.credits - calculateCost()} créditos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-300">{profile.credits}</p>
                  <p className="text-yellow-400 text-sm">Costo: {calculateCost()} créditos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Banner Preview */}
          <div className="order-2 xl:order-1">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Eye className="mr-3 h-6 w-6 text-cyan-400" />
                  Vista Previa en Vivo
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Haz clic directamente en cualquier posición disponible para seleccionarla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BannerPreview 
                  existingBanners={existingBanners}
                  selectedPosition={formData.position}
                  onPositionSelect={handlePositionSelect}
                  previewBanner={formData.imageUrl ? {
                    title: formData.title || 'Tu Banner',
                    image_url: formData.imageUrl,
                    position: formData.position
                  } : undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* Banner Form */}
          <div className="order-1 xl:order-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Upload className="mr-3 h-6 w-6 text-cyan-400" />
                  Información del Banner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {message && (
                    <Alert className={`${
                      messageType === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                      messageType === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                      'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    }`}>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="title" className="text-slate-300">Título del Banner</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: ¡Únete a nuestro servidor!"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-300">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del banner..."
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Imagen del Banner</Label>
                    <BannerImageUpload
                      selectedPosition={formData.position}
                      currentImageUrl={formData.imageUrl}
                      onImageChange={handleImageChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetUrl" className="text-slate-300">URL de Destino</Label>
                    <Input
                      id="targetUrl"
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                      placeholder="https://tu-servidor.com"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Posición del Banner</Label>
                    <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar posición">
                          {formData.position ? bannerPositions.find(p => p.value === formData.position)?.label : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {bannerPositions.map((position) => {
                          const isOccupied = existingBanners.some(banner => banner.position === position.value)
                          return (
                            <SelectItem 
                              key={position.value} 
                              value={position.value}
                              className={`text-white ${isOccupied ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
                              disabled={isOccupied}
                            >
                              {position.label}
                              {isOccupied && (
                                <span className="text-red-400 text-xs ml-2">Ocupado</span>
                              )}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Duración</Label>
                    <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar duración">
                          {formData.duration ? `${durations.find(d => d.value === formData.duration)?.label} - ${Math.round((bannerPositions.find(p => p.value === formData.position)?.cost || 1) * (durations.find(d => d.value === formData.duration)?.multiplier || 1))} créditos` : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value} className="text-white hover:bg-slate-700">
                            {duration.label} - {Math.round((bannerPositions.find(p => p.value === formData.position)?.cost || 1) * duration.multiplier)} créditos
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreating || !formData.position || !profile || profile.credits < calculateCost()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando Banner...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Crear Banner ({calculateCost()} créditos)
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 