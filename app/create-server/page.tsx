'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Info, CheckCircle, XCircle } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  _count: { servers: number }
}

export default function CreateServerPage() {
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    ip: '',
    description: '',
    website: '',
    country: 'España',
    language: 'es',
    version: '',
    experience: '',
    maxLevel: ''
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      
      if (response.ok) {
        setCategories(result.categories)
      } else {
        console.error('Error al cargar categorías:', result.error)
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessageType('success')
        setMessage(`✅ ¡Servidor creado exitosamente!

📊 **Detalles de Indexación:**
• ID único asignado: #${result.id}
• URL generada: ${result.url}
• Slug único: ${result.server.slug}
• Estado: En revisión`)

        // Limpiar formulario
        setFormData({
          title: '',
          categoryId: '',
          ip: '',
          description: '',
          website: '',
          country: 'España',
          language: 'es',
          version: '',
          experience: '',
          maxLevel: ''
        })
      } else {
        setMessageType('error')
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessageType('error')
      setMessage('❌ Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white flex items-center">
              <Plus className="mr-3 h-8 w-8 text-cyan-400" />
              Crear Nuevo Servidor
            </CardTitle>
            <CardDescription className="text-slate-300">
              Agrega tu servidor MMORPG a nuestro directorio y obtén más jugadores
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Información del sistema de indexación */}
            <Alert className="bg-blue-900/20 border-blue-500/50">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>🔢 Sistema de Indexación Automática</strong>
                <br />
                Cada servidor nuevo recibe automáticamente un ID único secuencial. 
                Este ID se usa para generar URLs amigables como /info/123_nombre-servidor.
              </AlertDescription>
            </Alert>

            {/* Mensaje de resultado */}
            {message && (
              <Alert className={`${
                messageType === 'success' 
                  ? 'bg-green-900/20 border-green-500/50' 
                  : 'bg-red-900/20 border-red-500/50'
              }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={`whitespace-pre-line ${
                  messageType === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre del servidor */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">
                    Nombre del Servidor *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    required
                    maxLength={50}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Mi Servidor Increíble"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Categoría *</Label>
                  {loadingCategories ? (
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando categorías...</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => handleInputChange('categoryId', value)}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                            className="text-white hover:bg-slate-600"
                          >
                            {category.name} ({category._count.servers} servidores)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* IP del servidor */}
                <div className="space-y-2">
                  <Label htmlFor="ip" className="text-slate-300">
                    IP del Servidor *
                  </Label>
                  <Input
                    id="ip"
                    type="text"
                    required
                    value={formData.ip}
                    onChange={(e) => handleInputChange('ip', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="192.168.1.100:44405"
                  />
                </div>

                {/* Sitio web */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-slate-300">
                    Sitio Web
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://miservidor.com"
                  />
                </div>

                {/* País */}
                <div className="space-y-2">
                  <Label className="text-slate-300">País</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="España" className="text-white">🇪🇸 España</SelectItem>
                      <SelectItem value="International" className="text-white">🌍 Internacional</SelectItem>
                      <SelectItem value="English" className="text-white">🇺🇸 Estados Unidos</SelectItem>
                      <SelectItem value="Brazil" className="text-white">🇧🇷 Brasil</SelectItem>
                      <SelectItem value="Russia" className="text-white">🇷🇺 Rusia</SelectItem>
                      <SelectItem value="Germany" className="text-white">🇩🇪 Alemania</SelectItem>
                      <SelectItem value="France" className="text-white">🇫🇷 Francia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Idioma */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => handleInputChange('language', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="es" className="text-white">Español</SelectItem>
                      <SelectItem value="en" className="text-white">English</SelectItem>
                      <SelectItem value="pt" className="text-white">Português</SelectItem>
                      <SelectItem value="fr" className="text-white">Français</SelectItem>
                      <SelectItem value="de" className="text-white">Deutsch</SelectItem>
                      <SelectItem value="ru" className="text-white">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Versión */}
                <div className="space-y-2">
                  <Label htmlFor="version" className="text-slate-300">
                    Versión/Crónica
                  </Label>
                  <Input
                    id="version"
                    type="text"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Season 6, Interlude, TBC..."
                  />
                </div>

                {/* Experiencia */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-slate-300">
                    Experiencia (multiplicador)
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="1"
                    max="9999"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="100"
                  />
                </div>

                {/* Nivel máximo */}
                <div className="space-y-2">
                  <Label htmlFor="maxLevel" className="text-slate-300">
                    Nivel Máximo
                  </Label>
                  <Input
                    id="maxLevel"
                    type="number"
                    min="1"
                    max="9999"
                    value={formData.maxLevel}
                    onChange={(e) => handleInputChange('maxLevel', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="400"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  maxLength={800}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Describe tu servidor, características especiales, eventos, etc..."
                />
                <div className="text-xs text-slate-400 text-right">
                  {formData.description.length}/800 caracteres
                </div>
              </div>

              {/* Botón de envío */}
              <Button
                type="submit"
                disabled={loading || loadingCategories}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando servidor...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Servidor
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}