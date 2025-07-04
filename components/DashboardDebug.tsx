'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  User, 
  Shield,
  RefreshCw
} from 'lucide-react';

interface DebugInfo {
  auth: {
    status: 'loading' | 'authenticated' | 'unauthenticated';
    user: any;
    error?: string;
  };
  database: {
    connection: 'testing' | 'connected' | 'error';
    userProfile: 'loading' | 'found' | 'not_found' | 'error';
    profileData?: any;
    error?: string;
  };
  permissions: {
    canReadProfile: boolean;
    canCreateProfile: boolean;
    rpcFunctions: string[];
  };
}

export default function DashboardDebug() {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    auth: { status: 'loading', user: null },
    database: { connection: 'testing', userProfile: 'loading' },
    permissions: { canReadProfile: false, canCreateProfile: false, rpcFunctions: [] }
  });
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {
      // 1. Verificar autenticación
      console.log('🔍 Verificando autenticación...');
      const authStatus: any = {
        status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated',
        user: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        } : null
      };

      setDebugInfo(prev => ({ ...prev, auth: authStatus }));

      if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
      }

      // 2. Verificar conexión a base de datos
      console.log('🔍 Verificando conexión a base de datos...');
      try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        
        if (error) {
          console.log('❌ Error de conexión:', error);
          setDebugInfo(prev => ({
            ...prev,
            database: { 
              connection: 'error', 
              userProfile: 'error',
              error: error.message 
            }
          }));
          return;
        }

        console.log('✅ Conexión a base de datos exitosa');
        setDebugInfo(prev => ({
          ...prev,
          database: { ...prev.database, connection: 'connected' }
        }));

      } catch (dbError: any) {
        console.log('❌ Error crítico de base de datos:', dbError);
        setDebugInfo(prev => ({
          ...prev,
          database: { 
            connection: 'error', 
            userProfile: 'error',
            error: dbError.message 
          }
        }));
        return;
      }

      // 3. Verificar perfil de usuario
      console.log('🔍 Verificando perfil de usuario...');
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('❌ Error al obtener perfil:', profileError);
          
          if (profileError.code === 'PGRST116') {
            console.log('🔄 Perfil no encontrado, intentando crear...');
            
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || null,
                username: user.user_metadata?.username || null,
                credits: 1000,
                avatar_url: null
              })
              .select()
              .single();

            if (createError) {
              console.log('❌ Error al crear perfil:', createError);
              setDebugInfo(prev => ({
                ...prev,
                database: { 
                  ...prev.database, 
                  userProfile: 'error',
                  error: `Create error: ${createError.message}`
                }
              }));
            } else {
              console.log('✅ Perfil creado exitosamente:', newProfile);
              setDebugInfo(prev => ({
                ...prev,
                database: { 
                  ...prev.database, 
                  userProfile: 'found',
                  profileData: newProfile
                }
              }));
            }
          } else {
            setDebugInfo(prev => ({
              ...prev,
              database: { 
                ...prev.database, 
                userProfile: 'error',
                error: profileError.message
              }
            }));
          }
        } else {
          console.log('✅ Perfil encontrado:', profile);
          setDebugInfo(prev => ({
            ...prev,
            database: { 
              ...prev.database, 
              userProfile: 'found',
              profileData: profile
            }
          }));
        }

      } catch (profileError: any) {
        console.log('❌ Error crítico al verificar perfil:', profileError);
        setDebugInfo(prev => ({
          ...prev,
          database: { 
            ...prev.database, 
            userProfile: 'error',
            error: profileError.message
          }
        }));
      }

      // 4. Verificar funciones RPC
      console.log('🔍 Verificando funciones RPC...');
      try {
        const { data: rpcTest, error: rpcError } = await supabase.rpc('check_username_available', {
          username_to_check: 'test_user_debug'
        });

        const rpcFunctions = rpcError ? [] : ['check_username_available'];
        
        setDebugInfo(prev => ({
          ...prev,
          permissions: {
            canReadProfile: prev.database.userProfile === 'found',
            canCreateProfile: prev.database.userProfile === 'found',
            rpcFunctions
          }
        }));

        console.log('✅ Diagnóstico completado');

      } catch (rpcError: any) {
        console.log('❌ Error en funciones RPC:', rpcError);
      }

    } catch (error: any) {
      console.log('❌ Error general en diagnóstico:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      runDiagnostics();
    }
  }, [user, loading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'found':
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
      case 'unauthenticated':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'not_found':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'found':
      case 'authenticated':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
      case 'unauthenticated':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'not_found':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔧 Dashboard Debug</h1>
          <p className="text-slate-400">Diagnosticando problemas del dashboard</p>
          
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ejecutando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Ejecutar Diagnóstico
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Autenticación */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-cyan-400" />
                Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Estado:</span>
                <Badge className={getStatusColor(debugInfo.auth.status)}>
                  {getStatusIcon(debugInfo.auth.status)}
                  <span className="ml-1">{debugInfo.auth.status}</span>
                </Badge>
              </div>
              
              {debugInfo.auth.user && (
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {debugInfo.auth.user.id}</div>
                  <div><strong>Email:</strong> {debugInfo.auth.user.email}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Base de Datos */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="mr-2 h-5 w-5 text-green-400" />
                Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Conexión:</span>
                <Badge className={getStatusColor(debugInfo.database.connection)}>
                  {getStatusIcon(debugInfo.database.connection)}
                  <span className="ml-1">{debugInfo.database.connection}</span>
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Perfil:</span>
                <Badge className={getStatusColor(debugInfo.database.userProfile)}>
                  {getStatusIcon(debugInfo.database.userProfile)}
                  <span className="ml-1">{debugInfo.database.userProfile}</span>
                </Badge>
              </div>

              {debugInfo.database.error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded p-2 text-red-300 text-xs">
                  {debugInfo.database.error}
                </div>
              )}

              {debugInfo.database.profileData && (
                <div className="bg-green-900/20 border border-green-500/50 rounded p-2 text-green-300 text-xs">
                  Créditos: {debugInfo.database.profileData.credits}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permisos */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="mr-2 h-5 w-5 text-purple-400" />
                Permisos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Leer Perfil:</span>
                <Badge className={debugInfo.permissions.canReadProfile ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {debugInfo.permissions.canReadProfile ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Crear Perfil:</span>
                <Badge className={debugInfo.permissions.canCreateProfile ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {debugInfo.permissions.canCreateProfile ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </Badge>
              </div>

              <div className="text-xs text-slate-400">
                RPC Functions: {debugInfo.permissions.rpcFunctions.length}
              </div>
            </CardContent>
          </Card>

          {/* Datos de Usuario */}
          {debugInfo.database.profileData && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Datos de Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-slate-300 overflow-auto">
                  {JSON.stringify(debugInfo.database.profileData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Revisa la consola del navegador (F12) para logs detallados
          </p>
        </div>
      </div>
    </div>
  );
} 