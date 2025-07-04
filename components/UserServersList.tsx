'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserServers, deleteUserServer, type UserServer } from '@/lib/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Server, 
  Globe, 
  MapPin, 
  Star, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  ExternalLink,
  Loader2,
  Plus,
  Target,
  Gamepad2
} from 'lucide-react';

interface UserServersListProps {
  onCreateServer?: () => void;
  onEditServer?: (server: UserServer) => void;
  refreshTrigger?: number;
}

export default function UserServersList({ onCreateServer, onEditServer, refreshTrigger }: UserServersListProps) {
  const { user } = useAuth();
  const [servers, setServers] = useState<UserServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user, refreshTrigger]);

  const fetchServers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await getUserServers(user.id);
      
      if (error) {
        console.error('Error fetching servers:', error);
        setMessage('Error al cargar los servidores');
        setMessageType('error');
        setServers([]);
      } else {
        setServers(data);
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
      setMessage('Error de conexión');
      setMessageType('error');
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    setDeletingId(serverId);
    
    try {
      const { error } = await deleteUserServer(serverId);
      
      if (error) {
        console.error('Error deleting server:', error);
        setMessage('Error al eliminar el servidor');
        setMessageType('error');
      } else {
        setMessage('Servidor eliminado exitosamente');
        setMessageType('success');
        setServers(servers.filter(s => s.id !== serverId));
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      setMessage('Error de conexión');
      setMessageType('error');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      case 'rejected': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'offline': return 'Fuera de línea';
      case 'maintenance': return 'Mantenimiento';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="ml-2 text-slate-300">Cargando servidores...</span>
          </div>
        </CardContent>
      </Card>
    );
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

      {/* Mensaje de resultado */}
      {message && (
        <Alert className={`${
          messageType === 'success' 
            ? 'bg-green-900/20 border-green-500/50' 
            : messageType === 'error'
            ? 'bg-red-900/20 border-red-500/50'
            : 'bg-blue-900/20 border-blue-500/50'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : messageType === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Shield className="h-4 w-4 text-blue-400" />
          )}
          <AlertDescription className={`${
            messageType === 'success' ? 'text-green-300' : 
            messageType === 'error' ? 'text-red-300' : 'text-blue-300'
          }`}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de servidores */}
      {servers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Server className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No tienes servidores registrados
              </h3>
              <p className="text-slate-300 mb-6">
                Registra tu primer servidor y comienza a promocionarlo en nuestra plataforma.
              </p>
              {onCreateServer && (
                <Button
                  onClick={onCreateServer}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Servidor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <Card key={server.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-white text-lg">
                        {server.title}
                      </CardTitle>
                      {server.premium && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold">
                          <Star className="h-3 w-3 mr-1" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(server.status)} text-white border-0`}
                      >
                        {getStatusIcon(server.status)}
                        <span className="ml-1">{getStatusText(server.status)}</span>
                      </Badge>
                      
                      {server.category && (
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          {server.category.name}
                        </Badge>
                      )}
                      
                      {server.country && (
                        <Badge variant="outline" className="text-slate-300 border-slate-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {server.country}
                        </Badge>
                      )}
                      
                      {server.experience && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {server.experience}x EXP
                        </Badge>
                      )}
                    </div>
                    
                    <CardDescription className="text-slate-300 text-sm">
                      ID: {server.id} • Creado: {new Date(server.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/vote/${server.id}`, '_blank')}
                      className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {server.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(server.website!, '_blank')}
                        className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-300 border-slate-600 hover:bg-slate-600/50"
                      disabled
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                          disabled={deletingId === server.id}
                        >
                          {deletingId === server.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-800 border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            ¿Eliminar servidor?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-300">
                            Esta acción no se puede deshacer. El servidor &quot;{server.title}&quot; será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteServer(server.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              {server.description && (
                <CardContent className="pt-0">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {server.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                    {server.version && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Versión: {server.version}</span>
                      </div>
                    )}
                    
                    {server.max_level && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Nivel máx: {server.max_level}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>Idioma: {server.language}</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 