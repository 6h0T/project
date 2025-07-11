'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Banner {
  id?: string
  title: string
  image_url: string
  position: string
  status?: string
}

interface BannerPreviewProps {
  existingBanners: Banner[]
  selectedPosition: string
  previewBanner?: Banner
  onPositionSelect?: (position: string) => void
}

export default function BannerPreview({ existingBanners, selectedPosition, previewBanner, onPositionSelect }: BannerPreviewProps) {
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)

  const getBannerForPosition = (position: string) => {
    // Si hay un banner en preview y es para esta posición, mostrarlo
    if (previewBanner && previewBanner.position === position) {
      return previewBanner
    }
    
    // Si no, buscar un banner existente para esta posición
    return existingBanners.find(banner => banner.position === position)
  }

  const isPositionSelected = (position: string) => {
    return selectedPosition === position
  }

  const isPositionOccupied = (position: string) => {
    return existingBanners.some(banner => banner.position === position)
  }

  const handlePositionClick = (position: string) => {
    // Solo permitir seleccionar posiciones no ocupadas
    if (!isPositionOccupied(position) && onPositionSelect) {
      onPositionSelect(position)
    }
  }

  const getPositionLabel = (position: string) => {
    const labels: { [key: string]: string } = {
      'top-1': 'Banner Superior #1 (468x60)',
      'top-2': 'Banner Superior #2 (468x60)',
      'sidebar-1': 'Banner Lateral #1 (178x78)',
      'sidebar-2': 'Banner Lateral #2 (178x78)',
      'sidebar-3': 'Banner Lateral #3 (178x78)',
      'sidebar-4': 'Banner Lateral #4 (178x78)',
      'sidebar-5': 'Banner Lateral #5 (178x78)',
      'content-1': 'Banner Contenido #1 (300x250)',
      'content-2': 'Banner Contenido #2 (300x250)',
      'right-skyscraper': 'Banner Rascacielos (120x600)',
    }
    return labels[position] || position
  }

  const BannerSlot = ({ position, dimensions, className = '' }: { position: string, dimensions: string, className?: string }) => {
    const banner = getBannerForPosition(position)
    const isSelected = isPositionSelected(position)
    const isOccupied = isPositionOccupied(position)
    const isHovered = hoveredPosition === position
    const isClickable = !isOccupied && onPositionSelect

    return (
      <div
        className={`relative border-2 border-dashed transition-all duration-200 rounded-lg ${className} ${
          isSelected 
            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' 
            : isOccupied && !previewBanner
            ? 'border-red-400 bg-red-500/10'
            : isHovered && isClickable
            ? 'border-yellow-400 bg-yellow-500/10 cursor-pointer transform scale-105'
            : isClickable
            ? 'border-slate-600 bg-slate-700/30 cursor-pointer hover:border-slate-500'
            : 'border-slate-600 bg-slate-700/30'
        }`}
        onMouseEnter={() => setHoveredPosition(position)}
        onMouseLeave={() => setHoveredPosition(null)}
        onClick={() => handlePositionClick(position)}
        title={isOccupied ? 'Posición ocupada' : isClickable ? `Clic para seleccionar: ${getPositionLabel(position)}` : getPositionLabel(position)}
      >
        {banner ? (
          <div className="w-full h-full relative overflow-hidden rounded">
            <img 
              src={banner.image_url} 
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-banner.png'
              }}
            />
            {isSelected && previewBanner && (
              <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center backdrop-blur-sm">
                <Badge className="bg-cyan-500 text-white animate-pulse">Vista Previa</Badge>
              </div>
            )}
            {isOccupied && !previewBanner && (
              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                <Badge className="bg-red-500 text-white text-xs">Ocupado</Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
            <div className="text-slate-400 text-xs mb-1 font-medium">
              {position.replace('-', ' ').toUpperCase()}
            </div>
            <div className="text-slate-500 text-xs">
              {dimensions}
            </div>
            {isSelected && (
              <Badge className="mt-2 bg-cyan-500 text-white text-xs animate-pulse">Seleccionado</Badge>
            )}
            {isOccupied && (
              <Badge className="mt-2 bg-red-500 text-white text-xs">Ocupado</Badge>
            )}
            {isClickable && isHovered && !isSelected && !isOccupied && (
              <Badge className="mt-2 bg-yellow-500 text-black text-xs">Clic para seleccionar</Badge>
            )}
          </div>
        )}
        
        {/* Efecto de selección animado */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg animate-pulse pointer-events-none"></div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4 space-y-4">
      {/* Header con información */}
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold mb-2">Vista Previa Interactiva</h3>
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-dashed border-slate-600 mr-2"></div>
            <span className="text-slate-400">Disponible (clic para seleccionar)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-dashed border-red-400 bg-red-500/10 mr-2"></div>
            <span className="text-slate-400">Ocupado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-dashed border-cyan-400 bg-cyan-500/10 mr-2"></div>
            <span className="text-slate-400">Seleccionado</span>
          </div>
        </div>
      </div>

      {/* Simulación del layout del sitio */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        {/* Header con banners superiores */}
        <div className="grid grid-cols-2 gap-4">
          <BannerSlot position="top-1" dimensions="468x60" className="h-16" />
          <BannerSlot position="top-2" dimensions="468x60" className="h-16" />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar izquierdo con banners laterales */}
          <div className="col-span-3 space-y-2">
            <BannerSlot position="sidebar-1" dimensions="178x78" className="h-12" />
            <BannerSlot position="sidebar-2" dimensions="178x78" className="h-12" />
            <BannerSlot position="sidebar-3" dimensions="178x78" className="h-12" />
            <BannerSlot position="sidebar-4" dimensions="178x78" className="h-12" />
            <BannerSlot position="sidebar-5" dimensions="178x78" className="h-12" />
          </div>

          {/* Contenido central */}
          <div className="col-span-6">
            <div className="bg-slate-700/50 rounded p-4 space-y-4">
              <div className="text-slate-300 text-sm font-medium">Contenido Principal</div>
              
              {/* Banners de contenido */}
              <div className="grid grid-cols-2 gap-4">
                <BannerSlot position="content-1" dimensions="300x250" className="h-32" />
                <BannerSlot position="content-2" dimensions="300x250" className="h-32" />
              </div>
              
              <div className="space-y-2">
                <div className="h-2 bg-slate-600 rounded"></div>
                <div className="h-2 bg-slate-600 rounded w-3/4"></div>
                <div className="h-2 bg-slate-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Sidebar derecho */}
          <div className="col-span-3">
            <BannerSlot position="right-skyscraper" dimensions="120x600" className="h-64" />
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
          <h4 className="text-white text-sm font-semibold mb-2">Información de Posiciones</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
            <div>• Banners superiores: Máxima visibilidad</div>
            <div>• Banners laterales: Exposición constante</div>
            <div>• Banners de contenido: Integración natural</div>
            <div>• Banner rascacielos: Impacto visual</div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="text-center text-slate-400 text-sm">
        {selectedPosition ? (
          <div className="space-y-2">
            <p className="font-medium text-cyan-400">
              Posición seleccionada: {getPositionLabel(selectedPosition)}
            </p>
            {previewBanner?.image_url && (
              <p className="text-xs">Tu banner aparecerá en la posición resaltada arriba</p>
            )}
            {onPositionSelect && (
              <p className="text-xs text-yellow-400">Haz clic en otra posición disponible para cambiar la selección</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-medium">Selecciona una posición para tu banner</p>
            {onPositionSelect ? (
              <p className="text-xs text-yellow-400">Haz clic directamente en cualquier posición disponible arriba</p>
            ) : (
              <p className="text-xs">Usa el dropdown de posición para seleccionar</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 