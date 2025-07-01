'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trash2
} from 'lucide-react';
import BannerForm from '@/components/BannerForm';

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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Gestiona tu cuenta y banners publicitarios</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Créditos Disponibles</CardTitle>
              <CreditCard className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">{profile.credits}</div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Comprar Créditos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Banners Activos</CardTitle>
              <ImageIcon className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {banners.filter(b => b.status === 'active').length}
              </div>
              <p className="text-xs text-slate-400">
                {banners.filter(b => b.status === 'pending').length} pendientes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Miembro desde</CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Date(profile.created_at).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
              <p className="text-xs text-slate-400">
                {profile.full_name || 'Usuario'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="banners" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="banners" className="text-slate-300 data-[state=active]:text-white">
              Mis Banners
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-slate-300 data-[state=active]:text-white">
              Mi Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestión de Banners</h2>
              <Button 
                onClick={() => setShowBannerForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Banner
              </Button>
            </div>

            {loadingBanners ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : banners.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No tienes banners</h3>
                  <p className="text-slate-400 text-center mb-4">
                    Crea tu primer banner publicitario para promocionar tu servidor
                  </p>
                  <Button 
                    onClick={() => setShowBannerForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Banner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {banners.map((banner) => (
                  <Card key={banner.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{banner.title}</CardTitle>
                          <CardDescription className="text-slate-400">
                            {banner.game_category} • {banner.position}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(banner.status)}>
                          {getStatusText(banner.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden">
                          <img 
                            src={banner.image_url} 
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-slate-400">
                          <span>Costo: {banner.credits_cost} créditos</span>
                          <span>{new Date(banner.created_at).toLocaleDateString('es-ES')}</span>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre Completo
                    </label>
                    <div className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                      {profile.full_name || 'No especificado'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                      {profile.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Créditos
                    </label>
                    <div className="text-cyan-400 bg-slate-700 px-3 py-2 rounded-lg font-semibold">
                      {profile.credits}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Miembro desde
                    </label>
                    <div className="text-white bg-slate-700 px-3 py-2 rounded-lg">
                      {new Date(profile.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showBannerForm && (
        <BannerForm 
          isOpen={showBannerForm} 
          onClose={() => setShowBannerForm(false)}
          onSuccess={() => {
            setShowBannerForm(false);
            fetchBanners();
            fetchProfile(); // Refresh credits
          }}
        />
      )}
    </div>
  );
}