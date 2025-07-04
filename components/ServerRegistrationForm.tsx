'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createUserServer, getServerCategories, type CreateUserServerData, type ServerCategory } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Server, 
  Globe, 
  MapPin, 
  Settings, 
  Star, 
  TrendingUp, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';

const countries = [
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'BR', name: 'Brasil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'INT', name: 'Internacional' },
];

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'Inglés' },
  { code: 'pt', name: 'Portugués' },
  { code: 'fr', name: 'Francés' },
  { code: 'de', name: 'Alemán' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Ruso' },
];

interface ServerRegistrationFormProps {
  onSuccess?: () => void;
}

export default function ServerRegistrationForm({ onSuccess }: ServerRegistrationFormProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServerCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const [formData, setFormData] = useState<CreateUserServerData>({
    title: '',
    description: '',
    website: '',
    country: '',
    language: 'es',
    version: '',
    experience: 1,
    max_level: 80,
    category_id: undefined,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await getServerCategories();
      if (error) {
        console.error('Error fetching categories:', error);
        setMessage('Error al cargar las categorías');
        setMessageType('error');
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage('Error al cargar las categorías');
      setMessageType('error');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage('Debes estar logueado para registrar un servidor');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await createUserServer(user.id, formData);
      
      if (error) {
        console.error('Error creating server:', error);
        setMessage('Error al registrar el servidor. Inténtalo de nuevo.');
        setMessageType('error');
      } else {
        setMessage('¡Servidor registrado exitosamente! Tu servidor será revisado por nuestro equipo.');
        setMessageType('success');
        
        // Limpiar formulario
        setFormData({
          title: '',
          description: '',
          website: '',
          country: '',
          language: 'es',
          version: '',
          experience: 1,
          max_level: 80,
          category_id: undefined,
        });

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating server:', error);
      setMessage('Error de conexión. Inténtalo más tarde.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserServerData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingCategories) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="ml-2 text-slate-300">Cargando formulario...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center text-xl">
          <Plus className="mr-3 h-6 w-6 text-cyan-400" />
          Registrar Nuevo Servidor
        </CardTitle>
        <CardDescription className="text-slate-300">
          Completa la información de tu servidor. Será revisado por nuestro equipo antes de ser publicado.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mensaje de resultado */}
        {message && (
          <Alert className={`${
            messageType === 'success' 
              ? 'bg-green-900/20 border-green-500/50' 
              : messageType === 'error'
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-blue-900/20 border-blue-500/50'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : messageType === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Shield className="h-4 w-4 text-blue-400" />
            )}
            <AlertDescription className={`${
              messageType === 'success' ? 'text-green-300' : 
              messageType === 'error' ? 'text-red-300' : 'text-blue-300'
            }`}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Server className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Información Básica</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-slate-300 text-sm">Nombre del Servidor *</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Ej: L2 Legend Server"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-slate-300 text-sm">Categoría *</Label>
                <Select
                  value={formData.category_id?.toString()}
                  onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría">
                      {formData.category_id ? 
                        categories.find(cat => cat.id === formData.category_id)?.icon + ' ' + 
                        categories.find(cat => cat.id === formData.category_id)?.name 
                        : "Selecciona una categoría"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-300 text-sm">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Describe tu servidor, características especiales, rates, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-slate-300 text-sm">Página Web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pl-10"
                  placeholder="https://tuservidor.com"
                />
              </div>
            </div>
          </div>

          {/* Configuración del juego */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Configuración del Juego</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country" className="text-slate-300 text-sm">País/Región</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona país">
                      {formData.country || "Selecciona país"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-slate-300 text-sm">Idioma</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona idioma">
                      {formData.language ? languages.find(lang => lang.code === formData.language)?.name || formData.language : "Selecciona idioma"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version" className="text-slate-300 text-sm">Versión/Crónica</Label>
                <Input
                  id="version"
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Ej: Interlude, High Five"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience" className="text-slate-300 text-sm">Experiencia (Rate)</Label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 h-4 w-4" />
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white pl-10"
                    placeholder="1"
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_level" className="text-slate-300 text-sm">Nivel Máximo</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-4 w-4" />
                  <Input
                    id="max_level"
                    type="number"
                    value={formData.max_level}
                    onChange={(e) => handleInputChange('max_level', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white pl-10"
                    placeholder="80"
                    min="1"
                    max="200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.title}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Registrando servidor...
                </>
              ) : (
                <>
                  <Plus className="mr-3 h-5 w-5" />
                  Registrar Servidor
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">📋 Proceso de Revisión</h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Tu servidor será revisado por nuestro equipo en 24-48 horas</li>
              <li>• Verificaremos que la información sea correcta</li>
              <li>• Una vez aprobado, aparecerá en los listados públicos</li>
              <li>• Podrás crear banners publicitarios para promocionarlo</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 