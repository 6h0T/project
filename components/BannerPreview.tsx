'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Monitor, Vote, Info, Star, Users, TrendingUp } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('homepage')

  // Definir posiciones reales según las páginas
  const bannerPositions = {
    homepage: {
      'home-top-1': { label: 'Banner Superior Izquierdo', dimensions: '468x60', description: 'Página principal - Superior izquierdo', cost: 2 },
      'home-top-2': { label: 'Banner Superior Derecho', dimensions: '468x60', description: 'Página principal - Superior derecho', cost: 2 },
      'home-sidebar-right': { label: 'Banner Lateral Derecho', dimensions: '280x500', description: 'Página principal - Sidebar derecho', cost: 3 },
      'home-recent-servers': { label: 'Banner Servidores Recientes', dimensions: '280x200', description: 'Página principal - Área de servidores recientes', cost: 1 }
    },
    votepage: {
      'vote-left-skyscraper': { label: 'Banner Izquierdo Votación', dimensions: '250x600', description: 'Página de votación - Lateral izquierdo', cost: 4 },
      'vote-right-skyscraper': { label: 'Banner Derecho Votación', dimensions: '250x600', description: 'Página de votación - Lateral derecho', cost: 4 }
    }
  }

  const getAllPositions = () => {
    return { ...bannerPositions.homepage, ...bannerPositions.votepage }
  }

  const getBannerForPosition = (position: string) => {
    if (previewBanner && previewBanner.position === position) {
      return previewBanner
    }
    return existingBanners.find(banner => banner.position === position)
  }

  const isPositionSelected = (position: string) => {
    return selectedPosition === position
  }

  const isPositionOccupied = (position: string) => {
    return existingBanners.some(banner => banner.position === position)
  }

  const handlePositionClick = (position: string) => {
    if (!isPositionOccupied(position) && onPositionSelect) {
      onPositionSelect(position)
    }
  }

  const getPositionInfo = (position: string) => {
    const allPositions = getAllPositions()
    return allPositions[position as keyof typeof allPositions] || { label: position, dimensions: 'N/A', description: '', cost: 1 }
  }

  const BannerSlot = ({ position, className = '', style = {} }: { position: string, className?: string, style?: React.CSSProperties }) => {
    const banner = getBannerForPosition(position)
    const isSelected = isPositionSelected(position)
    const isOccupied = isPositionOccupied(position)
    const isHovered = hoveredPosition === position
    const isClickable = !isOccupied && onPositionSelect
    const positionInfo = getPositionInfo(position)

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
        style={style}
        onMouseEnter={() => setHoveredPosition(position)}
        onMouseLeave={() => setHoveredPosition(null)}
        onClick={() => handlePositionClick(position)}
        title={isOccupied ? 'Posición ocupada' : isClickable ? `Clic para seleccionar: ${positionInfo.label}` : positionInfo.label}
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
              {positionInfo.label}
            </div>
            <div className="text-slate-500 text-xs mb-1">
              {positionInfo.dimensions}
            </div>
            <div className="text-yellow-400 text-xs font-semibold">
              {positionInfo.cost} créditos
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

  const HomepagePreview = () => (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      {/* Simulación del header de Lineage II */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg p-3 text-center">
        <div className="text-white font-bold text-sm mb-1">🏰 Lineage II</div>
        <div className="text-slate-300 text-xs">The Chronicles Continue</div>
      </div>

      {/* Banners superiores */}
      <div className="flex justify-center items-center gap-8">
        <BannerSlot position="home-top-1" className="w-[200px] h-[50px]" />
        <BannerSlot position="home-top-2" className="w-[200px] h-[50px]" />
      </div>

      {/* Contenido principal con grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar izquierdo */}
        <div className="col-span-2 space-y-2">
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-slate-300 text-xs font-medium mb-2">🔍 Filtros</div>
            <div className="space-y-1">
              <div className="h-2 bg-slate-600 rounded"></div>
              <div className="h-2 bg-slate-600 rounded w-3/4"></div>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-slate-300 text-xs font-medium mb-2">📊 Stats</div>
            <div className="space-y-1">
              <div className="h-2 bg-slate-600 rounded"></div>
              <div className="h-2 bg-slate-600 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Contenido central */}
        <div className="col-span-8">
          <div className="bg-slate-700/50 rounded p-3 space-y-3">
            <div className="text-slate-300 text-sm font-medium">🎮 Top Servers</div>
            
            {/* Simulación de tarjetas de servidores */}
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-600/50 rounded p-2 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {i}
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-500 rounded mb-1"></div>
                    <div className="h-2 bg-slate-500 rounded w-3/4"></div>
                  </div>
                  <div className="text-cyan-400 text-xs">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar derecho */}
        <div className="col-span-2 space-y-3">
          <BannerSlot position="home-sidebar-right" className="w-full h-[120px]" />
          
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-slate-300 text-xs font-medium mb-2">🕒 Recientes</div>
            <BannerSlot position="home-recent-servers" className="w-full h-[60px]" />
          </div>
        </div>
      </div>
    </div>
  )

  const VotePagePreview = () => (
    <div className="bg-slate-800 rounded-lg p-4 relative">
      {/* Banners laterales fijos */}
      <div className="absolute left-2 top-8">
        <BannerSlot position="vote-left-skyscraper" className="w-[60px] h-[150px]" />
      </div>
      
      <div className="absolute right-2 top-8">
        <BannerSlot position="vote-right-skyscraper" className="w-[60px] h-[150px]" />
      </div>

      {/* Contenido central de la página de votación */}
      <div className="mx-16 space-y-4">
        {/* Header de votación */}
        <div className="text-center bg-slate-700/50 rounded p-3">
          <div className="text-cyan-400 font-bold text-sm mb-1">🗳️ Votar por este servidor</div>
          <div className="text-slate-300 text-xs">Ayuda a subir en el ranking</div>
        </div>

        {/* Información del servidor */}
        <div className="bg-slate-700/50 rounded p-3 space-y-3">
          <div className="text-white font-semibold text-sm">#1 L2 GH0T SEASON</div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-600/50 rounded p-2">
              <div className="text-slate-300 text-xs font-medium mb-1">🔧 Info Servidor</div>
              <div className="space-y-1">
                <div className="h-2 bg-slate-500 rounded"></div>
                <div className="h-2 bg-slate-500 rounded w-3/4"></div>
              </div>
            </div>
            
            <div className="bg-slate-600/50 rounded p-2">
              <div className="text-slate-300 text-xs font-medium mb-1">💾 Detalles</div>
              <div className="space-y-1">
                <div className="h-2 bg-slate-500 rounded"></div>
                <div className="h-2 bg-slate-500 rounded w-2/3"></div>
              </div>
            </div>
            
            <div className="bg-slate-600/50 rounded p-2">
              <div className="text-slate-300 text-xs font-medium mb-1">📝 Descripción</div>
              <div className="space-y-1">
                <div className="h-2 bg-slate-500 rounded"></div>
                <div className="h-2 bg-slate-500 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de votación */}
        <div className="text-center bg-slate-700/50 rounded p-3">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded px-4 py-2 text-white text-sm font-bold">
            ¡VOTAR AHORA!
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4 space-y-4">
      {/* Header con información */}
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold mb-2">Vista Previa en Vivo de Banners</h3>
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-dashed border-slate-600 mr-2"></div>
            <span className="text-slate-400">Disponible</span>
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

      {/* Tabs para diferentes páginas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="homepage" className="data-[state=active]:bg-slate-700">
            <Monitor className="h-4 w-4 mr-2" />
            Página Principal
          </TabsTrigger>
          <TabsTrigger value="votepage" className="data-[state=active]:bg-slate-700">
            <Vote className="h-4 w-4 mr-2" />
            Página de Votación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="mt-4">
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="text-white font-medium mb-1">Página Principal - Lineage II</h4>
              <p className="text-slate-400 text-sm">Haz clic en cualquier posición disponible para seleccionarla</p>
            </div>
            <HomepagePreview />
          </div>
        </TabsContent>

        <TabsContent value="votepage" className="mt-4">
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="text-white font-medium mb-1">Página de Votación</h4>
              <p className="text-slate-400 text-sm">Banners laterales con máxima visibilidad</p>
            </div>
            <VotePagePreview />
          </div>
        </TabsContent>
      </Tabs>

      {/* Información de la posición seleccionada */}
      {selectedPosition && (
        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-cyan-500/30">
          <div className="text-center">
            <h4 className="text-cyan-400 font-semibold mb-2">Posición Seleccionada</h4>
            <div className="space-y-1">
              <p className="text-white font-medium">{getPositionInfo(selectedPosition).label}</p>
              <p className="text-slate-300 text-sm">{getPositionInfo(selectedPosition).description}</p>
              <div className="flex justify-center items-center space-x-4 text-sm">
                <span className="text-slate-400">Dimensiones: {getPositionInfo(selectedPosition).dimensions}</span>
                <span className="text-yellow-400 font-semibold">Costo: {getPositionInfo(selectedPosition).cost} créditos</span>
              </div>
            </div>
            {previewBanner?.image_url && (
              <p className="text-xs text-green-400 mt-2">✅ Tu banner aparecerá en la posición resaltada arriba</p>
            )}
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="text-center text-slate-400 text-sm">
        {!selectedPosition ? (
          <div className="space-y-2">
            <p className="font-medium">Selecciona una posición para tu banner</p>
            <p className="text-xs text-yellow-400">💡 Haz clic directamente en cualquier posición disponible en las vistas previas</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-yellow-400">💡 Puedes cambiar de pestaña para ver cómo se verá tu banner en diferentes páginas</p>
            <p className="text-xs">Haz clic en otra posición disponible para cambiar la selección</p>
          </div>
        )}
      </div>
    </div>
  )
}