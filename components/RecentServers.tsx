'use client'

import Link from 'next/link';
import { useRecentServers } from '@/hooks/useRecentServers';
import { Loader2, RefreshCw } from 'lucide-react';

export default function RecentServers() {
  const { recentServers, loading, error, refetch } = useRecentServers();

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
        <h3 className="text-xs font-semibold text-white mb-2">Recientes</h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white">Recientes</h3>
          <button
            onClick={refetch}
            className="text-slate-400 hover:text-white transition-colors"
            title="Reintentar"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <div className="text-xs text-slate-400 text-center py-2">
          Error al cargar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-white">Recientes</h3>
        <button
          onClick={refetch}
          className="text-slate-400 hover:text-white transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      
      <div className="space-y-1">
        {recentServers.length > 0 ? (
          recentServers.map((server) => (
            <Link
              key={server.id}
              href={`/vote/${server.id}`}
              className="block hover:bg-slate-700/30 rounded p-1 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate group-hover:text-cyan-400 transition-colors">
                    {server.title}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span className="truncate">{server.categoryName}</span>
                    <span>•</span>
                    <span>{server.timeAgo}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            No hay servidores recientes
          </div>
        )}
      </div>
    </div>
  );
} 