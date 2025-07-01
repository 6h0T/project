import { notFound } from 'next/navigation'
import { getServerById } from '@/lib/database'
import VotePage from '@/components/VotePage'

async function getServerInfo(serverId: string) {
  const id = parseInt(serverId)
  if (isNaN(id)) return null

  const { data: server, error } = await getServerById(id)
  if (error || !server) return null

  return server
}

export default async function ServerVotePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const server = await getServerInfo(params.id)
  
  if (!server || !server.approved) {
    notFound()
  }

  return <VotePage server={server} />
}