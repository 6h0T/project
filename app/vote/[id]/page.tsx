import { notFound } from 'next/navigation'
import { getAnyServerById, type UnifiedServer } from '@/lib/database'
import VotePage from '@/components/VotePage'

async function getServerInfo(idParam: string) {
  // Extraer ID del formato tanto "123" como "123_nombre-servidor"
  let serverId = idParam
  
  // Si contiene underscore, extraer solo la parte antes del underscore
  if (idParam.includes('_')) {
    serverId = idParam.split('_')[0]
  }
  
  console.log(`[VOTE_PAGE] Buscando servidor con ID: ${serverId} (parámetro original: ${idParam})`)
  
  const { data: server, error } = await getAnyServerById(serverId)
  
  if (error || !server) {
    console.log(`[VOTE_PAGE] Servidor no encontrado: ${serverId}`, error)
    return null
  }

  return server
}

export default async function ServerVotePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const server = await getServerInfo(params.id)
  
  if (!server || !server.approved) {
    console.log(`[VOTE_PAGE] Servidor no aprobado o no encontrado: ${params.id}`, { server })
    notFound()
  }

  // Convertir UnifiedServer a la interfaz que espera VotePage
  const votePageServer = {
    id: typeof server.id === 'string' ? parseInt(server.id) || 0 : server.id,
    title: server.title,
    description: server.description,
    website: server.website,
    ip: server.ip || `${server.title.toLowerCase().replace(/\s+/g, '')}.server.com:7777`, // IP simulada para servidores de usuario
    country: server.country,
    language: server.language,
    version: server.version,
    experience: server.experience,
    maxLevel: server.maxLevel,
    status: server.status,
    premium: server.premium,
    approved: server.approved,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    category: server.category,
    user: server.user,
    _count: server._count
  }

  return <VotePage server={votePageServer as any} />
}