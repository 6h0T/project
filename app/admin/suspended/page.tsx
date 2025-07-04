'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ban, Home, ArrowLeft, Calendar, User, AlertTriangle } from 'lucide-react';

interface SuspensionInfo {
  suspended_at: string;
  suspended_reason: string | null;
  suspended_by: string | null;
}

export default function AdminSuspended() {
  const router = useRouter();
  const { user } = useAuth();
  const [suspensionInfo, setSuspensionInfo] = useState<SuspensionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuspensionInfo();
    }
  }, [user]);

  const fetchSuspensionInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('suspended_at, suspended_reason, suspended_by')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setSuspensionInfo(data);
    } catch (error) {
      console.error('Error fetching suspension info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-red-400" />
          <span className="text-slate-300">Verificando estado de la cuenta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-red-500/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-500/20 rounded-full">
              <Ban className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Cuenta Suspendida
            </CardTitle>
            <p className="text-slate-400 mt-2">
              Tu cuenta de administrador ha sido suspendida
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-red-500/20 border-red-500/30 text-red-400">
            <Ban className="h-4 w-4" />
            <AlertDescription>
              No puedes acceder al panel de administración mientras tu cuenta esté suspendida.
            </AlertDescription>
          </Alert>

          {suspensionInfo && (
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Estado:</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <Ban className="h-3 w-3 mr-1" />
                    Suspendido
                  </Badge>
                </div>
                
                {suspensionInfo.suspended_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Fecha de suspensión:</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-white text-sm">
                        {new Date(suspensionInfo.suspended_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}
                
                {suspensionInfo.suspended_reason && (
                  <div>
                    <span className="text-slate-400 text-sm">Motivo:</span>
                    <p className="text-white text-sm mt-1 p-2 bg-slate-800/50 rounded">
                      {suspensionInfo.suspended_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-slate-400 text-sm space-y-2">
            <p>Para solicitar la reactivación de tu cuenta, contacta con un administrador superior.</p>
            <p>Si crees que esta suspensión es incorrecta, puedes apelar la decisión.</p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full text-slate-300 border-slate-600 hover:text-white hover:border-red-500/50"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-xs">
              Email de soporte: admin@svtop.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 