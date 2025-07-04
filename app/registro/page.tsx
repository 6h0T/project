'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Mail, Lock, User, Shield, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import BotIdClient from '@/components/BotIdClient';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede tener más de 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/(?=.*[a-z])/, 'Debe contener al menos una letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Debe contener al menos una letra mayúscula')
    .regex(/(?=.*\d)/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Función para verificar disponibilidad del username
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    
    try {
      // Usar función RPC para verificar disponibilidad
      const { data, error } = await supabase
        .rpc('check_username_available', { username_param: username });

      if (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } else {
        // data será true si está disponible, false si no
        setUsernameAvailable(data);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Effect para verificar username cuando cambie
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'username' && value.username) {
        const username = value.username.trim();
        if (username && username.length >= 3) {
          // Debounce la verificación
          const timeoutId = setTimeout(() => {
            checkUsernameAvailability(username);
          }, 500);
          
          return () => clearTimeout(timeoutId);
        } else {
          setUsernameAvailable(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar captcha primero
      if (!isCaptchaVerified) {
        throw new Error('Por favor completa la verificación de captcha');
      }

      // Verificar que el username esté disponible
      if (usernameAvailable !== true) {
        throw new Error('Por favor elige un nombre de usuario válido y disponible');
      }

      // Verificar captcha en el servidor
      const captchaResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
      });

      if (!captchaResponse.ok) {
        throw new Error('Verificación de captcha fallida');
      }

      const captchaData = await captchaResponse.json();
      
      if (captchaData.isBot) {
        throw new Error('Verificación de captcha fallida. Intenta nuevamente.');
      }

      // Proceder con el registro
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Si el usuario se creó pero no hay perfil automático, crearlo manualmente
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          // Intentar crear el perfil manualmente como fallback
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: data.email,
              username: data.username,
              full_name: data.username,
              credits: 1000
            });
          
          if (profileError) {
            console.warn('Profile creation fallback failed:', profileError);
            // No lanzar error aquí, el trigger podría haber funcionado
          }
        } catch (profileError) {
          console.warn('Profile creation fallback error:', profileError);
          // No bloquear el registro por esto
        }
      }

      setSuccess('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta y luego podrás iniciar sesión.');
      form.reset();
      
      // Redireccionar después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error: any) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
            <h2 className="text-4xl font-bold text-white mb-2">Crear Cuenta</h2>
            <p className="text-slate-400">
              Únete a GameServers Hub y comienza a promocionar tus servidores
            </p>
          </div>

          {/* Formulario */}
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">
                Registro
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Completa todos los campos para crear tu cuenta
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
                
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">
                    Nombre de Usuario
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="tu_usuario"
                      className={`pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 ${
                        usernameAvailable === true ? 'border-green-500' : 
                        usernameAvailable === false ? 'border-red-500' : ''
                      }`}
                      {...form.register('username')}
                    />
                    {/* Indicador de estado del username */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingUsername ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : usernameAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {form.formState.errors.username && (
                    <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-green-400 text-sm">✓ Nombre de usuario disponible</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="text-red-400 text-sm">✗ Este nombre de usuario ya está en uso</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      {...form.register('email')}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
                  )}
                  <div className="text-xs text-slate-500">
                    Debe contener: 8+ caracteres, mayúscula, minúscula y número
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      {...form.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Captcha BotId */}
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Verificación de Seguridad
                  </Label>
                  <BotIdClient
                    protect={["/api/verify-captcha"]}
                    onVerified={() => setIsCaptchaVerified(true)}
                    onError={() => setIsCaptchaVerified(false)}
                  />
                  {!isCaptchaVerified && (
                    <p className="text-amber-400 text-sm">
                      Por favor completa la verificación de seguridad
                    </p>
                  )}
                </div>

                {/* Error Messages */}
                {error && (
                  <Alert className="bg-red-900/20 border-red-500/50">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Messages */}
                {success && (
                  <Alert className="bg-green-900/20 border-green-500/50">
                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !isCaptchaVerified || usernameAvailable !== true || checkingUsername}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-slate-400 text-sm">
                    ¿Ya tienes una cuenta?{' '}
                    <Link
                      href="/login"
                      className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}