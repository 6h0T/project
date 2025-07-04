import { useState, useEffect } from 'react'

interface Server {
  id: number
  name: string
  title: string
  description: string
  country: string
  chronicle: string
  serverType: string
  platform: string
  players: number
  votes: number
  uptime: string
  exp: string
  features: string[]
  rank: number | string
  isPremium: boolean
  website?: string
  ip?: string
  category: string
  slug: string
}

interface ServersResponse {
  success: boolean
  servers: Server[]
  premiumServers: Server[]
  normalServers: Server[]
  total: number
  stats: {
    totalServers: number
    premiumCount: number
    totalVotes: number
  }
  error?: string
}

interface UseServersState {
  servers: Server[]
  premiumServers: Server[]
  normalServers: Server[]
  totalServers: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useServers(category: string = 'all', limit: number = 50): UseServersState {
  const [servers, setServers] = useState<Server[]>([])
  const [premiumServers, setPremiumServers] = useState<Server[]>([])
  const [normalServers, setNormalServers] = useState<Server[]>([])
  const [totalServers, setTotalServers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category !== 'all') {
        params.set('category', category)
      }
      params.set('limit', limit.toString())

      const response = await fetch(`/api/servers?${params.toString()}`)
      const data: ServersResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar servidores')
      }

      if (data.success) {
        setServers(data.servers)
        setPremiumServers(data.premiumServers)
        setNormalServers(data.normalServers)
        setTotalServers(data.stats.totalServers)
      } else {
        throw new Error('Error al procesar datos de servidores')
      }
    } catch (err) {
      console.error('Error fetching servers:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [category, limit])

  return {
    servers,
    premiumServers,
    normalServers,
    totalServers,
    loading,
    error,
    refetch: fetchServers
  }
} 