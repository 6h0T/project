'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verificar si hay una sesión válida para el reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        // Verificar si es una sesión de reset de contraseña
        if (session?.user && session.user.email) {
          setIsValidSession(true);
        } else {
          // Si no hay sesión, intentar detectar tokens en la URL
          const accessToken = searchParams?.get('access_token');
          const refreshToken = searchParams?.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Configurar la sesión con los tokens de la URL
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!setSessionError) {
              setIsValidSession(true);
            } else {
              setIsValidSession(false);
            }
          } else {
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const handleResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      if (error.message.includes('same_password')) {
        setError('La nueva contraseña debe ser diferente a la anterior.');
      } else if (error.message.includes('weak_password')) {
        setError('La contraseña es muy débil. Por favor usa una contraseña más segura.');
      } else {
        setError('Error al actualizar la contraseña. Por favor intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras verifica la sesión
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-slate-300">Verificando enlace...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay sesión válida
  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <div className="p-6">
          <Link
            href="/login"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al login
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 w-auto mx-auto mb-6"
              />
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Enlace Inválido
                </h2>
                <p className="text-slate-400">
                  El enlace de restablecimiento ha expirado o es inválido
                </p>
              </div>
            </div>

            <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Alert className="border-red-800 bg-red-900/50 text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enlace de restablecimiento inválido</strong>
                    <br />
                    El enlace puede haber expirado o ya haber sido usado.
                  </AlertDescription>
                </Alert>

                <div className="text-center pt-4">
                  <p className="text-slate-400 text-sm mb-4">
                    Qué puedes hacer:
                  </p>
                  <div className="flex flex-col space-y-3">
                    <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                      <Link href="/forgot-password">
                        Solicitar Nuevo Enlace
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="text-slate-300 border-slate-600">
                      <Link href="/login">
                        Volver al Login
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 w-auto mx-auto mb-6 hover:scale-105 transition-transform duration-300"
              />
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  ¡Contraseña Actualizada!
                </h2>
                <p className="text-slate-400">
                  Tu contraseña se ha cambiado exitosamente
                </p>
              </div>
            </div>

            <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Alert className="border-green-800 bg-green-900/50 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Contraseña actualizada correctamente</strong>
                    <br />
                    Ahora puedes iniciar sesión con tu nueva contraseña.
                    Serás redirigido automáticamente en unos segundos.
                  </AlertDescription>
                </Alert>

                <div className="text-center pt-4">
                  <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <Link href="/login">
                      Ir al Login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="p-6">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al login
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 w-auto mx-auto mb-6 hover:scale-105 transition-transform duration-300"
            />
            <h2 className="text-3xl font-bold text-white mb-2">
              Nueva Contraseña
            </h2>
            <p className="text-slate-400">
              Ingresa tu nueva contraseña segura
            </p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center">
                <Shield className="h-6 w-6 mr-2 text-cyan-400" />
                Restablecer Contraseña
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Crea una contraseña segura para proteger tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-800 bg-red-900/50 text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Nueva Contraseña
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400 pr-10"
                      {...form.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Requisitos de contraseña */}
                <div className="bg-slate-700/30 p-3 rounded-lg">
                  <p className="text-slate-300 text-sm font-medium mb-2">Requisitos de contraseña:</p>
                  <ul className="text-slate-400 text-xs space-y-1">
                    <li>• Al menos 6 caracteres</li>
                    <li>• Una letra mayúscula</li>
                    <li>• Una letra minúscula</li>
                    <li>• Un número</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2.5 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Actualizar Contraseña
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 