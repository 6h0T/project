'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        setError('Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.');
      } else {
        setError('Error al enviar el correo de restablecimiento. Verifica que el email sea correcto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Header con botón de volver */}
        <div className="p-6">
          <Link
            href="/login"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al login
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
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  ¡Correo Enviado!
                </h2>
                <p className="text-slate-400">
                  Hemos enviado las instrucciones de restablecimiento a tu correo
                </p>
              </div>
            </div>

            {/* Información */}
            <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <Alert className="border-green-800 bg-green-900/50 text-green-200">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Revisa tu bandeja de entrada</strong>
                    <br />
                    Te hemos enviado un enlace para restablecer tu contraseña a:
                    <br />
                    <strong className="text-green-400">{form.getValues('email')}</strong>
                  </AlertDescription>
                </Alert>

                <div className="text-slate-300 space-y-2 text-sm">
                  <p><strong>Qué hacer ahora:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Revisa tu bandeja de entrada (y spam/promociones)</li>
                    <li>Busca un correo de GameServers Hub</li>
                    <li>Haz clic en el enlace del correo</li>
                    <li>Ingresa tu nueva contraseña</li>
                  </ol>
                </div>

                <div className="text-center pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm mb-4">
                    ¿No recibiste el correo?
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => {
                        setSuccess(false);
                        form.reset();
                      }}
                      variant="outline"
                      className="text-slate-300 border-slate-600 hover:text-white hover:border-cyan-500/50"
                    >
                      Intentar con otro email
                    </Button>
                    <Link
                      href="/login"
                      className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
                    >
                      Volver al login
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header con botón de volver */}
      <div className="p-6">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al login
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
              Restablecer Contraseña
            </h2>
            <p className="text-slate-400">
              Ingresa tu email y te enviaremos las instrucciones
            </p>
          </div>

          {/* Formulario */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center">
                <Mail className="h-6 w-6 mr-2 text-cyan-400" />
                Recuperar Acceso
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Te enviaremos un enlace seguro para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-800 bg-red-900/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email de tu cuenta
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2.5 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando correo...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Instrucciones
                    </>
                  )}
                </Button>
              </form>

              {/* Enlaces adicionales */}
              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  ¿Recordaste tu contraseña?{' '}
                  <Link
                    href="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
                  >
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Si tienes problemas, contacta a nuestro{' '}
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