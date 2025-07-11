'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CustomSelect as Select,
  CustomSelectContent as SelectContent,
  CustomSelectItem as SelectItem,
  CustomSelectTrigger as SelectTrigger,
  CustomSelectValue as SelectValue,
} from '@/components/ui/custom-select';
import { 
  Loader2, 
  Search, 
  Eye, 
  Check, 
  X, 
  AlertTriangle,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Edit,
  Trash2,
  User,
  Clock,
  DollarSign
} from 'lucide-react';

interface Banner {
  id: string;
  user_id: string;
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
  updated_at: string;
  user_profiles?: {
    email: string;
    full_name: string | null;
    username: string | null;
  };
}

export default function AdminBannersModule() {
  const { user } = useAdmin();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete'>('approve');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select(`
          *,
          user_profiles (
            email,
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      setError('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBanner = async (banner: Banner) => {
    setActionLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 días de duración

      const { error } = await supabase
        .from('banners')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString()
        })
        .eq('id', banner.id);

      if (error) throw error;

      // Refresh banners list
      await fetchBanners();
    } catch (error: any) {
      console.error('Error approving banner:', error);
      setError('Error al aprobar banner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBanner = async (banner: Banner) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .update({
          status: 'rejected'
        })
        .eq('id', banner.id);

      if (error) throw error;

      // Refresh banners list
      await fetchBanners();
    } catch (error: any) {
      console.error('Error rejecting banner:', error);
      setError('Error al rechazar banner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id);

      if (error) throw error;

      // Refresh banners list
      await fetchBanners();
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      setError('Error al eliminar banner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBannerAction = async () => {
    if (!selectedBanner) return;

    setActionLoading(true);
    try {
      let updateData: any = {};
      
      switch (actionType) {
        case 'approve':
          await handleApproveBanner(selectedBanner);
          break;
        case 'reject':
          await handleRejectBanner(selectedBanner);
          break;
        case 'delete':
          await handleDeleteBanner(selectedBanner);
          setActionDialog(false);
          setSelectedBanner(null);
          return;
      }

      setActionDialog(false);
      setSelectedBanner(null);
    } catch (error: any) {
      console.error('Error updating banner:', error);
      setError('Error al actualizar banner');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || banner.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Check className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <X className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-slate-600">
            {status}
          </Badge>
        );
    }
  };

  const getPositionBadge = (position: string) => {
    const positionNames = {
      top: 'Superior',
      sidebar: 'Lateral',
      bottom: 'Inferior'
    };
    
    return (
      <Badge variant="outline" className="text-slate-300 border-slate-600">
        {positionNames[position as keyof typeof positionNames] || position}
      </Badge>
    );
  };

  const calculateDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-400" />
        <span className="ml-2 text-slate-300">Cargando banners...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-500/20 border-red-500/30 text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título, descripción o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={fetchBanners}
          variant="outline"
          className="text-slate-300 border-slate-600 hover:text-white hover:border-red-500/50"
        >
          Actualizar
        </Button>
      </div>

      {/* Banners Table */}
      <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">
            Gestión de Banners ({filteredBanners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Tipo Banner</TableHead>
                  <TableHead className="text-slate-300">Desc.</TableHead>
                  <TableHead className="text-slate-300">Url</TableHead>
                  <TableHead className="text-slate-300">Imagen</TableHead>
                  <TableHead className="text-slate-300">Días de banner</TableHead>
                  <TableHead className="text-slate-300">Autor</TableHead>
                  <TableHead className="text-slate-300">Fecha</TableHead>
                  <TableHead className="text-slate-300">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBanners.map((banner) => (
                  <TableRow key={banner.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-white">
                      <div className="space-y-2">
                        {getPositionBadge(banner.position)}
                        {getStatusBadge(banner.status)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-300 max-w-[200px]">
                      <div>
                        <p className="font-semibold text-white truncate">{banner.title}</p>
                        <p className="text-sm text-slate-400 truncate">
                          {banner.description || 'Sin descripción'}
                        </p>
                        <p className="text-xs text-slate-500">{banner.game_category}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                        <a 
                          href={banner.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 truncate max-w-[150px] text-sm"
                        >
                          {banner.target_url}
                        </a>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBanner(banner);
                          setPreviewDialog(true);
                        }}
                        className="text-slate-300 border-slate-600 hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                    
                    <TableCell className="text-white">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-yellow-400" />
                          <span className="font-semibold">{banner.credits_cost}</span>
                        </div>
                        {banner.status === 'active' && banner.end_date && (
                          <div className="text-sm text-slate-400">
                            {calculateDaysRemaining(banner.end_date)} días restantes
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {banner.user_profiles?.username || 'Sin usuario'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">
                          {banner.user_profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm">
                          {new Date(banner.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {banner.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBanner(banner);
                                setActionType('approve');
                                setActionDialog(true);
                              }}
                              disabled={actionLoading}
                              className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBanner(banner);
                                setActionType('reject');
                                setActionDialog(true);
                              }}
                              disabled={actionLoading}
                              className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBanner(banner);
                            setActionType('delete');
                            setActionDialog(true);
                          }}
                          disabled={actionLoading}
                          className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredBanners.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No se encontraron banners
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Preview del Banner</DialogTitle>
            <DialogDescription className="text-slate-400">
              Vista previa de cómo se ve el banner
            </DialogDescription>
          </DialogHeader>
          
          {selectedBanner && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg">
                <img 
                  src={selectedBanner.image_url} 
                  alt={selectedBanner.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-banner.png';
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Título:</span>
                  <p className="text-white">{selectedBanner.title}</p>
                </div>
                <div>
                  <span className="text-slate-400">Posición:</span>
                  <p className="text-white">{selectedBanner.position}</p>
                </div>
                <div>
                  <span className="text-slate-400">Categoría:</span>
                  <p className="text-white">{selectedBanner.game_category}</p>
                </div>
                <div>
                  <span className="text-slate-400">Estado:</span>
                  <div className="mt-1">{getStatusBadge(selectedBanner.status)}</div>
                </div>
              </div>
              
              {selectedBanner.description && (
                <div>
                  <span className="text-slate-400">Descripción:</span>
                  <p className="text-white">{selectedBanner.description}</p>
                </div>
              )}
              
              <div>
                <span className="text-slate-400">URL de destino:</span>
                <a 
                  href={selectedBanner.target_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {selectedBanner.target_url}
                </a>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialog(false)}
              className="text-slate-300 border-slate-600"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' && 'Aprobar Banner'}
              {actionType === 'reject' && 'Rechazar Banner'}
              {actionType === 'delete' && 'Eliminar Banner'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionType === 'approve' && `¿Estás seguro de que quieres aprobar el banner "${selectedBanner?.title}"?`}
              {actionType === 'reject' && `¿Estás seguro de que quieres rechazar el banner "${selectedBanner?.title}"?`}
              {actionType === 'delete' && `¿Estás seguro de que quieres eliminar permanentemente el banner "${selectedBanner?.title}"? Esta acción no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(false)}
              className="text-slate-300 border-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBannerAction}
              disabled={actionLoading}
              className={
                actionType === 'approve' 
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {actionType === 'approve' && <Check className="h-4 w-4 mr-2" />}
                  {actionType === 'reject' && <X className="h-4 w-4 mr-2" />}
                  {actionType === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                  {actionType === 'approve' && 'Aprobar'}
                  {actionType === 'reject' && 'Rechazar'}
                  {actionType === 'delete' && 'Eliminar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 