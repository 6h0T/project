'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Usuario y contraseña son requeridos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'username' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Limpiar error al empezar a escribir
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header con botón de volver */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo y título */}
          <div className="text-center">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={64} 
              height={64} 
              className="mx-auto mb-6" 
            />
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Panel de Administración</h2>
              <p className="text-slate-400">
                Accede al sistema administrativo
              </p>
            </div>
          </div>

          {/* Formulario de login */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center">
                <User className="h-6 w-6 mr-2 text-blue-400" />
                Iniciar Sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-800 bg-red-900/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={handleInputChange('password')}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400 pr-10"
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de login */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>

              {/* Información de desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-center pt-4 border-t border-slate-700">
                  <div className="text-slate-400 text-sm space-y-2">
                    <p className="flex items-center justify-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Modo Desarrollo
                    </p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><strong>Usuario:</strong> admin</p>
                      <p><strong>Contraseña:</strong> admin</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 