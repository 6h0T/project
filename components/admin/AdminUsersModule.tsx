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
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Search, 
  UserX, 
  UserCheck, 
  Crown, 
  Shield, 
  AlertTriangle,
  Calendar,
  Mail,
  User,
  Ban,
  CheckCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  admin_rank: number;
  credits: number;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_by: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersModule() {
  const { user } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason.trim()) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: suspendReason.trim()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Refresh users list
      await fetchUsers();
      
      setSuspendDialog(false);
      setSelectedUser(null);
      setSuspendReason('');
    } catch (error: any) {
      console.error('Error suspending user:', error);
      setError('Error al suspender usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendUser = async (user: UserProfile) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null,
          suspended_by: null
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error unsuspending user:', error);
      setError('Error al reactivar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (adminRank: number) => {
    if (adminRank === 1) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-slate-400 border-slate-600">
        <User className="h-3 w-3 mr-1" />
        Usuario
      </Badge>
    );
  };

  const getStatusBadge = (user: UserProfile) => {
    if (user.is_suspended) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <Ban className="h-3 w-3 mr-1" />
          Suspendido
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-red-400" />
        <span className="ml-2 text-slate-300">Cargando usuarios...</span>
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
            placeholder="Buscar por email, nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
          />
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="text-slate-300 border-slate-600 hover:text-white hover:border-red-500/50"
        >
          Actualizar
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">
            Gestión de Usuarios ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Usuario</TableHead>
                  <TableHead className="text-slate-300">Nombre</TableHead>
                  <TableHead className="text-slate-300">Rango</TableHead>
                  <TableHead className="text-slate-300">Correo</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Crédito</TableHead>
                  <TableHead className="text-slate-300">Fecha</TableHead>
                  <TableHead className="text-slate-300">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-white">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{user.username || 'Sin usuario'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      {user.full_name || 'Sin nombre'}
                    </TableCell>
                    
                    <TableCell>
                      {getRoleBadge(user.admin_rank)}
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    
                    <TableCell className="text-white font-semibold">
                      {user.credits.toLocaleString()}
                    </TableCell>
                    
                    <TableCell className="text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsuspendUser(user)}
                            disabled={actionLoading}
                            className="text-green-400 border-green-500/30 hover:bg-green-500/20"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Reactivar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setSuspendDialog(true);
                            }}
                            disabled={actionLoading || user.admin_rank === 1}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Suspender
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No se encontraron usuarios
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Suspender Usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              Estás a punto de suspender a {selectedUser?.email}. Esta acción se puede revertir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium">
                Motivo de la suspensión *
              </label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Describe el motivo de la suspensión..."
                className="mt-2 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialog(false)}
              className="text-slate-300 border-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSuspendUser}
              disabled={!suspendReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suspendiendo...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspender Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 