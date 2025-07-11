'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Server, Edit, Eye, Trash2, ExternalLink } from 'lucide-react'
import { getUserServers, type UserServer } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'

interface UserServersListProps {
  onCreateServer: () => void
  onEditServer: (server: UserServer) => void
  refreshTrigger: number
}

export default function UserServersList({ onCreateServer, onEditServer, refreshTrigger }: UserServersListProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [userServers, setUserServers] = useState<UserServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserServers()
    }
  }, [user, refreshTrigger])

  const fetchUserServers = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await getUserServers(user.id)
      if (error) {
        console.error('Error fetching user servers:', error)
      } else {
        setUserServers(data)
      }
    } catch (error) {
      console.error('Error fetching user servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            ✓ En línea
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
            ⏳ Pendiente
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
            ✗ Rechazado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getCategoryBadge = (category: string) => {
    return (
      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
        📁 {category}
      </Badge>
    )
  }

  const getCountryBadge = (country: string) => {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
        🌍 {country}
      </Badge>
    )
  }

  const getExperienceBadge = (experience: number) => {
    return (
      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
        ⚡ {experience}x EXP
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-slate-400">Cargando servidores...</span>
      </div>
    )
  }

  if (userServers.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12">
          <div className="text-center">
            <Server className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No tienes servidores registrados
            </h3>
            <p className="text-slate-400 mb-6">
              Comienza registrando tu primer servidor en nuestra plataforma
            </p>
            <Button 
              onClick={onCreateServer}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Primer Servidor
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mis Servidores</h2>
          <p className="text-slate-400">Gestiona tus servidores registrados</p>
        </div>
        <Button 
          onClick={onCreateServer}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servidor
        </Button>
      </div>

      {/* Lista de servidores */}
      <div className="space-y-4">
        {userServers.map((server) => (
          <Card key={server.id} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                {/* Información del servidor */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{server.title}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(server.status)}
                      {server.category && getCategoryBadge(server.category.name)}
                      {server.country && getCountryBadge(server.country)}
                      {server.experience && getExperienceBadge(server.experience)}
                    </div>
                  </div>

                  <div className="text-slate-400 text-sm mb-3">
                    ID: {server.id} • Creado: {new Date(server.created_at).toLocaleDateString('es-ES')}
                  </div>

                  {server.description && (
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {server.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {server.version && (
                      <div>
                        <span className="text-slate-500">📋 Versión:</span>
                        <p className="text-slate-300">{server.version}</p>
                      </div>
                    )}
                    {server.max_level && (
                      <div>
                        <span className="text-slate-500">🏆 Nivel máx:</span>
                        <p className="text-slate-300">{server.max_level}</p>
                      </div>
                    )}
                    {server.language && (
                      <div>
                        <span className="text-slate-500">🌐 Idioma:</span>
                        <p className="text-slate-300">{server.language}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center space-x-2 ml-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/vote/${server.id}`)}
                    className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/info/${server.id}`)}
                    className="text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditServer(server)}
                    className="text-slate-300 border-slate-600 hover:text-white hover:border-cyan-500"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 