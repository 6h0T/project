import { useState, useEffect } from 'react'

interface Server {
  id: string | number
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
  rank: number
  isPremium: boolean
  website?: string
  ip?: string
  category?: string
  slug?: string
  created_at?: string
  source?: string
}

interface UseLineageServersState {
  servers: Server[]
  premiumServers: Server[]
  normalServers: Server[]
  totalServers: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLineageServers(): UseLineageServersState {
  const [servers, setServers] = useState<Server[]>([])
  const [premiumServers, setPremiumServers] = useState<Server[]>([])
  const [normalServers, setNormalServers] = useState<Server[]>([])
  const [totalServers, setTotalServers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔄 LISTENER PARA EVENTOS DE VOTACIÓN
  useEffect(() => {
    const handleVoteSuccess = (event: CustomEvent) => {
      const { serverId, newVoteCount } = event.detail
      
      // Actualizar el servidor en todas las listas
      const updateServerVotes = (serverList: Server[]) => 
        serverList.map(server => 
          server.id.toString() === serverId.toString() 
            ? { ...server, votes: newVoteCount }
            : server
        )
      
      setServers(prev => updateServerVotes(prev))
      setPremiumServers(prev => updateServerVotes(prev))
      setNormalServers(prev => updateServerVotes(prev))
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('voteSuccess', handleVoteSuccess as EventListener)
      return () => {
        window.removeEventListener('voteSuccess', handleVoteSuccess as EventListener)
      }
    }
  }, [])

  const fetchLineageServers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching Lineage servers from both categories...')

      // Obtener servidores de ambas categorías de Lineage usando la nueva API
      const responses = await Promise.all([
        fetch('/api/servers?category=lineage-ii&limit=200'),
        fetch('/api/servers?category=lineage-2&limit=200')
      ])

      const results = await Promise.all(responses.map(r => r.json()))
      
      console.log('📊 Resultados por categoría:', {
        'lineage-ii': results[0]?.servers?.length || 0,
        'lineage-2': results[1]?.servers?.length || 0
      })

      // Combinar servidores de ambas categorías, evitando duplicados
      const allServers: Server[] = []
      const seenIds = new Set<string>()

      // Procesar todos los resultados
      results.forEach((result, index) => {
        const categoryName = index === 0 ? 'Lineage II' : 'Lineage 2'
        
        if (result?.success && result?.servers) {
          result.servers.forEach((server: any) => {
            if (!seenIds.has(server.id.toString())) {
              allServers.push({
                id: server.id,
                name: server.title || server.name,
                title: server.title || server.name,
                description: server.description || '',
                country: server.country || 'International',
                chronicle: server.version || server.chronicle || 'Unknown',
                serverType: server.serverType || 'PvP',
                platform: server.platform || 'L2J',
                players: server.players || Math.floor(Math.random() * 500) + 100,
                votes: server.votes || 0,
                uptime: server.uptime || '99.5%',
                exp: server.exp || (server.experience ? `Exp x${server.experience}` : 'Exp x1'),
                features: server.features || (server.isPremium ? ['Premium'] : ['Normal']),
                rank: 0,
                isPremium: server.isPremium || false,
                website: server.website,
                ip: server.ip,
                category: server.category || categoryName,
                slug: server.slug,
                created_at: server.created_at,
                source: server.source || 'imported'
              })
              seenIds.add(server.id.toString())
            }
          })
        }
      })

      // Ordenar por premium primero, luego por votos descendente
      allServers.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1
        if (!a.isPremium && b.isPremium) return 1
        return b.votes - a.votes
      })

      // Asignar ranking
      allServers.forEach((server, index) => {
        server.rank = index + 1
      })

      // Separar servidores premium y normales
      const premium = allServers.filter(s => s.isPremium)
      const normal = allServers.filter(s => !s.isPremium)

      console.log('✅ Lineage servers loaded:', {
        total: allServers.length,
        premium: premium.length,
        normal: normal.length,
        servers: allServers.map(s => ({ id: s.id, title: s.title, votes: s.votes, source: s.source }))
      })

      setServers(allServers)
      setPremiumServers(premium)
      setNormalServers(normal)
      setTotalServers(allServers.length)
    } catch (err) {
      console.error('❌ Error fetching Lineage servers:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLineageServers()
  }, [])

  return {
    servers,
    premiumServers,
    normalServers,
    totalServers,
    loading,
    error,
    refetch: fetchLineageServers
  }
} 