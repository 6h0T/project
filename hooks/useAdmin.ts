'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AdminUser extends User {
  admin_rank: number;
  is_suspended: boolean;
  suspended_reason?: string;
}

export function useAdmin() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    checkAdminStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setIsSuspended(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setIsSuspended(false);
        setLoading(false);
        return;
      }

      // Obtener perfil del usuario con admin_rank
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('admin_rank, is_suspended, suspended_reason')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        setUser(null);
        setIsAdmin(false);
        setIsSuspended(false);
        setLoading(false);
        return;
      }

      // Crear usuario admin con los datos del perfil
      const adminUser: AdminUser = {
        ...session.user,
        admin_rank: profile.admin_rank || 0,
        is_suspended: profile.is_suspended || false,
        suspended_reason: profile.suspended_reason
      };

      setUser(adminUser);
      setIsAdmin(profile.admin_rank === 1);
      setIsSuspended(profile.is_suspended || false);
      setLoading(false);

    } catch (error) {
      console.error('Error checking admin status:', error);
      setUser(null);
      setIsAdmin(false);
      setIsSuspended(false);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    isAdmin,
    isSuspended,
    signOut,
    refreshAdminStatus: checkAdminStatus
  };
} 