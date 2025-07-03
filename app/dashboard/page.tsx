'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  CreditCard, 
  Plus, 
  Image as ImageIcon, 
  Calendar,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  Upload,
  Shield,
  Globe,
  Mail,
  Clock,
  Target,
  BarChart3,
  Zap,
  Star,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  target_url: string;
  position: 'top' | 'sidebar' | 'bottom';
  game_category: string;
  status: 'active' | 'pending' | 'rejected';
  credits_cost: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const bannerPositions = [
  { value: 'top', label: 'Banner Superior (728x90)', cost: 200, description: 'Máxima visibilidad en la parte superior' },
  { value: 'sidebar', label: 'Banner Lateral (300x250)', cost: 150, description: 'Visible en todas las páginas laterales' },
  { value: 'bottom', label: 'Banner Inferior (728x90)', cost: 100, description: 'Posición al final del contenido' },
];

const durations = [
  { value: '7', label: '7 días', multiplier: 1 },
  { value: '15', label: '15 días', multiplier: 1.8 },
  { value: '30', label: '30 días', multiplier: 3 },
];

const gameCategories = [
  { value: 'lineage-ii', label: 'Lineage II' },
  { value: 'aion', label: 'Aion Online' },
  { value: 'mu-online', label: 'Mu Online' },
  { value: 'perfect-world', label: 'Perfect World' },
  { value: 'counter-strike', label: 'Counter Strike' },
  { value: 'wow', label: 'World of Warcraft' },
  { value: 'all', label: 'Todas las categorías' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    position: 'sidebar',
    gameCategory: 'all',
    duration: '15',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfile();
      fetchBanners();
    }
  }, [user, loading, router]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const calculateCost = () => {
    const position = bannerPositions.find(p => p.value === formData.position);
    const duration = durations.find(d => d.value === formData.duration);
    return position && duration ? Math.round(position.cost * duration.multiplier) : 0;
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const totalCost = calculateCost();
    
    if (profile.credits < totalCost) {
      setMessage('Créditos insuficientes para crear este banner');
      setMessageType('error');
      return;
    }

    setIsCreating(true);
    setMessage('');

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(formData.duration));

      const { error: insertError } = await supabase
        .from('banners')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          image_url: formData.imageUrl,
          target_url: formData.targetUrl,
          position: formData.position,
          game_category: formData.gameCategory,
          credits_cost: totalCost,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Deduct credits
      const { error: updateError } = await supabase.rpc('deduct_credits', {
        user_id: user.id,
        amount: totalCost,
      });

      if (updateError) throw updateError;

      setMessage('¡Banner creado exitosamente! Está en revisión.');
      setMessageType('success');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        targetUrl: '',
        position: 'sidebar',
        gameCategory: 'all',
        duration: '15',
      });

      // Refresh data
      fetchProfile();
      fetchBanners();
    } catch (error: any) {
      setMessage(error.message || 'Error al crear el banner');
      setMessageType('error');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'En Revisión';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const activeBanners = banners.filter(b => b.status === 'active').length;
  const pendingBanners = banners.filter(b => b.status === 'pending').length;
  const totalInvestment = banners.reduce((sum, b) => sum + b.credits_cost, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Gestiona tu cuenta y campañas publicitarias</p>
        </div>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column - Account Information */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* Profile Card */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white">{profile.full_name || 'Usuario'}</CardTitle>
                <CardDescription className="text-slate-400">{profile.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">{profile.credits}</div>
                  <div className="text-sm text-slate-400">Créditos disponibles</div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Comprar Créditos
                </Button>
                
                <div className="pt-4 border-t border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Miembro desde</span>
                    <span className="text-white">{new Date(profile.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Última actividad</span>
                    <span className="text-white">{new Date(profile.updated_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{activeBanners}</div>
                      <div className="text-xs text-slate-400">Banners Activos</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{pendingBanners}</div>
                      <div className="text-xs text-slate-400">En Revisión</div>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-cyan-400">{banners.length}</div>
                      <div className="text-xs text-slate-400">Total Banners</div>
                    </div>
                    <BarChart3 className="h-8 w-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{totalInvestment}</div>
                      <div className="text-xs text-slate-400">Inversión Total</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
                <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300">
                  <Mail className="mr-2 h-4 w-4" />
                  Soporte
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Create Banner Form */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <Plus className="mr-3 h-6 w-6 text-cyan-400" />
                  Crear Nuevo Banner Publicitario
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Miles de personas están conectadas a SVTOP.NET, accediendo a nuestros mejores servidores todo el día. 
                  Llega a todos ellos promocionando tu página aquí y así ganar más visitas, aumentando la presencia en la red.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreateBanner} className="space-y-6">
                  
                  {/* Banner Position */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Seleccionar Banner</Label>
                    <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {bannerPositions.map((position) => (
                          <SelectItem key={position.value} value={position.value} className="text-white">
                            <div className="flex flex-col">
                              <span>{position.label}</span>
                              <span className="text-xs text-slate-400">{position.description} - {position.cost} créditos/día</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Duración</Label>
                    <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value} className="text-white">
                            {duration.label} (x{duration.multiplier} multiplicador)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cost Display */}
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Costo Total:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-cyan-400">{calculateCost()}</span>
                        <span className="text-slate-400">créditos</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Crédito disponible: {profile.credits} | Crédito después de publicar: {profile.credits - calculateCost()}
                    </div>
                  </div>

                  {/* Game Category */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Categoría del Juego</Label>
                    <Select value={formData.gameCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, gameCategory: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {gameCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="text-white">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Título del Banner</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título atractivo para tu banner"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Descripción</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del banner"
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>

                  {/* Target URL */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">URL</Label>
                    <Input
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                      placeholder="https://www.example.com/"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Imagen</Label>
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="URL de la imagen del banner"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                    <div className="text-xs text-slate-500">
                      El tamaño del archivo de imagen no puede exceder 2 MB
                    </div>
                  </div>

                  {/* Guidelines */}
                  <Alert className="bg-blue-900/20 border-blue-500/50">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300 text-sm">
                      <div className="space-y-1">
                        <div>• Crea imágenes simples y elegantes</div>
                        <div>• No permitimos contenido desnudo o pornografía</div>
                        <div>• Los banners serán removidos sin posibilidad de publicidad nuevamente</div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Message */}
                  {message && (
                    <Alert className={`${
                      messageType === 'success' 
                        ? 'bg-green-900/20 border-green-500/50' 
                        : messageType === 'error'
                        ? 'bg-red-900/20 border-red-500/50'
                        : 'bg-blue-900/20 border-blue-500/50'
                    }`}>
                      <AlertDescription className={`${
                        messageType === 'success' ? 'text-green-300' : 
                        messageType === 'error' ? 'text-red-300' : 'text-blue-300'
                      }`}>
                        {message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isCreating || profile.credits < calculateCost()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 py-3 text-lg font-semibold"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Crear Banner ({calculateCost()} créditos)
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Banner Diagram & Management */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* Banner Layout Diagram */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Diagrama de Banners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Top Banner */}
                <div className="bg-slate-700/50 border border-slate-600 rounded p-2 text-center">
                  <div className="text-xs text-slate-400 mb-1">Banner Superior (728x90)</div>
                  <div className="h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded flex items-center justify-center">
                    <span className="text-xs text-cyan-400">
                      {banners.filter(b => b.position === 'top' && b.status === 'active').length} activos
                    </span>
                  </div>
                </div>

                {/* Content Area with Sidebar */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 bg-slate-700/30 border border-slate-600 rounded p-2 text-center">
                    <div className="text-xs text-slate-400">Contenido Principal</div>
                  </div>
                  <div className="bg-slate-700/50 border border-slate-600 rounded p-2 text-center">
                    <div className="text-xs text-slate-400 mb-1">Lateral (300x250)</div>
                    <div className="h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded flex items-center justify-center">
                      <span className="text-xs text-green-400">
                        {banners.filter(b => b.position === 'sidebar' && b.status === 'active').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Banner */}
                <div className="bg-slate-700/50 border border-slate-600 rounded p-2 text-center">
                  <div className="text-xs text-slate-400 mb-1">Banner Inferior (728x90)</div>
                  <div className="h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded flex items-center justify-center">
                    <span className="text-xs text-purple-400">
                      {banners.filter(b => b.position === 'bottom' && b.status === 'active').length} activos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Banners List */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Mis Banners</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBanners ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  </div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-4">
                    <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No tienes banners</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {banners.map((banner) => (
                      <div key={banner.id} className="bg-slate-700/50 border border-slate-600 rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white text-sm font-medium truncate flex-1">{banner.title}</h4>
                          <Badge className={`${getStatusColor(banner.status)} text-xs ml-2 flex-shrink-0`}>
                            {getStatusIcon(banner.status)}
                            <span className="ml-1">{getStatusText(banner.status)}</span>
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-slate-400">
                          <div>Posición: {bannerPositions.find(p => p.value === banner.position)?.label}</div>
                          <div>Costo: {banner.credits_cost} créditos</div>
                          <div>Creado: {new Date(banner.created_at).toLocaleDateString('es-ES')}</div>
                        </div>

                        <div className="flex space-x-1 mt-2">
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs px-2 py-1">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs px-2 py-1">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20 text-xs px-2 py-1">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}