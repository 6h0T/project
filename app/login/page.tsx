'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Redireccionar al dashboard después del login exitoso
      router.push('/dashboard');
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Por favor confirma tu email antes de iniciar sesión.');
      } else {
        setError(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading si aún está verificando la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-slate-300">Verificando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header con botón de volver */}
      <div className="p-6">
        <Link
          href="/"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo y título */}
          <div className="text-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 w-auto mx-auto mb-6 hover:scale-105 transition-transform duration-300"
            />
            <h2 className="text-3xl font-bold text-white mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-slate-400">
              Accede a tu cuenta de GameServers Hub
            </p>
          </div>

          {/* Formulario de login */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center">
                <LogIn className="h-6 w-6 mr-2 text-cyan-400" />
                Bienvenido de vuelta
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Ingresa tus credenciales para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-800 bg-red-900/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400 pr-10"
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2.5 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>

              {/* Enlace para olvidar contraseña */}
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-slate-400 hover:text-cyan-300 text-sm transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Enlace a registro */}
              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  ¿No tienes una cuenta?{' '}
                  <Link
                    href="/registro"
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Enlace de ayuda */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              ¿Problemas para acceder? Contacta a nuestro{' '}
              <a
                href="mailto:soporte@gameservershub.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
              >
                soporte técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 