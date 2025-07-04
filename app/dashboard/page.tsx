'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserServers, type UserServer } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServerRegistrationForm from '@/components/ServerRegistrationForm';
import UserServersList from '@/components/UserServersList';
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
  XCircle,
  Server,
  Loader2
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
  position: 'premium-card' | 'top' | 'sidebar' | 'bottom';
  game_category: string;
  status: 'active' | 'pending' | 'rejected';
  credits_cost: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  user_server_id?: number;
}

const bannerPositions = [
  { 
    value: 'premium-card', 
    label: '⭐ Tarjetas Premium de Servidores', 
    cost: 350, 
    description: 'Destacado especial en tarjetas de servidores con diseño premium',
    icon: '⭐',
    featured: true
  },
  { 
    value: 'top', 
    label: 'Banner Superior (728x90)', 
    cost: 200, 
    description: 'Máxima visibilidad en la parte superior',
    icon: '🔝',
    featured: false
  },
  { 
    value: 'sidebar', 
    label: 'Banner Lateral (300x250)', 
    cost: 150, 
    description: 'Visible en todas las páginas laterales',
    icon: '🏢',
    featured: false
  },
  { 
    value: 'bottom', 
    label: 'Banner Inferior (728x90)', 
    cost: 100, 
    description: 'Posición al final del contenido',
    icon: '📍',
    featured: false
  },
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
  const [userServers, setUserServers] = useState<UserServer[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [activeTab, setActiveTab] = useState('servers');
  const [showServerForm, setShowServerForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
      fetchUserServers();
    }
  }, [user, loading, router]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user!.id);
      
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.log('Profile fetch error:', error);
        
        // Si el perfil no existe, créalo automáticamente
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user!.id,
              email: user!.email!,
              full_name: user!.user_metadata?.full_name || null,
              credits: 1000, // Créditos iniciales
              username: user!.user_metadata?.username || null,
              avatar_url: null
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
          
          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        console.log('Profile found:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setMessage('Error al cargar el perfil. Intentando de nuevo...');
      setMessageType('error');
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

  const fetchUserServers = async () => {
    try {
      const { data, error } = await getUserServers(user!.id);
      if (error) {
        console.error('Error fetching user servers:', error);
      } else {
        setUserServers(data);
      }
    } catch (error) {
      console.error('Error fetching user servers:', error);
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

    // Validar límite de tarjetas premium
    if (formData.position === 'premium-card') {
      try {
        const { data: canCreate, error } = await supabase.rpc('check_premium_card_limit', {
          user_id_param: user.id
        });

        if (error) throw error;
        
        if (!canCreate) {
          setMessage('Has alcanzado el límite máximo de 4 tarjetas premium activas');
          setMessageType('error');
          return;
        }
      } catch (error: any) {
        console.error('Error checking premium limit:', error);
        setMessage('Error al validar límite de tarjetas premium');
        setMessageType('error');
        return;
      }
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

  const handleServerSuccess = () => {
    setShowServerForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateServer = () => {
    setShowServerForm(true);
  };

  const handleEditServer = (server: UserServer) => {
    // TODO: Implementar edición de servidor
    console.log('Edit server:', server);
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando dashboard...</p>
          <p className="text-slate-400 text-sm">Preparando tu cuenta</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h2>
          <p className="text-slate-400 mb-6">Necesitas iniciar sesión para acceder al dashboard</p>
          <Button onClick={() => router.push('/login')} className="bg-gradient-to-r from-cyan-500 to-blue-500">
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Error al cargar perfil</h2>
            <p className="text-red-300 mb-6">
              No se pudo cargar tu perfil. Esto puede deberse a un problema de conexión o configuración.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setLoadingProfile(true);
                  fetchProfile();
                }} 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                Reintentar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')} 
                className="w-full border-slate-600 text-slate-300"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estadísticas
  const activeBanners = banners.filter(b => b.status === 'active').length;
  const pendingBanners = banners.filter(b => b.status === 'pending').length;
  const totalInvestment = banners.reduce((sum, b) => sum + b.credits_cost, 0);
  const approvedServers = userServers.filter(s => s.approved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Dashboard</h1>
          <p className="text-slate-400 text-lg">Gestiona tus servidores y campañas publicitarias</p>
        </div>

        {/* Layout con sidebar y contenido principal */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Sidebar izquierdo - Perfil y estadísticas */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Profile Card */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-md">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-white text-xl">{profile.full_name || 'Usuario'}</CardTitle>
                <CardDescription className="text-slate-400 text-sm">{profile.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">{profile.credits}</div>
                  <div className="text-sm text-slate-400">Créditos disponibles</div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 py-3">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Comprar Créditos
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-cyan-400 mb-1">{userServers.length}</div>
                      <div className="text-sm text-slate-400">Servidores</div>
                    </div>
                    <Server className="h-10 w-10 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-400 mb-1">{approvedServers}</div>
                      <div className="text-sm text-slate-400">Aprobados</div>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-yellow-400 mb-1">{activeBanners}</div>
                      <div className="text-sm text-slate-400">Banners Activos</div>
                    </div>
                    <ImageIcon className="h-10 w-10 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-400 mb-1">{totalInvestment}</div>
                      <div className="text-sm text-slate-400">Inversión Total</div>
                    </div>
                    <TrendingUp className="h-10 w-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="xl:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
                <TabsTrigger 
                  value="servers" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                >
                  <Server className="mr-2 h-4 w-4" />
                  Mis Servidores
                </TabsTrigger>
                <TabsTrigger 
                  value="banners" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Banners
                </TabsTrigger>
              </TabsList>

              {/* Pestaña de servidores */}
              <TabsContent value="servers" className="mt-8">
                {showServerForm ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-white">Registrar Nuevo Servidor</h2>
                      <Button 
                        onClick={() => setShowServerForm(false)}
                        variant="outline"
                        className="border-slate-600 text-slate-300 px-6 py-2"
                      >
                        Cancelar
                      </Button>
                    </div>
                    <ServerRegistrationForm onSuccess={handleServerSuccess} />
                  </div>
                ) : (
                  <UserServersList 
                    onCreateServer={handleCreateServer}
                    onEditServer={handleEditServer}
                    refreshTrigger={refreshTrigger}
                  />
                )}
              </TabsContent>

              {/* Pestaña de banners */}
              <TabsContent value="banners" className="mt-8">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white flex items-center text-2xl">
                      <ImageIcon className="mr-3 h-7 w-7 text-cyan-400" />
                      Sistema de Banners
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-base">
                      Crea banners publicitarios para tus servidores registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {userServers.length === 0 ? (
                      <div className="text-center py-12">
                        <Server className="h-20 w-20 text-slate-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Primero registra un servidor
                        </h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                          Necesitas tener al menos un servidor registrado para crear banners publicitarios
                        </p>
                        <Button 
                          onClick={() => setActiveTab('servers')}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8 py-3"
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Registrar Primer Servidor
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ImageIcon className="h-20 w-20 text-slate-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-white mb-4">
                          Sistema de Banners
                        </h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                          Funcionalidad de banners publicitarios vinculada a tus servidores estará disponible próximamente
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                          {userServers.filter(s => s.approved).map(server => (
                            <Card key={server.id} className="bg-slate-700/50 border-slate-600">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <Server className="h-7 w-7 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white text-lg">{server.title}</h4>
                                    <p className="text-sm text-slate-400">
                                      {server.category?.name} • {server.country}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 py-3"
                                  disabled
                                >
                                  <Plus className="mr-2 h-5 w-5" />
                                  Crear Banner (Próximamente)
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}