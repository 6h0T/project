'use client'

import { useState } from 'react'
import { ExternalLink, Eye } from 'lucide-react'

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  target_url: string
  position: string
  game_category: string
  status: string
  credits_cost: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface BannerDisplayProps {
  banner: Banner | null
  position: string
  dimensions: { width: number; height: number }
  className?: string
  style?: React.CSSProperties
  showPlaceholder?: boolean
}

export default function BannerDisplay({ 
  banner, 
  position, 
  dimensions, 
  className = '', 
  style = {},
  showPlaceholder = true 
}: BannerDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleBannerClick = () => {
    if (banner && banner.target_url) {
      // Abrir en nueva pestaña
      window.open(banner.target_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Si hay un banner activo, mostrarlo
  if (banner && !imageError) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${className}`}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          ...style
        }}
        onClick={handleBannerClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`${banner.title} - Clic para visitar`}
      >
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Overlay con información al hacer hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-2 transition-opacity duration-200">
            <div className="text-center">
              <h3 className="font-semibold text-sm mb-1 truncate max-w-full">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="text-xs opacity-90 line-clamp-2 mb-2">
                  {banner.description}
                </p>
              )}
              <div className="flex items-center justify-center text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span>Clic para visitar</span>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de banner activo */}
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded opacity-75">
          <Eye className="h-2 w-2" />
        </div>
      </div>
    )
  }

  // Si no hay banner y se debe mostrar placeholder
  if (showPlaceholder) {
    return (
      <div
        className={`relative border-2 border-dashed border-slate-600 bg-slate-700/30 rounded-lg flex flex-col items-center justify-center text-slate-400 ${className}`}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          ...style
        }}
      >
        <div className="text-center p-2">
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center mb-2 mx-auto">
            <span className="text-slate-500 text-lg">📢</span>
          </div>
          <p className="text-xs font-medium mb-1">Espacio Publicitario</p>
          <p className="text-xs text-slate-500">{dimensions.width}x{dimensions.height}</p>
          <p className="text-xs text-slate-500 mt-1">Disponible</p>
        </div>
      </div>
    )
  }

  // Si no hay banner y no se debe mostrar placeholder, no renderizar nada
  return null
}