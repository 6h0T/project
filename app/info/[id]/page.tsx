import { notFound } from 'next/navigation'
import { getServerById } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Globe, 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  Shield, 
  ExternalLink,
  TrendingUp,
  Clock,
  Database,
  User,
  Hash
} from 'lucide-react'
import CountryFlag from '@/components/CountryFlag'
import VoteButton from '@/components/VoteButton'

async function getServerInfo(idParam: string) {
  // Extraer ID del formato "123_nombre-servidor"
  const serverId = parseInt(idParam.split('_')[0])
  if (isNaN(serverId)) return null

  const { data: server, error } = await getServerById(serverId)
  if (error || !server) return null

  return server
}

export default async function ServerInfoPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const server = await getServerInfo(params.id)
  
  if (!server) {
    notFound()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header del servidor */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md mb-8">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    #{server.id}
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">
                      {server.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CountryFlag country={server.country || 'International'} size="sm" />
                        <span className="text-slate-300">{server.country}</span>
                      </div>
                      <Badge className={getStatusColor(server.status)}>
                        {getStatusText(server.status)}
                      </Badge>
                      {server.premium && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          ⭐ PREMIUM
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <CardDescription className="text-slate-300 text-lg">
                  {server.description}
                </CardDescription>
              </div>

              {/* Sección de votación */}
              <div className="flex flex-col items-center space-y-4 lg:ml-8">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-cyan-400" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      {server._count?.votes || 0}
                    </div>
                    <div className="text-sm text-slate-400">votos</div>
                  </div>
                </div>
                
                <VoteButton serverId={server.id} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Información de indexación */}
        <Card className="bg-blue-900/20 border-blue-500/50 backdrop-blur-md mb-8">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center">
              <Database className="mr-2 h-5 w-5" />
              📊 Información de Indexación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-blue-300">
                <Hash className="h-4 w-4" />
                <span><strong>ID único:</strong> #{server.id}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <ExternalLink className="h-4 w-4" />
                <span><strong>Slug:</strong> {server.slug}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <Globe className="h-4 w-4" />
                <span><strong>URL:</strong> /info/{server.id}_{server.slug}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <Calendar className="h-4 w-4" />
                <span><strong>Creado:</strong> {new Date(server.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Detalles del servidor */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Detalles del Servidor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        IP del Servidor
                      </label>
                      <div className="text-lg font-mono bg-slate-700/50 px-3 py-2 rounded-lg text-cyan-400 border border-slate-600">
                        {server.ip}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        Categoría
                      </label>
                      <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                        {server.category?.name || 'Lineage 2'}
                      </div>
                    </div>

                    {server.version && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Versión/Crónica
                        </label>
                        <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                          {server.version}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {server.experience && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Experiencia
                        </label>
                        <div className="text-yellow-400 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600 font-semibold">
                          x{server.experience}
                        </div>
                      </div>
                    )}

                    {server.maxLevel && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Nivel Máximo
                        </label>
                        <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                          {server.maxLevel}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        Idioma
                      </label>
                      <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600">
                        {server.language.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {server.website && (
                  <div className="mt-6 pt-6 border-t border-slate-600">
                    <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                      <a href={server.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visitar Sitio Web
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Descripción completa */}
            {server.description && (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {server.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Estadísticas */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total de votos</span>
                  <span className="text-cyan-400 font-semibold text-lg">
                    {server._count?.votes || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estado</span>
                  <Badge className={getStatusColor(server.status)}>
                    {getStatusText(server.status)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Creado</span>
                  <span className="text-white">
                    {new Date(server.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Actualizado</span>
                  <span className="text-white">
                    {new Date(server.updatedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Información del propietario */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Propietario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {server.user?.nickname.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {server.user?.nickname || 'Admin'}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Administrador
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