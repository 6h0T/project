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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import Link from 'next/link';

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

  // Función para obtener créditos reales de la base de datos
  const fetchUserCredits = async (): Promise<number> => {
    try {
      const token = await user?.getIdToken();
      if (!token) return 0;

      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error fetching credits:', response.statusText);
        return 0;
      }

      const data = await response.json();
      return data.credits || 0;
    } catch (error) {
      console.error('Error fetching user credits:', error);
      return 0;
    }
  };

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
          
          // Obtener créditos reales de la base de datos
          const realCredits = await fetchUserCredits();
          newProfile.credits = realCredits;
          
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        console.log('Profile loaded successfully:', data);
        
        // Siempre obtener créditos reales de la base de datos
        const realCredits = await fetchUserCredits();
        data.credits = realCredits;
        
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
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
    return position && duration ? position.cost * duration.multiplier : 0;
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage('');

    try {
      const cost = calculateCost();
      
      if (profile!.credits < cost) {
        setMessage(`Necesitas ${cost} créditos para crear este banner. Tienes ${profile!.credits} créditos disponibles.`);
        setMessageType('error');
        return;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(formData.duration));

      const { data: banner, error: bannerError } = await supabase
        .from('banners')
        .insert({
          user_id: user!.id,
          title: formData.title,
          description: formData.description,
          image_url: formData.imageUrl,
          target_url: formData.targetUrl,
          position: formData.position,
          game_category: formData.gameCategory,
          status: 'pending',
          credits_cost: cost,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (bannerError) throw bannerError;

      // Deduct credits
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ credits: profile!.credits - cost })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, credits: prev.credits - cost } : null);
      setBanners(prev => [banner, ...prev]);
      
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

      setMessage('Banner creado exitosamente y enviado para revisión.');
      setMessageType('success');
    } catch (error) {
      console.error('Error creating banner:', error);
      setMessage('Error al crear el banner. Por favor, intenta nuevamente.');
      setMessageType('error');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Gestiona tus servidores y campañas publicitarias</p>
        </div>

        {/* Layout con sidebar y contenido principal */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Sidebar izquierdo - Perfil y estadísticas */}
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
                
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <Link href="/buy-credits">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Comprar Créditos
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-cyan-400">{userServers.length}</div>
                      <div className="text-xs text-slate-400">Servidores</div>
                    </div>
                    <Server className="h-8 w-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{approvedServers}</div>
                      <div className="text-xs text-slate-400">Aprobados</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{activeBanners}</div>
                      <div className="text-xs text-slate-400">Banners Activos</div>
                    </div>
                    <ImageIcon className="h-8 w-8 text-yellow-400" />
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
          </div>

          {/* Contenido principal */}
          <div className="col-span-12 lg:col-span-9">
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
              <TabsContent value="servers" className="mt-6">
                {showServerForm ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Registrar Nuevo Servidor</h2>
                      <Button 
                        onClick={() => setShowServerForm(false)}
                        variant="outline"
                        className="border-slate-600 text-slate-300"
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
              <TabsContent value="banners" className="mt-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <ImageIcon className="mr-3 h-6 w-6 text-cyan-400" />
                      Sistema de Banners
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Crea banners publicitarios para tus servidores registrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userServers.length === 0 ? (
                      <div className="text-center py-8">
                        <Server className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Primero registra un servidor
                        </h3>
                        <p className="text-slate-400 mb-6">
                          Necesitas tener al menos un servidor registrado para crear banners publicitarios
                        </p>
                        <Button 
                          onClick={() => setActiveTab('servers')}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Primer Servidor
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Sistema de Banners
                        </h3>
                        <p className="text-slate-400 mb-6">
                          Funcionalidad de banners publicitarios vinculada a tus servidores estará disponible próximamente
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userServers.filter(s => s.approved).map(server => (
                            <Card key={server.id} className="bg-slate-700/50 border-slate-600">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <Server className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white">{server.title}</h4>
                                    <p className="text-sm text-slate-400">
                                      {server.category?.name} • {server.country}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                  disabled
                                >
                                  <Plus className="mr-2 h-4 w-4" />
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