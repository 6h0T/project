'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  RefreshCw, 
  Eye,
  AlertTriangle,
  Bot,
  Loader2,
  ShieldCheck,
  Globe,
  Calendar,
  BarChart3
} from 'lucide-react';

interface ValidationInfo {
  isValid: boolean;
  score: number;
  missingFields: string[];
  issues: string[];
  recommendations: string[];
  canAutoApprove: boolean;
}

interface PendingServer {
  id: string | number;
  title: string;
  description: string | null;
  website: string | null;
  country: string | null;
  language: string;
  status: string;
  created_at: string;
  user_id: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  validation: ValidationInfo;
  source: 'user_server' | 'hardcoded';
}

interface PendingServersStats {
  total: number;
  pending: number;
  rejected: number;
  canAutoApprove: number;
  averageScore: number;
}

interface PendingServersResponse {
  success: boolean;
  servers: PendingServer[];
  stats: PendingServersStats;
}

export default function PendingServersWidget() {
  const [servers, setServers] = useState<PendingServer[]>([]);
  const [stats, setStats] = useState<PendingServersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoApproving, setAutoApproving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedServer, setExpandedServer] = useState<string | number | null>(null);

  // Función para cargar servidores pendientes
  const loadPendingServers = async () => {
    try {
      const response = await fetch('/api/admin/pending-servers');
      const data: PendingServersResponse = await response.json();

      if (data.success) {
        setServers(data.servers);
        setStats(data.stats);
      } else {
        console.error('Error cargando servidores pendientes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para auto-aprobar servidores
  const handleAutoApproval = async () => {
    setAutoApproving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auto-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Recargar datos después de auto-aprobación
        await loadPendingServers();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error en auto-aprobación'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión'
      });
    } finally {
      setAutoApproving(false);
    }
  };

  // Función para aprobar/rechazar servidor individual
  const handleServerAction = async (serverId: string | number, action: 'approve' | 'reject', source: string) => {
    try {
      const response = await fetch('/api/admin/pending-servers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, action, source }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Recargar datos
        await loadPendingServers();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error procesando servidor'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión'
      });
    }
  };

  // Función para refrescar datos
  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingServers();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPendingServers();
    
    // Auto-refrescar cada 30 segundos
    const interval = setInterval(loadPendingServers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Función para obtener color del score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Función para obtener badge del status
  const getStatusBadge = (server: PendingServer) => {
    if (server.validation.canAutoApprove) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Auto-aprobable
        </Badge>
      );
    }
    
    if (server.validation.score >= 60) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          <Clock className="h-3 w-3 mr-1" />
          Casi listo
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Requiere atención
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="ml-2 text-slate-300">Cargando servidores pendientes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center">
              <Server className="h-6 w-6 mr-2 text-cyan-400" />
              Servidores Pendientes
              {stats && stats.total > 0 && (
                <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                  {stats.total} pendientes
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              {stats && stats.canAutoApprove > 0 && (
                <Button
                  onClick={handleAutoApproval}
                  disabled={autoApproving}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {autoApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Escaneando...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Auto-aprobar ({stats.canAutoApprove})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {stats && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-xs text-slate-400">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.canAutoApprove}</div>
                <div className="text-xs text-slate-400">Auto-aprobables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.averageScore}%</div>
                <div className="text-xs text-slate-400">Score promedio</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Mensaje de feedback */}
      {message && (
        <Alert className={`${
          message.type === 'success' 
            ? 'border-green-800 bg-green-900/50 text-green-200' 
            : 'border-red-800 bg-red-900/50 text-red-200'
        }`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Lista de servidores */}
      {servers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">¡Todo al día!</h3>
            <p className="text-slate-400">No hay servidores pendientes de aprobación</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <Card key={server.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{server.title}</h3>
                      {getStatusBadge(server)}
                      <div className={`text-sm font-medium ${getScoreColor(server.validation.score)}`}>
                        <BarChart3 className="h-4 w-4 inline mr-1" />
                        {server.validation.score}%
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                      {server.category && (
                        <span className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          {server.category.name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(server.created_at).toLocaleDateString('es-ES')}
                      </span>
                      <span>ID: {server.id}</span>
                    </div>

                    {server.description && (
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                        {server.description}
                      </p>
                    )}

                    {/* Mostrar issues si están expandidos */}
                    {expandedServer === server.id && (
                      <div className="mt-3 space-y-2">
                        {server.validation.issues.length > 0 && (
                          <div className="bg-red-900/20 border border-red-800/50 rounded p-3">
                            <h4 className="text-red-400 font-medium mb-2">Problemas encontrados:</h4>
                            <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                              {server.validation.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {server.validation.recommendations.length > 0 && (
                          <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-3">
                            <h4 className="text-yellow-400 font-medium mb-2">Recomendaciones:</h4>
                            <ul className="list-disc list-inside text-yellow-300 text-sm space-y-1">
                              {server.validation.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => setExpandedServer(
                        expandedServer === server.id ? null : server.id
                      )}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {expandedServer === server.id ? 'Ocultar' : 'Detalles'}
                    </Button>
                    
                    <Button
                      onClick={() => handleServerAction(server.id, 'approve', server.source)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    
                    <Button
                      onClick={() => handleServerAction(server.id, 'reject', server.source)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-900/50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 