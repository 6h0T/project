import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          credits: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          credits?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          credits?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      banners: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          target_url: string;
          position: 'top' | 'sidebar' | 'bottom';
          game_category: string;
          status?: 'active' | 'pending' | 'rejected';
          credits_cost?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          target_url?: string;
          position?: 'top' | 'sidebar' | 'bottom';
          game_category?: string;
          status?: 'active' | 'pending' | 'rejected';
          credits_cost?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};