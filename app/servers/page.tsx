'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Server, Filter, TrendingUp, Star, Users, ExternalLink, Crown } from 'lucide-react';
import { getUserServers, type UserServer } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import CountryFlag from '@/components/CountryFlag';

export default function ServersPage() {
  const { user } = useAuth();
  const [servers, setServers] = useState<UserServer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchServers = async () => {
      try {
        if (user) {
          const { data } = await getUserServers(user.id);
          setServers(data);
        }
      } catch (error) {
        console.error('Error fetching servers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [user]);

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && server.approved) ||
                         (filterStatus === 'pending' && !server.approved);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando servidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mis Servidores</h1>
          <p className="text-slate-400">Administra tus servidores registrados</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar servidores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className="bg-slate-800 border-slate-600"
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('approved')}
              className="bg-slate-800 border-slate-600"
            >
              Aprobados
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
              className="bg-slate-800 border-slate-600"
            >
              Pendientes
            </Button>
          </div>
        </div>

        {/* Servers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <Card key={server.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      #{server.id}
                    </div>
                    <CardTitle className="text-white text-lg">{server.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {server.premium && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                    <Badge 
                      variant={server.approved ? 'default' : 'secondary'}
                      className={server.approved ? 'bg-green-500' : 'bg-yellow-500'}
                    >
                      {server.approved ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm line-clamp-2">
                    {server.description || 'Sin descripción disponible'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <CountryFlag country={server.country || 'International'} size="sm" />
                      <span className="text-slate-300">{server.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">0</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-400">
                      {server.category?.name || 'Categoría'}
                    </div>
                    <div className="flex items-center space-x-2">
                      {server.website && (
                        <Button asChild size="sm" variant="outline" className="border-slate-600">
                          <a href={server.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                        <Link href={`/vote/${server.id}`}>
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Votar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredServers.length === 0 && (
          <div className="text-center py-12">
            <Server className="h-24 w-24 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron servidores
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No tienes servidores registrados aún.'}
            </p>
            <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Link href="/create-server">
                Registrar Servidor
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}