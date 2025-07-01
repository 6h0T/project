import Link from 'next/link'
import { getServers, getStats } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, Users, Calendar, ExternalLink } from 'lucide-react'
import CountryFlag from '@/components/CountryFlag'

export default async function ServersPage() {
  const { data: servers } = await getServers()
  const { data: stats } = await getStats()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Lista de Servidores MMORPG
            </h1>
            <p className="text-slate-300">
              Descubre los mejores servidores privados de MMORPG
            </p>
          </div>
          
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
            <Link href="/create-server">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Servidor
            </Link>
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Servidores</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalServers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aprobados</p>
                  <p className="text-2xl font-bold text-white">{stats?.approvedServers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Votos</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalVotes || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Categorías</p>
                  <p className="text-2xl font-bold text-white">{stats?.categories || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de servidores */}
        <div className="space-y-6">
          {servers.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No hay servidores disponibles
                </h3>
                <p className="text-slate-400 text-center mb-4">
                  Sé el primero en agregar un servidor a nuestro directorio
                </p>
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  <Link href="/create-server">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Servidor
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            servers.map((server) => (
              <Card key={server.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-md hover:bg-slate-800/70 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
                          #{server.id}
                        </Badge>
                        <h3 className="text-xl font-bold text-white">
                          {server.title}
                        </h3>
                        {server.premium && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            ⭐ PREMIUM
                          </Badge>
                        )}
                        <Badge className={getStatusColor(server.status)}>
                          {server.status === 'online' ? 'En línea' : 
                           server.status === 'offline' ? 'Fuera de línea' : 'En revisión'}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 mb-3 leading-relaxed">
                        {server.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center space-x-2">
                          <CountryFlag country={server.country || 'International'} size="sm" />
                          <span>{server.country}</span>
                        </div>
                        <span>📂 {server.category?.name || 'Lineage 2'}</span>
                        <span>👤 {server.user?.nickname || 'Admin'}</span>
                        <span>🗳️ {server._count?.votes || 0} votos</span>
                        <span>📅 {new Date(server.createdAt).toLocaleDateString('es-ES')}</span>
                        {server.version && <span>🎮 {server.version}</span>}
                        {server.experience && <span>⭐ x{server.experience} EXP</span>}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col space-y-3 lg:ml-6">
                      <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        <Link href={`/info/${server.id}_${server.slug}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">IP del servidor</p>
                        <p className="text-sm font-mono text-cyan-400 bg-slate-700/50 px-2 py-1 rounded">
                          {server.ip}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}