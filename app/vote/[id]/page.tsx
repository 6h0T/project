import { notFound } from 'next/navigation'
import { getAnyServerById, type UnifiedServer } from '@/lib/database'
import VotePage from '@/components/VotePage'

async function getServerInfo(serverId: string) {
  const { data: server, error } = await getAnyServerById(serverId)
  
  if (error || !server) {
    console.log(`Servidor no encontrado: ${serverId}`, error)
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
    console.log(`Servidor no aprobado o no encontrado: ${params.id}`, { server })
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