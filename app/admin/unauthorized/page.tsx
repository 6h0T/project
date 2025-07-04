'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function AdminUnauthorized() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-red-500/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Acceso Denegado
            </CardTitle>
            <p className="text-slate-400 mt-2">
              No tienes permisos de administrador
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-red-500/20 border-red-500/30 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tu cuenta no tiene los privilegios necesarios para acceder al panel de administración.
            </AlertDescription>
          </Alert>

          <div className="text-center text-slate-400 text-sm space-y-2">
            <p>Si crees que esto es un error, contacta con el administrador del sistema.</p>
            <p>Para solicitar permisos de administrador, envía un email detallando tu solicitud.</p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full text-slate-300 border-slate-600 hover:text-white hover:border-red-500/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver Atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 