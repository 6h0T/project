'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Image as ImageIcon, Info, Check } from 'lucide-react'

interface BannerImageUploadProps {
  selectedPosition: string
  onImageChange: (imageUrl: string, imageFile: File | null) => void
  currentImageUrl?: string
  bannerDimensions?: { width: number; height: number }
}

const positionDimensions: { [key: string]: { width: number; height: number } } = {
  // Página Principal
  'home-top-1': { width: 468, height: 85 },
  'home-top-2': { width: 468, height: 85 },
  'home-sidebar-right': { width: 280, height: 500 },
  'home-recent-servers': { width: 280, height: 200 },
  'home-sidebar-left-bottom': { width: 280, height: 500 },
  // Página de Votación
  'vote-left-skyscraper': { width: 250, height: 600 },
  'vote-right-skyscraper': { width: 250, height: 600 },
}

export default function BannerImageUpload({ 
  selectedPosition, 
  onImageChange, 
  currentImageUrl,
  bannerDimensions 
}: BannerImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dimensions = bannerDimensions || positionDimensions[selectedPosition] || { width: 468, height: 60 }

  // Limpiar imagen cuando cambie la posición
  useEffect(() => {
    if (selectedPosition && previewUrl) {
      // Verificar si las dimensiones cambiaron
      const newDimensions = positionDimensions[selectedPosition]
      if (newDimensions) {
        // Solo limpiar si las dimensiones son diferentes
        const currentDimensions = Object.values(positionDimensions).find(dim => 
          dim.width === dimensions.width && dim.height === dimensions.height
        )
        if (!currentDimensions || 
            (newDimensions.width !== dimensions.width || newDimensions.height !== dimensions.height)) {
          setPreviewUrl('')
          onImageChange('', null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
    }
  }, [selectedPosition])

  // Actualizar preview cuando cambie currentImageUrl externamente
  useEffect(() => {
    setPreviewUrl(currentImageUrl || '')
  }, [currentImageUrl])

  const resizeImage = useCallback((file: File, targetWidth: number, targetHeight: number): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Configurar canvas con las dimensiones exactas del banner
        canvas.width = targetWidth
        canvas.height = targetHeight

        // Limpiar canvas con fondo transparente
        ctx!.clearRect(0, 0, targetWidth, targetHeight)

        // Ajustar la imagen EXACTAMENTE a las dimensiones del banner
        // Sin mantener proporción - se estira/comprime para ajustarse perfectamente
        ctx!.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Convertir a blob y data URL con alta calidad
        canvas.toBlob((blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL('image/png', 0.95)
            resolve({ blob, dataUrl })
          } else {
            reject(new Error('Error al procesar la imagen'))
          }
        }, 'image/png', 0.95)
      }

      img.onerror = () => reject(new Error('Error al cargar la imagen'))
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const processFile = useCallback(async (file: File) => {
    setError('')
    setIsProcessing(true)

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen')
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('El archivo no puede exceder 2 MB')
      }

      // Redimensionar imagen
      const { blob, dataUrl } = await resizeImage(file, dimensions.width, dimensions.height)
      
      // Crear nuevo archivo con la imagen redimensionada
      const resizedFile = new File([blob], file.name, { type: 'image/png' })

      setPreviewUrl(dataUrl)
      onImageChange(dataUrl, resizedFile)
    } catch (error: any) {
      setError(error.message || 'Error al procesar la imagen')
    } finally {
      setIsProcessing(false)
    }
  }, [dimensions, onImageChange, resizeImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl('')
    onImageChange('', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onImageChange])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-4">
      {/* Información de dimensiones */}
      {selectedPosition && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium">Dimensiones requeridas: {dimensions.width}x{dimensions.height} píxeles</p>
              <p>Tu imagen se ajustará automáticamente a estas dimensiones exactas</p>
            </div>
          </div>
        </div>
      )}

      {/* Zona de carga */}
      {!previewUrl ? (
        <Card
          className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
          } ${!selectedPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={selectedPosition ? handleDrop : undefined}
          onDragOver={selectedPosition ? handleDragOver : undefined}
          onDragLeave={selectedPosition ? handleDragLeave : undefined}
          onClick={selectedPosition ? handleBrowseClick : undefined}
        >
          <div className="p-8 text-center">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="text-slate-400">Procesando imagen...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-white font-medium">
                    {selectedPosition
                      ? 'Arrastra tu imagen aquí o haz clic para seleccionar'
                      : 'Selecciona primero una posición para el banner'
                    }
                  </p>
                  <p className="text-slate-400 text-sm">
                    Formatos soportados: JPG, PNG, GIF, WebP
                  </p>
                  <p className="text-slate-400 text-sm">
                    Tamaño máximo: 2 MB
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        /* Preview de imagen */
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">Imagen cargada</span>
              </div>
              <Button
                onClick={handleRemoveImage}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
            
            {/* Preview con dimensiones exactas */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div 
                  className="border border-slate-600 rounded-lg overflow-hidden bg-slate-900"
                  style={{ 
                    width: `${Math.min(dimensions.width, 400)}px`,
                    height: `${Math.min(dimensions.height, 300)}px`,
                    maxWidth: '100%'
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview del banner"
                    className="w-full h-full object-cover"
                    style={{
                      aspectRatio: `${dimensions.width} / ${dimensions.height}`
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  Dimensiones: {dimensions.width}x{dimensions.height} píxeles
                </p>
                <Button
                  onClick={handleBrowseClick}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-slate-300 border-slate-600 hover:text-white hover:border-cyan-500"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Cambiar imagen
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!selectedPosition}
      />

      {/* Error */}
      {error && (
        <Alert className="bg-red-500/20 border-red-500/30 text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reglas */}
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-300">
            <p className="font-medium">Crea imágenes simples y elegantes</p>
            <p>• No permitimos contenido desnudo o pornografía, los banners serán removidos</p>
            <p>• El tamaño del archivo no puede exceder 2 MB</p>
          </div>
        </div>
      </div>
    </div>
  )
} 