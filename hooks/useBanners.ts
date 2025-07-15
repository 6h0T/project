'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  target_url: string
  position: string
  game_category: string
  status: string
  credits_cost: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .not('end_date', 'lt', new Date().toISOString()) // No incluir banners expirados
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setBanners(data || [])
    } catch (err) {
      console.error('Error fetching banners:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('banners_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        (payload) => {
          console.log('Banner change detected:', payload)
          fetchBanners() // Refrescar banners cuando hay cambios
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getBannerByPosition = (position: string): Banner | null => {
    return banners.find(banner => banner.position === position) || null
  }

  const getBannersByPage = (page: 'homepage' | 'votepage'): Banner[] => {
    const pagePrefix = page === 'homepage' ? 'home-' : 'vote-'
    return banners.filter(banner => banner.position.startsWith(pagePrefix))
  }

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners,
    getBannerByPosition,
    getBannersByPage
  }
}