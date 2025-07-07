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

      // Obtener servidores de ambas categorías de Lineage
      const responses = await Promise.all([
        fetch('/api/servers?category=lineage-ii&limit=100'),
        fetch('/api/servers?category=lineage-2&limit=100'),
        fetch('/api/servers?category=all&limit=100') // También incluir todos como respaldo
      ])

      const results = await Promise.all(responses.map(r => r.json()))
      
      console.log('📊 Resultados por categoría:', {
        'lineage-ii': results[0]?.servers?.length || 0,
        'lineage-2': results[1]?.servers?.length || 0,
        'all': results[2]?.servers?.length || 0
      })

      // Combinar servidores de ambas categorías, evitando duplicados
      const allServers: Server[] = []
      const seenIds = new Set<string>()

      // Procesar servidores de lineage-ii (categoría 1)
      if (results[0]?.success && results[0]?.servers) {
        results[0].servers.forEach((server: any) => {
          if (!seenIds.has(server.id.toString())) {
            allServers.push({
              id: server.id,
              name: server.title || server.name,
              title: server.title || server.name,
              description: server.description || '',
              country: server.country || 'International',
              chronicle: server.version || server.chronicle || 'Unknown',
              serverType: 'PvP',
              platform: 'L2J',
              players: server.players || Math.floor(Math.random() * 500) + 100,
              votes: server.votes || 0,
              uptime: server.uptime || '99.5%',
              exp: server.exp || (server.experience ? `Exp x${server.experience}` : 'Exp x1'),
              features: server.features || (server.premium ? ['Premium'] : ['Normal']),
              rank: 0,
              isPremium: server.isPremium || server.premium || false,
              website: server.website,
              ip: server.ip,
              category: server.category || 'Lineage II',
              slug: server.slug,
              created_at: server.created_at,
              source: server.source || 'lineage-ii'
            })
            seenIds.add(server.id.toString())
          }
        })
      }

      // Procesar servidores de lineage-2 (categoría 31)
      if (results[1]?.success && results[1]?.servers) {
        results[1].servers.forEach((server: any) => {
          if (!seenIds.has(server.id.toString())) {
            allServers.push({
              id: server.id,
              name: server.title || server.name,
              title: server.title || server.name,
              description: server.description || '',
              country: server.country || 'International',
              chronicle: server.version || server.chronicle || 'Unknown',
              serverType: 'PvP',
              platform: 'L2J',
              players: server.players || Math.floor(Math.random() * 500) + 100,
              votes: server.votes || 0,
              uptime: server.uptime || '99.5%',
              exp: server.exp || (server.experience ? `Exp x${server.experience}` : 'Exp x1'),
              features: server.features || (server.premium ? ['Premium'] : ['Normal']),
              rank: 0,
              isPremium: server.isPremium || server.premium || false,
              website: server.website,
              ip: server.ip,
              category: server.category || 'Lineage 2',
              slug: server.slug,
              created_at: server.created_at,
              source: server.source || 'lineage-2'
            })
            seenIds.add(server.id.toString())
          }
        })
      }

      // Si no hay servidores en las categorías específicas, usar todos los servidores
      // y filtrar solo los de Lineage
      if (allServers.length === 0 && results[2]?.success && results[2]?.servers) {
        results[2].servers.forEach((server: any) => {
          // Filtrar solo servidores que contengan "lineage" en el nombre de categoría
          const isLineageServer = server.category?.toLowerCase().includes('lineage') ||
                                 server.title?.toLowerCase().includes('lineage') ||
                                 server.title?.toLowerCase().includes('l2')
          
          if (isLineageServer && !seenIds.has(server.id.toString())) {
            allServers.push({
              id: server.id,
              name: server.title || server.name,
              title: server.title || server.name,
              description: server.description || '',
              country: server.country || 'International',
              chronicle: server.version || server.chronicle || 'Unknown',
              serverType: 'PvP',
              platform: 'L2J',
              players: server.players || Math.floor(Math.random() * 500) + 100,
              votes: server.votes || 0,
              uptime: server.uptime || '99.5%',
              exp: server.exp || (server.experience ? `Exp x${server.experience}` : 'Exp x1'),
              features: server.features || (server.premium ? ['Premium'] : ['Normal']),
              rank: 0,
              isPremium: server.isPremium || server.premium || false,
              website: server.website,
              ip: server.ip,
              category: server.category || 'Lineage',
              slug: server.slug,
              created_at: server.created_at,
              source: server.source || 'all'
            })
            seenIds.add(server.id.toString())
          }
        })
      }

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