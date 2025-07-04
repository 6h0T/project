'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PendingServersWidget from '@/components/PendingServersWidget';
import { 
  Shield, 
  LogOut, 
  Settings, 
  Users, 
  Server, 
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/admin/login', {
        method: 'DELETE',
      });
      
      // Redireccionar al login
      router.push('/admin');
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
                <p className="text-slate-400 text-sm">Sistema de gestión administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                <Shield className="h-3 w-3 mr-1" />
                Admin Activo
              </Badge>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                <Users className="h-3 w-3 mr-1" />
                admin
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoading ? 'Cerrando...' : 'Cerrar Sesión'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-8">
        {/* Servidores Pendientes - Nuevo módulo principal */}
        <div className="mb-8">
          <PendingServersWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjetas de estadísticas */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Servidores Activos
              </CardTitle>
              <Server className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-xs text-slate-400">
                +2 desde el último mes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Usuarios Registrados
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,234</div>
              <p className="text-xs text-slate-400">
                +180 desde el último mes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Votos Totales
              </CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45,678</div>
              <p className="text-xs text-slate-400">
                +2,345 desde el último mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Server className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Gestionar Servidores</h3>
                <p className="text-slate-400 text-sm">Agregar, editar o eliminar servidores</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Gestionar Usuarios</h3>
                <p className="text-slate-400 text-sm">Administrar cuentas de usuario</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Estadísticas</h3>
                <p className="text-slate-400 text-sm">Ver reportes y análisis</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-medium">Auto-Aprobación</h3>
                <p className="text-slate-400 text-sm">Sistema automático de validación</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estado del sistema */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Estado del Sistema</h2>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white">Base de datos</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    Operativo
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white">Autenticación Admin</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    Activo
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white">Sistema de auto-aprobación</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    Activo
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <span className="text-white">Sistema de votos</span>
                  </div>
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                    Monitoreando
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white">API Endpoints</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    Operativo
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información de desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Información de Desarrollo</h2>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Sistema de autenticación simple activo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">Credenciales: admin / admin</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-slate-300">Sesiones válidas por 8 horas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-slate-300">Auto-aprobación con validación inteligente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 